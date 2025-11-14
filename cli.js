#!/usr/bin/env node

import { Command } from 'commander';
import { StyleConverter } from './src/converter.js';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json for version
const packageJson = JSON.parse(
    await fs.readFile(path.join(__dirname, 'package.json'), 'utf-8')
);

const program = new Command();

program
    .name('convert-exe-style')
    .description('Convert eXeLearning styles from v2.9 to v3.0')
    .version(packageJson.version);

program
    .option('-i, --input <path>', 'Input directory containing old style (v2.9)')
    .option('-o, --output <dir>', 'Output directory for converted styles', 'results')
    .option('-d, --dry-run', 'Preview changes without writing files')
    .option('-v, --verbose', 'Show detailed progress')
    .option('-z, --zip', 'Create ZIP file ready for eXeLearning 3.0 import')
    .option('-b, --batch <dir>', 'Convert all styles in a directory');

program.parse(process.argv);

const options = program.opts();

// Display banner
console.log(chalk.bold.cyan('\n╔════════════════════════════════════════════════════════════╗'));
console.log(chalk.bold.cyan('║   eXeLearning Style Converter v2.9 → v3.0                 ║'));
console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════════╝\n'));

async function main() {
    try {
        // Validate options
        if (!options.input && !options.batch) {
            console.error(chalk.red('Error: Either --input or --batch option is required\n'));
            program.help();
            process.exit(1);
        }

        // Create converter
        const converter = new StyleConverter({
            dryRun: options.dryRun,
            outputDir: options.output,
            verbose: options.verbose,
            createZip: options.zip
        });

        // Batch mode
        if (options.batch) {
            const batchDir = path.resolve(options.batch);

            if (!await fs.pathExists(batchDir)) {
                throw new Error(`Batch directory does not exist: ${batchDir}`);
            }

            console.log(chalk.blue(`Batch mode: Converting all styles in ${batchDir}\n`));
            await converter.convertBatch(batchDir);
        }
        // Single conversion mode
        else if (options.input) {
            const inputPath = path.resolve(options.input);

            if (!await fs.pathExists(inputPath)) {
                throw new Error(`Input path does not exist: ${inputPath}`);
            }

            await converter.convert(inputPath);
        }

        if (options.dryRun) {
            console.log(chalk.yellow('\nℹ  This was a dry run. No files were modified.'));
            console.log(chalk.yellow('   Run without --dry-run to perform the actual conversion.\n'));
        }

        process.exit(0);
    } catch (error) {
        console.error(chalk.red(`\n✗ Error: ${error.message}\n`));
        if (options.verbose) {
            console.error(chalk.gray(error.stack));
        }
        process.exit(1);
    }
}

main();
