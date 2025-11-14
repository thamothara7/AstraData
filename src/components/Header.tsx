import { useWalletKit } from '@mysten/wallet-kit';
import { Wallet, Upload, Database, Sun, Moon, ShoppingBag } from 'lucide-react';
import { formatAddress } from '../utils/format';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect, useRef } from 'react';

interface HeaderProps {
  activeTab: 'marketplace' | 'upload' | 'purchased';
  setActiveTab: (tab: 'marketplace' | 'upload' | 'purchased') => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const { currentWallet, disconnect, isConnected, wallets, connect } = useWalletKit();
  const { theme, toggleTheme } = useTheme();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Extract address from wallet - wallet-kit API varies
  // @ts-ignore - wallet-kit API typing issue
  const address = currentWallet?.accounts?.[0]?.address 
    || (currentWallet as any)?.wallet?.accounts?.[0]?.address 
    || (currentWallet as any)?.address
    || (currentWallet as any)?.adapter?.accounts?.[0]?.address;
  
  // Log wallet info for debugging
  useEffect(() => {
    if (wallets) {
      console.log('Available wallets:', wallets.map(w => ({ 
        name: w.name, 
        installed: (w as any).installed 
      })));
    }
    if (currentWallet) {
      console.log('Current wallet:', currentWallet);
    }
  }, [wallets, currentWallet]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowConnectModal(false);
      }
    };

    if (showConnectModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showConnectModal]);

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 shadow-sm dark:shadow-gray-900/50 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-lg shadow-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">AstraData</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Decentralized Data Vault</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === 'marketplace'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Database className="w-4 h-4" />
              <span className="font-medium">Marketplace</span>
            </button>
            <button
              onClick={() => setActiveTab('purchased')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === 'purchased'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="font-medium">Purchased</span>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === 'upload'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span className="font-medium">Upload Dataset</span>
            </button>
          </nav>

          {/* Wallet Connection & Theme Toggle */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {isConnected && address ? (
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{formatAddress(address)}</span>
                </div>
                <button
                  onClick={disconnect}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="relative">
                {showConnectModal && wallets && wallets.length > 0 ? (
                  <div ref={modalRef} className="absolute right-0 top-16 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50 min-w-[200px] transition-colors duration-200">
                    {wallets.map((wallet) => (
                      <button
                        key={wallet.name}
                        onClick={async () => {
                          try {
                            console.log('Attempting to connect wallet:', wallet.name);
                            setShowConnectModal(false);
                            
                            // Use the connect function from wallet-kit hook with wallet name
                            // This is the correct way according to wallet-kit API
                            if (connect && typeof connect === 'function') {
                              await connect(wallet.name);
                              console.log('Wallet connection initiated successfully');
                            } else {
                              throw new Error('Connect function not available');
                            }
                          } catch (error: any) {
                            console.error('Failed to connect wallet:', error);
                            const errorMsg = error?.message || error?.toString() || 'Unknown error';
                            alert(`Failed to connect to ${wallet.name}: ${errorMsg}\n\nMake sure the wallet extension is installed and unlocked.`);
                            setShowConnectModal(true); // Reopen modal on error
                          }
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white flex items-center space-x-2 transition-colors duration-200"
                      >
                        <Wallet className="w-4 h-4" />
                        <span className="font-medium">{wallet.name}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => setShowConnectModal(false)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 mt-2 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      console.log('Available wallets:', wallets);
                      if (wallets && wallets.length > 0) {
                        setShowConnectModal(true);
                      } else {
                        alert('No wallets available. Please install a Sui wallet extension (like Sui Wallet or Suiet).');
                        console.warn('No wallets detected. Make sure wallet extension is installed.');
                      }
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 text-white rounded-lg transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
                    type="button"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Connect Wallet</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

