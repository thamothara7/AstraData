import { createWalrusClient } from "./walrusClient";

export interface WalrusUploadResult {
  reference: string;
  hash: string;
  size: number;
}

/**
 * Upload to Walrus Storage (compatible with @mysten/walrus@0.8.4)
 */
export const uploadToWalrus = async (file: File): Promise<WalrusUploadResult> => {
  try {
    const client = createWalrusClient();

    // Convert File → Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // v0.8.4 writeBlobToUploadRelay requires fields TypeScript doesn't know about.
    // So we cast to any to bypass strict TS types.
    const res = await (client.walrus.writeBlobToUploadRelay as any)({
      blob: bytes,
      deletable: false,
    });

    // Extract blobId (naming changes across versions)
    const blobId =
      res?.blobId ??
      res?.id ??
      res ?? // fallback
      "";

    return {
      reference: `walrus:${blobId}`,
      hash: blobId,
      size: file.size,
    };
  } catch (err) {
    console.error("Walrus upload error:", err);
    throw new Error("Failed to upload to Walrus storage");
  }
};

/**
 * Download from Walrus Storage (compatible with @mysten/walrus@0.8.4)
 */
export const downloadFromWalrus = async (reference: string): Promise<Blob> => {
  try {
    if (!reference) throw new Error("Download reference is empty");

    const blobId = reference.replace(/^walrus:\/?/, "").trim();
    const client = createWalrusClient();

    // v0.8.4 getFiles also has flexible shapes → cast to any
    const [walrusFile] = await (client.walrus.getFiles as any)({
      ids: [blobId],
    });

    if (!walrusFile) {
      throw new Error("Walrus file not found");
    }

    // Extract raw data (SDK uses blob, new ones use data)
    const raw =
      (walrusFile as any).blob ??
      (walrusFile as any).data ??
      walrusFile;

    // Ensure Uint8Array
    const uint8 =
      raw instanceof Uint8Array ? raw : new Uint8Array(raw);

    // SAFE conversion (fixes SharedArrayBuffer build error)
    const safeArray = new Uint8Array(uint8).buffer;

    const mime =
      (walrusFile as any).contentType ??
      (walrusFile as any).mime ??
      "application/octet-stream";

    return new Blob([safeArray], { type: mime });
  } catch (err) {
    console.error("Walrus download error:", err);
    throw new Error("Failed to download from Walrus storage");
  }
};
