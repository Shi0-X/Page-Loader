import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import { URL } from 'url';
import debug from 'debug';
import nock from 'nock';
import chalk from 'chalk';

// Configurar debug para page-loader
const log = debug('page-loader');
const axiosLog = debug('axios');

// Niveles de logs
const isVerbose = process.env.LOG_LEVEL === 'verbose';

// Añadir manualmente interceptores a axios
axios.interceptors.request.use((config) => {
  axiosLog(chalk.blue(`Starting Request to: ${config.url}`));
  return config;
});

axios.interceptors.response.use(
  (response) => {
    axiosLog(chalk.green(`Response received with status: ${response.status}`));
    if (isVerbose) {
      axiosLog(chalk.gray(`Headers: ${JSON.stringify(response.headers)}`));
      axiosLog(chalk.gray(`Body: ${JSON.stringify(response.data).slice(0, 200)}...`));
    }
    return response;
  },
  (error) => {
    axiosLog(chalk.red(`Request failed: ${error.message}`));
    return Promise.reject(error);
  }
);

// Configurar nock para pruebas y desarrollo
if (process.env.DEBUG && process.env.DEBUG.includes('nock')) {
  nock.recorder.rec({
    output_objects: true,
    dont_print: false,
  });
}

const downloadResource = async (resourceUrl, resourcePath) => {
  try {
    log(chalk.blue(`Attempting to download: ${resourceUrl}`));
    const response = await axios.get(resourceUrl, { responseType: 'arraybuffer' });
    await fs.mkdir(path.dirname(resourcePath), { recursive: true });
    await fs.writeFile(resourcePath, response.data);
    log(chalk.green(`Downloaded: ${resourceUrl} to ${resourcePath}`));
  } catch (error) {
    log(chalk.red(`Failed to download ${resourceUrl}: ${error.message}`));
  }
};

const downloadPage = async (url, outputDir) => {
  log(chalk.yellow('Debugging page-loader is working!'));
  const cheerio = await import('cheerio');
  const urlObj = new URL(url);
  const urlWithoutProtocol = url.replace(/https?:\/\//, '');
  const fileName = `${urlWithoutProtocol}.html`;
  const filesDir = `${urlWithoutProtocol}_files`;
  const filesPath = path.join(outputDir, filesDir);
  const filePath = path.join(outputDir, fileName);

  await fs.mkdir(outputDir, { recursive: true }); // Asegura que el directorio de salida exista

  log(chalk.blue(`Saving file to: ${filePath}`));
  const { data } = await axios.get(url);

  const $ = cheerio.load(data);
  const resourcePromises = [];

  const processResource = (element, attr) => {
    const src = $(element).attr(attr);
    if (src) {
      const resourceUrl = new URL(src, urlObj).href;
      const resourceFileName = path.basename(src);
      const resourcePath = path.join(filesPath, resourceFileName);

      resourcePromises.push(
        downloadResource(resourceUrl, resourcePath).then(() => {
          $(element).attr(attr, path.join(filesDir, resourceFileName));
        })
      );
    }
  };

  $('img').each((_, element) => processResource(element, 'src'));
  $('link[rel="stylesheet"]').each((_, element) => processResource(element, 'href'));
  $('script[src]').each((_, element) => processResource(element, 'src'));

  await Promise.all(resourcePromises);
  await fs.writeFile(filePath, $.html());

  log(chalk.green(`File successfully saved at: ${filePath}`));
  return filePath;
};

export default downloadPage;
