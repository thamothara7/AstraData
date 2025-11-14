import { useState } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { UploadFormData } from '../types';
import { uploadDataset } from '../services/marketplace';
import { formatFileSize } from '../utils/format';

interface UploadDatasetProps {
  onUploaded: (dataset: any) => void;
}

export default function UploadDataset({ onUploaded }: UploadDatasetProps) {
  const { isConnected, currentWallet, currentAccount } = useWalletKit();
  const [formData, setFormData] = useState<UploadFormData>({
    name: '',
    description: '',
    category: 'AI/ML',
    price: '',
    file: null as any,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const categories = ['AI/ML', 'Finance', 'Healthcare', 'IoT', 'Social', 'Gaming', 'Other'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      setErrorMessage('Please connect your wallet first');
      setUploadStatus('error');
      return;
    }

    if (!formData.file || !formData.name || !formData.description || !formData.price) {
      setErrorMessage('Please fill in all fields');
      setUploadStatus('error');
      return;
    }

    const priceValue = parseFloat(formData.price);
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      setErrorMessage('Price must be greater than 0 SUI');
      setUploadStatus('error');
      return;
    }

    try {
      setUploading(true);
      setUploadStatus('idle');
      setErrorMessage('');

      // Extract wallet address
      const walletAddress =
        currentAccount?.address ||
        // @ts-ignore - wallet-kit API typing issue
        currentWallet?.accounts?.[0]?.address ||
        // @ts-ignore
        (currentWallet as any)?.wallet?.accounts?.[0]?.address ||
        // @ts-ignore
        (currentWallet as any)?.address;

      if (!walletAddress) {
        throw new Error('Wallet address not found');
      }

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
      const dataset = await uploadDataset(formData, walletAddress, signer, currentAccount);


      setUploadStatus('success');

      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'AI/ML',
        price: '',
        file: null as any,
      });

      onUploaded(dataset);

      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Upload error:', error);
      setErrorMessage(error.message || 'Failed to upload dataset');
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Upload Dataset</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Upload your dataset to Walrus storage with truth verification via Seal
        </p>
      </div>

      {!isConnected && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-400">
            <AlertCircle className="w-5 h-5" />
            <span>Please connect your wallet to upload datasets</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-gray-900/50 transition-colors duration-200">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dataset File
          </label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors duration-200">
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              {formData.file ? (
                <>
                  <FileText className="w-12 h-12 text-primary-500 dark:text-primary-400 mb-2" />
                  <p className="text-gray-900 dark:text-white font-medium">{formData.file.name}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    {formatFileSize(formData.file.size)}
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-2" />
                  <p className="text-gray-700 dark:text-gray-300">Click to upload or drag and drop</p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                    CSV, JSON, TXT, or other data formats
                  </p>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Name */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dataset Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Stock Market Data 2024"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg"
            disabled={uploading}
            required
          />
        </div>

        {/* Description */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your dataset..."
            rows={4}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg"
            disabled={uploading}
            required
          />
        </div>

        {/* Category + Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border dark:border-gray-700">
            <label className="block text-sm mb-2">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded-lg"
              disabled={uploading}
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border dark:border-gray-700">
            <label className="block text-sm mb-2">Price (SUI) *</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.0000"
              step="0.0001"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded-lg"
              disabled={uploading}
              required
            />
          </div>
        </div>

        {/* Status */}
        {uploadStatus === 'success' && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-600 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span>Dataset uploaded successfully!</span>
            </div>
          </div>
        )}

        {uploadStatus === 'error' && errorMessage && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={uploading || !isConnected}
          className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg flex items-center justify-center space-x-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span>Upload Dataset</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
