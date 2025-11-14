export interface Dataset {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string; // in SUI
  owner: string;
  walrusRef: string; // Walrus storage reference
  sealHash: string; // Seal verification hash
  truthScore: number; // 0-100
  uploadDate: Date;
  size: number; // in bytes
  format: string;
  downloads: number;
  verified: boolean;
}

export interface UploadFormData {
  name: string;
  description: string;
  category: string;
  price: string;
  file: File;
}

export interface PurchaseTransaction {
  datasetId: string;
  buyer: string;
  price: string;
  timestamp: Date;
  txHash: string;
}


