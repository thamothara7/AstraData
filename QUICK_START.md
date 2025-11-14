# Quick Start Guide

## ✅ Frontend Issues Fixed

The module type warning has been fixed by adding `"type": "module"` to `package.json`.

## 🚀 Running the Frontend

The frontend is already running! You should see it at:
- **Local**: http://localhost:3000/
- The warning should be gone after restarting

If you need to restart:
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## 🔧 Installing Sui CLI

Choose one of these methods:

### Method 1: Homebrew (Easiest - macOS)
```bash
brew install mystenlabs/tap/sui
```

### Method 2: Direct Download
1. Go to: https://github.com/MystenLabs/sui/releases
2. Download the latest `sui-macos` release
3. Extract and move to `/usr/local/bin`:
```bash
unzip sui-macos.zip
sudo mv sui /usr/local/bin/
chmod +x /usr/local/bin/sui
```

### Method 3: Build from Source (If you have Rust/Cargo)
```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch main sui
```

### Verify Installation
```bash
sui --version
```

If command not found, add to PATH:
```bash
# For zsh (default on macOS)
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Or if using cargo:
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## 📝 Next Steps

1. **Frontend is working** ✅
   - Open http://localhost:3000 in your browser
   - Connect your Sui wallet
   - Try uploading a dataset or browsing the marketplace

2. **Install Sui CLI** (for deploying contracts)
   ```bash
   brew install mystenlabs/tap/sui
   ```

3. **Build Contracts** (after Sui CLI is installed)
   ```bash
   cd contracts
   sui move build
   ```

4. **Deploy Contracts** (to Sui mainnet)
   ```bash
   sui client publish --gas-budget 100000000
   ```

## 🐛 Troubleshooting

### Frontend Issues
- If you see errors in the browser console, check:
  - Sui wallet extension is installed
  - Network is set to mainnet in wallet
  - All npm packages are installed: `npm install`

### Sui CLI Issues
- Make sure PATH includes `/usr/local/bin` or `~/.cargo/bin`
- Restart your terminal after installing
- Check with `which sui` and `sui --version`

### Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node version: `node --version` (should be 18+)

