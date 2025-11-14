import { useState } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';
import { X, Shield, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Dataset } from '../types';
import { purchaseDataset } from '../services/marketplace';
import { formatPrice, formatFileSize, formatDate, formatAddress, getTruthScoreColor } from '../utils/format';

interface PurchaseModalProps {
  dataset: Dataset;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PurchaseModal({ dataset, onClose, onSuccess }: PurchaseModalProps) {
  const { isConnected, currentWallet, currentAccount } = useWalletKit();
  const [purchasing, setPurchasing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handlePurchase = async () => {
    if (!isConnected) {
      setErrorMessage('Please connect your wallet first');
      setStatus('error');
      return;
    }

    // Extract buyer address
    const buyerAddress =
      currentAccount?.address ||
      // @ts-ignore - wallet-kit API typing issue
      (currentWallet as any)?.accounts?.[0]?.address ||
      // @ts-ignore
      (currentWallet as any)?.wallet?.accounts?.[0]?.address ||
      // @ts-ignore
      (currentWallet as any)?.address;

    if (!buyerAddress) {
      setErrorMessage('Wallet address not found');
      setStatus('error');
      return;
    }

    if (buyerAddress === dataset.owner) {
      setErrorMessage('You cannot purchase your own dataset');
      setStatus('error');
      return;
    }

    try {
      setPurchasing(true);
      setStatus('idle');
      setErrorMessage('');

      // Use currentWallet as the signer - it's the wallet adapter with signAndExecuteTransactionBlock
      // @ts-ignore - wallet-kit types may not expose signAndExecuteTransactionBlock directly
      const signer = currentWallet;

      if (!signer || typeof signer.signAndExecuteTransactionBlock !== 'function') {
        console.error('Wallet signer check failed:', { 
          hasSigner: !!signer, 
          hasMethod: typeof signer?.signAndExecuteTransactionBlock,
          currentWallet 
        });
        throw new Error('Unable to get wallet signer. Please reconnect your wallet.');
      }

      // @ts-ignore - Type mismatch between wallet-kit WalletAdapter and our WalletSigner type due to different TransactionBlock versions, but runtime works
      const hash = await purchaseDataset(dataset, signer, currentAccount, buyerAddress);

      setTxHash(hash);
      setStatus('success');

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Purchase error:', error);
      setErrorMessage(error.message || 'Failed to purchase dataset');
      setStatus('error');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Dataset</h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Dataset Info */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{dataset.name}</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{dataset.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Category</p>
                <p className="text-gray-900 dark:text-white font-medium">{dataset.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Size</p>
                <p className="text-gray-900 dark:text-white font-medium">{formatFileSize(dataset.size)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Format</p>
                <p className="text-gray-900 dark:text-white font-medium">{dataset.format}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Uploaded</p>
                <p className="text-gray-900 dark:text-white font-medium text-sm">
                  {formatDate(dataset.uploadDate)}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-500">Truth Score</span>
                <div className="flex items-center space-x-2">
                  <Shield
                    className={`w-4 h-4 ${
                      dataset.verified ? 'text-green-500' : 'text-yellow-500'
                    }`}
                  />
                  <span className={`font-semibold ${getTruthScoreColor(dataset.truthScore)}`}>
                    {dataset.truthScore}/100
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    dataset.truthScore >= 80
                      ? 'bg-green-500'
                      : dataset.truthScore >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${dataset.truthScore}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">Seller</p>
              <p className="text-gray-700 dark:text-gray-300 font-mono text-sm">
                {formatAddress(dataset.owner)}
              </p>
            </div>
          </div>

          {/* Price */}
          <div className="bg-primary-50 dark:bg-primary-700/20 rounded-lg p-6 border border-primary-200 dark:border-primary-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Price</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(dataset.price)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Downloads</p>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {dataset.downloads}
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          {status === 'success' && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-600 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-700 dark:text-green-400 mb-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Purchase Successful!</span>
              </div>
              {txHash && (
                <p className="text-sm text-gray-600 dark:text-gray-400 font-mono break-all">{txHash}</p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                You now have access to download this dataset from Walrus storage.
              </p>
            </div>
          )}

          {status === 'error' && errorMessage && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {!isConnected && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-400">
                <AlertCircle className="w-5 h-5" />
                <span>Please connect your wallet to purchase</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg"
              disabled={purchasing}
            >
              Cancel
            </button>
            <button
              onClick={handlePurchase}
              disabled={purchasing || !isConnected || status === 'success'}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 rounded-lg text-white font-semibold flex items-center justify-center space-x-2"
            >
              {purchasing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Purchase Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
