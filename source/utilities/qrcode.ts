import qrcode from 'qrcode-terminal';

/**
 * Generates a string representation of a QR code for the terminal.
 * @param url The URL to encode in the QR code.
 * @returns A promise that resolves to the QR code string.
 */
export const getQRCode = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    qrcode.generate(url, { small: true }, (code) => {
      resolve(code);
    });
  });
};