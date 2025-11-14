# Vercel Deployment Checklist

## ✅ Pre-Deployment Checks

- [x] Build completes successfully (`npm run build`)
- [x] No TypeScript errors
- [x] No linter errors
- [x] Vercel configuration file exists (`vercel.json`)
- [x] Environment variables documented

## 📋 Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Vite

### 3. Set Environment Variables in Vercel

Go to **Project Settings → Environment Variables** and add:

#### Required:
```
VITE_SUI_NETWORK=sui:mainnet
VITE_MARKETPLACE_PACKAGE_ID=0xYOUR_PACKAGE_ID
VITE_MARKETPLACE_OBJECT_ID=0xYOUR_MARKETPLACE_OBJECT_ID
```

#### Optional:
```
VITE_WALRUS_API_URL=https://walrus-api-url
VITE_SEAL_API_URL=https://seal-api-url
```

**Important**: 
- Variables must start with `VITE_` to be accessible in the frontend
- Redeploy after adding/updating variables
- Use the same values for Production, Preview, and Development

### 4. Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Check build logs for any errors

### 5. Verify Deployment
- [ ] Site loads without errors
- [ ] Wallet connection works
- [ ] Can view marketplace
- [ ] Can upload datasets (if configured)
- [ ] Can purchase datasets (if configured)
- [ ] Can view purchased datasets
- [ ] Download functionality works (if Walrus API configured)

## 🔧 Getting Contract IDs

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

Extract from JSON:
- `packageId` → `VITE_MARKETPLACE_PACKAGE_ID`
- Find `Marketplace` object in `createdObjects` → `VITE_MARKETPLACE_OBJECT_ID`

## 🐛 Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure `npm run build` works locally
- Verify Node.js version (Vercel uses Node 18+ by default)

### Environment Variables Not Working
- Ensure variables start with `VITE_`
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

### Wallet Connection Issues
- Verify `VITE_SUI_NETWORK` matches contract network
- Check package and object IDs are correct
- Ensure wallet extension is installed

### 404 Errors on Routes
- Verify `vercel.json` has SPA rewrite rules
- Check that all routes redirect to `/index.html`

## 📝 Notes

- Vercel automatically handles:
  - HTTPS
  - CDN distribution
  - Automatic deployments on git push
  - Preview deployments for PRs

- Build output is in `dist/` directory
- Framework is auto-detected as Vite
- No additional configuration needed for Vite projects

