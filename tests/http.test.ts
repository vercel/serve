import { afterEach, describe, expect, test, vi } from 'vitest';

const { networkInterfaces } = vi.hoisted(() => ({
  networkInterfaces: vi.fn(),
}));
vi.mock('node:os', () => ({ networkInterfaces }));

afterEach(() => {
  vi.resetModules();
  networkInterfaces.mockReset();
});

describe('utilities/http', () => {
  test('an unavailable network interface list does not prevent serving locally', async () => {
    networkInterfaces.mockImplementation(() => {
      throw new Error(
        'uv_interface_addresses returned Unknown system error 13',
      );
    });
    const { getNetworkAddress } = await import('../source/utilities/http.js');
    expect(networkInterfaces).not.toHaveBeenCalled();
    expect(getNetworkAddress()).toBeUndefined();
  });

  test('a non-internal IPv4 address is still advertised', async () => {
    networkInterfaces.mockReturnValue({
      lo: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
      eth0: [{ address: '192.168.1.2', family: 'IPv4', internal: false }],
    });
    const { getNetworkAddress } = await import('../source/utilities/http.js');
    expect(getNetworkAddress()).toBe('192.168.1.2');
  });
});
