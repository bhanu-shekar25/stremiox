import axios from 'axios';

// stremioAxios — base instance for Stremio API (no auth header, auth handled by stremio-api-client)
export const stremioAxios = axios.create({ baseURL: 'https://api.strem.io' });

// cinemetaAxios — Cinemeta metadata API
export const cinemetaAxios = axios.create({ baseURL: 'https://v3-cinemeta.strem.io' });

// rdAxios — Real-Debrid API (token injected via interceptor after auth)
export const rdAxios = axios.create({ baseURL: 'https://api.real-debrid.com/rest/1.0' });

// Set RD API key after login
export function setRDToken(apiKey: string) {
  rdAxios.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
} 
