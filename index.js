import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import { URL } from 'url';
import debug from 'debug';
import { Listr } from 'listr2';

// Configurar debug para page-loader y axios
const log = debug('page-loader');
const axiosLog = debug('axios');

axios.interceptors.request.use((config) => {
  axiosLog(`Starting request to: ${config.url}`);
  return config;
});

axios.interceptors.response.use(
  (response) => {
    axiosLog(`Response received with status: ${response.status}`);
    return response;
  },
  (error) => {
    axiosLog(`Request failed: ${error.message}`);
    return Promise.reject(error);
  }
);

const writeToLogFile = async (message, logFilePath) => {
  try {
    await fs.appendFile(logFilePath, `${message}\n`);
  } catch (error) {
    log(`Failed to write to log file at ${logFilePath}. Error: ${error.message}`);
  }
};

const handleErrorLogging = async (error) => {
  const currentLogFile = './error.log';
  try {
    await writeToLogFile(error.message, currentLogFile);
    log(`Logged error to: ${currentLogFile}`);
  } catch (logError) {
    console.error(`Failed to log error. Original error: ${error.message}`);
  }
};

const downloadResource = async (resourceUrl, resourcePath) => {
  try {
    log(`Attempting to download: ${resourceUrl}`);
    const response = await axios.get(resourceUrl, { responseType: 'arraybuffer' });
    await fs.mkdir(path.dirname(resourcePath), { recursive: true });
    await fs.writeFile(resourcePath, response.data);
    log(`Downloaded: ${resourceUrl} to ${resourcePath}`);
  } catch (error) {
    throw new Error(`Failed to download resource: ${resourceUrl}. Error: ${error.message}`);
  }
};

const downloadPage = async (url, outputDir) => {
  try {
    const cheerio = await import('cheerio');
    const urlObj = new URL(url);
    const sanitizedHost = urlObj.host.replace(/[^\w.-]/g, '_');
    const fileName = `${sanitizedHost}.html`;
    const filesDir = `${sanitizedHost}_files`;
    const filesPath = path.join(outputDir, filesDir);
    const filePath = path.join(outputDir, fileName);

    log(`Saving file to: ${filePath}`);
    const { data } = await axios.get(url);

    const $ = cheerio.load(data);
    const tasks = new Listr([], { concurrent: true });

    const processResource = (element, attr) => {
      const src = $(element).attr(attr);
      if (src) {
        const resourceUrl = new URL(src, urlObj).href;
        const resourceFileName = path.basename(src);
        const resourcePath = path.join(filesPath, resourceFileName);

        tasks.add({
          title: `Downloading resource: ${resourceUrl}`,
          task: () => downloadResource(resourceUrl, resourcePath),
        });

        $(element).attr(attr, path.join(filesDir, resourceFileName));
      }
    };

    $('img').each((_, element) => processResource(element, 'src'));
    $('link[rel="stylesheet"]').each((_, element) => processResource(element, 'href'));
    $('script[src]').each((_, element) => processResource(element, 'src'));

    await fs.mkdir(outputDir, { recursive: true });
    await tasks.run();
    await fs.writeFile(filePath, $.html());

    log(`File successfully saved at: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(error.message);
    await handleErrorLogging(error);
    throw error;  
  }
};

export default downloadPage;
