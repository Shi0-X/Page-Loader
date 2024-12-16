import nock from 'nock';
import path from 'path';
import { promises as fs } from 'fs';

describe('PageLoader CLI with Nock', () => {
  const testHtml = `<!doctype html>
<html>
<head><title>Example Domain</title></head>
<body><h1>Example Domain</h1></body>
</html>`;

  const tempDir = path.join(process.cwd(), 'temp-test-dir');
  const expectedPath = path.join(tempDir, 'example-com.html');

  beforeAll(() => {
    console.log('Configuring Nock...');
    nock('https://example.com')
      .get('/')
      .reply(200, testHtml);
  });

  beforeEach(async () => {
    // Limpiar y crear el directorio fijo
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });

    // Configurar argumentos CLI
    process.argv = [
      'node',
      'index.js',
      '--output',
      tempDir,
      'https://example.com',
    ];
  });

  afterAll(() => {
    nock.cleanAll();
  });

  test('CLI downloads a page and verifies mocked content', async () => {
    console.log(`Temporary directory: ${tempDir}`);
    console.log(`Expected file path: ${expectedPath}`);

    // Importar el CLI y esperar a que termine
    const cliPromise = import('../index.js');
    await cliPromise;

    // Esperar brevemente para asegurar la escritura completa del archivo
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verificar si el archivo existe
    const fileExists = await fs.access(expectedPath).then(() => true).catch(() => false);
    console.log('File exists:', fileExists);
    expect(fileExists).toBe(true);

    // Verificar el contenido del archivo
    const fileContent = await fs.readFile(expectedPath, 'utf-8');
    expect(fileContent).toBe(testHtml);

    // Verificar que Nock manejó la solicitud
    expect(nock.isDone()).toBe(true);
  });
});
