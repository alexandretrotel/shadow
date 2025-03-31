export const featureFlags = {
  enableMessageSearch: false,
};

export const isFeatureEnabled = (
  feature: keyof typeof featureFlags,
): boolean => {
  return featureFlags[feature];
};
