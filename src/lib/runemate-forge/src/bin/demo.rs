use nsp_core::{ClientHandshake, ServerHandshake, HandshakeState, SessionParams};
use runemate_forge::secure::compile_and_encrypt;
use runemate_forge::disasm;
use std::time::Instant;

const DEMO_SOURCE: &str = r#"
style dark_card {
    background: #1a1a2e
    padding-top: 16px
    padding-right: 16px
    padding-bottom: 16px
    padding-left: 16px
    border-radius: 8px
    width: 100%
}

style metric_row {
    direction: row
    justify: between
    gap: 12px
}

tone notify {
    frequency: 440hz
    duration: 100ms
    amplitude: 0.25
    waveform: sine
    channel: 0
}

tone alert {
    frequency: 880hz
    duration: 300ms
    amplitude: 0.5
    waveform: square
    channel: 1
}

safety bci_default {
    max-elements: 256
    max-depth: 16
    max-bytecode: 65536
    max-charge-density: 30.0
    max-charge-per-phase: 4.0
    max-frequency: 2500
    max-amplitude: 1.0
    shannon-k: 1.75
}

stave dashboard {
    column(style: dark_card) {
        heading(1) "Neural Status"
        separator
        row(style: metric_row) {
            metric "Heart Rate" "72 bpm"
            metric "Neural Load" "14%"
            metric "Signal Quality" "98%"
        }
        spacer 16px
        button(action: "calibrate") "Re-calibrate"
        tone notify
    }
}
"#;

fn main() {
    println!("--- Runemate Forge v1.0 / NSP Secure Neural Pipe Demo ---");

    // 1. NSP Handshake
    println!("\n[1] Post-Quantum Handshake (ML-KEM-768 + ML-DSA-65)...");
    let start_handshake = Instant::now();

    let client_id = [0xAA; 32];
    let mut client = ClientHandshake::new(client_id);
    let mut server = ServerHandshake::new();

    let client_dsa_pk = client.public_key_bytes().to_vec();
    let server_dsa_pk = server.public_key_bytes().to_vec();

    let c_hello = client.create_hello().expect("ClientHello failed");
    server.process_client_hello(c_hello, &client_dsa_pk).expect("Server process failed");

    let s_hello = server.create_server_hello(client.kem_public_key_bytes(), SessionParams::default())
        .expect("ServerHello failed");
    client.process_server_hello(s_hello, &server_dsa_pk).expect("Client process failed");

    let c_confirm = client.create_confirm().expect("ClientConfirm failed");
    server.process_client_confirm(c_confirm).expect("Server process failed");

    let s_ready = server.create_ready().expect("ServerReady failed");
    client.process_server_ready(s_ready).expect("Client process failed");
    server.mark_established().expect("Final establishment failed");

    assert_eq!(*client.state(), HandshakeState::Established);
    println!("  Handshake established in {:?}", start_handshake.elapsed());

    let session = client.session().unwrap();
    println!("  Session ID: {:02X?}...", &session.id()[..8]);

    // 2. Compile & Encrypt
    println!("\n[2] Compiling Staves DSL & Encrypting...");
    let start_compile = Instant::now();
    let nonce = [0x11; 12];

    let (encrypted, result) = compile_and_encrypt(session, DEMO_SOURCE, &nonce)
        .expect("Secure compilation failed");
    let compile_time = start_compile.elapsed();

    println!("  Source: {} bytes", DEMO_SOURCE.len());
    println!("  Bytecode: {} bytes", result.bytecode.len());
    println!("  Encrypted: {} bytes (+{} overhead)",
        encrypted.len(), encrypted.len() - result.bytecode.len());
    println!("  Staves: {:?}", result.stave_names);
    println!("  Compile+Encrypt: {:?}", compile_time);

    if !result.warnings.is_empty() {
        println!("  Warnings:");
        for w in &result.warnings {
            println!("    - {}", w);
        }
    }

    let compression = (1.0 - (result.bytecode.len() as f64 / DEMO_SOURCE.len() as f64)) * 100.0;
    println!("  Compression: {:.1}%", compression);

    // 3. Decrypt & Verify
    println!("\n[3] Decrypting on Client...");
    let start_decrypt = Instant::now();
    let decrypted = session.decrypt(&nonce, &encrypted).expect("Decryption failed");
    println!("  Decrypt: {:?}", start_decrypt.elapsed());
    assert_eq!(decrypted, result.bytecode);
    assert_eq!(&decrypted[0..4], b"STV1");
    println!("  Magic: STV1 verified");

    // 4. Disassemble
    println!("\n[4] Disassembly:");
    let disasm_output = disasm::disassemble(&decrypted).expect("Disassembly failed");
    for line in disasm_output.lines() {
        println!("  {}", line);
    }

    println!("\n--- Pipeline Verified Successfully ---");
}
