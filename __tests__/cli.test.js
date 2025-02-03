import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import nock from 'nock';
import fetch from 'node-fetch';
import downloadPage from '../src/pageLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('PageLoader with Fixtures', () => {
  const fixturesDir = path.join(__dirname, '../__fixtures__');
  const outputDir = path.join(fixturesDir, 'output');
  const expectedDir = path.join(fixturesDir, 'expected');

  beforeEach(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.mkdir(outputDir, { recursive: true });

    nock('https://google.com')
      .get('/')
      .reply(
        200,
        `<!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="utf-8">
            <title>Google</title>
            <link rel="stylesheet" href="/styles.css">
            <script src="/script.js"></script>
          </head>
          <body>
            <h1>Welcome to Google!</h1>
            <img src="/logo.png" alt="Google Logo">
            <p>
              Visit our <a href="/about">About page</a> for more information.
            </p>
          </body>
        </html>`,
      );

    nock('https://google.com')
      .get('/logo.png')
      .reply(200, 'fake-image-content', { 'Content-Type': 'image/png' });

    nock('https://google.com')
      .get('/styles.css')
      .reply(200, 'body { background-color: #f3f3f3; }', { 'Content-Type': 'text/css' });

    nock('https://google.com')
      .get('/script.js')
      .reply(200, 'console.log("Hello, world!");', { 'Content-Type': 'application/javascript' });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  test('Mock works correctly', async () => {
    const response = await fetch('https://google.com/');
    const body = await response.text();
    expect(body).toContain('Welcome to Google');
  });

  test('Downloads HTML and resources correctly', async () => {
    const outputHtmlPath = path.join(outputDir, 'google.com.html');
    const expectedHtmlPath = path.join(expectedDir, 'google.com.html');
    const expectedFilesDir = path.join(expectedDir, 'google.com_files');
    const outputFilesDir = path.join(outputDir, 'google-com_files');

    await downloadPage('https://google.com', outputDir);

    // Leer los archivos generados
    let outputHtml = await fs.readFile(outputHtmlPath, 'utf-8');
    let expectedHtml = await fs.readFile(expectedHtmlPath, 'utf-8');

    // Ajustar las rutas de los archivos en outputHtml para que coincidan con expectedHtml
    outputHtml = outputHtml.replace(/google-com_files\\/g, 'google.com_files/');
    outputHtml = outputHtml.replace(/google-com-/g, '');

    // Normalización para evitar diferencias menores de formato
    const normalizeHtml = (html) =>
      html
        .replace(/\s+/g, ' ') // Eliminar espacios innecesarios
        .replace(/>\s+</g, '><') // Eliminar espacios entre etiquetas
        .replace(/(\s)\/>/g, '>') // Eliminar espacios antes de "/>"
        .replace(/\/>/g, '>') // Eliminar "/" en etiquetas auto-cerradas
        .trim(); // Eliminar espacios al inicio y fin
    
    expect(normalizeHtml(outputHtml)).toEqual(normalizeHtml(expectedHtml));

    // Verificar la existencia de los archivos descargados
    const outputFiles = await fs.readdir(outputFilesDir);
    const expectedFiles = await fs.readdir(expectedFilesDir);

    expect(outputFiles.map((f) => f.replace('google-com-', '')).sort()).toEqual(expectedFiles.sort());

    // Verificar el contenido de cada archivo
    await Promise.all(
      expectedFiles.map(async (file) => {
        const outputFilePath = path.join(outputFilesDir, `google-com-${file}`);
        const expectedFilePath = path.join(expectedFilesDir, file);

        const outputContent = await fs.readFile(outputFilePath, 'utf-8');
        const expectedContent = await fs.readFile(expectedFilePath, 'utf-8');

        expect(outputContent.trim()).toBe(expectedContent.trim());
      }),
    );
  });
});
