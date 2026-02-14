use nsp_core::{ClientHandshake, ServerHandshake, HandshakeState, SessionParams};
use runemate_forge::secure::compile_and_encrypt;
use std::time::Instant;

fn main() {
    println!("--- NSP/Runemate Secure Neural Pipe Demo ---");
    
    // 1. NSP Handshake
    println!("\n[1] Initializing Post-Quantum Handshake...");
    let start_handshake = Instant::now();
    
    let client_id = [0xAA; 32];
    let mut client = ClientHandshake::new(client_id);
    let mut server = ServerHandshake::new();
    
    let client_dsa_pk = client.public_key_bytes().to_vec();
    let server_dsa_pk = server.public_key_bytes().to_vec();
    
    // Step 1: ClientHello
    let c_hello = client.create_hello().expect("ClientHello failed");
    server.process_client_hello(c_hello, &client_dsa_pk).expect("Server process ClientHello failed");
    
    // Step 2: ServerHello
    let s_hello = server.create_server_hello(client.kem_public_key_bytes(), SessionParams::default())
        .expect("ServerHello failed");
    client.process_server_hello(s_hello, &server_dsa_pk).expect("Client process ServerHello failed");
    
    // Step 3: ClientConfirm
    let c_confirm = client.create_confirm().expect("ClientConfirm failed");
    server.process_client_confirm(c_confirm).expect("Server process ClientConfirm failed");
    
    // Step 4: ServerReady
    let s_ready = server.create_ready().expect("ServerReady failed");
    client.process_server_ready(s_ready).expect("Client process ServerReady failed");
    server.mark_established().expect("Final establishment failed");
    
    assert_eq!(*client.state(), HandshakeState::Established);
    println!("SUCCESS: Handshake established in {:?}", start_handshake.elapsed());
    
    let session = client.session().unwrap();
    println!("Session ID: {:02X?}", &session.id()[..8]);

    // 2. Runemate Compilation & Encryption
    println!("\n[2] Compiling & Encrypting BCI Dashboard...");
    let bci_html = r#"
        <div class="dashboard">
            <h1>Neural Status</h1>
            <div class="metrics">
                <p>Heart Rate: 72 bpm</p>
                <p>Neural Load: 14%</p>
            </div>
            <button onclick="calibrate()">Re-calibrate</button>
        </div>
    "#;
    
    let start_compile = Instant::now();
    let nonce = [0x11; 12];
    let encrypted_payload = compile_and_encrypt(session, bci_html, &nonce)
        .expect("Secure compilation failed");
    let compile_time = start_compile.elapsed();
    
    println!("Source Size: {} bytes", bci_html.len());
    println!("Secure Payload Size: {} bytes", encrypted_payload.len());
    println!("Processing Time: {:?}", compile_time);
    
    let compression = (1.0 - (encrypted_payload.len() as f64 / bci_html.len() as f64)) * 100.0;
    println!("Effective Compression: {:.1}%", compression);

    // 3. Client-side Decryption
    println!("\n[3] Client Decrypting Neural Frame...");
    let start_decrypt = Instant::now();
    let decrypted_bytecode = session.decrypt(&nonce, &encrypted_payload)
        .expect("Decryption failed");
    println!("Decryption Time: {:?}", start_decrypt.elapsed());
    
    println!("\n--- Pipeline Verified Successfully ---");
}
