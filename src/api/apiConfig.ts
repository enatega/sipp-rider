const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
if (!baseUrl) {
  throw new Error('Missing EXPO_PUBLIC_API_BASE_URL environment variable');
}

export const apiConfig = {
  baseUrl,
  timeoutMs: 15_000,
};
