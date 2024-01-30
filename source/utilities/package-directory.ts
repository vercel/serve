import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SERVE_PACKAGE_DIR = resolve(
  // import.meta.url is `build/main.js` after bundle
  fileURLToPath(import.meta.url),
  '../',
);
