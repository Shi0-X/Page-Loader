#!/usr/bin/env node

import downloadPage from '../src/pageLoader.js'; // Importa como default
import { program } from 'commander';
import path from 'path';

program
  .version('1.0.0')
  .description('Downloads a webpage and its resources.')
  .option('-o, --output [dir]', 'output directory (default: current working directory)', process.cwd())
  .arguments('<url>')
  .action((url, options) => {
    const outputDir = path.resolve(options.output);

    downloadPage(url, outputDir)
      .then(({ filepath }) => {
        console.log(`✅ Página descargada exitosamente en: '${filepath}'`);
      })
      .catch((error) => {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1); // ✅ Salir con código de error si hay fallo
      });
  });

program.on('--help', () => {
  console.log('');
  console.log('Example usage:');
  console.log('  $ page-loader -o ./output https://example.com');
  console.log('');
});

program.parse(process.argv);
