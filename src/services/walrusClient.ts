import { SuiClient } from "@mysten/sui/client";
import { walrus, WalrusClient } from "@mysten/walrus";

const WALRUS_UPLOAD_RELAY = import.meta.env.VITE_WALRUS_UPLOAD_RELAY_URL;
const WALRUS_NETWORK = import.meta.env.VITE_WALRUS_NETWORK || "testnet";

const SUI_FULLNODE =
  import.meta.env.VITE_SUI_FULLNODE_URL ||
  "https://fullnode.testnet.sui.io:443";

export function createWalrusClient() {
  const rpc = new SuiClient({
    url: SUI_FULLNODE,
  }).$extend(
    walrus({
      uploadRelay: WALRUS_UPLOAD_RELAY
        ? { host: WALRUS_UPLOAD_RELAY }
        : undefined,
      network: WALRUS_NETWORK,
      storageNodeClientOptions: {
        fetch: (url, opts) => fetch(url, opts),
        timeout: 60_000,
      },
    })
  );

  return rpc as unknown as { walrus: WalrusClient } & SuiClient;
}
