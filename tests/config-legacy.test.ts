import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { loadConfiguration } from '../source/utilities/config.js';

test('a modern now.json without a legacy static section does not break static serving', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'serve-now-'));
  try {
    await writeFile(
      join(directory, 'now.json'),
      JSON.stringify({ version: 2 }),
    );
    const config = await loadConfiguration(directory, directory, {});
    expect(config.public).toBe('');
    expect(config.etag).toBe(true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
test('a legacy now.static section is still loaded', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'serve-now-'));
  try {
    await writeFile(
      join(directory, 'now.json'),
      JSON.stringify({ now: { static: { cleanUrls: false } } }),
    );
    const config = await loadConfiguration(directory, directory, {});
    expect(config.cleanUrls).toBe(false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('a modern now.json falls through to package.json static settings', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'serve-now-'));
  try {
    await writeFile(
      join(directory, 'now.json'),
      JSON.stringify({ version: 2 }),
    );
    await writeFile(
      join(directory, 'package.json'),
      JSON.stringify({ static: { cleanUrls: false } }),
    );
    const config = await loadConfiguration(directory, directory, {});
    expect(config.cleanUrls).toBe(false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
