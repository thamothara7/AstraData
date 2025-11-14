import { useState, useEffect } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';
import { Search, Loader2, Database, Download, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import DatasetCard from './DatasetCard';
import { Dataset } from '../types';
import { getPurchasedDatasets } from '../services/marketplace';
import { downloadFromWalrus } from '../services/walrus';

export default function PurchasedDatasets() {
  const { isConnected, currentWallet, currentAccount } = useWalletKit();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Extract wallet address
  const address =
    currentAccount?.address ||
    // @ts-ignore
    (currentWallet as any)?.accounts?.[0]?.address ||
    // @ts-ignore
    (currentWallet as any)?.wallet?.accounts?.[0]?.address ||
    // @ts-ignore
    (currentWallet as any)?.address;

  useEffect(() => {
    if (isConnected && address) {
      loadPurchasedDatasets();
    } else {
      setDatasets([]);
      setLoading(false);
    }
  }, [isConnected, address]);

  // Also reload when component becomes visible (when switching to this tab)
  useEffect(() => {
    if (isConnected && address) {
      // Small delay to ensure we're on the tab
      const timer = setTimeout(() => {
        loadPurchasedDatasets();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const loadPurchasedDatasets = async () => {
    if (!address) {
      console.warn('No address available for loading purchased datasets');
      setDatasets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading purchased datasets for address:', address);
      const data = await getPurchasedDatasets(address);
      console.log('Loaded purchased datasets:', data.length, data);
      setDatasets(data);
    } catch (error) {
      console.error('Failed to load purchased datasets:', error);
      setDatasets([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDatasets = datasets.filter((dataset) => {
    const matchesSearch =
      dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleDownload = async (dataset: Dataset) => {
    if (!dataset.walrusRef) {
      alert('Dataset download reference not available');
      return;
    }

    try {
      setDownloading(dataset.id);
      setDownloadStatus('idle');

      const blob = await downloadFromWalrus(dataset.walrusRef);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataset.name}.${dataset.format || 'bin'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadStatus('success');
      setTimeout(() => {
        setDownloadStatus('idle');
        setDownloading(null);
      }, 2000);
    } catch (error: any) {
      console.error('Download error:', error);
      setDownloadStatus('error');
      alert(error.message || 'Failed to download dataset');
      setDownloading(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Purchases</h2>
          <p className="text-gray-600 dark:text-gray-400">
            View datasets you've purchased
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/50 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Wallet Not Connected
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please connect your wallet to view your purchased datasets
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Purchases</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Datasets you've purchased and have access to download
          </p>
          {address && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
              Wallet: {address.slice(0, 8)}...{address.slice(-6)}
            </p>
          )}
        </div>
        <button
          onClick={loadPurchasedDatasets}
          disabled={loading}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-gray-900/50 transition-colors duration-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search purchased datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
          />
        </div>
      </div>

      {/* Datasets Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : filteredDatasets.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Database className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            {datasets.length === 0 ? 'No purchases yet' : 'No datasets match your search'}
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            {datasets.length === 0
              ? 'Purchase datasets from the marketplace to see them here'
              : 'Try adjusting your search'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDatasets.map((dataset) => (
            <div key={dataset.id} className="bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500/50 dark:hover:border-primary-500/50 transition-all duration-300 overflow-hidden shadow-sm dark:shadow-gray-900/50 hover:shadow-md dark:hover:shadow-gray-900/70 relative">
              <DatasetCard dataset={dataset} onPurchase={() => {}} />
              <div className="absolute bottom-4 right-4 z-20">
                <button
                  onClick={() => handleDownload(dataset)}
                  disabled={downloading === dataset.id}
                  className={`px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 shadow-md ${
                    downloading === dataset.id
                      ? 'bg-gray-400 cursor-not-allowed'
                      : downloadStatus === 'success' && downloading === dataset.id
                      ? 'bg-green-600'
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  {downloading === dataset.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Downloading...</span>
                    </>
                  ) : downloadStatus === 'success' && downloading === dataset.id ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Downloaded</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

