import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const cliPath = path.resolve('index.js');
const outputDir = path.resolve('tmp');
const testUrl = 'https://example.com';
const expectedFileName = 'example-com.html';
const expectedFilePath = path.join(outputDir, expectedFileName);

describe('PageLoader CLI', () => {
  beforeAll(async () => {
    // Crear directorio de salida antes de ejecutar pruebas
    await fs.mkdir(outputDir, { recursive: true });
  });

  afterAll(async () => {
    // Limpiar archivos creados durante las pruebas
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  test('downloads a page and saves it to the specified directory', async () => {
    // Ejecutar la CLI
    const { stdout } = await execAsync(`node ${cliPath} --output ${outputDir} ${testUrl}`);

    // Verificar mensaje en consola
    console.log('CLI Output:', stdout);
    expect(stdout).toContain(`Page was downloaded as '${expectedFilePath}'`);

    // Verificar que el archivo fue creado
    const fileExists = await fs.access(expectedFilePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    // Verificar que el contenido del archivo no esté vacío
    const fileContent = await fs.readFile(expectedFilePath, 'utf-8');
    console.log('File content:', fileContent);
    expect(fileContent.length).toBeGreaterThan(0);
  });
});
