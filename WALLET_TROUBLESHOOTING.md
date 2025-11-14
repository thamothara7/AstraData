# Wallet Connection Troubleshooting

## Issue: Sui Wallet Not Connecting

If your Sui wallet (Sui Wallet, Suiet, etc.) is not connecting, try these solutions:

### 1. Check Wallet Extension Installation
- Make sure you have a Sui wallet extension installed:
  - **Sui Wallet**: https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil
  - **Suiet**: https://suiet.app/
- Ensure the extension is enabled in your browser
- Refresh the page after installing the extension

### 2. Check Wallet Status
- Open your wallet extension
- Make sure it's unlocked
- Verify you're connected to Sui Mainnet (or the correct network)
- Try disconnecting and reconnecting

### 3. Browser Console Debugging
Open browser console (F12) and check for:
- Errors when clicking "Connect Wallet"
- Available wallets logged: `Available wallets: [...]`
- Connection errors: `Failed to connect wallet: ...`

### 4. Clear Cache and Reload
- Clear browser cache
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Try in an incognito/private window

### 5. Check Network Settings
- Ensure the app is using the correct Sui network
- Verify your wallet is on the same network
- Check for network mismatch errors in console

### 6. Common Error Messages

**"No wallets available"**
- Install a Sui wallet extension
- Refresh the page after installation
- Check that the extension is enabled

**"Failed to connect: User rejected"**
- You declined the connection request
- Try again and click "Approve" or "Connect"

**"Wallet does not have connect method"**
- The wallet extension may not be properly initialized
- Refresh the page
- Reinstall the wallet extension

### 7. Manual Connection
If automatic connection fails:
1. Click "Connect Wallet" button
2. Select your wallet from the modal
3. Approve the connection in your wallet popup
4. The address should appear in the header

### 8. Still Not Working?
- Check the browser console for detailed error messages
- Verify wallet extension is the latest version
- Try a different browser
- Check if other Sui dApps can connect to your wallet

## Testing Connection
After connecting, you should see:
- Your wallet address in the header (truncated)
- "Disconnect" button instead of "Connect Wallet"
- Ability to upload datasets (requires connected wallet)

