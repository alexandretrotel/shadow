export const featureFlags = {
  enableMessageSearch: false,
  enableReactions: false,
  enableEditDelete: false,
  enableImageDownload: false,
  enableVerifyQRCode: false,
};

export const isFeatureEnabled = (
  feature: keyof typeof featureFlags,
): boolean => {
  return featureFlags[feature];
};
