module astradata::marketplace {
    use sui::event;
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::table::{Self, Table};

    /// Dataset struct stored on-chain
    struct Dataset has store, drop {
        id: u64,  // Internal dataset ID
        name: vector<u8>,
        description: vector<u8>,
        category: vector<u8>,
        price: u64,
        owner: address,
        walrus_ref: vector<u8>,  // Walrus storage reference
        seal_hash: vector<u8>,   // Seal verification hash
        truth_score: u8,         // 0-100
        size: u64,
        format: vector<u8>,
        upload_timestamp: u64,
    }

    /// Marketplace struct holding all datasets
    struct Marketplace has key {
        id: UID,
        datasets: Table<u64, Dataset>,  // Use u64 counter as key for unique IDs
        dataset_count: u64,
    }

    /// Capability for creating datasets
    struct DatasetCap has store, key {
        id: UID,
    }

    /// NFT representing a purchased dataset
    struct DatasetNFT has key, store {
        id: UID,
        dataset_id: u64,
        name: vector<u8>,
        walrus_ref: vector<u8>,
        seal_hash: vector<u8>,
        purchase_timestamp: u64,
    }

    /// Events
    struct DatasetRegistered has copy, drop {
        dataset_id: u64,
        owner: address,
        name: vector<u8>,
        price: u64,
        walrus_ref: vector<u8>,
        seal_hash: vector<u8>,
        truth_score: u8,
    }

    struct DatasetPurchased has copy, drop {
        dataset_id: u64,
        buyer: address,
        seller: address,
        price: u64,
        timestamp: u64,
        nft_id: ID,
    }

    struct DatasetRemoved has copy, drop {
        dataset_id: u64,
        owner: address,
        timestamp: u64,
    }

    /// Errors
    const E_NOT_OWNER: u64 = 0;
    const E_DATASET_NOT_FOUND: u64 = 1;
    const E_INSUFFICIENT_FUNDS: u64 = 2;
    const E_INVALID_PRICE: u64 = 3;
    const E_INVALID_PAYMENT: u64 = 4;
    const E_DATASET_HAS_PURCHASES: u64 = 5;

    /// Initialize marketplace
    fun init(ctx: &mut TxContext) {
        let marketplace = Marketplace {
            id: object::new(ctx),
            datasets: table::new(ctx),
            dataset_count: 0,
        };
        transfer::share_object(marketplace);
        
        // Create and transfer dataset capability to admin
        let cap = DatasetCap {
            id: object::new(ctx),
        };
        transfer::transfer(cap, tx_context::sender(ctx));
    }

    /// Register a new dataset
    public fun register_dataset(
        marketplace: &mut Marketplace,
        name: vector<u8>,
        description: vector<u8>,
        category: vector<u8>,
        price: u64,
        walrus_ref: vector<u8>,
        seal_hash: vector<u8>,
        truth_score: u8,
        size: u64,
        format: vector<u8>,
        ctx: &mut TxContext,
    ) {
        assert!(price > 0, E_INVALID_PRICE);
        assert!(truth_score <= 100, E_INVALID_PRICE);

        let owner = tx_context::sender(ctx);
        let timestamp = tx_context::epoch_timestamp_ms(ctx);
        
        // Generate a unique dataset ID using the counter
        let dataset_id = marketplace.dataset_count;
        
        // Create a new dataset object
        let dataset = Dataset {
            id: dataset_id,
            name,
            description,
            category,
            price,
            owner,
            walrus_ref,
            seal_hash,
            truth_score,
            size,
            format,
            upload_timestamp: timestamp,
        };

        table::add(&mut marketplace.datasets, dataset_id, dataset);
        marketplace.dataset_count = marketplace.dataset_count + 1;

        event::emit(DatasetRegistered {
            dataset_id,
            owner,
            name,
            price,
            walrus_ref,
            seal_hash,
            truth_score,
        });
    }

    /// Purchase a dataset and mint NFT
    public fun purchase_dataset(
        marketplace: &mut Marketplace,
        dataset_id: u64,
        payment: Coin<SUI>,
        ctx: &mut TxContext,
    ) {
        assert!(table::contains(&marketplace.datasets, dataset_id), E_DATASET_NOT_FOUND);

        let dataset = table::borrow(&marketplace.datasets, dataset_id);
        let buyer = tx_context::sender(ctx);
        let seller = dataset.owner;
        let price = dataset.price;

        // Check if buyer is not the owner
        assert!(buyer != seller, E_NOT_OWNER);

        // Check if payment is sufficient
        let payment_value = coin::value(&payment);
        assert!(payment_value >= price, E_INSUFFICIENT_FUNDS);

        // Require exact payment to avoid non-composable change transfers
        assert!(payment_value == price, E_INVALID_PAYMENT);
        let payment_to_seller = coin::into_balance(payment);
        
        // Transfer exact price to seller
        let exact_payment = coin::from_balance(payment_to_seller, ctx);
        transfer::public_transfer(exact_payment, seller);

        let timestamp = tx_context::epoch_timestamp_ms(ctx);

        // Create NFT for the purchased dataset
        let nft = DatasetNFT {
            id: object::new(ctx),
            dataset_id,
            name: dataset.name,
            walrus_ref: dataset.walrus_ref,
            seal_hash: dataset.seal_hash,
            purchase_timestamp: timestamp,
        };

        let nft_id = object::id(&nft);
        
        // Transfer NFT to buyer
        transfer::transfer(nft, buyer);

        event::emit(DatasetPurchased {
            dataset_id,
            buyer,
            seller,
            price,
            timestamp,
            nft_id,
        });
    }

    /// Get dataset by ID (returns true if exists, false otherwise)
    public fun dataset_exists(marketplace: &Marketplace, dataset_id: u64): bool {
        table::contains(&marketplace.datasets, dataset_id)
    }
    
    /// Borrow dataset (aborts if not found)
    public fun borrow_dataset(marketplace: &Marketplace, dataset_id: u64): &Dataset {
        table::borrow(&marketplace.datasets, dataset_id)
    }

    /// Get dataset count
    public fun get_dataset_count(marketplace: &Marketplace): u64 {
        marketplace.dataset_count
    }

    /// Remove a dataset (only by owner)
    public fun remove_dataset(
        marketplace: &mut Marketplace,
        dataset_id: u64,
        ctx: &mut TxContext,
    ) {
        assert!(table::contains(&marketplace.datasets, dataset_id), E_DATASET_NOT_FOUND);
        
        let dataset = table::borrow(&marketplace.datasets, dataset_id);
        let owner = dataset.owner;
        let sender = tx_context::sender(ctx);
        
        // Only the owner can remove their dataset
        assert!(sender == owner, E_NOT_OWNER);
        
        // Remove the dataset from the table (dataset is dropped)
        let dataset = table::remove(&mut marketplace.datasets, dataset_id);
        // Dataset is automatically dropped here
        
        let timestamp = tx_context::epoch_timestamp_ms(ctx);
        
        event::emit(DatasetRemoved {
            dataset_id,
            owner,
            timestamp,
        });
    }
}

