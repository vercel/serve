import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { loadConfiguration } from '../source/utilities/config.js';

const withConfig = async (
  contents: object,
  run: (directory: string) => Promise<void>,
) => {
  const directory = await mkdtemp(join(tmpdir(), 'serve-config-'));
  try {
    await writeFile(join(directory, 'serve.json'), JSON.stringify(contents));
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
};

test('a serve.json with an editor $schema key still loads its real options', async () => {
  await withConfig(
    { $schema: 'https://json.schemastore.org/serve.json', cleanUrls: false },
    async (directory) => {
      const config = await loadConfiguration(directory, directory, {});
      expect(config.cleanUrls).toBe(false);
      expect((config as Record<string, unknown>).$schema).toBeUndefined();
    },
  );
});

test('a serve.json holding only a $schema key is accepted', async () => {
  await withConfig(
    { $schema: 'https://json.schemastore.org/serve.json' },
    async (directory) => {
      const config = await loadConfiguration(directory, directory, {});
      expect(config.etag).toBe(true);
    },
  );
});

test('an unknown real option is still rejected', async () => {
  await withConfig({ notAServeOption: true }, async (directory) => {
    await expect(loadConfiguration(directory, directory, {})).rejects.toThrow(
      'The configuration you provided is invalid',
    );
  });
});
