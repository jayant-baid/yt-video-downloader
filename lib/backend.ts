export function getBackendBaseUrl() {
  const value =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_API_URL ||
    "http://127.0.0.1:8080";

  return value.replace(/\/$/, "");
}
