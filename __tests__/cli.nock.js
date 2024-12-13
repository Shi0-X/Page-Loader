import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import nock from 'nock';

const execAsync = promisify(exec);

const cliPath = path.resolve('index.js');

describe('PageLoader CLI with Nock', () => {
  const testUrl = 'https://example.com';
  const testHtml = '<html><title>Test</title></html>';
  let outputDir;
  let expectedFilePath;

  beforeAll(() => {
    nock.cleanAll();
    console.log('Configuring Nock...');
    nock('https://example.com') // Configuración del interceptor
      .get('/')
      .reply(200, testHtml);
  });

  beforeEach(async () => {
    outputDir = path.join(process.cwd(), 'tmp');
    expectedFilePath = path.join(outputDir, 'example-com.html');
    await fs.mkdir(outputDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
    nock.cleanAll();
  });

  test('downloads a page and verifies mocked content', async () => {
    const { stdout } = await execAsync(
      `node ${cliPath} --output ${outputDir} ${testUrl}`
    );
    console.log('CLI Output:', stdout);

    const fileContent = await fs.readFile(expectedFilePath, 'utf-8');
    console.log('File content:', fileContent);
    expect(fileContent).toBe(testHtml);
  });
});
