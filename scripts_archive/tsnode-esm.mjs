// Register ts-node for ESM
import { register } from 'ts-node';

register({
  esm: true,
  experimentalSpecifierResolution: 'node'
});

// Import and run the actual script
import('./verifyData.ts');
