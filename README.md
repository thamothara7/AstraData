# AstraData: Decentralized AI-Ready Data Vault & Truth Protocol

AstraData is a decentralized data vault and truth-verification protocol built on Walrus, Seal, and Nautilus for the Walrus Haulout Hackathon.

## 🌟 Features

- **Decentralized Data Storage**: Store datasets provably on Walrus
- **Truth Verification**: Anchor metadata via Seal for authenticity proofs  
- **Data Marketplace**: Buy and sell datasets with transparent provenance
- **AI-Ready**: Expose structured data streams for AI/ML applications
- **Truth Scoring**: Provable authenticity with 0-100 truth scores
- **Secure Transactions**: On-chain payments with Sui blockchain

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Blockchain**: Sui Mainnet
- **Storage**: Walrus (decentralized storage)
- **Encryption/Verification**: Seal (truth protocol)
- **Wallet**: Sui Wallet Kit
- **Smart Contracts**: Sui Move

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Sui CLI (for deploying contracts)
- Sui wallet extension

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd astradata
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
astradata/
├── src/
│   ├── components/          # React components
│   │   ├── Header.tsx       # Navigation header
│   │   ├── Marketplace.tsx  # Marketplace view
│   │   ├── DatasetCard.tsx  # Dataset card component
│   │   ├── UploadDataset.tsx # Upload form
│   │   └── PurchaseModal.tsx # Purchase dialog
│   ├── services/            # Integration services
│   │   ├── wallet.ts        # Sui wallet integration
│   │   ├── walrus.ts        # Walrus storage service
│   │   ├── seal.ts          # Seal verification service
│   │   └── marketplace.ts   # Marketplace operations
│   ├── types/               # TypeScript types
│   ├── utils/               # Utility functions
│   ├── config/              # Configuration
│   └── App.tsx              # Main app component
├── contracts/               # Sui Move smart contracts
│   ├── Move.toml
│   └── sources/
│       └── marketplace.move # Marketplace contract
├── package.json
└── README.md
```

## 🔐 Smart Contracts

The project includes Sui Move smart contracts for:

- **Marketplace**: Main marketplace object storing all datasets
- **Dataset Registration**: Upload and register datasets with Walrus refs and Seal hashes
- **Purchase Transactions**: Secure on-chain payments for dataset purchases
- **Events**: On-chain events for dataset registration and purchases

### Deploying Contracts

```bash
# Build contracts
sui move build

# Deploy to Sui mainnet
sui client publish --gas-budget 100000000

# Update .env with deployed package and object IDs
```

## 🎯 How It Works

1. **Upload Dataset**: 
   - User uploads a dataset file
   - File is uploaded to Walrus decentralized storage
   - Truth anchor is created via Seal protocol
   - Dataset metadata is registered on-chain

2. **Purchase Dataset**:
   - Buyer browses marketplace
   - Selects dataset and initiates purchase
   - SUI is transferred from buyer to seller on-chain
   - Buyer gains access to download from Walrus

3. **Truth Verification**:
   - Each dataset has a truth score (0-100)
   - Seal protocol verifies authenticity
   - Hash commitments ensure data integrity
   - Timestamp proofs verify upload time

## 🔧 Configuration

Create a `.env` file with:

```env
VITE_SUI_NETWORK=mainnet
VITE_MARKETPLACE_PACKAGE_ID=0xYOUR_PACKAGE_ID
VITE_MARKETPLACE_OBJECT_ID=0xYOUR_MARKETPLACE_OBJECT_ID
VITE_WALRUS_API_URL=https://walrus-api-url
VITE_SEAL_API_URL=https://seal-api-url
```

## 📝 Integration Notes

### Walrus Integration
- Replace mock functions in `src/services/walrus.ts` with actual Walrus API
- Walrus API endpoints will be provided during hackathon

### Seal Integration
- Replace mock functions in `src/services/seal.ts` with actual Seal API
- Seal protocol provides truth verification and scoring

### Smart Contract Integration
- Update marketplace service to call actual on-chain functions
- Connect frontend to deployed contract addresses

## 🏆 Hackathon Tracks

This project covers:
- ✅ **Data Marketplaces**: Buy/sell datasets with on-chain payments
- ✅ **AI x Data**: Structured data streams ready for AI/ML applications
- ✅ **Provably Authentic**: Truth verification via Seal protocol

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

This is a hackathon project. Contributions and improvements welcome!

## 📧 Contact

For questions about the project, please open an issue in the repository.

