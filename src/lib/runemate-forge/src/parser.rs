use crate::ast::*;
use crate::error::{ForgeError, Span};
use crate::lexer::{Token, SpannedToken};

pub struct Parser {
    tokens: Vec<SpannedToken>,
    pos: usize,
}

impl Parser {
    pub fn new(tokens: Vec<SpannedToken>) -> Self {
        Parser { tokens, pos: 0 }
    }

    pub fn parse(&mut self) -> Result<StavesDocument, ForgeError> {
        let mut doc = StavesDocument {
            staves: Vec::new(),
            styles: Vec::new(),
            tones: Vec::new(),
            pulses: Vec::new(),
            safety: None,
        };

        while !self.at_eof() {
            match &self.peek().token {
                Token::Stave => doc.staves.push(self.parse_stave_def()?),
                Token::Style => doc.styles.push(self.parse_style_def()?),
                Token::Tone => doc.tones.push(self.parse_tone_def()?),
                Token::Pulse => doc.pulses.push(self.parse_pulse_def()?),
                Token::Safety => { doc.safety = Some(self.parse_safety_def()?); }
                _ => return Err(self.error("expected 'stave', 'style', 'tone', 'pulse', or 'safety'")),
            }
        }

        Ok(doc)
    }

    fn parse_stave_def(&mut self) -> Result<StaveDef, ForgeError> {
        let span = self.expect_token(&Token::Stave)?;
        let name = self.expect_ident()?;
        self.expect_token(&Token::LBrace)?;
        let body = self.parse_elements()?;
        self.expect_token(&Token::RBrace)?;
        Ok(StaveDef { name, body, span })
    }

    fn parse_elements(&mut self) -> Result<Vec<Element>, ForgeError> {
        let mut elements = Vec::new();
        while !self.check(&Token::RBrace) && !self.at_eof() {
            elements.push(self.parse_element()?);
        }
        Ok(elements)
    }

    fn parse_element(&mut self) -> Result<Element, ForgeError> {
        let span = self.span();
        match &self.peek().token {
            Token::Row | Token::Column | Token::Section | Token::List | Token::Grid => {
                self.parse_container()
            }
            Token::Heading => self.parse_heading(),
            Token::Text => self.parse_text(),
            Token::Button => self.parse_button(),
            Token::Input => self.parse_input(),
            Token::Image => self.parse_image(),
            Token::Link => self.parse_link(),
            Token::Spacer => self.parse_spacer(),
            Token::Item => self.parse_item(),
            Token::Metric => self.parse_metric(),
            Token::Separator => {
                self.advance();
                Ok(Element::Leaf { kind: LeafKind::Separator, attrs: Attrs::default(), span })
            }
            Token::Tone => {
                self.advance();
                let name = self.expect_ident()?;
                Ok(Element::ToneRef { name, span })
            }
            Token::Pulse => {
                self.advance();
                let name = self.expect_ident()?;
                Ok(Element::PulseRef { name, span })
            }
            _ => Err(self.error("expected element")),
        }
    }

    fn parse_container(&mut self) -> Result<Element, ForgeError> {
        let span = self.span();
        let kind = match &self.peek().token {
            Token::Row => { self.advance(); ContainerKind::Row }
            Token::Column => { self.advance(); ContainerKind::Column }
            Token::Section => { self.advance(); ContainerKind::Section }
            Token::List => { self.advance(); ContainerKind::List }
            Token::Grid => { self.advance(); ContainerKind::Grid }
            _ => return Err(self.error("expected container type")),
        };
        let attrs = self.maybe_parse_attrs()?;
        self.expect_token(&Token::LBrace)?;
        let children = self.parse_elements()?;
        self.expect_token(&Token::RBrace)?;
        Ok(Element::Container { kind, attrs, children, span })
    }

    fn parse_heading(&mut self) -> Result<Element, ForgeError> {
        let span = self.span();
        self.advance(); // heading
        let level = if self.check(&Token::LParen) {
            self.advance();
            let n = self.expect_int()? as u8;
            self.expect_token(&Token::RParen)?;
            n.clamp(1, 6)
        } else {
            1
        };
        let text = self.expect_string()?;
        Ok(Element::Leaf { kind: LeafKind::Heading(level, text), attrs: Attrs::default(), span })
    }

    fn parse_text(&mut self) -> Result<Element, ForgeError> {
        let span = self.span();
        self.advance();
        let attrs = self.maybe_parse_attrs()?;
        let content = self.expect_string()?;
        Ok(Element::Leaf { kind: LeafKind::Text(content), attrs, span })
    }

    fn parse_button(&mut self) -> Result<Element, ForgeError> {
        let span = self.span();
        self.advance();
        let attrs = self.maybe_parse_attrs()?;
        let label = self.expect_string()?;
        let action = attrs.extra.get("action").cloned().unwrap_or_default();
        Ok(Element::Leaf { kind: LeafKind::Button { action, label }, attrs, span })
    }

    fn parse_input(&mut self) -> Result<Element, ForgeError> {
        let span = self.span();
        self.advance();
        let attrs = self.maybe_parse_attrs()?;
        let field = attrs.extra.get("field").cloned().unwrap_or_default();
        let placeholder = attrs.extra.get("placeholder").cloned();
        let input_type = attrs.extra.get("type").cloned();
        Ok(Element::Leaf { kind: LeafKind::Input { field, input_type, placeholder }, attrs, span })
    }

    fn parse_image(&mut self) -> Result<Element, ForgeError> {
        let span = self.span();
        self.advance();
        let attrs = self.maybe_parse_attrs()?;
        let src = attrs.extra.get("src").cloned().unwrap_or_default();
        let alt = attrs.extra.get("alt").cloned().unwrap_or_default();
        Ok(Element::Leaf { kind: LeafKind::Image { src, alt }, attrs, span })
    }

    fn parse_link(&mut self) -> Result<Element, ForgeError> {
        let span = self.span();
        self.advance();
        let attrs = self.maybe_parse_attrs()?;
        let label = self.expect_string()?;
        let href = attrs.extra.get("href").cloned().unwrap_or_default();
        Ok(Element::Leaf { kind: LeafKind::Link { href, label }, attrs, span })
    }

    fn parse_spacer(&mut self) -> Result<Element, ForgeError> {
        let span = self.span();
        self.advance();
        let val = self.parse_value()?;
        Ok(Element::Leaf { kind: LeafKind::Spacer(val), attrs: Attrs::default(), span })
    }

    fn parse_item(&mut self) -> Result<Element, ForgeError> {
        let span = self.span();
        self.advance();
        let attrs = self.maybe_parse_attrs()?;
        let content = self.expect_string()?;
        Ok(Element::Leaf { kind: LeafKind::Item(content), attrs, span })
    }

    fn parse_metric(&mut self) -> Result<Element, ForgeError> {
        let span = self.span();
        self.advance();
        let attrs = self.maybe_parse_attrs()?;
        let label = self.expect_string()?;
        let value = self.expect_string()?;
        Ok(Element::Leaf { kind: LeafKind::Metric { label, value }, attrs, span })
    }

    fn maybe_parse_attrs(&mut self) -> Result<Attrs, ForgeError> {
        if !self.check(&Token::LParen) {
            return Ok(Attrs::default());
        }
        self.advance(); // (
        let mut attrs = Attrs::default();
        while !self.check(&Token::RParen) && !self.at_eof() {
            let key = self.expect_ident()?;
            self.expect_token(&Token::Colon)?;
            let val = self.parse_attr_value()?;
            match key.as_str() {
                "style" => attrs.style = Some(val),
                "id" => attrs.id = Some(val),
                _ => { attrs.extra.insert(key, val); }
            }
            if self.check(&Token::Comma) { self.advance(); }
        }
        self.expect_token(&Token::RParen)?;
        Ok(attrs)
    }

    fn parse_attr_value(&mut self) -> Result<String, ForgeError> {
        match &self.peek().token {
            Token::StringLit(s) => { let s = s.clone(); self.advance(); Ok(s) }
            Token::IntLit(n) => { let s = n.to_string(); self.advance(); Ok(s) }
            Token::FloatLit(f) => { let s = f.to_string(); self.advance(); Ok(s) }
            Token::Ident(s) => { let s = s.clone(); self.advance(); Ok(s) }
            Token::Px(v) => { let s = format!("{}px", v); self.advance(); Ok(s) }
            Token::Percent(v) => { let s = format!("{}%", v / 100); self.advance(); Ok(s) }
            Token::ColorHex(r, g, b, a) => { let s = format!("#{:02x}{:02x}{:02x}{:02x}", r, g, b, a); self.advance(); Ok(s) }
            _ => Err(self.error("expected attribute value")),
        }
    }

    fn parse_style_def(&mut self) -> Result<StyleDef, ForgeError> {
        let span = self.span();
        self.advance(); // style
        let name = self.expect_ident()?;
        self.expect_token(&Token::LBrace)?;
        let mut properties = Vec::new();
        while !self.check(&Token::RBrace) && !self.at_eof() {
            properties.push(self.parse_style_property()?);
        }
        self.expect_token(&Token::RBrace)?;
        Ok(StyleDef { name, properties, span })
    }

    fn parse_style_property(&mut self) -> Result<StyleProperty, ForgeError> {
        let name = self.expect_ident()?;
        self.expect_token(&Token::Colon)?;
        let prop = match name.as_str() {
            "width" => StyleProperty::Width(self.parse_value()?),
            "height" => StyleProperty::Height(self.parse_value()?),
            "margin" => { let v = self.parse_value()?; return Ok(StyleProperty::MarginTop(v)); }
            "margin-top" => StyleProperty::MarginTop(self.parse_value()?),
            "margin-right" => StyleProperty::MarginRight(self.parse_value()?),
            "margin-bottom" => StyleProperty::MarginBottom(self.parse_value()?),
            "margin-left" => StyleProperty::MarginLeft(self.parse_value()?),
            "padding" => { let v = self.parse_value()?; return Ok(StyleProperty::PaddingTop(v)); }
            "padding-top" => StyleProperty::PaddingTop(self.parse_value()?),
            "padding-right" => StyleProperty::PaddingRight(self.parse_value()?),
            "padding-bottom" => StyleProperty::PaddingBottom(self.parse_value()?),
            "padding-left" => StyleProperty::PaddingLeft(self.parse_value()?),
            "background" => StyleProperty::Background(self.parse_color()?),
            "color" => StyleProperty::TextColor(self.parse_color()?),
            "font-size" => StyleProperty::FontSize(self.expect_int()? as u8),
            "font-weight" => StyleProperty::FontWeight(self.expect_int()? as u16),
            "font-family" => StyleProperty::FontFamily(self.expect_string()?),
            "direction" => StyleProperty::Direction(self.parse_direction()?),
            "justify" => StyleProperty::Justify(self.parse_justify()?),
            "align" => StyleProperty::Align(self.parse_align()?),
            "display" => StyleProperty::Display(self.parse_display()?),
            "position" => StyleProperty::Position(self.parse_position()?),
            "top" => StyleProperty::Top(self.parse_value()?),
            "right" => StyleProperty::Right(self.parse_value()?),
            "bottom" => StyleProperty::Bottom(self.parse_value()?),
            "left" => StyleProperty::Left(self.parse_value()?),
            "border-width" => StyleProperty::BorderWidth(self.expect_int()? as u8),
            "border-color" => StyleProperty::BorderColor(self.parse_color()?),
            "border-radius" => StyleProperty::BorderRadius(self.parse_value()?),
            "opacity" => StyleProperty::Opacity((self.expect_float()? * 255.0) as u8),
            "overflow" => StyleProperty::Overflow(self.parse_overflow()?),
            "text-align" => StyleProperty::TextAlign(self.parse_text_align()?),
            "gap" => StyleProperty::Gap(self.parse_value()?),
            "wrap" => StyleProperty::Wrap(self.parse_wrap()?),
            "grow" => StyleProperty::Grow(self.expect_int()? as u8),
            "shrink" => StyleProperty::Shrink(self.expect_int()? as u8),
            "z-index" => StyleProperty::ZIndex(self.expect_int()? as i16),
            "visibility" => StyleProperty::Visibility(self.parse_visibility()?),
            "max-width" => StyleProperty::MaxWidth(self.parse_value()?),
            "min-width" => StyleProperty::MinWidth(self.parse_value()?),
            "max-height" => StyleProperty::MaxHeight(self.parse_value()?),
            "min-height" => StyleProperty::MinHeight(self.parse_value()?),
            _ => return Err(ForgeError::Parse { message: format!("unknown style property: {}", name), span: self.span() }),
        };
        Ok(prop)
    }

    fn parse_value(&mut self) -> Result<Value, ForgeError> {
        match &self.peek().token {
            Token::Auto => { self.advance(); Ok(Value::Auto) }
            Token::Px(v) => { let v = *v; self.advance(); Ok(Value::Px(v)) }
            Token::Percent(v) => { let v = *v; self.advance(); Ok(Value::Percent(v)) }
            Token::Vh(v) => { let v = *v; self.advance(); Ok(Value::Vh(v)) }
            Token::Vw(v) => { let v = *v; self.advance(); Ok(Value::Vw(v)) }
            Token::IntLit(n) => { let v = *n as i32; self.advance(); Ok(Value::Px(v)) }
            _ => Err(self.error("expected value (px, %, vh, vw, auto, or integer)")),
        }
    }

    fn parse_color(&mut self) -> Result<Color, ForgeError> {
        match &self.peek().token {
            Token::ColorHex(r, g, b, a) => {
                let c = Color { r: *r, g: *g, b: *b, a: *a };
                self.advance();
                Ok(c)
            }
            Token::Ident(name) => {
                let c = named_color(name).ok_or_else(|| self.error(&format!("unknown color: {}", name)))?;
                self.advance();
                Ok(c)
            }
            _ => Err(self.error("expected color (#hex or named)")),
        }
    }

    fn parse_direction(&mut self) -> Result<Direction, ForgeError> {
        match self.expect_ident()?.as_str() {
            "row" => Ok(Direction::Row),
            "column" => Ok(Direction::Column),
            other => Err(ForgeError::Parse { message: format!("expected 'row' or 'column', got '{}'", other), span: self.span() }),
        }
    }

    fn parse_justify(&mut self) -> Result<Justify, ForgeError> {
        match self.expect_ident()?.as_str() {
            "start" => Ok(Justify::Start), "center" => Ok(Justify::Center),
            "end" => Ok(Justify::End), "between" => Ok(Justify::Between),
            "around" => Ok(Justify::Around), "evenly" => Ok(Justify::Evenly),
            other => Err(ForgeError::Parse { message: format!("invalid justify: {}", other), span: self.span() }),
        }
    }

    fn parse_align(&mut self) -> Result<Align, ForgeError> {
        match self.expect_ident()?.as_str() {
            "start" => Ok(Align::Start), "center" => Ok(Align::Center),
            "end" => Ok(Align::End), "stretch" => Ok(Align::Stretch),
            other => Err(ForgeError::Parse { message: format!("invalid align: {}", other), span: self.span() }),
        }
    }

    fn parse_display(&mut self) -> Result<Display, ForgeError> {
        match self.expect_ident()?.as_str() {
            "block" => Ok(Display::Block), "flex" => Ok(Display::Flex),
            "grid" => Ok(Display::Grid), "inline" => Ok(Display::Inline), "none" => Ok(Display::None),
            other => Err(ForgeError::Parse { message: format!("invalid display: {}", other), span: self.span() }),
        }
    }

    fn parse_position(&mut self) -> Result<Position, ForgeError> {
        match self.expect_ident()?.as_str() {
            "static" => Ok(Position::Static), "relative" => Ok(Position::Relative),
            "absolute" => Ok(Position::Absolute), "fixed" => Ok(Position::Fixed),
            other => Err(ForgeError::Parse { message: format!("invalid position: {}", other), span: self.span() }),
        }
    }

    fn parse_overflow(&mut self) -> Result<Overflow, ForgeError> {
        match self.expect_ident()?.as_str() {
            "visible" => Ok(Overflow::Visible), "hidden" => Ok(Overflow::Hidden),
            "scroll" => Ok(Overflow::Scroll), "auto" => Ok(Overflow::Auto),
            other => Err(ForgeError::Parse { message: format!("invalid overflow: {}", other), span: self.span() }),
        }
    }

    fn parse_text_align(&mut self) -> Result<TextAlign, ForgeError> {
        match self.expect_ident()?.as_str() {
            "left" => Ok(TextAlign::Left), "center" => Ok(TextAlign::Center),
            "right" => Ok(TextAlign::Right), "justify" => Ok(TextAlign::Justify),
            other => Err(ForgeError::Parse { message: format!("invalid text-align: {}", other), span: self.span() }),
        }
    }

    fn parse_wrap(&mut self) -> Result<Wrap, ForgeError> {
        match self.expect_ident()?.as_str() {
            "nowrap" => Ok(Wrap::Nowrap), "wrap" => Ok(Wrap::Wrap),
            other => Err(ForgeError::Parse { message: format!("invalid wrap: {}", other), span: self.span() }),
        }
    }

    fn parse_visibility(&mut self) -> Result<Visibility, ForgeError> {
        match self.expect_ident()?.as_str() {
            "visible" => Ok(Visibility::Visible), "hidden" => Ok(Visibility::Hidden),
            other => Err(ForgeError::Parse { message: format!("invalid visibility: {}", other), span: self.span() }),
        }
    }

    fn parse_tone_def(&mut self) -> Result<ToneDef, ForgeError> {
        let span = self.span();
        self.advance(); // tone
        let name = self.expect_ident()?;
        self.expect_token(&Token::LBrace)?;
        let mut freq: u16 = 440;
        let mut dur: u16 = 100;
        let mut amp: u8 = 128;
        let mut wf = Waveform::Biphasic;
        let mut ch: u8 = 0;
        while !self.check(&Token::RBrace) && !self.at_eof() {
            let key = self.expect_ident()?;
            self.expect_token(&Token::Colon)?;
            match key.as_str() {
                "frequency" => { freq = self.expect_hz()?; }
                "duration" => { dur = self.expect_duration_ms()?; }
                "amplitude" => { amp = (self.expect_float()?.clamp(0.0, 1.0) * 255.0) as u8; }
                "waveform" => { wf = match self.expect_ident()?.as_str() {
                    "biphasic" => Waveform::Biphasic, "sine" => Waveform::Sine, "square" => Waveform::Square,
                    other => return Err(ForgeError::Parse { message: format!("unknown waveform: {}", other), span: self.span() }),
                }; }
                "channel" => { ch = self.expect_int()? as u8; }
                other => return Err(ForgeError::Parse { message: format!("unknown tone property: {}", other), span: self.span() }),
            }
        }
        self.expect_token(&Token::RBrace)?;
        Ok(ToneDef { name, frequency: freq, duration_ms: dur, amplitude: amp, waveform: wf, channel: ch, span })
    }

    fn parse_pulse_def(&mut self) -> Result<PulseDef, ForgeError> {
        let span = self.span();
        self.advance(); // pulse
        let name = self.expect_ident()?;
        self.expect_token(&Token::LBrace)?;
        let mut region = String::new();
        let mut dur: u16 = 100;
        let mut intensity: u8 = 128;
        let mut wf = PulseWaveform::Biphasic;
        let mut charge: u8 = 0;
        while !self.check(&Token::RBrace) && !self.at_eof() {
            let key = self.expect_ident()?;
            self.expect_token(&Token::Colon)?;
            match key.as_str() {
                "region" => { region = self.expect_ident()?; }
                "duration" => { dur = self.expect_duration_ms()?; }
                "intensity" => { intensity = (self.expect_float()?.clamp(0.0, 1.0) * 255.0) as u8; }
                "waveform" => { wf = match self.expect_ident()?.as_str() {
                    "biphasic" => PulseWaveform::Biphasic, "monophasic" => PulseWaveform::Monophasic, "ramp" => PulseWaveform::Ramp,
                    other => return Err(ForgeError::Parse { message: format!("unknown waveform: {}", other), span: self.span() }),
                }; }
                "charge" => { charge = (self.expect_float()?.clamp(0.0, 30.0) / 30.0 * 255.0) as u8; }
                other => return Err(ForgeError::Parse { message: format!("unknown pulse property: {}", other), span: self.span() }),
            }
        }
        self.expect_token(&Token::RBrace)?;
        Ok(PulseDef { name, region, duration_ms: dur, intensity, waveform: wf, charge, span })
    }

    fn parse_safety_def(&mut self) -> Result<SafetyDef, ForgeError> {
        let span = self.span();
        self.advance(); // safety
        let name = self.expect_ident()?;
        self.expect_token(&Token::LBrace)?;
        let mut profile = SafetyDef::default();
        profile.name = name;
        profile.span = span;
        while !self.check(&Token::RBrace) && !self.at_eof() {
            let key = self.expect_ident()?;
            self.expect_token(&Token::Colon)?;
            match key.as_str() {
                "max-elements" => { profile.max_elements = self.expect_int()? as u16; }
                "max-depth" => { profile.max_depth = self.expect_int()? as u16; }
                "max-bytecode" => { profile.max_bytecode = self.expect_int()? as u32; }
                "max-charge-density" => { profile.max_charge_density = self.expect_float()? as f32; }
                "max-charge-per-phase" => { profile.max_charge_per_phase = self.expect_float()? as f32; }
                "max-frequency" => { profile.max_frequency = self.expect_int()? as u16; }
                "max-amplitude" => { profile.max_amplitude = self.expect_float()? as f32; }
                "shannon-k" => { profile.shannon_k = self.expect_float()? as f32; }
                other => return Err(ForgeError::Parse { message: format!("unknown safety property: {}", other), span: self.span() }),
            }
        }
        self.expect_token(&Token::RBrace)?;
        Ok(profile)
    }

    // --- Helpers ---

    fn peek(&self) -> &SpannedToken {
        &self.tokens[self.pos.min(self.tokens.len() - 1)]
    }

    fn span(&self) -> Span {
        self.peek().span
    }

    fn at_eof(&self) -> bool {
        self.peek().token == Token::Eof
    }

    fn check(&self, expected: &Token) -> bool {
        std::mem::discriminant(&self.peek().token) == std::mem::discriminant(expected)
    }

    fn advance(&mut self) -> &SpannedToken {
        let t = &self.tokens[self.pos.min(self.tokens.len() - 1)];
        if self.pos < self.tokens.len() { self.pos += 1; }
        t
    }

    fn expect_token(&mut self, expected: &Token) -> Result<Span, ForgeError> {
        if self.check(expected) {
            let span = self.span();
            self.advance();
            Ok(span)
        } else {
            Err(self.error(&format!("expected {:?}, got {:?}", expected, self.peek().token)))
        }
    }

    fn expect_ident(&mut self) -> Result<String, ForgeError> {
        let name = match &self.peek().token {
            Token::Ident(s) => s.clone(),
            // Allow keywords to be used as identifiers in context
            Token::Stave => "stave".to_string(),
            Token::Style => "style".to_string(),
            Token::Tone => "tone".to_string(),
            Token::Pulse => "pulse".to_string(),
            Token::Safety => "safety".to_string(),
            Token::Heading => "heading".to_string(),
            Token::Text => "text".to_string(),
            Token::Button => "button".to_string(),
            Token::Input => "input".to_string(),
            Token::Image => "image".to_string(),
            Token::Link => "link".to_string(),
            Token::Spacer => "spacer".to_string(),
            Token::Item => "item".to_string(),
            Token::Metric => "metric".to_string(),
            Token::Separator => "separator".to_string(),
            Token::Row => "row".to_string(),
            Token::Column => "column".to_string(),
            Token::Section => "section".to_string(),
            Token::List => "list".to_string(),
            Token::Grid => "grid".to_string(),
            Token::Auto => "auto".to_string(),
            _ => return Err(self.error(&format!("expected identifier, got {:?}", self.peek().token))),
        };
        self.advance();
        Ok(name)
    }

    fn expect_string(&mut self) -> Result<String, ForgeError> {
        match &self.peek().token {
            Token::StringLit(s) => { let s = s.clone(); self.advance(); Ok(s) }
            _ => Err(self.error("expected string literal")),
        }
    }

    fn expect_int(&mut self) -> Result<i64, ForgeError> {
        match &self.peek().token {
            Token::IntLit(n) => { let n = *n; self.advance(); Ok(n) }
            _ => Err(self.error("expected integer")),
        }
    }

    fn expect_float(&mut self) -> Result<f64, ForgeError> {
        match &self.peek().token {
            Token::FloatLit(f) => { let f = *f; self.advance(); Ok(f) }
            Token::IntLit(n) => { let f = *n as f64; self.advance(); Ok(f) }
            _ => Err(self.error("expected number")),
        }
    }

    fn expect_hz(&mut self) -> Result<u16, ForgeError> {
        match &self.peek().token {
            Token::Hz(v) => { let v = *v; self.advance(); Ok(v) }
            Token::IntLit(n) => { let v = *n as u16; self.advance(); Ok(v) }
            _ => Err(self.error("expected frequency (e.g. 440hz)")),
        }
    }

    fn expect_duration_ms(&mut self) -> Result<u16, ForgeError> {
        match &self.peek().token {
            Token::Ms(v) => { let v = *v; self.advance(); Ok(v) }
            Token::Seconds(v) => { let v = *v * 1000; self.advance(); Ok(v) }
            Token::IntLit(n) => { let v = *n as u16; self.advance(); Ok(v) }
            _ => Err(self.error("expected duration (e.g. 200ms)")),
        }
    }

    fn error(&self, msg: &str) -> ForgeError {
        ForgeError::Parse { message: msg.to_string(), span: self.span() }
    }
}

fn named_color(name: &str) -> Option<Color> {
    match name {
        "black" => Some(Color { r: 0, g: 0, b: 0, a: 255 }),
        "white" => Some(Color { r: 255, g: 255, b: 255, a: 255 }),
        "red" => Some(Color { r: 255, g: 0, b: 0, a: 255 }),
        "green" => Some(Color { r: 0, g: 128, b: 0, a: 255 }),
        "blue" => Some(Color { r: 0, g: 0, b: 255, a: 255 }),
        "yellow" => Some(Color { r: 255, g: 255, b: 0, a: 255 }),
        "cyan" => Some(Color { r: 0, g: 255, b: 255, a: 255 }),
        "magenta" => Some(Color { r: 255, g: 0, b: 255, a: 255 }),
        "gray" | "grey" => Some(Color { r: 128, g: 128, b: 128, a: 255 }),
        "orange" => Some(Color { r: 255, g: 165, b: 0, a: 255 }),
        "purple" => Some(Color { r: 128, g: 0, b: 128, a: 255 }),
        "pink" => Some(Color { r: 255, g: 192, b: 203, a: 255 }),
        "brown" => Some(Color { r: 139, g: 69, b: 19, a: 255 }),
        "transparent" => Some(Color { r: 0, g: 0, b: 0, a: 0 }),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lexer::lex;

    #[test]
    fn test_parse_minimal_stave() {
        let tokens = lex(r#"stave test { heading "Hello" }"#).unwrap();
        let mut parser = Parser::new(tokens);
        let doc = parser.parse().unwrap();
        assert_eq!(doc.staves.len(), 1);
        assert_eq!(doc.staves[0].name, "test");
        assert_eq!(doc.staves[0].body.len(), 1);
    }

    #[test]
    fn test_parse_style() {
        let tokens = lex(r#"style card { background: #1a1a2e color: white padding: 12px }"#).unwrap();
        let mut parser = Parser::new(tokens);
        let doc = parser.parse().unwrap();
        assert_eq!(doc.styles.len(), 1);
        assert_eq!(doc.styles[0].name, "card");
        assert_eq!(doc.styles[0].properties.len(), 3);
    }

    #[test]
    fn test_parse_tone() {
        let tokens = lex(r#"tone alert { frequency: 880hz duration: 200ms amplitude: 0.3 waveform: biphasic }"#).unwrap();
        let mut parser = Parser::new(tokens);
        let doc = parser.parse().unwrap();
        assert_eq!(doc.tones.len(), 1);
        assert_eq!(doc.tones[0].frequency, 880);
        assert_eq!(doc.tones[0].duration_ms, 200);
    }

    #[test]
    fn test_parse_full_document() {
        let src = r#"
            safety bci { max-elements: 256 max-depth: 16 }
            style card { background: #1a1a2e color: white }
            tone beep { frequency: 440hz duration: 100ms amplitude: 0.5 }
            pulse tap { region: fingertip intensity: 0.5 duration: 100ms waveform: biphasic }
            stave main {
                column(style: card) {
                    heading(1) "Dashboard"
                    text "Status: OK"
                    tone beep
                    button(action: "refresh") "Refresh"
                }
            }
        "#;
        let tokens = lex(src).unwrap();
        let mut parser = Parser::new(tokens);
        let doc = parser.parse().unwrap();
        assert!(doc.safety.is_some());
        assert_eq!(doc.styles.len(), 1);
        assert_eq!(doc.tones.len(), 1);
        assert_eq!(doc.pulses.len(), 1);
        assert_eq!(doc.staves.len(), 1);
    }
}
