fn main() {
    let network = std::env::var("NETWORK").unwrap_or_else(|_| "localnet".to_string());
    println!("cargo:rustc-cfg=feature=\"{}\"", network);
}