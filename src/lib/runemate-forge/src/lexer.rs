use html5ever::tendril::TendrilSink;
use html5ever::{parse_document, ParseOpts};
use markup5ever_rcdom::{RcDom, NodeData, Handle};
use crate::error::ForgeError;

pub type Dom = RcDom;

/// Parse HTML into an RC DOM for processing
pub fn parse_html(html: &str) -> Result<Dom, ForgeError> {
    let opts = ParseOpts::default();
    
    let dom = parse_document(RcDom::default(), opts)
        .from_utf8()
        .read_from(&mut html.as_bytes())
        .map_err(|e: std::io::Error| ForgeError::ParseError(e.to_string()))?;
        
    Ok(dom)
}

/// Helper to debug print the DOM structure
pub fn walk_dom(handle: &Handle, depth: usize) {
    let node = handle;
    match node.data {
        NodeData::Document => println!("Document"),
        NodeData::Doctype { ref name, .. } => println!("Doctype: {}", name),
        NodeData::Text { ref contents } => {
            let text = contents.borrow();
            if !text.trim().is_empty() {
                println!("{:depth$}Text: {}", "", text.trim(), depth = depth * 2);
            }
        },
        NodeData::Comment { .. } => {},
        NodeData::Element { ref name, .. } => {
            println!("{:depth$}Element: <{}>", "", name.local, depth = depth * 2);
            for child in node.children.borrow().iter() {
                walk_dom(child, depth + 1);
            }
        },
        _ => {},
    }
}
