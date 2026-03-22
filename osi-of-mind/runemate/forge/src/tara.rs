use crate::ast::{Element, SafetyDef, StavesDocument, ToneDef, PulseDef};
use crate::error::{ForgeError, ForgeWarning, WarningKind};

/// Validate a parsed document against TARA safety bounds.
/// Returns warnings for soft violations, errors for hard violations.
pub fn validate(doc: &StavesDocument, safety: &SafetyDef) -> Result<Vec<ForgeWarning>, ForgeError> {
    let mut warnings = Vec::new();

    for stave in &doc.staves {
        // Count elements and max depth
        let mut count = 0u16;
        let mut max_depth = 0u16;
        count_elements(&stave.body, 1, &mut count, &mut max_depth);

        if count > safety.max_elements {
            return Err(ForgeError::TaraViolation {
                message: format!(
                    "stave '{}' has {} elements (max {})",
                    stave.name, count, safety.max_elements
                ),
                span: stave.span,
            });
        }

        if max_depth > safety.max_depth {
            return Err(ForgeError::TaraViolation {
                message: format!(
                    "stave '{}' nesting depth {} exceeds max {}",
                    stave.name, max_depth, safety.max_depth
                ),
                span: stave.span,
            });
        }

        // Warn if approaching limits (>80%)
        if count > safety.max_elements * 4 / 5 {
            warnings.push(ForgeWarning {
                message: format!(
                    "stave '{}' has {} elements ({:.0}% of max {})",
                    stave.name, count,
                    count as f64 / safety.max_elements as f64 * 100.0,
                    safety.max_elements
                ),
                span: Some(stave.span),
                kind: WarningKind::TaraLimit,
            });
        }
    }

    // Validate tones
    for tone in &doc.tones {
        validate_tone(tone, safety, &mut warnings)?;
    }

    // Validate pulses
    for pulse in &doc.pulses {
        validate_pulse(pulse, safety, &mut warnings)?;
    }

    Ok(warnings)
}

fn count_elements(elements: &[Element], depth: u16, count: &mut u16, max_depth: &mut u16) {
    if depth > *max_depth {
        *max_depth = depth;
    }
    for el in elements {
        *count = count.saturating_add(1);
        if let Element::Container { children, .. } = el {
            count_elements(children, depth + 1, count, max_depth);
        }
    }
}

fn validate_tone(tone: &ToneDef, safety: &SafetyDef, warnings: &mut Vec<ForgeWarning>) -> Result<(), ForgeError> {
    if tone.frequency > safety.max_frequency {
        return Err(ForgeError::TaraViolation {
            message: format!(
                "tone '{}' frequency {}Hz exceeds max {}Hz",
                tone.name, tone.frequency, safety.max_frequency
            ),
            span: tone.span,
        });
    }

    let amplitude_f = tone.amplitude as f32 / 255.0;
    if amplitude_f > safety.max_amplitude {
        return Err(ForgeError::TaraViolation {
            message: format!(
                "tone '{}' amplitude {:.2} exceeds max {:.2}",
                tone.name, amplitude_f, safety.max_amplitude
            ),
            span: tone.span,
        });
    }

    // Shannon criterion: k = log10(D) + log10(Q)
    // D = charge density (uC/cm^2), Q = charge per phase (uC)
    // For auditory tones, we estimate charge from amplitude and duration
    let charge_density = amplitude_f * safety.max_charge_density;
    let charge_per_phase = amplitude_f * safety.max_charge_per_phase;
    if charge_density > 0.0 && charge_per_phase > 0.0 {
        let k = charge_density.log10() + charge_per_phase.log10();
        if k >= safety.shannon_k {
            return Err(ForgeError::TaraViolation {
                message: format!(
                    "tone '{}' Shannon k={:.2} exceeds limit {:.2} (D={:.1}, Q={:.1})",
                    tone.name, k, safety.shannon_k, charge_density, charge_per_phase
                ),
                span: tone.span,
            });
        }
    }

    // Warn if approaching limits
    if tone.frequency > safety.max_frequency * 4 / 5 {
        warnings.push(ForgeWarning {
            message: format!(
                "tone '{}' frequency {}Hz is {:.0}% of max {}Hz",
                tone.name, tone.frequency,
                tone.frequency as f64 / safety.max_frequency as f64 * 100.0,
                safety.max_frequency
            ),
            span: Some(tone.span),
            kind: WarningKind::TaraLimit,
        });
    }

    Ok(())
}

fn validate_pulse(pulse: &PulseDef, safety: &SafetyDef, _warnings: &mut Vec<ForgeWarning>) -> Result<(), ForgeError> {
    // charge field maps 0-255 → 0.0-30.0 uC/cm^2
    let charge_density = pulse.charge as f32 / 255.0 * 30.0;
    if charge_density > safety.max_charge_density {
        return Err(ForgeError::TaraViolation {
            message: format!(
                "pulse '{}' charge density {:.1} uC/cm^2 exceeds max {:.1}",
                pulse.name, charge_density, safety.max_charge_density
            ),
            span: pulse.span,
        });
    }

    let intensity_f = pulse.intensity as f32 / 255.0;
    if intensity_f > safety.max_amplitude {
        return Err(ForgeError::TaraViolation {
            message: format!(
                "pulse '{}' intensity {:.2} exceeds max amplitude {:.2}",
                pulse.name, intensity_f, safety.max_amplitude
            ),
            span: pulse.span,
        });
    }

    // Shannon check for pulses
    let charge_per_phase = intensity_f * safety.max_charge_per_phase;
    if charge_density > 0.0 && charge_per_phase > 0.0 {
        let k = charge_density.log10() + charge_per_phase.log10();
        if k >= safety.shannon_k {
            return Err(ForgeError::TaraViolation {
                message: format!(
                    "pulse '{}' Shannon k={:.2} exceeds limit {:.2}",
                    pulse.name, k, safety.shannon_k
                ),
                span: pulse.span,
            });
        }
    }

    Ok(())
}

/// Validate that the final bytecode size is within TARA bounds.
pub fn validate_bytecode_size(size: usize, safety: &SafetyDef) -> Result<(), ForgeError> {
    if size > safety.max_bytecode as usize {
        return Err(ForgeError::TaraSimple(format!(
            "bytecode size {} bytes exceeds max {} bytes",
            size, safety.max_bytecode
        )));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ast::*;
    use crate::error::Span;

    fn empty_doc() -> StavesDocument {
        StavesDocument {
            staves: vec![],
            styles: vec![],
            tones: vec![],
            pulses: vec![],
            safety: None,
        }
    }

    #[test]
    fn test_empty_doc_passes() {
        let doc = empty_doc();
        let safety = SafetyDef::default();
        let warnings = validate(&doc, &safety).unwrap();
        assert!(warnings.is_empty());
    }

    #[test]
    fn test_too_many_elements() {
        let span = Span { line: 1, col: 1 };
        let mut body = Vec::new();
        for _ in 0..300 {
            body.push(Element::Leaf {
                kind: LeafKind::Text("x".to_string()),
                attrs: Attrs::default(),
                span,
            });
        }
        let doc = StavesDocument {
            staves: vec![StaveDef { name: "test".to_string(), body, span }],
            styles: vec![],
            tones: vec![],
            pulses: vec![],
            safety: None,
        };
        let safety = SafetyDef::default();
        let result = validate(&doc, &safety);
        assert!(result.is_err());
    }

    #[test]
    fn test_tone_frequency_limit() {
        let span = Span { line: 1, col: 1 };
        let doc = StavesDocument {
            staves: vec![],
            styles: vec![],
            tones: vec![ToneDef {
                name: "bad_tone".to_string(),
                frequency: 5000,
                duration_ms: 100,
                amplitude: 128,
                waveform: Waveform::Sine,
                channel: 0,
                span,
            }],
            pulses: vec![],
            safety: None,
        };
        let safety = SafetyDef::default();
        let result = validate(&doc, &safety);
        assert!(result.is_err());
    }

    #[test]
    fn test_bytecode_size_limit() {
        let safety = SafetyDef::default();
        assert!(validate_bytecode_size(100, &safety).is_ok());
        assert!(validate_bytecode_size(100_000, &safety).is_err());
    }
}
