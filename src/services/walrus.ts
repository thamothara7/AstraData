/**
 * Walrus Storage Integration
 * Uploads files to Walrus decentralized storage and returns storage reference
 */

export interface WalrusUploadResult {
  reference: string;
  hash: string;
  size: number;
}

/**
 * Upload file to Walrus storage
 * Note: This is a placeholder - you'll need to integrate with actual Walrus API
 * Walrus API endpoints and SDK will be available during hackathon
 */
export const uploadToWalrus = async (file: File): Promise<WalrusUploadResult> => {
  try {
    // Convert file to buffer/ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // TODO: Replace with actual Walrus API call
    // Example structure:
    // const formData = new FormData();
    // formData.append('file', file);
    // const response = await fetch('https://walrus-api-url/upload', {
    //   method: 'POST',
    //   body: formData,
    // });
    // const data = await response.json();

    // Mock response for development
    const mockReference = `walrus://${Date.now()}-${file.name}`;
    // Generate hash from first 32 bytes
    const hashBytes = uint8Array.slice(0, 32);
    const mockHash = `0x${Array.from(hashBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`;

    return {
      reference: mockReference,
      hash: mockHash,
      size: file.size,
    };
  } catch (error) {
    console.error('Walrus upload error:', error);
    throw new Error('Failed to upload to Walrus storage');
  }
};

/**
 * Download file from Walrus storage
 */
export const downloadFromWalrus = async (reference: string): Promise<Blob> => {
  try {
    if (!reference || reference.trim() === '') {
      throw new Error('Download reference is empty');
    }

    const cleanRef = reference.replace(/^walrus:\/\//, '');

    // Check if this is a mock reference (starts with timestamp pattern like "1763116372765-")
    const isMockReference = /^\d{13,}-/.test(cleanRef) || cleanRef.includes('mock') || cleanRef.includes('demo');
    
    // If it's already a full HTTP/HTTPS URL, use it directly
    if (reference.startsWith('http://') || reference.startsWith('https://')) {
      try {
        const response = await fetch(reference);
        if (!response.ok) {
          throw new Error(`Failed to download: ${response.statusText} (${response.status})`);
        }
        return await response.blob();
      } catch (fetchError: any) {
        if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('ERR_NAME_NOT_RESOLVED')) {
          throw new Error('Unable to reach download server. The file may be temporarily unavailable or the URL is incorrect.');
        }
        throw fetchError;
      }
    }

    // If it's a mock reference and no API is configured, provide helpful error
    if (isMockReference) {
      const walrusApiUrl = import.meta.env.VITE_WALRUS_API_URL || '';
      if (!walrusApiUrl) {
        throw new Error(
          'This is a demo/mock dataset. The actual file is not available for download.\n\n' +
          'To enable downloads:\n' +
          '1. Configure VITE_WALRUS_API_URL in your environment variables\n' +
          '2. Upload datasets with actual Walrus storage integration\n' +
          '3. Contact the dataset owner for the actual file'
        );
      }
    }

    // Try Walrus API if configured
    const walrusApiUrl = import.meta.env.VITE_WALRUS_API_URL || '';
    if (walrusApiUrl) {
      try {
        const response = await fetch(`${walrusApiUrl}/download/${encodeURIComponent(cleanRef)}`);
        if (!response.ok) {
          throw new Error(`Failed to download from Walrus: ${response.statusText} (${response.status})`);
        }
        return await response.blob();
      } catch (fetchError: any) {
        if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('ERR_NAME_NOT_RESOLVED')) {
          throw new Error('Unable to reach Walrus API. Please check your network connection or contact support.');
        }
        throw fetchError;
      }
    }

    // If no Walrus API URL and not a direct HTTP URL
    throw new Error(
      'Walrus API URL not configured.\n\n' +
      'Please set VITE_WALRUS_API_URL in your environment variables to enable downloads.'
    );
  } catch (error) {
    console.error('Walrus download error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to download from Walrus storage');
  }
};

