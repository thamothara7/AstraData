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

    // Upload using public upload relay
    const { blobId } = await client.walrus.writeBlobToUploadRelay({
      blob: bytes,
      deletable: false,
      epochs: 3,
    });

    return {
      reference: `walrus:${blobId}`,
      hash: blobId, // blobId IS the hash
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
    if (!reference) {
      throw new Error("Download reference is empty");
    }

    const blobId = reference.replace(/^walrus:\/?/, "").trim();
    const client = createWalrusClient();

    // SDK read (NO HTTP gateway)
    const [walrusFile] = await client.walrus.getFiles({ ids: [blobId] });

    if (!walrusFile) {
      throw new Error("Walrus file not found");
    }

    const arrayBuffer = await walrusFile.arrayBuffer();
    const mime = walrusFile.contentType || "application/octet-stream";

    return new Blob([arrayBuffer], { type: mime });
  } catch (err) {
    console.error("Walrus download error:", err);
    throw new Error("Failed to download from Walrus storage");
  }
};
