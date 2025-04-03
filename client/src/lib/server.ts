const DEV = process.env.NODE_ENV === "development";
const IS_VERCEL_PREVIEW = process.env.VERCEL_ENV === "preview";

export const SERVER_URL =
  !DEV && !IS_VERCEL_PREVIEW
    ? "https://shadow-backend.alexandretrotel.org"
    : "http://localhost:3000";
