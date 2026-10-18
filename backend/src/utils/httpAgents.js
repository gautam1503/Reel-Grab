import http from 'http';
import https from 'https';

// Certificate checks are relaxed because endpoint-security products on some networks
// intercept TLS with their own certificates.
export const httpAgent = new http.Agent({ keepAlive: true });
export const httpsAgent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });
