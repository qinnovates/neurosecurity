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
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Clone)]
pub enum Tag {
    Div,
    Span,
    P,
    H1,
    H2,
    Button,
    Input,
    Img,
    Custom(String),
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
    Margin(EdgeValues),
    Padding(EdgeValues),
    Background(Color),
    Color(Color),
    FlexDirection(FlexDirection),
    JustifyContent(Justify),
    AlignItems(Align),
    FontSize(u8),
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Clone)]
pub enum Value {
    Auto,
    Px(i32),
    Percent(u32), // In basis points (10000 = 100%)
    Vh(u32),      // In 0.1% units (1000 = 100vh)
    Vw(u32),      // In 0.1% units (1000 = 100vw)
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Clone)]
pub struct EdgeValues {
    pub top: Value,
    pub right: Value,
    pub bottom: Value,
    pub left: Value,
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
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Clone)]
pub enum Align {
    FlexStart,
    Center,
    FlexEnd,
    Stretch,
}
