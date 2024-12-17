import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import { Command } from 'commander';
import { URL } from 'url';

export const downloadPage = async (url, outputDir) => {
  const cheerio = await import('cheerio');
  const urlObj = new URL(url);
  const urlWithoutProtocol = url.replace(/https?:\/\//, '');
  const fileName = `${urlWithoutProtocol.replace(/[^a-zA-Z0-9]/g, '-')}.html`;
  const filesDir = `${urlWithoutProtocol.replace(/[^a-zA-Z0-9]/g, '-')}_files`;
  const filesPath = path.join(outputDir, filesDir);
  const filePath = path.join(outputDir, fileName);

  console.log(`Saving file to: ${filePath}`);
  const { data } = await axios.get(url);

  // Extraer y descargar imágenes con Cheerio
  const $ = cheerio.load(data);
  const imagePromises = [];
  $('img').each((_, element) => {
    const src = $(element).attr('src');
    if (src) {
      const absoluteUrl = new URL(src, urlObj).href; // Convertir a URL absoluta
      const ext = path.extname(absoluteUrl) || '.jpg'; // Extraer la extensión (default: .jpg)
      const baseName = src.replace(/[^a-zA-Z0-9]/g, '-').replace(/-$/, ''); // Limpiar nombre
      const imageFileName = `${baseName}${ext}`; // Añadir extensión al nombre limpio
      const imagePath = path.join(filesPath, imageFileName);

      imagePromises.push(
        axios.get(absoluteUrl, { responseType: 'arraybuffer' })
          .then((response) => {
            return fs.mkdir(filesPath, { recursive: true })
              .then(() => fs.writeFile(imagePath, response.data));
          })
          .then(() => {
            console.log(`Downloaded image: ${absoluteUrl} to ${imagePath}`);
            $(element).attr('src', path.join(filesDir, imageFileName)); // Reemplazar ruta en HTML
          })
      );
    }
  });

  await Promise.all(imagePromises); // Esperar a que todas las imágenes se descarguen
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(filePath, $.html()); // Guardar HTML modificado

  console.log(`File successfully saved at: ${filePath}`);
  return filePath;
};

// CLI Logic
const program = new Command();

program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0.0')
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .argument('<url>', 'URL to download')
  .action(async (url, options) => {
    try {
      const filePath = await downloadPage(url, options.output);
      console.log(`CLI Output: ${filePath}`);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
