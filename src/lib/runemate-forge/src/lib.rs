pub mod ast;
pub mod lexer;
pub mod parser;
pub mod codegen;
pub mod error;

pub use error::ForgeError;

/// Compile HTML/CSS source into Staves v1.0 bytecode
pub fn compile(html: &str) -> Result<Vec<u8>, ForgeError> {
    // 1. Lexing & Parsing
    let dom = lexer::parse_html(html)?;
    
    // 2. Transform to Runemate AST
    let ast = parser::transform(dom)?;
    
    // 3. Code Generation
    let bytecode = codegen::emit(ast)?;
    
    Ok(bytecode)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compile_minimal() {
        let html = "<div>Hello Neural</div>";
        let result = compile(html);
        assert!(result.is_ok());
        let bytecode = result.unwrap();
        assert!(!bytecode.is_empty());
        println!("Bytecode size: {} bytes", bytecode.len());
    }

    #[test]
    fn test_compile_nested() {
        let html = "<div><h1>Title</h1><p>Paragraph with <span>span</span></p></div>";
        let result = compile(html);
        assert!(result.is_ok());
        let bytecode = result.unwrap();
        assert!(!bytecode.is_empty());
    }

    #[test]
    fn test_lexer_strips_comments() {
        let html = "<div><!-- comment -->Text</div>";
        let dom = lexer::parse_html(html).unwrap();
        let ast = parser::transform(dom).unwrap();
        
        // Find the div node in the tree
        fn find_div(node: &ast::Node) -> Option<&ast::ElementNode> {
            match node {
                ast::Node::Element(el) if el.tag == ast::Tag::Div => Some(el),
                ast::Node::Element(el) => {
                    for child in &el.children {
                        if let Some(res) = find_div(child) {
                            return Some(res);
                        }
                    }
                    None
                },
                ast::Node::Fragment(children) => {
                    for child in children {
                        if let Some(res) = find_div(child) {
                            return Some(res);
                        }
                    }
                    None
                },
                _ => None,
            }
        }

        let div = find_div(&ast.root).expect("Could not find div in AST");
        // Children of div should only be the text "Text", skipping the comment
        assert_eq!(div.children.len(), 1);
        if let ast::Node::Text(t) = &div.children[0] {
            assert_eq!(t, "Text");
        } else {
            panic!("Expected text node");
        }
    }
}
