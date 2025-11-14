import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

/**
 * Generates conversion reports
 */
export class ConversionReporter {
    constructor(options = {}) {
        this.options = options;
        this.startTime = Date.now();
    }

    /**
     * Generate console report
     */
    generateConsoleReport(results) {
        const { analysis, validation, dryRun } = results;

        console.log('\n' + chalk.bold.cyan('='.repeat(60)));
        console.log(chalk.bold.cyan('  eXeLearning Style Conversion Report'));
        console.log(chalk.bold.cyan('='.repeat(60)));

        // Style information
        console.log('\n' + chalk.bold('Style Information:'));
        console.log(`  Name: ${chalk.green(analysis.styleName)}`);
        console.log(`  Complexity: ${this.colorizeComplexity(analysis.complexity)}`);
        console.log(`  Template Used: ${chalk.cyan(analysis.template)}`);
        console.log(`  Lines of Code: ${analysis.customCode.linesOfCode}`);

        // Custom features
        if (analysis.customCode.customFunctions.length > 0) {
            console.log('\n' + chalk.bold('Custom Features Detected:'));
            for (const feature of analysis.customCode.customFunctions) {
                console.log(`  ${chalk.yellow('✓')} ${feature}`);
            }
        }

        // JavaScript transformation
        if (results.jsTransform) {
            console.log('\n' + chalk.bold('JavaScript Transformation:'));
            if (results.jsTransform.customCodeSections.length > 0) {
                console.log(`  ${chalk.green('✓')} Preserved ${results.jsTransform.customCodeSections.length} custom code sections:`);
                for (const section of results.jsTransform.customCodeSections) {
                    console.log(`    - ${section}`);
                }
            } else {
                console.log(`  ${chalk.blue('→')} Used standard v3.0 template (no custom code)`);
            }
        }

        // CSS changes
        if (results.cssChanges) {
            const summary = results.cssChanges.summary || {};
            console.log('\n' + chalk.bold('CSS Changes:'));
            console.log(`  Total Updates: ${chalk.cyan(summary.totalChanges || 0)}`);
            if (summary.byType) {
                for (const [type, count] of Object.entries(summary.byType)) {
                    console.log(`    - ${type}: ${count}`);
                }
            }
        }

        // Config.xml changes
        if (results.configChanges) {
            const summary = results.configChanges.summary || {};
            console.log('\n' + chalk.bold('Config.xml Updates:'));
            console.log(`  Fields Added: ${chalk.green(summary.fieldsAdded || 0)}`);
            console.log(`  Fields Updated: ${chalk.yellow(summary.fieldsUpdated || 0)}`);
            console.log(`  Fields Removed: ${chalk.red(summary.fieldsRemoved || 0)}`);
        }

        // Asset migration
        if (results.assetMigration) {
            const summary = results.assetMigration.summary || {};
            console.log('\n' + chalk.bold('Asset Migration:'));
            console.log(`  Total Files: ${chalk.cyan(summary.total || 0)}`);
            if (summary.byType) {
                for (const [type, count] of Object.entries(summary.byType)) {
                    console.log(`    - ${type}/: ${count} files`);
                }
            }
        }

        // Validation results
        if (validation) {
            console.log('\n' + chalk.bold('Validation Results:'));
            const status = validation.isValid ? chalk.green('✓ PASSED') : chalk.red('✗ FAILED');
            console.log(`  Status: ${status}`);
            console.log(`  Errors: ${validation.errors.length > 0 ? chalk.red(validation.errors.length) : chalk.green('0')}`);
            console.log(`  Warnings: ${validation.warnings.length > 0 ? chalk.yellow(validation.warnings.length) : chalk.green('0')}`);

            if (validation.errors.length > 0) {
                console.log('\n' + chalk.bold.red('Errors:'));
                for (const error of validation.errors) {
                    console.log(`  ${chalk.red('✗')} ${error.message}`);
                }
            }

            if (validation.warnings.length > 0) {
                console.log('\n' + chalk.bold.yellow('Warnings:'));
                for (const warning of validation.warnings) {
                    console.log(`  ${chalk.yellow('⚠')} ${warning.message}`);
                }
            }
        }

        // Dry run notice
        if (dryRun) {
            console.log('\n' + chalk.bold.yellow('⚠ DRY RUN MODE - No files were written'));
        } else {
            console.log('\n' + chalk.bold.green('✓ Conversion completed successfully!'));
            if (results.outputPath) {
                console.log(`  Output: ${chalk.cyan(results.outputPath)}`);
            }
            if (results.zipFile) {
                console.log(`  ZIP: ${chalk.cyan(results.zipFile.zipPath)}`);
                console.log(`  Ready to import into eXeLearning 3.0!`);
            }
        }

        // Execution time
        const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
        console.log(`\n  Time: ${chalk.gray(duration + 's')}`);

        console.log(chalk.bold.cyan('='.repeat(60)) + '\n');
    }

    /**
     * Generate markdown report file
     */
    async generateMarkdownReport(results, outputPath) {
        const { analysis, validation } = results;

        let md = '# eXeLearning Style Conversion Report\n\n';
        md += `**Date:** ${new Date().toISOString()}\n\n`;
        md += `**Style:** ${analysis.styleName}\n\n`;

        md += '---\n\n';

        // Summary
        md += '## Summary\n\n';
        md += `- **Complexity Level:** ${analysis.complexity}\n`;
        md += `- **Template Used:** ${analysis.template}\n`;
        md += `- **Original JS Lines:** ${analysis.customCode.linesOfCode}\n`;
        md += `- **Validation:** ${validation.isValid ? '✓ PASSED' : '✗ FAILED'}\n\n`;

        // Custom features
        if (analysis.customCode.customFunctions.length > 0) {
            md += '## Custom Features Preserved\n\n';
            for (const feature of analysis.customCode.customFunctions) {
                md += `- ${feature}\n`;
            }
            md += '\n';
        }

        // JavaScript transformation
        if (results.jsTransform && results.jsTransform.customCodeSections.length > 0) {
            md += '## JavaScript Transformation\n\n';
            md += 'The following custom code sections were preserved:\n\n';
            for (const section of results.jsTransform.customCodeSections) {
                md += `- ${section}\n`;
            }
            md += '\n';
        }

        // CSS changes
        if (results.cssChanges && results.cssChanges.changes) {
            md += '## CSS Changes\n\n';
            md += `Total changes: ${results.cssChanges.changes.length}\n\n`;
            if (results.cssChanges.changes.length > 0) {
                md += '| Type | Old | New | Count |\n';
                md += '|------|-----|-----|-------|\n';
                for (const change of results.cssChanges.changes.slice(0, 20)) {
                    md += `| ${change.type} | \`${change.old || '-'}\` | \`${change.new || '-'}\` | ${change.count || 1} |\n`;
                }
                if (results.cssChanges.changes.length > 20) {
                    md += `\n*... and ${results.cssChanges.changes.length - 20} more changes*\n`;
                }
                md += '\n';
            }
        }

        // Config.xml changes
        if (results.configChanges && results.configChanges.changes) {
            md += '## Config.xml Updates\n\n';
            for (const change of results.configChanges.changes) {
                md += `- **${change.type}**: ${change.field}`;
                if (change.oldValue && change.newValue) {
                    md += ` (${change.oldValue} → ${change.newValue})`;
                } else if (change.value) {
                    md += ` = ${change.value}`;
                }
                md += `\n  - ${change.description}\n`;
            }
            md += '\n';
        }

        // Asset migration
        if (results.assetMigration && results.assetMigration.migrations) {
            md += '## Asset Migration\n\n';
            md += `Total assets migrated: ${results.assetMigration.migrations.length}\n\n`;
            if (results.assetMigration.summary.byType) {
                for (const [type, count] of Object.entries(results.assetMigration.summary.byType)) {
                    md += `- **${type}**: ${count} files\n`;
                }
                md += '\n';
            }
        }

        // Validation
        md += '## Validation Results\n\n';
        md += `**Status:** ${validation.isValid ? '✓ PASSED' : '✗ FAILED'}\n\n`;
        md += `- Errors: ${validation.errors.length}\n`;
        md += `- Warnings: ${validation.warnings.length}\n\n`;

        if (validation.errors.length > 0) {
            md += '### Errors\n\n';
            for (const error of validation.errors) {
                md += `- ❌ **${error.type}**: ${error.message}\n`;
            }
            md += '\n';
        }

        if (validation.warnings.length > 0) {
            md += '### Warnings\n\n';
            for (const warning of validation.warnings) {
                md += `- ⚠️ **${warning.type}**: ${warning.message}\n`;
            }
            md += '\n';
        }

        // Manual review recommendations
        md += '## Recommendations\n\n';
        md += '### Manual Review Required\n\n';
        md += '1. **CSS Styling**: Review the merged CSS to ensure all styles are correct\n';
        md += '2. **Asset References**: Verify all asset paths are correctly updated\n';
        md += '3. **Custom Features**: Test all preserved custom functionality\n';
        md += '4. **Browser Testing**: Test the converted style in different browsers\n\n';

        // Save the report
        const reportPath = path.join(outputPath, 'conversion-report.md');
        await fs.writeFile(reportPath, md, 'utf-8');

        return reportPath;
    }

    /**
     * Colorize complexity level
     */
    colorizeComplexity(complexity) {
        switch (complexity) {
            case 'simple':
                return chalk.green(complexity);
            case 'moderate':
                return chalk.yellow(complexity);
            case 'complex':
                return chalk.red(complexity);
            default:
                return complexity;
        }
    }
}
