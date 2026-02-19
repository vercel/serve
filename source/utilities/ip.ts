import dgram from 'dgram';

export const detectNetwork = (): Promise<string | undefined> => {
  return new Promise((resolve) => {
    const socket = dgram.createSocket('udp4');

    socket.connect(53, '8.8.8.8', () => {
      const address = socket.address();
      socket.close();
      resolve(typeof address === 'string' ? undefined : address.address);
    });

    socket.on('error', () => resolve(undefined));
  });
};
