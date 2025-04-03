const DEV = process.env.NODE_ENV !== "production";

export const SERVER_URL =
  process.env.SERVER_URL ??
  (DEV
    ? "http://localhost:3000"
    : "https://shadow-backend.alexandretrotel.org");
