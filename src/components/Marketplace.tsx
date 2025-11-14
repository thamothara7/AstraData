import { useState } from 'react';
import { Search, Loader2, Database } from 'lucide-react';
import DatasetCard from './DatasetCard';
import PurchaseModal from './PurchaseModal';
import { Dataset } from '../types';

interface MarketplaceProps {
  datasets: Dataset[];
  loading: boolean;
  onRefresh: () => void;
}

export default function Marketplace({ datasets, loading, onRefresh }: MarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  const categories = ['all', 'AI/ML', 'Finance', 'Healthcare', 'IoT', 'Social', 'Gaming', 'Other'];

  const filteredDatasets = datasets.filter(dataset => {
    const matchesSearch = 
      dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || dataset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Data Marketplace</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Discover verified datasets with provable authenticity on Walrus & Seal
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-gray-900/50 transition-colors duration-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 font-medium ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
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
            {datasets.length === 0 ? 'No datasets yet' : 'No datasets match your search'}
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            {datasets.length === 0
              ? 'Be the first to upload a dataset!'
              : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDatasets.map((dataset) => (
            <DatasetCard
              key={dataset.id}
              dataset={dataset}
              onPurchase={() => setSelectedDataset(dataset)}
            />
          ))}
        </div>
      )}

      {/* Purchase Modal */}
      {selectedDataset && (
        <PurchaseModal
          dataset={selectedDataset}
          onClose={() => setSelectedDataset(null)}
          onSuccess={() => {
            setSelectedDataset(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
