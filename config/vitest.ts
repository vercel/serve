// config/vitest.ts
// The vitest configuration file.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Collect coverage using C8.
    coverage: { enabled: true },
  },
});
