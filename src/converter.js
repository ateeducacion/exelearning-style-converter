import fs from 'fs-extra';
import path from 'path';
import { StyleAnalyzer } from './analyzer.js';
import { JavaScriptTransformer } from './js-transformer.js';
import { CSSMerger } from './css-merger.js';
import { ConfigUpdater } from './config-updater.js';
import { AssetMigrator } from './asset-migrator.js';
import { StyleValidator } from './validator.js';
import { ConversionReporter } from './reporter.js';
import { ZipCreator } from './zip-creator.js';
import chalk from 'chalk';

/**
 * Main converter orchestrator
 */
export class StyleConverter {
    constructor(options = {}) {
        this.options = {
            dryRun: options.dryRun || false,
            outputDir: options.outputDir || 'results',
            verbose: options.verbose || false,
            createZip: options.createZip || false,
            ...options
        };
    }

    /**
     * Main conversion method
     */
    async convert(inputPath) {
        const reporter = new ConversionReporter();

        try {
            // Validate input path
            if (!await fs.pathExists(inputPath)) {
                throw new Error(`Input path does not exist: ${inputPath}`);
            }

            const styleName = path.basename(inputPath);

            if (this.options.verbose) {
                console.log(chalk.blue(`\nAnalyzing style: ${styleName}...`));
            }

            // Step 1: Analyze the old style
            const analyzer = new StyleAnalyzer(inputPath);
            const analysis = await analyzer.analyze();

            if (this.options.verbose) {
                console.log(chalk.green(`✓ Analysis complete`));
                console.log(`  Complexity: ${analysis.complexity}`);
                console.log(`  Template: ${analysis.template}`);
            }

            // Step 2: Prepare output directory
            const outputPath = path.join(this.options.outputDir, styleName);

            if (!this.options.dryRun) {
                await fs.ensureDir(outputPath);
                // Create subdirectories
                await fs.ensureDir(path.join(outputPath, 'icons'));
                await fs.ensureDir(path.join(outputPath, 'img'));
                await fs.ensureDir(path.join(outputPath, 'fonts'));
            }

            if (this.options.verbose) {
                console.log(chalk.blue(`\nTransforming JavaScript...`));
            }

            // Step 3: Transform JavaScript
            const jsTransformer = new JavaScriptTransformer(analysis);
            const jsResult = await jsTransformer.transform();

            if (!this.options.dryRun) {
                await fs.writeFile(
                    path.join(outputPath, 'style.js'),
                    jsResult.content,
                    'utf-8'
                );
            }

            if (this.options.verbose) {
                console.log(chalk.green(`✓ JavaScript transformed`));
            }

            if (this.options.verbose) {
                console.log(chalk.blue(`\nMerging CSS files...`));
            }

            // Step 4: Merge and update CSS
            const cssMerger = new CSSMerger(inputPath, analysis);
            const cssResult = await cssMerger.merge();

            if (!this.options.dryRun) {
                await fs.writeFile(
                    path.join(outputPath, 'style.css'),
                    cssResult.content,
                    'utf-8'
                );
            }

            if (this.options.verbose) {
                console.log(chalk.green(`✓ CSS merged (${cssResult.changes.length} changes)`));
            }

            if (this.options.verbose) {
                console.log(chalk.blue(`\nUpdating config.xml...`));
            }

            // Step 5: Update config.xml
            const configUpdater = new ConfigUpdater(inputPath, styleName);
            const configResult = await configUpdater.update();

            if (!this.options.dryRun) {
                await fs.writeFile(
                    path.join(outputPath, 'config.xml'),
                    configResult.content,
                    'utf-8'
                );
            }

            if (this.options.verbose) {
                console.log(chalk.green(`✓ config.xml updated`));
            }

            if (this.options.verbose) {
                console.log(chalk.blue(`\nMigrating assets...`));
            }

            // Step 6: Migrate assets
            let assetResult = { migrations: [], summary: { total: 0, byType: {} } };
            if (!this.options.dryRun) {
                const assetMigrator = new AssetMigrator(inputPath, outputPath);
                assetResult = await assetMigrator.migrate();
            } else {
                // In dry run, just analyze
                const assetMigrator = new AssetMigrator(inputPath, outputPath);
                const files = await fs.readdir(inputPath);
                for (const file of files) {
                    const dest = assetMigrator.getDestination(file);
                    if (dest) {
                        assetResult.migrations.push({
                            filename: file,
                            to: `${dest}/${file}`,
                            type: dest
                        });
                    }
                }
                // Calculate summary
                for (const migration of assetResult.migrations) {
                    if (!assetResult.summary.byType[migration.type]) {
                        assetResult.summary.byType[migration.type] = 0;
                    }
                    assetResult.summary.byType[migration.type]++;
                }
                assetResult.summary.total = assetResult.migrations.length;
            }

            if (this.options.verbose) {
                console.log(chalk.green(`✓ Assets migrated (${assetResult.summary.total} files)`));
            }

            // Step 7: Validate the conversion
            let validation = {
                isValid: true,
                errors: [],
                warnings: [],
                info: []
            };

            if (!this.options.dryRun) {
                if (this.options.verbose) {
                    console.log(chalk.blue(`\nValidating conversion...`));
                }

                const validator = new StyleValidator(outputPath);
                validation = await validator.validate();

                if (this.options.verbose) {
                    const status = validation.isValid ? chalk.green('✓ Valid') : chalk.red('✗ Invalid');
                    console.log(`${status} (${validation.errors.length} errors, ${validation.warnings.length} warnings)`);
                }
            }

            // Step 8: Generate reports
            const results = {
                styleName,
                inputPath,
                outputPath,
                analysis,
                jsTransform: jsResult,
                cssChanges: {
                    changes: cssResult.changes,
                    summary: cssMerger.getSummary()
                },
                configChanges: {
                    changes: configResult.changes,
                    summary: configUpdater.getSummary()
                },
                assetMigration: assetResult,
                validation,
                dryRun: this.options.dryRun
            };

            // Console report
            reporter.generateConsoleReport(results);

            // Markdown report
            if (!this.options.dryRun) {
                const reportPath = await reporter.generateMarkdownReport(results, outputPath);
                if (this.options.verbose) {
                    console.log(chalk.blue(`Report saved: ${reportPath}`));
                }

                // Create ZIP file if requested
                if (this.options.createZip) {
                    if (this.options.verbose) {
                        console.log(chalk.blue(`\nCreating ZIP file...`));
                    }

                    const zipCreator = new ZipCreator(outputPath, styleName);
                    const zipResult = await zipCreator.createZip();

                    results.zipFile = zipResult;

                    if (this.options.verbose) {
                        console.log(chalk.green(`✓ ZIP created: ${zipResult.zipPath}`));
                        console.log(`  Size: ${(zipResult.size / 1024).toFixed(2)} KB`);
                        console.log(`  Files: ${zipResult.filesCount}`);
                    }
                }
            }

            return results;
        } catch (error) {
            console.error(chalk.red(`\n✗ Conversion failed: ${error.message}`));
            if (this.options.verbose) {
                console.error(error.stack);
            }
            throw error;
        }
    }

    /**
     * Convert multiple styles (batch mode)
     */
    async convertBatch(inputDir) {
        const styles = await fs.readdir(inputDir);
        const results = [];

        console.log(chalk.bold.cyan(`\nBatch conversion: ${styles.length} styles found\n`));

        for (const style of styles) {
            const stylePath = path.join(inputDir, style);
            const stats = await fs.stat(stylePath);

            if (stats.isDirectory()) {
                try {
                    console.log(chalk.bold(`\nConverting: ${style}`));
                    console.log(chalk.gray('-'.repeat(60)));

                    const result = await this.convert(stylePath);
                    results.push({ style, success: true, result });
                } catch (error) {
                    console.error(chalk.red(`Failed to convert ${style}: ${error.message}`));
                    results.push({ style, success: false, error: error.message });
                }
            }
        }

        // Summary
        console.log(chalk.bold.cyan('\n' + '='.repeat(60)));
        console.log(chalk.bold.cyan('Batch Conversion Summary'));
        console.log(chalk.bold.cyan('='.repeat(60)));
        console.log(`Total: ${results.length}`);
        console.log(chalk.green(`Success: ${results.filter(r => r.success).length}`));
        console.log(chalk.red(`Failed: ${results.filter(r => !r.success).length}`));

        if (results.some(r => !r.success)) {
            console.log(chalk.bold.red('\nFailed conversions:'));
            for (const result of results.filter(r => !r.success)) {
                console.log(chalk.red(`  - ${result.style}: ${result.error}`));
            }
        }

        return results;
    }
}
