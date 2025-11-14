const resolveSuiNetwork = () => {
  const raw = import.meta.env.VITE_SUI_NETWORK || 'mainnet';
  if (raw.startsWith('sui:')) {
    return raw.replace('sui:', '');
  }
  return raw;
};

const resolveSuiChain = () => {
  const raw = import.meta.env.VITE_SUI_NETWORK || 'sui:mainnet';
  if (raw.startsWith('sui:')) {
    return raw;
  }
  return `sui:${raw}`;
};

export const config = {
  sui: {
    network: resolveSuiNetwork(),
    chainId: resolveSuiChain(),
    marketplacePackageId: import.meta.env.VITE_MARKETPLACE_PACKAGE_ID || '0x0',
    marketplaceObjectId: import.meta.env.VITE_MARKETPLACE_OBJECT_ID || '0x0',
  },
  walrus: {
    apiUrl: import.meta.env.VITE_WALRUS_API_URL || '',
  },
  seal: {
    apiUrl: import.meta.env.VITE_SEAL_API_URL || '',
  },
};


