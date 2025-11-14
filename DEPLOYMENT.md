# Deployment Guide - Deploy AstraData to the Internet

## 🚀 Quick Deploy Options

### Option 1: Deploy to Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Or use Vercel Dashboard**:
   - Go to https://vercel.com
   - Import your Git repository
   - Vercel will auto-detect Vite settings
   - Click "Deploy"

### Option 2: Deploy to Netlify

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Deploy**:
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

4. **Or use Netlify Dashboard**:
   - Go to https://netlify.com
   - Drag and drop your `dist` folder
   - Or connect your Git repository

### Option 3: Deploy to GitHub Pages

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update package.json**:
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     },
     "homepage": "https://yourusername.github.io/astradata"
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

### Option 4: Deploy to Cloudflare Pages

1. Go to https://pages.cloudflare.com
2. Connect your Git repository
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Deploy!

## ⚙️ Environment Variables

Before deploying, set these environment variables in your hosting platform:

```
VITE_SUI_NETWORK=mainnet
VITE_MARKETPLACE_PACKAGE_ID=0xYOUR_PACKAGE_ID
VITE_MARKETPLACE_OBJECT_ID=0xYOUR_MARKETPLACE_OBJECT_ID
VITE_WALRUS_API_URL=https://walrus-api-url
VITE_SEAL_API_URL=https://seal-api-url
```

## 📝 Pre-Deployment Checklist

- [ ] Update `.env.example` with your actual values
- [ ] Build the project: `npm run build`
- [ ] Test locally: `npm run preview`
- [ ] Set environment variables in hosting platform
- [ ] Deploy!

## 🌐 Post-Deployment

1. **Share your link**: Your app will be live at `https://your-project.vercel.app` (or similar)
2. **Configure custom domain** (optional): Add your domain in hosting platform settings
3. **Monitor**: Check your hosting platform dashboard for analytics and logs

## 🔧 Troubleshooting

### Build Errors
- Make sure all dependencies are installed: `npm install`
- Check Node.js version (should be 18+)
- Review build logs in hosting platform

### Environment Variables Not Working
- Ensure variables are prefixed with `VITE_`
- Redeploy after adding/changing variables
- Check variable names match exactly

### Wallet Connection Issues
- Ensure users have Sui wallet extensions installed
- Check that wallet extension works with your deployed domain
- Verify CORS settings if needed

## 📊 Features Now Live

✅ **Dark/Light Mode Toggle** - Users can switch themes
✅ **Responsive Design** - Works on all devices
✅ **Wallet Integration** - Connect Sui wallets
✅ **Data Marketplace** - Browse and purchase datasets
✅ **Dataset Upload** - Upload datasets with Walrus & Seal

Enjoy your deployed application! 🎉

