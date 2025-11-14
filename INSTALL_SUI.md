# Installing Sui CLI

## Option 1: Using Homebrew (Recommended for macOS)

```bash
brew install mystenlabs/tap/sui
```

## Option 2: Using Cargo (If you have Rust installed)

```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch main sui
```

## Option 3: Download Pre-built Binary

For macOS:
```bash
curl -fsSL https://get.sui.io | sh
```

Or download directly from:
https://github.com/MystenLabs/sui/releases

## Verify Installation

After installation, verify it works:
```bash
sui --version
```

## Configure Sui

1. Create a new account:
```bash
sui client new-address ed25519
```

2. Switch to mainnet:
```bash
sui client switch --env mainnet
```

## Troubleshooting

If you get "command not found" after installation:

1. Make sure `/usr/local/bin` (or `~/.cargo/bin` if using cargo) is in your PATH:
```bash
echo $PATH
```

2. Add to your shell config (if needed):
```bash
# For zsh
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# OR for cargo install
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

3. Verify installation:
```bash
which sui
sui --version
```


