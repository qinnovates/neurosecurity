use crate::error::{ForgeError, Span};

#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    // Keywords
    Stave, Style, Tone, Pulse, Safety,
    Heading, Text, Button, Input, Image, Link, Spacer, Item, Metric, Separator,
    Row, Column, Section, List, Grid,
    // Literals
    Ident(String),
    StringLit(String),
    IntLit(i64),
    FloatLit(f64),
    ColorHex(u8, u8, u8, u8), // r,g,b,a
    // Values with units
    Px(i32),
    Percent(u32),
    Vh(u32),
    Vw(u32),
    Hz(u16),
    Ms(u16),
    Seconds(u16),
    // Symbols
    LBrace, RBrace, LParen, RParen, Colon, Comma,
    // Special
    Auto,
    Eof,
}

#[derive(Debug, Clone)]
pub struct SpannedToken {
    pub token: Token,
    pub span: Span,
}

pub fn lex(source: &str) -> Result<Vec<SpannedToken>, ForgeError> {
    let mut tokens = Vec::new();
    let chars: Vec<char> = source.chars().collect();
    let mut pos = 0;
    let mut line: u32 = 1;
    let mut col: u32 = 1;

    while pos < chars.len() {
        let ch = chars[pos];

        // Whitespace
        if ch == '\n' {
            line += 1;
            col = 1;
            pos += 1;
            continue;
        }
        if ch.is_ascii_whitespace() {
            col += 1;
            pos += 1;
            continue;
        }

        // Comments: // or #
        if ch == '/' && pos + 1 < chars.len() && chars[pos + 1] == '/' {
            while pos < chars.len() && chars[pos] != '\n' { pos += 1; }
            continue;
        }
        if ch == '#' && (pos == 0 || chars[pos - 1] == '\n' || chars.get(pos.wrapping_sub(1)).map_or(true, |c| c.is_ascii_whitespace())) {
            // Line comment starting with # (only at start of line or after whitespace, to avoid conflict with color hex)
            // Actually, # as comment is ambiguous with hex colors. Let's check if next char is a letter/digit for hex.
            if pos + 1 < chars.len() && chars[pos + 1].is_ascii_hexdigit() {
                // This is a color hex, not a comment — fall through
            } else {
                while pos < chars.len() && chars[pos] != '\n' { pos += 1; }
                continue;
            }
        }

        let span = Span { line, col };

        // Symbols
        match ch {
            '{' => { tokens.push(SpannedToken { token: Token::LBrace, span }); pos += 1; col += 1; continue; }
            '}' => { tokens.push(SpannedToken { token: Token::RBrace, span }); pos += 1; col += 1; continue; }
            '(' => { tokens.push(SpannedToken { token: Token::LParen, span }); pos += 1; col += 1; continue; }
            ')' => { tokens.push(SpannedToken { token: Token::RParen, span }); pos += 1; col += 1; continue; }
            ':' => { tokens.push(SpannedToken { token: Token::Colon, span }); pos += 1; col += 1; continue; }
            ',' => { tokens.push(SpannedToken { token: Token::Comma, span }); pos += 1; col += 1; continue; }
            _ => {}
        }

        // String literal
        if ch == '"' {
            pos += 1;
            col += 1;
            let mut s = String::new();
            while pos < chars.len() && chars[pos] != '"' {
                if chars[pos] == '\\' && pos + 1 < chars.len() {
                    match chars[pos + 1] {
                        'n' => { s.push('\n'); pos += 2; col += 2; }
                        't' => { s.push('\t'); pos += 2; col += 2; }
                        '"' => { s.push('"'); pos += 2; col += 2; }
                        '\\' => { s.push('\\'); pos += 2; col += 2; }
                        _ => { s.push(chars[pos + 1]); pos += 2; col += 2; }
                    }
                } else {
                    if chars[pos] == '\n' { line += 1; col = 1; } else { col += 1; }
                    s.push(chars[pos]);
                    pos += 1;
                }
            }
            if pos >= chars.len() {
                return Err(ForgeError::Parse { message: "unterminated string".to_string(), span });
            }
            pos += 1; // closing "
            col += 1;
            tokens.push(SpannedToken { token: Token::StringLit(s), span });
            continue;
        }

        // Color hex: #RGB, #RRGGBB, #RRGGBBAA
        if ch == '#' {
            pos += 1;
            col += 1;
            let start = pos;
            while pos < chars.len() && chars[pos].is_ascii_hexdigit() {
                pos += 1;
                col += 1;
            }
            let hex: String = chars[start..pos].iter().collect();
            let (r, g, b, a) = parse_hex_color(&hex, span)?;
            tokens.push(SpannedToken { token: Token::ColorHex(r, g, b, a), span });
            continue;
        }

        // Number (may have unit suffix)
        if ch.is_ascii_digit() || (ch == '-' && pos + 1 < chars.len() && chars[pos + 1].is_ascii_digit()) {
            let start = pos;
            if ch == '-' { pos += 1; col += 1; }
            while pos < chars.len() && chars[pos].is_ascii_digit() { pos += 1; col += 1; }

            let mut is_float = false;
            if pos < chars.len() && chars[pos] == '.' && pos + 1 < chars.len() && chars[pos + 1].is_ascii_digit() {
                is_float = true;
                pos += 1; col += 1;
                while pos < chars.len() && chars[pos].is_ascii_digit() { pos += 1; col += 1; }
            }

            let num_str: String = chars[start..pos].iter().collect();

            // Check for unit suffix (including %)
            let suffix_start = pos;
            if pos < chars.len() && chars[pos] == '%' {
                pos += 1; col += 1;
            } else {
                while pos < chars.len() && chars[pos].is_ascii_alphabetic() { pos += 1; col += 1; }
            }
            let suffix: String = chars[suffix_start..pos].iter().collect();

            let token = match suffix.as_str() {
                "px" => Token::Px(num_str.parse::<i32>().map_err(|_| ForgeError::Parse { message: format!("invalid px value: {}", num_str), span })?),
                "%" => Token::Percent(num_str.parse::<u32>().map_err(|_| ForgeError::Parse { message: format!("invalid % value: {}", num_str), span })? * 100),
                "vh" => Token::Vh(num_str.parse::<u32>().map_err(|_| ForgeError::Parse { message: format!("invalid vh value: {}", num_str), span })? * 10),
                "vw" => Token::Vw(num_str.parse::<u32>().map_err(|_| ForgeError::Parse { message: format!("invalid vw value: {}", num_str), span })? * 10),
                "hz" => Token::Hz(num_str.parse::<u16>().map_err(|_| ForgeError::Parse { message: format!("invalid hz value: {}", num_str), span })?),
                "ms" => Token::Ms(num_str.parse::<u16>().map_err(|_| ForgeError::Parse { message: format!("invalid ms value: {}", num_str), span })?),
                "s" => Token::Seconds(num_str.parse::<u16>().map_err(|_| ForgeError::Parse { message: format!("invalid s value: {}", num_str), span })?),
                "" if is_float => Token::FloatLit(num_str.parse::<f64>().map_err(|_| ForgeError::Parse { message: format!("invalid float: {}", num_str), span })?),
                "" => Token::IntLit(num_str.parse::<i64>().map_err(|_| ForgeError::Parse { message: format!("invalid integer: {}", num_str), span })?),
                _ => return Err(ForgeError::Parse { message: format!("unknown unit suffix: {}", suffix), span }),
            };
            tokens.push(SpannedToken { token, span });
            continue;
        }

        // Identifier or keyword
        if ch.is_ascii_alphabetic() || ch == '_' {
            let start = pos;
            while pos < chars.len() && (chars[pos].is_ascii_alphanumeric() || chars[pos] == '_' || chars[pos] == '-') {
                pos += 1;
                col += 1;
            }
            let word: String = chars[start..pos].iter().collect();
            let token = match word.as_str() {
                "stave" => Token::Stave,
                "style" => Token::Style,
                "tone" => Token::Tone,
                "pulse" => Token::Pulse,
                "safety" => Token::Safety,
                "heading" => Token::Heading,
                "text" => Token::Text,
                "button" => Token::Button,
                "input" => Token::Input,
                "image" => Token::Image,
                "link" => Token::Link,
                "spacer" => Token::Spacer,
                "item" => Token::Item,
                "metric" => Token::Metric,
                "separator" => Token::Separator,
                "row" => Token::Row,
                "column" => Token::Column,
                "section" => Token::Section,
                "list" => Token::List,
                "grid" => Token::Grid,
                "auto" => Token::Auto,
                _ => Token::Ident(word),
            };
            tokens.push(SpannedToken { token, span });
            continue;
        }

        return Err(ForgeError::Parse {
            message: format!("unexpected character: '{}'", ch),
            span,
        });
    }

    tokens.push(SpannedToken { token: Token::Eof, span: Span { line, col } });
    Ok(tokens)
}

fn parse_hex_color(hex: &str, span: Span) -> Result<(u8, u8, u8, u8), ForgeError> {
    let err = || ForgeError::Parse { message: format!("invalid hex color: #{}", hex), span };
    match hex.len() {
        3 => {
            let r = u8::from_str_radix(&hex[0..1], 16).map_err(|_| err())?;
            let g = u8::from_str_radix(&hex[1..2], 16).map_err(|_| err())?;
            let b = u8::from_str_radix(&hex[2..3], 16).map_err(|_| err())?;
            Ok((r * 17, g * 17, b * 17, 255))
        }
        6 => {
            let r = u8::from_str_radix(&hex[0..2], 16).map_err(|_| err())?;
            let g = u8::from_str_radix(&hex[2..4], 16).map_err(|_| err())?;
            let b = u8::from_str_radix(&hex[4..6], 16).map_err(|_| err())?;
            Ok((r, g, b, 255))
        }
        8 => {
            let r = u8::from_str_radix(&hex[0..2], 16).map_err(|_| err())?;
            let g = u8::from_str_radix(&hex[2..4], 16).map_err(|_| err())?;
            let b = u8::from_str_radix(&hex[4..6], 16).map_err(|_| err())?;
            let a = u8::from_str_radix(&hex[6..8], 16).map_err(|_| err())?;
            Ok((r, g, b, a))
        }
        _ => Err(err()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lex_basic() {
        let src = r#"stave dashboard {
            heading(1) "Hello"
        }"#;
        let tokens = lex(src).unwrap();
        assert_eq!(tokens[0].token, Token::Stave);
        assert_eq!(tokens[1].token, Token::Ident("dashboard".to_string()));
        assert_eq!(tokens[2].token, Token::LBrace);
        assert_eq!(tokens[3].token, Token::Heading);
        assert_eq!(tokens[4].token, Token::LParen);
        assert_eq!(tokens[5].token, Token::IntLit(1));
        assert_eq!(tokens[6].token, Token::RParen);
        assert_eq!(tokens[7].token, Token::StringLit("Hello".to_string()));
        assert_eq!(tokens[8].token, Token::RBrace);
    }

    #[test]
    fn test_lex_color() {
        let tokens = lex("#1a1a2e").unwrap();
        assert_eq!(tokens[0].token, Token::ColorHex(0x1a, 0x1a, 0x2e, 0xff));
    }

    #[test]
    fn test_lex_units() {
        let tokens = lex("8px 50% 100vh 440hz 200ms").unwrap();
        assert_eq!(tokens[0].token, Token::Px(8));
        assert_eq!(tokens[1].token, Token::Percent(5000));
        assert_eq!(tokens[2].token, Token::Vh(1000));
        assert_eq!(tokens[3].token, Token::Hz(440));
        assert_eq!(tokens[4].token, Token::Ms(200));
    }

    #[test]
    fn test_lex_comment() {
        let tokens = lex("// this is a comment\nstave test {}").unwrap();
        assert_eq!(tokens[0].token, Token::Stave);
    }
}
