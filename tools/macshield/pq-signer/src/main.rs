use clap::{Parser, Subcommand};
use pqcrypto_dilithium::dilithium3;
use pqcrypto_traits::sign::{PublicKey, SecretKey, DetachedSignature};
use base64::{Engine as _, engine::general_purpose};

#[derive(Parser)]
#[command(name = "pq-signer")]
#[command(about = "Post-Quantum Secure Signer for macshield fingerprints", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Generate a new ML-DSA keypair
    Keygen,
    /// Sign data using a private key
    Sign {
        #[arg(short, long)]
        key: String,
        #[arg(short, long)]
        data: String,
    },
    /// Verify a signature using a public key
    Verify {
        #[arg(short, long)]
        key: String,
        #[arg(short, long)]
        data: String,
        #[arg(short, long)]
        sig: String,
    },
}

fn main() {
    let cli = Cli::parse();

    match &cli.command {
        Commands::Keygen => {
            let (pk, sk) = dilithium3::keypair();
            println!("PUBLIC_KEY:{}", general_purpose::STANDARD.encode(pk.as_bytes()));
            println!("PRIVATE_KEY:{}", general_purpose::STANDARD.encode(sk.as_bytes()));
        }
        Commands::Sign { key, data } => {
            let sk_bytes = general_purpose::STANDARD.decode(key)
                .expect("Failed to decode private key from base64");
            let sk = dilithium3::SecretKey::from_bytes(&sk_bytes)
                .expect("Invalid private key bytes");
            
            let sig = dilithium3::detached_sign(data.as_bytes(), &sk);
            println!("{}", general_purpose::STANDARD.encode(sig.as_bytes()));
        }
        Commands::Verify { key, data, sig } => {
            let pk_bytes = general_purpose::STANDARD.decode(key)
                .expect("Failed to decode public key from base64");
            let pk = dilithium3::PublicKey::from_bytes(&pk_bytes)
                .expect("Invalid public key bytes");
            
            let sig_bytes = general_purpose::STANDARD.decode(sig)
                .expect("Failed to decode signature from base64");
            let detached_sig = dilithium3::DetachedSignature::from_bytes(&sig_bytes)
                .expect("Invalid signature bytes");

            if dilithium3::verify_detached_signature(&detached_sig, data.as_bytes(), &pk).is_ok() {
                println!("VALID");
            } else {
                println!("INVALID");
                std::process::exit(1);
            }
        }
    }
}
