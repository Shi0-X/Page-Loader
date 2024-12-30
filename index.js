import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import { URL } from 'url';

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

  // Extraer imágenes con Cheerio
  const $ = cheerio.load(data);
  const imagePromises = [];
  $('img').each((_, element) => {
    const src = $(element).attr('src');
    if (src) {
      const absoluteUrl = new URL(src, urlObj).href;
      const imageFileName = path.basename(src);
      const imagePath = path.join(filesPath, imageFileName);

      imagePromises.push(
        axios.get(absoluteUrl, { responseType: 'arraybuffer' })
          .then((response) => fs.mkdir(filesPath, { recursive: true })
            .then(() => fs.writeFile(imagePath, response.data)))
          .then(() => {
            console.log(`Downloaded image: ${absoluteUrl} to ${imagePath}`);
            $(element).attr('src', path.join(filesDir, imageFileName));
          })
      );
    }
  });

  await Promise.all(imagePromises);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(filePath, $.html());

  console.log(`File successfully saved at: ${filePath}`);
  return filePath;
};

export default downloadPage;
