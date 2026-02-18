use std::collections::BTreeMap;
use crate::error::Span;

/// Root of a parsed Staves document
#[derive(Debug)]
pub struct StavesDocument {
    pub staves: Vec<StaveDef>,
    pub styles: Vec<StyleDef>,
    pub tones: Vec<ToneDef>,
    pub pulses: Vec<PulseDef>,
    pub safety: Option<SafetyDef>,
}

/// A named visual layout tree
#[derive(Debug)]
pub struct StaveDef {
    pub name: String,
    pub body: Vec<Element>,
    pub span: Span,
}

/// Visual element in the layout tree
#[derive(Debug)]
pub enum Element {
    Container {
        kind: ContainerKind,
        attrs: Attrs,
        children: Vec<Element>,
        span: Span,
    },
    Leaf {
        kind: LeafKind,
        attrs: Attrs,
        span: Span,
    },
    ToneRef {
        name: String,
        span: Span,
    },
    PulseRef {
        name: String,
        span: Span,
    },
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ContainerKind {
    Column,
    Row,
    Section,
    List,
    Grid,
}

impl ContainerKind {
    pub fn tag_byte(&self) -> u8 {
        match self {
            ContainerKind::Column => 0x01,
            ContainerKind::Row => 0x02,
            ContainerKind::Section => 0x03,
            ContainerKind::List => 0x04,
            ContainerKind::Grid => 0x05,
        }
    }
}

#[derive(Debug)]
pub enum LeafKind {
    Heading(u8, String),
    Text(String),
    Button { action: String, label: String },
    Input { field: String, input_type: Option<String>, placeholder: Option<String> },
    Image { src: String, alt: String },
    Link { href: String, label: String },
    Spacer(Value),
    Item(String),
    Metric { label: String, value: String },
    Separator,
}

impl LeafKind {
    pub fn tag_byte(&self) -> u8 {
        match self {
            LeafKind::Heading(1, _) => 0x10,
            LeafKind::Heading(2, _) => 0x11,
            LeafKind::Heading(3, _) => 0x12,
            LeafKind::Heading(4, _) => 0x13,
            LeafKind::Heading(5, _) => 0x14,
            LeafKind::Heading(_, _) => 0x15,
            LeafKind::Text(_) => 0x08,
            LeafKind::Button { .. } => 0x09,
            LeafKind::Input { .. } => 0x0A,
            LeafKind::Image { .. } => 0x0B,
            LeafKind::Link { .. } => 0x0C,
            LeafKind::Spacer(_) => 0x1A,
            LeafKind::Item(_) => 0x1B,
            LeafKind::Metric { .. } => 0x18,
            LeafKind::Separator => 0x19,
        }
    }
}

/// Element attributes (deterministic ordering via BTreeMap)
#[derive(Debug, Default)]
pub struct Attrs {
    pub style: Option<String>,
    pub id: Option<String>,
    pub extra: BTreeMap<String, String>,
}

/// Named style definition
#[derive(Debug)]
pub struct StyleDef {
    pub name: String,
    pub properties: Vec<StyleProperty>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum StyleProperty {
    Width(Value),
    Height(Value),
    MarginTop(Value),
    MarginRight(Value),
    MarginBottom(Value),
    MarginLeft(Value),
    PaddingTop(Value),
    PaddingRight(Value),
    PaddingBottom(Value),
    PaddingLeft(Value),
    Background(Color),
    TextColor(Color),
    FontSize(u8),
    Direction(Direction),
    Justify(Justify),
    Align(Align),
    Display(Display),
    Position(Position),
    Top(Value),
    Right(Value),
    Bottom(Value),
    Left(Value),
    BorderWidth(u8),
    BorderColor(Color),
    BorderRadius(Value),
    Opacity(u8),
    Overflow(Overflow),
    TextAlign(TextAlign),
    FontWeight(u16),
    FontFamily(String),
    Gap(Value),
    Wrap(Wrap),
    Grow(u8),
    Shrink(u8),
    ZIndex(i16),
    Visibility(Visibility),
    MaxWidth(Value),
    MinWidth(Value),
    MaxHeight(Value),
    MinHeight(Value),
}

impl StyleProperty {
    pub fn id(&self) -> u8 {
        match self {
            StyleProperty::Width(_) => 0x01,
            StyleProperty::Height(_) => 0x02,
            StyleProperty::MarginTop(_) => 0x03,
            StyleProperty::MarginRight(_) => 0x04,
            StyleProperty::MarginBottom(_) => 0x05,
            StyleProperty::MarginLeft(_) => 0x06,
            StyleProperty::PaddingTop(_) => 0x07,
            StyleProperty::PaddingRight(_) => 0x08,
            StyleProperty::PaddingBottom(_) => 0x09,
            StyleProperty::PaddingLeft(_) => 0x0A,
            StyleProperty::Background(_) => 0x0B,
            StyleProperty::TextColor(_) => 0x0C,
            StyleProperty::FontSize(_) => 0x0D,
            StyleProperty::Direction(_) => 0x0E,
            StyleProperty::Justify(_) => 0x0F,
            StyleProperty::Align(_) => 0x10,
            StyleProperty::Display(_) => 0x11,
            StyleProperty::Position(_) => 0x12,
            StyleProperty::Top(_) => 0x13,
            StyleProperty::Right(_) => 0x14,
            StyleProperty::Bottom(_) => 0x15,
            StyleProperty::Left(_) => 0x16,
            StyleProperty::BorderWidth(_) => 0x17,
            StyleProperty::BorderColor(_) => 0x18,
            StyleProperty::BorderRadius(_) => 0x19,
            StyleProperty::Opacity(_) => 0x1A,
            StyleProperty::Overflow(_) => 0x1B,
            StyleProperty::TextAlign(_) => 0x1C,
            StyleProperty::FontWeight(_) => 0x1D,
            StyleProperty::FontFamily(_) => 0x1E,
            StyleProperty::Gap(_) => 0x1F,
            StyleProperty::Wrap(_) => 0x20,
            StyleProperty::Grow(_) => 0x21,
            StyleProperty::Shrink(_) => 0x22,
            StyleProperty::ZIndex(_) => 0x23,
            StyleProperty::Visibility(_) => 0x24,
            StyleProperty::MaxWidth(_) => 0x25,
            StyleProperty::MinWidth(_) => 0x26,
            StyleProperty::MaxHeight(_) => 0x27,
            StyleProperty::MinHeight(_) => 0x28,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum Value {
    Auto,
    Px(i32),
    Percent(u32),
    Vh(u32),
    Vw(u32),
}

impl Value {
    pub fn encode(&self) -> [u8; 4] {
        let (unit, raw) = match self {
            Value::Auto => (0x00u8, 0i32),
            Value::Px(v) => (0x01, v.clamp(&-32767, &32767).to_owned()),
            Value::Percent(v) => (0x02, v.min(&10000).to_owned() as i32),
            Value::Vh(v) => (0x03, v.min(&10000).to_owned() as i32),
            Value::Vw(v) => (0x04, v.min(&10000).to_owned() as i32),
        };
        let val_bytes = (raw as u32).to_le_bytes();
        [unit, val_bytes[0], val_bytes[1], val_bytes[2]]
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: u8,
}

impl Color {
    pub fn encode(&self) -> [u8; 4] {
        [self.r, self.g, self.b, self.a]
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Direction { Row, Column }
impl Direction { pub fn encode(&self) -> u8 { match self { Direction::Row => 0, Direction::Column => 1 } } }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Justify { Start, Center, End, Between, Around, Evenly }
impl Justify { pub fn encode(&self) -> u8 { match self { Justify::Start=>0, Justify::Center=>1, Justify::End=>2, Justify::Between=>3, Justify::Around=>4, Justify::Evenly=>5 } } }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Align { Start, Center, End, Stretch }
impl Align { pub fn encode(&self) -> u8 { match self { Align::Start=>0, Align::Center=>1, Align::End=>2, Align::Stretch=>3 } } }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Display { Block, Flex, Grid, Inline, None }
impl Display { pub fn encode(&self) -> u8 { match self { Display::Block=>0, Display::Flex=>1, Display::Grid=>2, Display::Inline=>3, Display::None=>4 } } }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Position { Static, Relative, Absolute, Fixed }
impl Position { pub fn encode(&self) -> u8 { match self { Position::Static=>0, Position::Relative=>1, Position::Absolute=>2, Position::Fixed=>3 } } }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Overflow { Visible, Hidden, Scroll, Auto }
impl Overflow { pub fn encode(&self) -> u8 { match self { Overflow::Visible=>0, Overflow::Hidden=>1, Overflow::Scroll=>2, Overflow::Auto=>3 } } }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum TextAlign { Left, Center, Right, Justify }
impl TextAlign { pub fn encode(&self) -> u8 { match self { TextAlign::Left=>0, TextAlign::Center=>1, TextAlign::Right=>2, TextAlign::Justify=>3 } } }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Wrap { Nowrap, Wrap }
impl Wrap { pub fn encode(&self) -> u8 { match self { Wrap::Nowrap=>0, Wrap::Wrap=>1 } } }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Visibility { Visible, Hidden }
impl Visibility { pub fn encode(&self) -> u8 { match self { Visibility::Visible=>0, Visibility::Hidden=>1 } } }

/// Named tone definition (auditory modality)
#[derive(Debug)]
pub struct ToneDef {
    pub name: String,
    pub frequency: u16,
    pub duration_ms: u16,
    pub amplitude: u8,
    pub waveform: Waveform,
    pub channel: u8,
    pub span: Span,
}

/// Named pulse definition (haptic modality)
#[derive(Debug)]
pub struct PulseDef {
    pub name: String,
    pub region: String,
    pub duration_ms: u16,
    pub intensity: u8,
    pub waveform: PulseWaveform,
    pub charge: u8,
    pub span: Span,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Waveform { Biphasic, Sine, Square }
impl Waveform { pub fn encode(&self) -> u8 { match self { Waveform::Biphasic=>0, Waveform::Sine=>1, Waveform::Square=>2 } } }

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum PulseWaveform { Biphasic, Monophasic, Ramp }
impl PulseWaveform { pub fn encode(&self) -> u8 { match self { PulseWaveform::Biphasic=>0, PulseWaveform::Monophasic=>1, PulseWaveform::Ramp=>2 } } }

/// TARA safety profile
#[derive(Debug, Clone)]
pub struct SafetyDef {
    pub name: String,
    pub max_elements: u16,
    pub max_depth: u16,
    pub max_bytecode: u32,
    pub max_charge_density: f32,
    pub max_charge_per_phase: f32,
    pub max_frequency: u16,
    pub max_amplitude: f32,
    pub shannon_k: f32,
    pub span: Span,
}

impl Default for SafetyDef {
    fn default() -> Self {
        SafetyDef {
            name: "bci_default".to_string(),
            max_elements: 256,
            max_depth: 16,
            max_bytecode: 65536,
            max_charge_density: 30.0,
            max_charge_per_phase: 4.0,
            max_frequency: 2500,
            max_amplitude: 1.0,
            shannon_k: 1.75,
            span: Span { line: 0, col: 0 },
        }
    }
}
