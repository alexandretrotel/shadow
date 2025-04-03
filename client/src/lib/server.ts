const DEV = import.meta.env.MODE === "development";
const IS_VERCEL_PREVIEW = import.meta.env.VITE_VERCEL_ENV === "preview";

export const SERVER_URL =
  !DEV && !IS_VERCEL_PREVIEW
    ? "https://shadow-backend.alexandretrotel.org"
    : "http://localhost:3000";
