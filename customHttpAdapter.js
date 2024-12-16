import http from 'http';
import https from 'https';
import { URL } from 'url';

const customHttpAdapter = async (config) => {
    const { method, url, headers, data } = config;
    const parsedUrl = new URL(url);

    const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method,
        headers,
    };

    return new Promise((resolve, reject) => {
        const lib = parsedUrl.protocol === 'https:' ? https : http;
        const req = lib.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                resolve({
                    data: responseData,
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    headers: res.headers,
                    config,
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(data);
        }

        req.end();
    });
};

export default customHttpAdapter;
