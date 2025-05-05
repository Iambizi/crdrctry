import { readFileSync } from 'fs';
import { join } from 'path';
import { FashionData } from '../src/types/fashion';
import chalk from 'chalk';

const __filename = join(import.meta.url);
const __dirname = dirname(__filename);

const main = () => {
  try {
    // Read the database file
    const dataPath = join(__dirname, '..', 'src', 'data', 'fashionGenealogy.json');
    const data = JSON.parse(readFileSync(dataPath, 'utf-8')) as FashionData;

    // Count brands
    const brands = new Set(data.brands.map(b => b.name));

    // Count designers
    const designers = new Set(data.designers.map(d => d.name));
    const activeDesigners = data.designers.filter(d => d.isActive).length;

    // Count tenures
    const currentTenures = data.tenures.filter(t => t.isCurrentRole).length;

    // Count relationships

    // Print results
    console.log(chalk.bold('\nSource Data Statistics:'));
    console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan('Brands:'), chalk.yellow(brands.size));
    console.log(chalk.cyan('Designers:'), chalk.yellow(designers.size), 
      chalk.gray(`(${activeDesigners} active)`));
    console.log(chalk.cyan('Tenures:'), chalk.yellow(data.tenures.length),
      chalk.gray(`(${currentTenures} current)`));
    console.log(chalk.cyan('Relationships:'), chalk.yellow(data.relationships.length));
    console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error occurred');
    process.exit(1);
  }
};

main();
