# AstraData Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUI_NETWORK=mainnet
VITE_MARKETPLACE_PACKAGE_ID=0xYOUR_PACKAGE_ID
VITE_MARKETPLACE_OBJECT_ID=0xYOUR_MARKETPLACE_OBJECT_ID
VITE_WALRUS_API_URL=https://walrus-api-url
VITE_SEAL_API_URL=https://seal-api-url
```

## Walrus Integration

During the hackathon, you'll need to:

1. Get Walrus API credentials
2. Replace mock functions in `src/services/walrus.ts` with actual API calls
3. Test file uploads to Walrus storage

## Seal Integration

For truth verification:

1. Get Seal API credentials
2. Replace mock functions in `src/services/seal.ts` with actual API calls
3. Test truth anchor creation and verification

## Smart Contract Deployment

1. **Build contracts:**
   ```bash
   cd contracts
   sui move build
   ```

2. **Deploy to Sui:**
   ```bash
   sui client publish --gas-budget 100000000
   ```

3. **Update .env with deployed IDs:**
   - Copy `PublishedObjectId` for marketplace object
   - Copy `PackageId` for package ID

## Troubleshooting

### Wallet Connection Issues
- Ensure Sui wallet extension is installed
- Check that you're on the correct network (mainnet)

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

### Contract Deployment Issues
- Ensure Sui CLI is installed and configured
- Check you have sufficient SUI for gas fees


