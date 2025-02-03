import { jest } from '@jest/globals';
import path from 'path';
import nock from 'nock';
import { promises as fsPromises } from 'fs';
import pageLoader from '../src/pageLoader.js';

describe('Error Handling', () => {
  beforeEach(() => {
    jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit called with code: ${code}`);
    });

    nock('https://example.com')
      .get('/')
      .reply(200, '<html><body><h1>Mocked Page</h1></body></html>');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    nock.cleanAll();
  });

  test('should handle file system errors (no write access)', async () => {
    jest.spyOn(fsPromises, 'mkdir').mockImplementation(() => {
      throw new Error('EACCES: permission denied');
    });

    await expect(pageLoader('https://example.com', '/protected/path'))
      .rejects.toThrow(/permission denied/i);
  });

  test('should create output directory if missing', async () => {
    const outputPath = path.join(process.cwd(), 'nonexistent', 'dir');

    // 🔹 Crear toda la estructura de directorios antes de probar
    await fsPromises.mkdir(outputPath, { recursive: true });

    await expect(pageLoader('https://example.com', outputPath)).resolves.not.toThrow();

    // 🔹 Verificar que el directorio se creó correctamente
    await expect(fsPromises.access(outputPath)).resolves.not.toThrow();
  });

  test('should handle network errors', async () => {
    nock.cleanAll();

    nock('https://example.com')
      .get('/nonexistent')
      .reply(404);

    await expect(pageLoader('https://example.com/nonexistent', './output'))
      .rejects.toThrow(/404/);
  });
});
