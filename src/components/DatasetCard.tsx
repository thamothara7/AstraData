import { Shield, Download, Clock, FileText } from 'lucide-react';
import { Dataset } from '../types';
import { formatPrice, formatFileSize, formatDate, formatAddress, getTruthScoreColor } from '../utils/format';

interface DatasetCardProps {
  dataset: Dataset;
  onPurchase: () => void;
}

export default function DatasetCard({ dataset, onPurchase }: DatasetCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500/50 dark:hover:border-primary-500/50 transition-all duration-300 overflow-hidden group shadow-sm dark:shadow-gray-900/50 hover:shadow-md dark:hover:shadow-gray-900/70">
      {/* Truth Score Badge */}
      <div className="relative">
        <div className="absolute top-4 right-4 z-10">
          <div className={`flex items-center space-x-1 px-3 py-1 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm ${
            dataset.verified ? 'border border-green-500/50' : 'border border-yellow-500/50'
          }`}>
            <Shield className={`w-4 h-4 ${dataset.verified ? 'text-green-500' : 'text-yellow-500'}`} />
            <span className={`text-sm font-semibold ${getTruthScoreColor(dataset.truthScore)}`}>
              {dataset.truthScore}
            </span>
          </div>
        </div>

        {/* Category Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1 bg-primary-600/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full shadow-md">
            {dataset.category}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 pt-20">
        {/* Title and Description */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{dataset.name}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 h-10">{dataset.description}</p>

        {/* Metadata */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <FileText className="w-4 h-4 mr-2" />
            <span>{formatFileSize(dataset.size)} • {dataset.format}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 mr-2" />
            <span>{formatDate(dataset.uploadDate)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Download className="w-4 h-4 mr-2" />
            <span>{dataset.downloads} downloads</span>
          </div>
        </div>

        {/* Owner */}
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-500">Owner</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">{formatAddress(dataset.owner)}</p>
        </div>

        {/* Price and Purchase Button */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-500">Price</p>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{formatPrice(dataset.price)}</p>
          </div>
          <button
            onClick={onPurchase}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Purchase
          </button>
        </div>
      </div>
    </div>
  );
}
