use thiserror::Error;
use crate::ast::Span;

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
    #[error("Strict mode violation: {0}")]
    StrictViolation(String),
}

#[derive(Debug, Clone)]
pub struct ForgeWarning {
    pub message: String,
    pub span: Option<Span>,
    pub kind: WarningKind,
}

impl std::fmt::Display for ForgeWarning {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        if let Some(span) = &self.span {
            write!(f, "[{}:{}] {}: {}", span.line, span.col, self.kind, self.message)
        } else {
            write!(f, "{}: {}", self.kind, self.message)
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub enum WarningKind {
    UnsupportedTag,
    UnsupportedProperty,
    InvalidValue,
    TaraViolation,
    SkippedElement,
}

impl std::fmt::Display for WarningKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            WarningKind::UnsupportedTag => write!(f, "unsupported tag"),
            WarningKind::UnsupportedProperty => write!(f, "unsupported property"),
            WarningKind::InvalidValue => write!(f, "invalid value"),
            WarningKind::TaraViolation => write!(f, "TARA violation"),
            WarningKind::SkippedElement => write!(f, "skipped element"),
        }
    }
}

#[derive(Debug)]
pub struct CompileResult {
    pub bytecode: Vec<u8>,
    pub warnings: Vec<ForgeWarning>,
}
