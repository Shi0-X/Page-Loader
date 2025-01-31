import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import { URL } from 'url';
import * as cheerio from 'cheerio';
import debug from 'debug';
import { Listr } from 'listr2';
import { urlToFilename, urlToDirname, getExtension } from './utils.js';

const log = debug('page-loader');

// 🔹 Función para evitar que `outputDirName` apunte a directorios restringidos
const sanitizeOutputDir = (dir) => {
  const restrictedPaths = ['/sys', '/etc', '/bin', '/usr', '/lib'];
  if (restrictedPaths.includes(dir)) {
    throw new Error(`❌ No se puede usar el directorio restringido: ${dir}`);
  }
  return dir;
};

// 🔹 Función para manejar reintentos en solicitudes HTTP con descarga de archivos binarios correcta
const fetchWithRetry = async (url, retries = 2, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        responseType: 'arraybuffer', 
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': '*/*',
        },
      });

      return response; 
    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        throw new Error(`❌ URL no encontrada: ${url} (${error.code})`);
      }

      if (error.response) {
        const status = error.response.status;
        if (status === 404) throw new Error(`❌ Error 404: Página no encontrada (${url})`);
        if (status === 500) throw new Error(`❌ Error 500: Error interno del servidor (${url})`);
      }

      if (i === retries - 1) {
        throw new Error(`❌ Falló la descarga tras ${retries} intentos: ${url}`);
      }

      console.warn(`⚠️ Retry ${i + 1}/${retries}: ${url}`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

// 🔹 Verifica si un archivo ya existe
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

// 🔹 Procesa y reemplaza las URLs de recursos dentro del HTML
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

// 🔹 Obtiene y procesa todos los recursos del HTML
const processResources = ($, baseUrl, baseDirname) => {
  const assets = [];

  processResource($, 'img', 'src', baseUrl, baseDirname, assets);
  processResource($, 'link[rel="stylesheet"]', 'href', baseUrl, baseDirname, assets);
  processResource($, 'script[src]', 'src', baseUrl, baseDirname, assets);

  return { html: $.html(), assets };
};

// 🔹 Función principal para descargar una página
const downloadPage = async (pageUrl, outputDirName) => {
  try {
    outputDirName = sanitizeOutputDir(outputDirName);

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

    // 🔹 Manejo de errores de directorios
    await fs.mkdir(fullOutputDirname, { recursive: true });

    if (await fileExists(fullOutputFilename)) {
      throw new Error(`❌ Conflicto: ${fullOutputFilename} ya existe como archivo.`);
    }

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
          await fs.writeFile(resourcePath, data);
        },
      })),
      { concurrent: 5 }
    );

    await tasks.run();
    log(`🎉 File successfully saved at: ${fullOutputFilename}`);
    return fullOutputFilename;
  } catch (error) {
    console.error(error.message);
    if (process.env.NODE_ENV === 'test') throw error;
    process.exit(1);
  }
};

export default downloadPage;
