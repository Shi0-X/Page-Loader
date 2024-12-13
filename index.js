import axios from 'axios';
import { Command } from 'commander';
import { promises as fs } from 'fs';
import path from 'path';

console.log('Axios adapter in use (index.js):', axios.defaults.adapter?.name || 'default');

const program = new Command();

program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0.0')
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .argument('<url>', 'URL to download')
  .action(async (url, options) => {
    const outputDir = options.output;
    const urlWithoutProtocol = url.replace(/https?:\/\//, '');
    const fileName = `${urlWithoutProtocol.replace(/[^a-zA-Z0-9]/g, '-')}.html`;
    const filePath = path.join(outputDir, fileName);

    try {
      console.log('Requesting URL:', url);
      const { data } = await axios.get(url); // Descargar página
      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(filePath, data);
      console.log(`Page was downloaded as '${filePath}'`);
    } catch (error) {
      console.error(`Error downloading the page: ${error.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
