use serde::{Serialize, Deserialize};
use std::collections::HashMap;

/// The Runemate AST optimized for neural rendering
#[derive(Debug, Serialize, Deserialize)]
pub struct RunemateAst {
    pub root: Node,
    pub styles: StyleTable,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum Node {
    Element(ElementNode),
    Text(String),
    Fragment(Vec<Node>),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ElementNode {
    pub tag: Tag,
    pub attributes: HashMap<String, String>,
    pub children: Vec<Node>,
    pub style_index: Option<u32>,
    pub raw_style: Option<String>,
    pub span: Option<Span>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Span {
    pub line: u32,
    pub col: u32,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Clone)]
pub enum Tag {
    Div,
    Span,
    P,
    H1,
    H2,
    H3,
    H4,
    H5,
    H6,
    Button,
    Input,
    Img,
    Br,
    A,
    Ul,
    Ol,
    Li,
    Section,
    Header,
    Footer,
    Nav,
    Main,
    Form,
    Label,
    Select,
    Option,
    Textarea,
    Custom(String),
}

impl Tag {
    pub fn tag_byte(&self) -> u8 {
        match self {
            Tag::Div => 0x01,
            Tag::Span => 0x02,
            Tag::P => 0x03,
            Tag::H1 => 0x04,
            Tag::H2 => 0x05,
            Tag::H3 => 0x06,
            Tag::H4 => 0x07,
            Tag::H5 => 0x08,
            Tag::H6 => 0x09,
            Tag::Button => 0x0A,
            Tag::Input => 0x0B,
            Tag::Img => 0x0C,
            Tag::Br => 0x0D,
            Tag::A => 0x0E,
            Tag::Ul => 0x0F,
            Tag::Ol => 0x10,
            Tag::Li => 0x11,
            Tag::Section => 0x12,
            Tag::Header => 0x13,
            Tag::Footer => 0x14,
            Tag::Nav => 0x15,
            Tag::Main => 0x16,
            Tag::Form => 0x17,
            Tag::Label => 0x18,
            Tag::Select => 0x19,
            Tag::Option => 0x1A,
            Tag::Textarea => 0x1B,
            Tag::Custom(_) => 0xFF,
        }
    }

    pub fn from_byte(byte: u8) -> Option<Tag> {
        match byte {
            0x01 => Some(Tag::Div),
            0x02 => Some(Tag::Span),
            0x03 => Some(Tag::P),
            0x04 => Some(Tag::H1),
            0x05 => Some(Tag::H2),
            0x06 => Some(Tag::H3),
            0x07 => Some(Tag::H4),
            0x08 => Some(Tag::H5),
            0x09 => Some(Tag::H6),
            0x0A => Some(Tag::Button),
            0x0B => Some(Tag::Input),
            0x0C => Some(Tag::Img),
            0x0D => Some(Tag::Br),
            0x0E => Some(Tag::A),
            0x0F => Some(Tag::Ul),
            0x10 => Some(Tag::Ol),
            0x11 => Some(Tag::Li),
            0x12 => Some(Tag::Section),
            0x13 => Some(Tag::Header),
            0x14 => Some(Tag::Footer),
            0x15 => Some(Tag::Nav),
            0x16 => Some(Tag::Main),
            0x17 => Some(Tag::Form),
            0x18 => Some(Tag::Label),
            0x19 => Some(Tag::Select),
            0x1A => Some(Tag::Option),
            0x1B => Some(Tag::Textarea),
            _ => None,
        }
    }

    pub fn from_str(s: &str) -> Tag {
        match s {
            "div" => Tag::Div,
            "span" => Tag::Span,
            "p" => Tag::P,
            "h1" => Tag::H1,
            "h2" => Tag::H2,
            "h3" => Tag::H3,
            "h4" => Tag::H4,
            "h5" => Tag::H5,
            "h6" => Tag::H6,
            "button" => Tag::Button,
            "input" => Tag::Input,
            "img" => Tag::Img,
            "br" => Tag::Br,
            "a" => Tag::A,
            "ul" => Tag::Ul,
            "ol" => Tag::Ol,
            "li" => Tag::Li,
            "section" => Tag::Section,
            "header" => Tag::Header,
            "footer" => Tag::Footer,
            "nav" => Tag::Nav,
            "main" => Tag::Main,
            "form" => Tag::Form,
            "label" => Tag::Label,
            "select" => Tag::Select,
            "option" => Tag::Option,
            "textarea" => Tag::Textarea,
            other => Tag::Custom(other.to_string()),
        }
    }

    pub fn name(&self) -> &str {
        match self {
            Tag::Div => "div",
            Tag::Span => "span",
            Tag::P => "p",
            Tag::H1 => "h1",
            Tag::H2 => "h2",
            Tag::H3 => "h3",
            Tag::H4 => "h4",
            Tag::H5 => "h5",
            Tag::H6 => "h6",
            Tag::Button => "button",
            Tag::Input => "input",
            Tag::Img => "img",
            Tag::Br => "br",
            Tag::A => "a",
            Tag::Ul => "ul",
            Tag::Ol => "ol",
            Tag::Li => "li",
            Tag::Section => "section",
            Tag::Header => "header",
            Tag::Footer => "footer",
            Tag::Nav => "nav",
            Tag::Main => "main",
            Tag::Form => "form",
            Tag::Label => "label",
            Tag::Select => "select",
            Tag::Option => "option",
            Tag::Textarea => "textarea",
            Tag::Custom(s) => s.as_str(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct StyleTable {
    pub entries: Vec<StyleSet>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Clone)]
pub struct StyleSet {
    pub properties: Vec<Property>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Clone)]
pub enum Property {
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
    Color(Color),
    FontSize(u8),
    FlexDirection(FlexDirection),
    JustifyContent(Justify),
    AlignItems(Align),
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
    FlexWrap(FlexWrap),
    FlexGrow(u8),
    FlexShrink(u8),
    ZIndex(i16),
    Visibility(Visibility),
    MaxWidth(Value),
    MinWidth(Value),
    MaxHeight(Value),
    MinHeight(Value),
}

impl Property {
    pub fn id(&self) -> u8 {
        match self {
            Property::Width(_) => 0x01,
            Property::Height(_) => 0x02,
            Property::MarginTop(_) => 0x03,
            Property::MarginRight(_) => 0x04,
            Property::MarginBottom(_) => 0x05,
            Property::MarginLeft(_) => 0x06,
            Property::PaddingTop(_) => 0x07,
            Property::PaddingRight(_) => 0x08,
            Property::PaddingBottom(_) => 0x09,
            Property::PaddingLeft(_) => 0x0A,
            Property::Background(_) => 0x0B,
            Property::Color(_) => 0x0C,
            Property::FontSize(_) => 0x0D,
            Property::FlexDirection(_) => 0x0E,
            Property::JustifyContent(_) => 0x0F,
            Property::AlignItems(_) => 0x10,
            Property::Display(_) => 0x11,
            Property::Position(_) => 0x12,
            Property::Top(_) => 0x13,
            Property::Right(_) => 0x14,
            Property::Bottom(_) => 0x15,
            Property::Left(_) => 0x16,
            Property::BorderWidth(_) => 0x17,
            Property::BorderColor(_) => 0x18,
            Property::BorderRadius(_) => 0x19,
            Property::Opacity(_) => 0x1A,
            Property::Overflow(_) => 0x1B,
            Property::TextAlign(_) => 0x1C,
            Property::FontWeight(_) => 0x1D,
            Property::FontFamily(_) => 0x1E,
            Property::Gap(_) => 0x1F,
            Property::FlexWrap(_) => 0x20,
            Property::FlexGrow(_) => 0x21,
            Property::FlexShrink(_) => 0x22,
            Property::ZIndex(_) => 0x23,
            Property::Visibility(_) => 0x24,
            Property::MaxWidth(_) => 0x25,
            Property::MinWidth(_) => 0x26,
            Property::MaxHeight(_) => 0x27,
            Property::MinHeight(_) => 0x28,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Clone)]
pub enum Value {
    Auto,
    Px(i32),
    Percent(u32),
    Vh(u32),
    Vw(u32),
}

impl Value {
    pub fn unit_byte(&self) -> u8 {
        match self {
            Value::Auto => 0x00,
            Value::Px(_) => 0x01,
            Value::Percent(_) => 0x02,
            Value::Vh(_) => 0x03,
            Value::Vw(_) => 0x04,
        }
    }

    pub fn raw_value(&self) -> i32 {
        match self {
            Value::Auto => 0,
            Value::Px(v) => *v,
            Value::Percent(v) => *v as i32,
            Value::Vh(v) => *v as i32,
            Value::Vw(v) => *v as i32,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Clone)]
pub struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: u8,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Clone)]
pub enum FlexDirection {
    Row,
    Column,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Clone)]
pub enum Justify {
    FlexStart,
    Center,
    FlexEnd,
    SpaceBetween,
    SpaceAround,
    SpaceEvenly,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Clone)]
pub enum Align {
    FlexStart,
    Center,
    FlexEnd,
    Stretch,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Clone)]
pub enum Display {
    Block,
    Flex,
    Grid,
    Inline,
    InlineBlock,
    InlineFlex,
    None,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Clone)]
pub enum Position {
    Static,
    Relative,
    Absolute,
    Fixed,
    Sticky,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Clone)]
pub enum Overflow {
    Visible,
    Hidden,
    Scroll,
    Auto,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Clone)]
pub enum TextAlign {
    Left,
    Center,
    Right,
    Justify,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Clone)]
pub enum FlexWrap {
    Nowrap,
    Wrap,
    WrapReverse,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Clone)]
pub enum Visibility {
    Visible,
    Hidden,
}
