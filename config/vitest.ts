// config/vitest.ts
// The vitest configuration file.

import { env } from 'node:process';
import { defineConfig } from 'vitest/config';

// Make sure the output of the CLI is in color, so that it matches the
// snapshots.
env.FORCE_COLOR = 2;

export default defineConfig({
  test: {
    // Collect coverage using C8.
    coverage: { enabled: true },
  },
});
