import nock from 'nock';
import path from 'path';
import { promises as fs } from 'fs';

describe('PageLoader CLI with Nock', () => {
  const testHtml = `<!doctype html>
<html>
<head><title>Example Domain</title></head>
<body>
  <h1>Example Domain</h1>
  <img src="/images/logo.png" alt="Logo">
</body>
</html>`;

  const tempDir = path.join(process.cwd(), 'temp-test-dir');
  const expectedHtmlPath = path.join(tempDir, 'example-com.html');
  const filesDir = path.join(tempDir, 'example-com_files');
  const expectedImagePath = path.join(filesDir, 'images-logo.png');

  beforeAll(() => {
    console.log('Configuring Nock...');
    nock('https://example.com')
      .get('/') // Responde con el HTML de prueba
      .reply(200, testHtml)
      .get('/images/logo.png') // Responde con un archivo de imagen simulado
      .reply(200, 'image-content', { 'Content-Type': 'image/png' })
      .persist(); // Mantén las rutas disponibles para solicitudes repetidas
  });

  beforeEach(async () => {
    // Limpiar y preparar el directorio de pruebas
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });

    // Configurar argumentos de la CLI
    process.argv = [
      'node',
      'index.js',
      '--output',
      tempDir,
      'https://example.com',
    ];
  });

  afterAll(() => {
    nock.cleanAll(); // Limpia los interceptores
  });

  test('CLI downloads HTML and images, modifies the HTML correctly', async () => {
    console.log(`Temporary directory: ${tempDir}`);
    console.log(`Expected file path: ${expectedHtmlPath}`);

    // Importar la CLI y esperar a que termine
    const cliPromise = import('../index.js');
    await cliPromise;

    // Verificar si el archivo HTML existe
    const fileExists = await fs.access(expectedHtmlPath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    // Verificar si el directorio _files existe
    const dirExists = await fs.access(filesDir).then(() => true).catch(() => false);
    expect(dirExists).toBe(true);

    // Verificar si la imagen se descargó correctamente
    const imageExists = await fs.access(expectedImagePath).then(() => true).catch(() => false);
    expect(imageExists).toBe(true);

    // Verificar que el HTML modificado apunta al archivo local
    const fileContent = await fs.readFile(expectedHtmlPath, 'utf-8');
    expect(fileContent).toContain('example-com_files/images-logo.png');

    // Verificar que Nock manejó todas las solicitudes
    expect(nock.isDone()).toBe(true);
  });
});
