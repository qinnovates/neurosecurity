use markup5ever_rcdom::{NodeData, Handle};
use crate::ast::{RunemateAst, Node, ElementNode, Tag, StyleTable};
use crate::error::ForgeError;
use std::collections::HashMap;

/// Transform the RC DOM into a Runemate AST
pub fn transform(dom: markup5ever_rcdom::RcDom) -> Result<RunemateAst, ForgeError> {
    let root = transform_node(&dom.document)?;
    
    Ok(RunemateAst {
        root,
        styles: StyleTable::default(), // Style resolution comes later
    })
}

fn transform_node(handle: &Handle) -> Result<Node, ForgeError> {
    match handle.data {
        NodeData::Document => {
            let children = transform_children(handle)?;
            Ok(Node::Fragment(children))
        },
        NodeData::Element { ref name, ref attrs, .. } => {
            let tag = match name.local.as_ref() {
                "div" => Tag::Div,
                "span" => Tag::Span,
                "p" => Tag::P,
                "h1" => Tag::H1,
                "h2" => Tag::H2,
                "button" => Tag::Button,
                "input" => Tag::Input,
                "img" => Tag::Img,
                other => Tag::Custom(other.to_string()),
            };
            
            let mut attributes = HashMap::new();
            for attr in attrs.borrow().iter() {
                attributes.insert(attr.name.local.to_string(), attr.value.to_string());
            }
            
            let children = transform_children(handle)?;
            
            Ok(Node::Element(ElementNode {
                tag,
                attributes,
                children,
                style_index: None,
            }))
        },
        NodeData::Text { ref contents } => {
            Ok(Node::Text(contents.borrow().to_string()))
        },
        _ => Ok(Node::Fragment(vec![])), // Skip comments, doctypes, etc.
    }
}

fn transform_children(handle: &Handle) -> Result<Vec<Node>, ForgeError> {
    let mut nodes = Vec::new();
    for child in handle.children.borrow().iter() {
        let node = transform_node(child)?;
        match node {
            Node::Fragment(inner) if inner.is_empty() => {},
            _ => nodes.push(node),
        }
    }
    Ok(nodes)
}
