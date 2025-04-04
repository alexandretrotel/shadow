const DEV = import.meta.env.MODE === "development";
const IS_VERCEL_PREVIEW = import.meta.env.VITE_VERCEL_ENV === "preview";

export const SERVER_URL = DEV
  ? "http://localhost:3000" // Local development
  : IS_VERCEL_PREVIEW
    ? "http://shadow-staging-backend.alexandretrotel.org" // Vercel preview
    : "https://shadow-backend.alexandretrotel.org"; // Production
