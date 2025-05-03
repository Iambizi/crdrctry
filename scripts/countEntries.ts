import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { FashionGenealogyData, Designer, Tenure } from '../src/types/fashion';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const main = () => {
  try {
    // Read the database file
    const dbPath = join(__dirname, '../src/data/fashionGenealogy.json');
    const data = JSON.parse(readFileSync(dbPath, 'utf-8')) as FashionGenealogyData;

    // Count entries
    const counts = {
      brands: data.brands.length,
      designers: data.designers.length,
      tenures: data.tenures.length,
      relationships: data.relationships.length,
    };

    // Calculate active designers
    const activeDesigners = data.designers.filter((d: Designer) => d.isActive).length;

    // Calculate current tenures
    const currentTenures = data.tenures.filter((t: Tenure) => t.isCurrentRole).length;

    // Print results
    console.log(chalk.bold('\nFashion Directory Database Statistics:'));
    console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan('Brands:'), chalk.yellow(counts.brands));
    console.log(chalk.cyan('Designers:'), chalk.yellow(counts.designers), 
      chalk.gray(`(${activeDesigners} active)`));
    console.log(chalk.cyan('Tenures:'), chalk.yellow(counts.tenures),
      chalk.gray(`(${currentTenures} current)`));
    console.log(chalk.cyan('Relationships:'), chalk.yellow(counts.relationships));
    console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error occurred');
    process.exit(1);
  }
};

main();
