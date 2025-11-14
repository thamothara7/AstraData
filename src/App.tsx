import { useState, useEffect } from 'react';
import { WalletKitProvider } from '@mysten/wallet-kit';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import Marketplace from './components/Marketplace';
import UploadDataset from './components/UploadDataset';
import PurchasedDatasets from './components/PurchasedDatasets';
import { Dataset } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'upload' | 'purchased'>('marketplace');
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      // In production, this would fetch from on-chain or indexer
      const { getMarketplaceDatasets } = await import('./services/marketplace');
      const data = await getMarketplaceDatasets();
      setDatasets(data);
    } catch (error) {
      console.error('Failed to load datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDatasetUploaded = (newDataset: Dataset) => {
    setDatasets([newDataset, ...datasets]);
    setActiveTab('marketplace');
  };

  const handlePurchaseSuccess = () => {
    // Refresh marketplace datasets
    loadDatasets();
    // Trigger refresh of purchased datasets if on that tab
    setRefreshKey(prev => prev + 1);
  };

  return (
    <ThemeProvider>
      <WalletKitProvider
        features={['standard:connect', 'standard:events']}
        enableUnsafeBurner={false}
        storageKey="astradata-wallet-kit"
      >
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
          <Header activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="container mx-auto px-4 py-8">
            {activeTab === 'marketplace' ? (
              <Marketplace 
                datasets={datasets} 
                loading={loading} 
                onRefresh={loadDatasets}
                onPurchaseSuccess={handlePurchaseSuccess}
              />
            ) : activeTab === 'purchased' ? (
              <PurchasedDatasets key={refreshKey} />
            ) : (
              <UploadDataset onUploaded={handleDatasetUploaded} />
            )}
          </main>
        </div>
      </WalletKitProvider>
    </ThemeProvider>
  );
}

export default App;

