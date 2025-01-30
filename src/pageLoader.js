import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import { URL } from 'url';
import * as cheerio from 'cheerio';
import debug from 'debug';
import { Listr } from 'listr2';
import { urlToFilename, urlToDirname, getExtension } from './utils.js';

const log = debug('page-loader');

const fetchWithRetry = async (url, retries = 2, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url, {
        timeout: 3000, // ⏳ Reduce timeout a 3s para no exceder el límite de 5s en la prueba
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': '*/*',
        },
      });
    } catch (error) {
      // 🚨 Si el error es crítico, fallamos inmediatamente
      if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'].includes(error.code)) {
        throw new Error(`❌ Connection failed immediately: ${url} (${error.code})`);
      }
      // ⏳ Si no es un error crítico, intentamos nuevamente
      if (i === retries - 1) throw error;
      console.warn(`⚠️ Retry ${i + 1}/${retries}: ${url}`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};


const processResource = ($, tagName, attrName, baseUrl, baseDirname, assets) => {
  $(tagName).each((_, element) => {
    const $element = $(element);
    const attrValue = $element.attr(attrName);
    if (!attrValue) return;

    const url = new URL(attrValue, baseUrl);
    if (url.origin !== baseUrl) return;

    const slug = urlToFilename(`${url.hostname}${url.pathname}`);
    const filepath = path.join(baseDirname, slug);
    assets.push({ url, filename: slug });
    $element.attr(attrName, filepath);
  });
};

const processResources = ($, baseUrl, baseDirname) => {
  const assets = [];
  processResource($, 'img', 'src', baseUrl, baseDirname, assets);
  processResource($, 'link[rel="stylesheet"]', 'href', baseUrl, baseDirname, assets);
  processResource($, 'script[src]', 'src', baseUrl, baseDirname, assets);
  return { html: $.html(), assets };
};

const downloadPage = async (pageUrl, outputDirName) => {
  try {
    log('url', pageUrl);
    log('output', outputDirName);

    const url = new URL(pageUrl);
    const slug = `${url.hostname}${url.pathname}`;
    const filename = urlToFilename(slug);
    const fullOutputDirname = path.resolve(process.cwd(), outputDirName);
    const extension = getExtension(filename) === '.html' ? '' : '.html';
    const fullOutputFilename = path.join(fullOutputDirname, `${filename}${extension}`);
    const assetsDirname = urlToDirname(slug);
    const fullOutputAssetsDirname = path.join(fullOutputDirname, assetsDirname);

    await fs.mkdir(fullOutputDirname, { recursive: true });
    await fs.mkdir(fullOutputAssetsDirname, { recursive: true });

    const { data: html } = await fetchWithRetry(pageUrl);
    const $ = cheerio.load(html, { decodeEntities: false });
    const { html: updatedHtml, assets } = processResources($, pageUrl, fullOutputAssetsDirname);

    await fs.writeFile(fullOutputFilename, updatedHtml);
    log(`✅ HTML saved: ${fullOutputFilename}`);

    const tasks = new Listr(
      assets.map(({ url, filename }) => ({
        title: `Downloading resource: ${url.href}`,
        task: async () => {
          const resourcePath = path.join(fullOutputAssetsDirname, filename);
          const { data } = await fetchWithRetry(url.href);

          // 🔹 Verifica que el archivo no esté vacío antes de guardarlo
          if (!data || data.length === 0) {
            throw new Error(`❌ Empty file received: ${url.href}`);
          }

          await fs.writeFile(resourcePath, data);
        },
      })),
      { concurrent: 5 } // 🔹 Máximo 5 descargas simultáneas para evitar sobrecarga
    );

    await tasks.run();
    log(`🎉 File successfully saved at: ${fullOutputFilename}`);
    return fullOutputFilename;
  } catch (error) {
    console.error(error.message);
    if (process.env.NODE_ENV === 'test') {
      throw error;
    } else {
      process.exit(1);
    }
  }
};

export default downloadPage;
