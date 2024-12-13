import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);
const cliPath = path.resolve('index.js');

describe('PageLoader CLI', () => {
  test('shows help with --help option', async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);
    expect(stdout).toContain('Usage: page-loader [options] <url>');
  });

  test('throws error when no arguments are provided', async () => {
    await expect(execAsync(`node ${cliPath}`))
      .rejects
      .toThrow(/error: missing required argument 'url'/);
  });
});
