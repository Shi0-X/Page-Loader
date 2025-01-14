import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import { URL } from 'url';

const downloadResource = async (resourceUrl, resourcePath) => {
  try {
    console.log(`Attempting to download: ${resourceUrl}`);
    const response = await axios.get(resourceUrl, { responseType: 'arraybuffer' });
    await fs.mkdir(path.dirname(resourcePath), { recursive: true });
    await fs.writeFile(resourcePath, response.data);
    console.log(`Downloaded: ${resourceUrl} to ${resourcePath}`);
  } catch (error) {
    console.error(`Failed to download ${resourceUrl}: ${error.message}`);
  }
};

const downloadPage = async (url, outputDir) => {
  const cheerio = await import('cheerio');
  const urlObj = new URL(url);
  const urlWithoutProtocol = url.replace(/https?:\/\//, '');
  const fileName = `${urlWithoutProtocol}.html`;
  const filesDir = `${urlWithoutProtocol}_files`;
  const filesPath = path.join(outputDir, filesDir);
  const filePath = path.join(outputDir, fileName);

  console.log(`Saving file to: ${filePath}`);
  const { data } = await axios.get(url);

  // Extraer y procesar recursos con Cheerio
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

  // Descargar imágenes
  $('img').each((_, element) => processResource(element, 'src'));

  // Descargar archivos CSS
  $('link[rel="stylesheet"]').each((_, element) => processResource(element, 'href'));

  // Descargar archivos JS
  $('script[src]').each((_, element) => processResource(element, 'src'));

  await Promise.all(resourcePromises);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(filePath, $.html());

  console.log(`File successfully saved at: ${filePath}`);
  return filePath;
};

export default downloadPage;
