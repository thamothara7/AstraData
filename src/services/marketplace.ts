import { TransactionBlock } from '@mysten/sui.js/transactions';
import { bcs } from '@mysten/sui.js/bcs';
import type { DynamicFieldInfo, SuiObjectResponse } from '@mysten/sui.js/client';
import { Dataset, UploadFormData } from '../types';
import { uploadToWalrus } from './walrus';
import { createTruthAnchor, verifyTruthAnchor } from './seal';
import { suiClient, walletChainId } from './wallet';
import { config } from '../config';

type WalletAccount = {
  address: string;
  chains?: string[];
  publicKey?: string;
  features?: string[];
  label?: string;
};

// Wallet adapter from @mysten/wallet-kit
type WalletSigner = {
  signAndExecuteTransactionBlock: (input: {
    transactionBlock: TransactionBlock;
    account?: WalletAccount;
    chain?: string;
    options?: {
      showEffects?: boolean;
      showEvents?: boolean;
      showInput?: boolean;
      showObjectChanges?: boolean;
      showBalanceChanges?: boolean;
    };
    requestType?: 'WaitForEffectsCert' | 'WaitForLocalExecution';
  }) => Promise<any>;
};

interface RawDataset {
  id: string;
  fields: Record<string, any>;
}

const SUI_DECIMALS = 1_000_000_000;
const SUI_DECIMALS_BIGINT = BigInt(SUI_DECIMALS);
const textDecoder = new TextDecoder();

const REGISTER_DATASET_TARGET = () =>
  `${config.sui.marketplacePackageId}::marketplace::register_dataset` as `${string}::${string}::${string}`;
const PURCHASE_DATASET_TARGET = () =>
  `${config.sui.marketplacePackageId}::marketplace::purchase_dataset` as `${string}::${string}::${string}`;
const REMOVE_DATASET_TARGET = () =>
  `${config.sui.marketplacePackageId}::marketplace::remove_dataset` as `${string}::${string}::${string}`;
const DATASET_REGISTERED_EVENT = () =>
  `${config.sui.marketplacePackageId}::marketplace::DatasetRegistered`;
const DATASET_REMOVED_EVENT = () =>
  `${config.sui.marketplacePackageId}::marketplace::DatasetRemoved`;

let cachedDatasetsTableId: string | null = null;

const ensureChainConfig = () => {
  if (!config.sui.marketplacePackageId || config.sui.marketplacePackageId === '0x0') {
    throw new Error('Marketplace package ID is not configured. Set VITE_MARKETPLACE_PACKAGE_ID.');
  }
  if (!config.sui.marketplaceObjectId || config.sui.marketplaceObjectId === '0x0') {
    throw new Error('Marketplace object ID is not configured. Set VITE_MARKETPLACE_OBJECT_ID.');
  }
};

const ensureSigner = (walletSigner: WalletSigner | null | undefined): WalletSigner => {
  if (!walletSigner || typeof walletSigner.signAndExecuteTransactionBlock !== 'function') {
    throw new Error('Wallet signer not available. Please reconnect your wallet.');
  }
  return walletSigner;
};

const ensureAccount = (
  walletAccount: WalletAccount | null | undefined,
  fallbackAddress?: string
): WalletAccount => {
  if (walletAccount?.address) {
    return walletAccount;
  }

  if (fallbackAddress) {
    return {
      address: fallbackAddress,
      chains: [walletChainId],
    };
  }

  throw new Error('Wallet account not available. Please reconnect your wallet.');
};

const toMist = (value: string): bigint => {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error('Price is required');
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error('Invalid price format');
  }

  const [whole, fraction = ''] = normalized.split('.');
  const paddedFraction = (fraction + '000000000').slice(0, 9);

  const wholePart = BigInt(whole || '0') * SUI_DECIMALS_BIGINT;
  const fractionPart = paddedFraction ? BigInt(paddedFraction) : BigInt(0);
  return wholePart + fractionPart;
};

const formatPriceFromMist = (value: string | number | bigint): string => {
  const numeric = typeof value === 'bigint' ? Number(value) : Number(value);
  if (Number.isNaN(numeric)) {
    return '0.0000';
  }
  return (numeric / SUI_DECIMALS).toFixed(4);
};

const toUint8Array = (value: any): Uint8Array => {
  if (!value) return new Uint8Array();

  if (typeof value === 'string') {
    const hex = value.startsWith('0x') ? value.slice(2) : value;
    if (!hex) return new Uint8Array();
    const bytes = new Uint8Array(Math.floor(hex.length / 2));
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
  }

  if (Array.isArray(value)) {
    return Uint8Array.from(value);
  }

  if (typeof value === 'object' && value.fields) {
    if (typeof value.fields.bytes === 'string') {
      return toUint8Array(value.fields.bytes);
    }
    if (Array.isArray(value.fields.contents)) {
      return Uint8Array.from(value.fields.contents);
    }
  }

  return new Uint8Array();
};

const bytesToHex = (bytes: Uint8Array): string => {
  if (!bytes.length) return '';
  return `0x${Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('')}`;
};

const decodeVector = (value: any): string => {
  const bytes = toUint8Array(value);
  if (!bytes.length) return '';
  try {
    return textDecoder.decode(bytes).replace(/\0/g, '');
  } catch {
    return '';
  }
};

const normalizeSealHash = (value: any): string => {
  const hex = bytesToHex(toUint8Array(value));
  if (hex) return hex;
  if (typeof value === 'string') {
    return value.startsWith('0x') ? value : `0x${value}`;
  }
  return '';
};

const resolveDatasetsTableId = async (): Promise<string> => {
  ensureChainConfig();
  if (cachedDatasetsTableId) {
    return cachedDatasetsTableId;
  }

  const marketplace = await suiClient.getObject({
    id: config.sui.marketplaceObjectId,
    options: { showContent: true },
  });

  const content = marketplace.data?.content as any;
  const tableId = content?.fields?.datasets?.fields?.id?.id;
  if (!tableId) {
    throw new Error('Marketplace datasets table not found on-chain');
  }

  cachedDatasetsTableId = tableId;
  return tableId;
};

const parseDatasetObject = (object: SuiObjectResponse): RawDataset | null => {
  const content = object.data?.content as any;
  if (!content || content.dataType !== 'moveObject') return null;

  const datasetFields = content.fields?.value?.fields;
  if (!datasetFields) return null;

  const keyField =
    content.fields?.name?.fields?.value ??
    content.fields?.name?.value ??
    content.fields?.name;

  const datasetId = keyField?.toString?.() ?? keyField;
  if (!datasetId) return null;

  return {
    id: datasetId.toString(),
    fields: datasetFields,
  };
};

const fetchRawDatasets = async (filterId?: string): Promise<RawDataset[]> => {
  const tableId = await resolveDatasetsTableId();
  const results: RawDataset[] = [];
  let cursor: string | null | undefined;

  do {
    const response = await suiClient.getDynamicFields({
      parentId: tableId,
      cursor: cursor ?? undefined,
      limit: 50,
    });

    if (!response.data.length) break;

    const objects = await Promise.all(
      response.data.map(async (field: DynamicFieldInfo) => {
        const object = await suiClient.getObject({
          id: field.objectId,
          options: { showContent: true },
        });
        return parseDatasetObject(object);
      })
    );

    for (const parsed of objects) {
      if (!parsed) continue;
      results.push(parsed);
      if (filterId && parsed.id === filterId) {
        return [parsed];
      }
    }

    if (!response.hasNextPage || !response.nextCursor) break;
    cursor = response.nextCursor;
  } while (true);

  if (filterId) {
    return results.filter(dataset => dataset.id === filterId);
  }

  return results;
};

const mapRawDataset = (raw: RawDataset): Dataset => {
  const truthScore = Number(raw.fields.truth_score ?? 0);
  const uploadTimestamp = Number(raw.fields.upload_timestamp ?? Date.now());

  return {
    id: raw.id,
    name: decodeVector(raw.fields.name) || 'Untitled Dataset',
    description: decodeVector(raw.fields.description) || 'No description provided yet.',
    category: decodeVector(raw.fields.category) || 'Other',
    price: formatPriceFromMist(raw.fields.price ?? '0'),
    owner: raw.fields.owner,
    walrusRef: decodeVector(raw.fields.walrus_ref),
    sealHash: normalizeSealHash(raw.fields.seal_hash),
    truthScore,
    uploadDate: new Date(uploadTimestamp || Date.now()),
    size: Number(raw.fields.size ?? 0),
    format: decodeVector(raw.fields.format) || 'unknown',
    downloads: 0,
    verified: truthScore >= 70,
  };
};

export const getMarketplaceDatasets = async (): Promise<Dataset[]> => {
  ensureChainConfig();
  const rawDatasets = await fetchRawDatasets();
  const datasets = rawDatasets.map(mapRawDataset);

  return datasets.sort(
    (a, b) => b.uploadDate.getTime() - a.uploadDate.getTime()
  );
};

export const getDatasetById = async (id: string): Promise<Dataset | null> => {
  ensureChainConfig();
  const [rawDataset] = await fetchRawDatasets(id);
  if (!rawDataset) return null;

  const dataset = mapRawDataset(rawDataset);

  try {
    const truthScore = await verifyTruthAnchor({
      hash: dataset.sealHash,
      timestamp: dataset.uploadDate.getTime(),
      metadata: {
        name: dataset.name,
        description: dataset.description,
      },
    });
    dataset.truthScore = truthScore.score;
    dataset.verified = truthScore.verified;
  } catch (error) {
    console.warn('Truth anchor verification failed:', error);
  }

  return dataset;
};

const waitForDataset = async (datasetId: string, attempts = 6): Promise<Dataset | null> => {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const dataset = await getDatasetById(datasetId);
    if (dataset) return dataset;
    await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
  }
  return null;
};

export const uploadDataset = async (
  formData: UploadFormData,
  walletAddress: string,
  walletSigner: WalletSigner | null | undefined,
  walletAccount?: WalletAccount | null
): Promise<Dataset> => {
  try {
    ensureChainConfig();
    const signer = ensureSigner(walletSigner);
    const accountForSigning = ensureAccount(walletAccount, walletAddress);

    const walrusResult = await uploadToWalrus(formData.file);
    const sealProof = await createTruthAnchor(walrusResult.hash, {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      size: formData.file.size,
      format: formData.file.type || formData.file.name.split('.').pop(),
      uploader: walletAddress,
    });

    const truthScore = await verifyTruthAnchor(sealProof);

    const tx = new TransactionBlock();
    tx.setGasBudget(100_000_000);

    const sealHashBytes = Array.from(toUint8Array(sealProof.hash));
    const sealHashBcs = bcs.ser('vector<u8>', sealHashBytes).toBytes();

    tx.moveCall({
      target: REGISTER_DATASET_TARGET(),
      arguments: [
        tx.object(config.sui.marketplaceObjectId),
        tx.pure.string(formData.name),
        tx.pure.string(formData.description),
        tx.pure.string(formData.category),
        tx.pure(toMist(formData.price)),
        tx.pure.string(walrusResult.reference),
        tx.pure(sealHashBcs),
        tx.pure(truthScore.score),
        tx.pure(BigInt(formData.file.size)),
        tx.pure.string(formData.file.type || formData.file.name.split('.').pop() || 'unknown'),
      ],
    });

    const response = await signer.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      account: accountForSigning,
      chain: walletChainId,
      options: { showEvents: true, showEffects: true },
    });

    const txDigest = response.digest ?? response.effects?.transactionDigest;
    const effectsStatus = response.effects?.status?.status ?? response.effects?.status;

    if (effectsStatus && effectsStatus !== 'success') {
      const errorMessage =
        response.effects?.status?.error || 'Dataset registration transaction failed';
      throw new Error(`${errorMessage}${txDigest ? ` (tx ${txDigest})` : ''}`);
    }

    const datasetEvent = response.events?.find(
      (event: any) => event.type === DATASET_REGISTERED_EVENT()
    );

    const datasetId =
      datasetEvent?.parsedJson?.dataset_id ??
      datasetEvent?.parsedJson?.datasetId;

    if (datasetId === undefined) {
      const envHint = `Check that VITE_MARKETPLACE_PACKAGE_ID (${config.sui.marketplacePackageId}) matches the deployed package on ${config.sui.network}.`;
      throw new Error(
        `Dataset registration event not found in transaction result${txDigest ? ` (tx ${txDigest})` : ''}. ${envHint}`
      );
    }

    const dataset = await waitForDataset(datasetId.toString());
    if (!dataset) {
      throw new Error('Dataset registered but not yet available on-chain. Please refresh in a moment.');
    }

    return dataset;
  } catch (error) {
    console.error('Dataset upload error:', error);
    throw error;
  }
};

export const purchaseDataset = async (
  dataset: Dataset,
  walletSigner: WalletSigner | null | undefined,
  walletAccount?: WalletAccount | null,
  buyerAddress?: string
): Promise<string> => {
  ensureChainConfig();
  const signer = ensureSigner(walletSigner);
  const accountForSigning = ensureAccount(walletAccount, buyerAddress);

  if (!/^\d+$/.test(dataset.id)) {
    throw new Error('Invalid dataset identifier');
  }

  const datasetId = BigInt(dataset.id);
  const priceInMist = toMist(dataset.price);

  const tx = new TransactionBlock();
  tx.setGasBudget(100_000_000);

  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure(priceInMist)]);

  tx.moveCall({
    target: PURCHASE_DATASET_TARGET(),
    arguments: [
      tx.object(config.sui.marketplaceObjectId),
      tx.pure(datasetId),
      paymentCoin,
    ],
  });

  const response = await signer.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    account: accountForSigning,
    chain: walletChainId,
    options: { showEffects: true },
  });

  return response.digest;
};

/**
 * Remove a dataset (only by owner)
 */
export const removeDataset = async (
  dataset: Dataset,
  walletSigner: WalletSigner | null | undefined,
  walletAccount?: WalletAccount | null,
  ownerAddress?: string
): Promise<string> => {
  ensureChainConfig();
  const signer = ensureSigner(walletSigner);
  const accountForSigning = ensureAccount(walletAccount, ownerAddress);

  if (!/^\d+$/.test(dataset.id)) {
    throw new Error('Invalid dataset identifier');
  }

  const datasetId = BigInt(dataset.id);

  const tx = new TransactionBlock();
  tx.setGasBudget(100_000_000);

  tx.moveCall({
    target: REMOVE_DATASET_TARGET(),
    arguments: [
      tx.object(config.sui.marketplaceObjectId),
      tx.pure(datasetId),
    ],
  });

  const response = await signer.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    account: accountForSigning,
    chain: walletChainId,
    options: { showEffects: true, showEvents: true },
  });

  // Verify the removal event
  const events = response.events || [];
  const removedEvent = events.find(
    (e: any) =>
      e.type === DATASET_REMOVED_EVENT() ||
      e.type?.includes('DatasetRemoved')
  );

  if (!removedEvent) {
    const txDigest = response.digest;
    console.warn(
      `Dataset removal event not found in transaction result (tx ${txDigest}). Dataset may still be removed.`
    );
  }

  return response.digest;
};

/**
 * Get datasets purchased by a specific address (via NFT ownership)
 */
export const getPurchasedDatasets = async (buyerAddress: string): Promise<Dataset[]> => {
  ensureChainConfig();

  try {
    console.log('Fetching purchased datasets for:', buyerAddress);
    
    // Query owned objects of type DatasetNFT with pagination
    const nftType = `${config.sui.marketplacePackageId}::marketplace::DatasetNFT`;
    console.log('NFT type:', nftType);
    
    const purchasedDatasetIds = new Set<string>();
    let cursor: string | null | undefined;
    let hasMore = true;

    while (hasMore) {
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: buyerAddress,
        filter: {
          StructType: nftType,
        },
        options: {
          showContent: true,
          showType: true,
        },
        cursor: cursor ?? undefined,
        limit: 50,
      });

      console.log('Owned objects response:', {
        count: ownedObjects.data?.length || 0,
        hasNextPage: ownedObjects.hasNextPage,
      });

      if (!ownedObjects.data || ownedObjects.data.length === 0) {
        break;
      }

      // Extract dataset IDs from NFTs
      for (const obj of ownedObjects.data) {
        const content = obj.data?.content as any;
        console.log('NFT object:', {
          objectId: obj.data?.objectId,
          contentType: content?.dataType,
          fields: content?.fields,
        });
        
        if (content?.dataType === 'moveObject' && content.fields) {
          // Try different possible field names
          const datasetId = 
            content.fields.dataset_id?.toString() ||
            content.fields.datasetId?.toString() ||
            content.fields['dataset_id']?.toString();
          console.log('Found dataset ID in NFT:', datasetId, 'Fields:', Object.keys(content.fields));
          if (datasetId !== undefined && datasetId !== null) {
            purchasedDatasetIds.add(datasetId.toString());
          }
        }
      }

      hasMore = ownedObjects.hasNextPage ?? false;
      cursor = ownedObjects.nextCursor ?? null;
      
      if (!hasMore || !cursor) {
        break;
      }
    }

    console.log('Total purchased dataset IDs found:', purchasedDatasetIds.size, Array.from(purchasedDatasetIds));

    if (purchasedDatasetIds.size === 0) {
      console.log('No purchased datasets found');
      return [];
    }

    // Fetch all purchased datasets
    const allDatasets = await getMarketplaceDatasets();
    console.log('All marketplace datasets:', allDatasets.length);
    
    const purchasedDatasets = allDatasets.filter((dataset) => {
      // Try both string and number comparison
      const isPurchased = 
        purchasedDatasetIds.has(dataset.id) || 
        purchasedDatasetIds.has(dataset.id.toString()) ||
        purchasedDatasetIds.has(String(dataset.id));
      console.log(`Dataset ${dataset.id} (${dataset.name}): ${isPurchased ? 'PURCHASED' : 'not purchased'}`, {
        datasetId: dataset.id,
        datasetIdType: typeof dataset.id,
        purchasedIds: Array.from(purchasedDatasetIds),
      });
      return isPurchased;
    });

    console.log('Final purchased datasets:', purchasedDatasets.length);

    return purchasedDatasets.sort(
      (a, b) => b.uploadDate.getTime() - a.uploadDate.getTime()
    );
  } catch (error) {
    console.error('Failed to fetch purchased datasets:', error);
    throw error;
  }
};

/**
 * Check if a user has purchased a specific dataset (owns the NFT)
 */
export const hasPurchasedDataset = async (
  buyerAddress: string,
  datasetId: string
): Promise<boolean> => {
  ensureChainConfig();

  try {
    const nftType = `${config.sui.marketplacePackageId}::marketplace::DatasetNFT`;
    
    // Query with pagination to get all NFTs
    let cursor: string | null | undefined;
    let hasMore = true;
    
    while (hasMore) {
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: buyerAddress,
        filter: {
          StructType: nftType,
        },
        options: {
          showContent: true,
        },
        cursor: cursor ?? undefined,
        limit: 50,
      });

      if (!ownedObjects.data) {
        return false;
      }

      for (const obj of ownedObjects.data) {
        const content = obj.data?.content as any;
        if (content?.dataType === 'moveObject' && content.fields) {
          const nftDatasetId = content.fields.dataset_id?.toString();
          if (nftDatasetId === datasetId) {
            return true;
          }
        }
      }

      hasMore = ownedObjects.hasNextPage ?? false;
      cursor = ownedObjects.nextCursor ?? null;
      
      if (!hasMore || !cursor) {
        break;
      }
    }

    return false;
  } catch (error) {
    console.error('Failed to check purchase status:', error);
    return false;
  }
};
