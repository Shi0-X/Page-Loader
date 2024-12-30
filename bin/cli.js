#!/usr/bin/env node
import downloadPage from '../index.js'; // Importa como default
import { program } from 'commander';
import path from 'path';

program
  .version('1.0.0')
  .description('Downloads a webpage and its resources')
  .option('-o, --output [dir]', 'output directory', process.cwd())
  .arguments('<url>')
  .action((url, options) => {
    const outputDir = path.resolve(options.output);
    downloadPage(url, outputDir)
      .then(() => console.log('Download completed successfully'))
      .catch((err) => console.error(`Error: ${err.message}`));
  });

program.parse(process.argv);
