import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import { Command } from 'commander';

export const downloadPage = async (url, outputDir) => {
  const urlWithoutProtocol = url.replace(/https?:\/\//, '');
  const fileName = `${urlWithoutProtocol.replace(/[^a-zA-Z0-9]/g, '-')}.html`;
  const filePath = path.join(outputDir, fileName);

  console.log(`Saving file to: ${filePath}`);
  const { data } = await axios.get(url);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(filePath, data);

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
