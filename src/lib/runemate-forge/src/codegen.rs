use crate::ast::RunemateAst;
use crate::error::ForgeError;

/// Emit Staves v1.0 bytecode from the Runemate AST
pub fn emit(ast: RunemateAst) -> Result<Vec<u8>, ForgeError> {
    // Initial implementation uses bincode as a placeholder for the custom bytecode
    // Phase 4 will implement the actual bit-packed opcode stream
    bincode::serialize(&ast)
        .map_err(|e| ForgeError::CodegenError(e.to_string()))
}
