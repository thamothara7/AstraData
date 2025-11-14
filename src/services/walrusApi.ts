import { createWalrusClient } from "./walrusClient";

export interface WalrusUploadResult {
  reference: string;
  hash: string;
  size: number;
}

/**
 * Upload to Walrus Storage (v0.8.4 API)
 */
export const uploadToWalrus = async (file: File): Promise<WalrusUploadResult> => {
  try {
    const client = createWalrusClient();

    // Convert File to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // v0.8.4 --- writeBlobToUploadRelay requires ONLY blob + deletable
    const res = await client.walrus.writeBlobToUploadRelay({
      blob: bytes,
      deletable: false,
    });

    const { blobId } = res;

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
 * Download from Walrus Storage (v0.8.4 API)
 */
export const downloadFromWalrus = async (reference: string): Promise<Blob> => {
  try {
    if (!reference) throw new Error("Download reference is empty");

    const blobId = reference.replace(/^walrus:\/?/, "").trim();
    const client = createWalrusClient();

    // v0.8.4 getFiles returns >>> WalrusFile { blob, contentType }
    const [walrusFile] = await client.walrus.getFiles({ ids: [blobId] });

    if (!walrusFile) throw new Error("Walrus file not found");

    const uint8 = walrusFile.blob; // <--- correct field in v0.8.4
    const mime = walrusFile.contentType || "application/octet-stream";

    return new Blob([uint8], { type: mime });
  } catch (err) {
    console.error("Walrus download error:", err);
    throw new Error("Failed to download from Walrus storage");
  }
};
