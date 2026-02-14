use thiserror::Error;

#[derive(Error, Debug)]
pub enum ForgeError {
    #[error("HTML parsing error: {0}")]
    ParseError(String),
    #[error("CSS resolution error: {0}")]
    CssError(String),
    #[error("AST transformation error: {0}")]
    AstError(String),
    #[error("Bytecode generation error: {0}")]
    CodegenError(String),
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}
