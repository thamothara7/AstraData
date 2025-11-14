# Vercel Deployment Guide

## Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)

## Deployment Steps

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Vite configuration

### 3. Configure Environment Variables

In Vercel project settings, add these environment variables:

#### Required Variables:
```
VITE_SUI_NETWORK=sui:mainnet
# OR for testnet:
# VITE_SUI_NETWORK=sui:testnet

VITE_MARKETPLACE_PACKAGE_ID=0xYOUR_PACKAGE_ID
VITE_MARKETPLACE_OBJECT_ID=0xYOUR_MARKETPLACE_OBJECT_ID
```

#### Optional Variables:
```
VITE_WALRUS_API_URL=https://walrus-api-url
VITE_SEAL_API_URL=https://seal-api-url
```

### 4. Build Settings

Vercel should auto-detect:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

If not auto-detected, manually set:
- Build Command: `npm run build`
- Output Directory: `dist`
- Framework: Vite

### 5. Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Your app will be live at `your-project.vercel.app`

## Getting Your Contract IDs

### For Testnet:
```bash
cd contracts
sui client publish --gas-budget 100000000 --json > publish-testnet.json
```

### For Mainnet:
```bash
cd contracts
sui client publish --gas-budget 100000000 --json > publish-mainnet.json
```

Extract from the JSON:
- `packageId` → `VITE_MARKETPLACE_PACKAGE_ID`
- Find the shared `Marketplace` object in `createdObjects` → `VITE_MARKETPLACE_OBJECT_ID`

## Troubleshooting

### Build Fails
- Check that all TypeScript errors are resolved
- Ensure `npm run build` works locally
- Check Vercel build logs for specific errors

### Environment Variables Not Working
- Make sure variables start with `VITE_` prefix
- Redeploy after adding new variables
- Check variable names match exactly

### Wallet Connection Issues
- Ensure `VITE_SUI_NETWORK` matches the network your contracts are on
- Verify package and object IDs are correct

### Download Not Working
- Set `VITE_WALRUS_API_URL` if using Walrus API
- Check browser console for errors

## Post-Deployment

1. Test wallet connection
2. Test dataset upload
3. Test dataset purchase
4. Test download functionality
5. Verify NFTs appear in wallet

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

