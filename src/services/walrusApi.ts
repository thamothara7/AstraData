import { createWalrusClient } from "./walrusClient";

export interface WalrusUploadResult {
  reference: string;
  hash: string;
  size: number;
}

/**
 * REAL Upload to Walrus Storage
 */
export const uploadToWalrus = async (file: File): Promise<WalrusUploadResult> => {
  try {
    const client = createWalrusClient();

    // Convert file → Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Upload using updated API (NO epochs)
    const { blobId } = await client.walrus.writeBlobToUploadRelay({
      blob: bytes,
      deletable: false,
    });

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
 * REAL Download from Walrus Storage
 */
export const downloadFromWalrus = async (reference: string): Promise<Blob> => {
  try {
    if (!reference) throw new Error("Download reference is empty");

    const blobId = reference.replace(/^walrus:\/?/, "").trim();
    const client = createWalrusClient();

    const [walrusFile] = await client.walrus.getFiles({ ids: [blobId] });

    if (!walrusFile) throw new Error("Walrus file not found");

    // Updated WalrusFile API
    const uint8 = walrusFile.data;      // Uint8Array
    const mime = walrusFile.mime || "application/octet-stream";

    return new Blob([uint8.buffer], { type: mime });
  } catch (err) {
    console.error("Walrus download error:", err);
    throw new Error("Failed to download from Walrus storage");
  }
};
