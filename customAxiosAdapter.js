import http from 'http';
import https from 'https';
import { URL } from 'url';

export default async function customAxiosAdapter(config) {
  const url = new URL(config.url);

  const isHttps = url.protocol === 'https:';
  const transport = isHttps ? https : http;

  const options = {
    method: config.method.toUpperCase(),
    headers: config.headers,
    timeout: config.timeout,
  };

  return new Promise((resolve, reject) => {
    const req = transport.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          data,
        });
      });
    });

    req.on('error', reject);
    req.end(config.data || null);
  });
}
