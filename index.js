#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0.0')
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .argument('<url>', 'URL to download')
  .action((url, options) => {
    console.log(`Downloading ${url} to ${options.output}`);
    // Aquí implementaremos la lógica de descarga más adelante
  });

program.parse(process.argv);
