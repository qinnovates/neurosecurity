use thiserror::Error;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Span {
    pub line: u32,
    pub col: u32,
}

impl std::fmt::Display for Span {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}:{}", self.line, self.col)
    }
}

#[derive(Error, Debug)]
pub enum ForgeError {
    #[error("[{span}] parse error: {message}")]
    Parse { message: String, span: Span },
    #[error("parse error: {0}")]
    ParseSimple(String),
    #[error("[{span}] TARA violation: {message}")]
    TaraViolation { message: String, span: Span },
    #[error("TARA violation: {0}")]
    TaraSimple(String),
    #[error("codegen error: {0}")]
    Codegen(String),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
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
            write!(f, "[{}] {}: {}", span, self.kind, self.message)
        } else {
            write!(f, "{}: {}", self.kind, self.message)
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub enum WarningKind {
    TaraLimit,
    Deprecated,
    Unused,
}

impl std::fmt::Display for WarningKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            WarningKind::TaraLimit => write!(f, "TARA limit"),
            WarningKind::Deprecated => write!(f, "deprecated"),
            WarningKind::Unused => write!(f, "unused"),
        }
    }
}

#[derive(Debug)]
pub struct CompileResult {
    pub bytecode: Vec<u8>,
    pub warnings: Vec<ForgeWarning>,
    pub stave_names: Vec<String>,
}
