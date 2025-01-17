import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import { URL } from 'url';
import debug from 'debug';

// Configurar debug para page-loader
const log = debug('page-loader');

const writeToLogFile = async (message, logFilePath) => {
  try {
    await fs.appendFile(logFilePath, `${message}\n`);
  } catch (error) {
    console.error(`Failed to write to log file at ${logFilePath}. Error: ${error.message}`);
    throw error;
  }
};

const handleErrorLogging = async (error) => {
  const currentLogFile = './error.log';
  const tempLogFile = path.join(process.env.TEMP || '/tmp', 'error.log');

  // Intenta registrar el error en el archivo de log principal
  try {
    await writeToLogFile(error.message, currentLogFile);
    console.error(`Failed to complete operation. See log at ${currentLogFile}`);
  } catch (writeError) {
    console.error(`Failed to write to error log in the current directory. Error: ${writeError.message}`);
    try {
      // Si falla, intenta registrar el error en un archivo temporal
      await writeToLogFile(error.message, tempLogFile);
      console.error(`Logged error to temporary file at ${tempLogFile}`);
    } catch (tempWriteError) {
      console.error(`Failed to write to temporary log file. Error: ${tempWriteError.message}`);
    }
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
    const urlWithoutProtocol = url.replace(/https?:\/\//, '');
    const fileName = `${urlWithoutProtocol}.html`;
    const filesDir = `${urlWithoutProtocol}_files`;
    const filesPath = path.join(outputDir, filesDir);
    const filePath = path.join(outputDir, fileName);

    await fs.mkdir(outputDir, { recursive: true });

    log(`Saving file to: ${filePath}`);
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

    log(`File successfully saved at: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(error.message);
    await handleErrorLogging(error);
    process.exit(1);
  }
};

export default downloadPage;
