const DEV = process.env.NODE_ENV === "development";

export const featureFlags = {
  enableMessageSearch: false,
  enableReactions: false,
  enableEditDelete: false,
  enableImageDownload: false,
  enableVerifyQRCode: DEV,
};

export const isFeatureEnabled = (
  feature: keyof typeof featureFlags,
): boolean => {
  return featureFlags[feature];
};
