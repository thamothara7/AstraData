import { createWalrusClient } from "./walrusClient";

export interface WalrusUploadResult {
  reference: string;
  hash: string;
  size: number;
}

/**
 * Quick workaround upload (casts to any to satisfy v0.8.4 types)
 */
export const uploadToWalrus = async (file: File): Promise<WalrusUploadResult> => {
  try {
    const client = createWalrusClient();

    // Convert File -> Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Cast to any to bypass type mismatch in v0.8.4
    const res = await (client.walrus.writeBlobToUploadRelay as any)({
      blob: bytes,
      deletable: false,
    });

    const blobId = (res as any).blobId ?? (res as any).id ?? String(res);

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
 * Quick workaround download (casts to any)
 */
export const downloadFromWalrus = async (reference: string): Promise<Blob> => {
  try {
    if (!reference) throw new Error("Download reference is empty");

    const blobId = reference.replace(/^walrus:\/?/, "").trim();
    const client = createWalrusClient();

    // Cast getFiles result to any so we can access blob/contentType
    const [walrusFile] = await (client.walrus.getFiles as any)({ ids: [blobId] });

    if (!walrusFile) throw new Error("Walrus file not found");

    // Use the v0.8.4 field names if present, otherwise try common alternatives
    const uint8 = (walrusFile as any).blob ?? (walrusFile as any).data ?? walrusFile;
    const mime = (walrusFile as any).contentType ?? (walrusFile as any).mime ?? "application/octet-stream";

    // If uint8 is already a Uint8Array or ArrayBuffer, wrap appropriately
    if (uint8 instanceof ArrayBuffer) return new Blob([uint8], { type: mime });
    if (uint8 && (uint8 as Uint8Array).buffer) return new Blob([ (uint8 as Uint8Array).buffer ], { type: mime });

    // Fallback: convert to Blob directly
    return new Blob([uint8], { type: mime });
  } catch (err) {
    console.error("Walrus download error:", err);
    throw new Error("Failed to download from Walrus storage");
  }
};
