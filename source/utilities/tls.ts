// source/utilities/tls.ts
// Generate a self-signed certificate for local HTTPS.

import { generateKeyPairSync, createSign, randomBytes } from 'node:crypto';

/**
 * Generates a self-signed TLS certificate for localhost.
 *
 * Uses Node's built-in crypto module — no external dependencies.
 * The certificate is valid for localhost, 127.0.0.1, and ::1.
 *
 * @returns An object with PEM-encoded `key` and `cert` strings.
 */
export const generateCertificate = (): { key: string; cert: string } => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
    });

    // Export private key as PEM.
    const keyPem = privateKey
        .export({ type: 'pkcs8', format: 'pem' })
        .toString();

    // Build a self-signed X.509 v3 certificate using DER encoding.
    const serialNumber = randomBytes(16);
    // Ensure the serial number is positive (set high bit to 0).
    serialNumber[0] &= 0x7f;

    const now = new Date();
    const notBefore = now;
    const notAfter = new Date(now);
    notAfter.setFullYear(notAfter.getFullYear() + 1);

    // Encode the certificate TBS (To-Be-Signed) structure.
    const issuerAndSubject = derSequence([
        // CN=localhost
        derSet([
            derSequence([
                derOid([2, 5, 4, 3]), // id-at-commonName
                derUtf8String('localhost'),
            ]),
        ]),
    ]);

    const publicKeyDer = publicKey.export({ type: 'spki', format: 'der' });

    // Extensions: Subject Alternative Names (DNS:localhost, IP:127.0.0.1, IP:::1)
    const sanExtension = derSequence([
        derOid([2, 5, 29, 17]), // id-ce-subjectAltName
        derOctetString(
            derSequence([
                // DNS:localhost
                derContextTag(2, Buffer.from('localhost')),
                // IP:127.0.0.1
                derContextTag(7, Buffer.from([127, 0, 0, 1])),
                // IP:::1
                derContextTag(
                    7,
                    Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]),
                ),
            ]),
        ),
    ]);

    const extensions = derContextConstructed(3, derSequence([sanExtension]));

    const tbs = derSequence([
        // Version: v3
        derContextConstructed(0, derInteger(Buffer.from([2]))),
        // Serial number
        derInteger(serialNumber),
        // Signature algorithm: SHA-256 with RSA
        derSequence([derOid([1, 2, 840, 113549, 1, 1, 11]), derNull()]),
        // Issuer
        issuerAndSubject,
        // Validity
        derSequence([derUtcTime(notBefore), derUtcTime(notAfter)]),
        // Subject
        issuerAndSubject,
        // Subject Public Key Info
        Buffer.from(publicKeyDer),
        // Extensions
        extensions,
    ]);

    // Sign the TBS.
    const signer = createSign('SHA256');
    signer.update(tbs);
    const signature = signer.sign(privateKey);

    // Assemble the full certificate.
    const cert = derSequence([
        tbs,
        // Signature algorithm
        derSequence([derOid([1, 2, 840, 113549, 1, 1, 11]), derNull()]),
        // Signature value (bit string)
        derBitString(signature),
    ]);

    const certPem = `-----BEGIN CERTIFICATE-----\n${cert.toString('base64').match(/.{1,64}/g)!.join('\n')}\n-----END CERTIFICATE-----\n`;

    return { key: keyPem, cert: certPem };
};

// --- DER encoding helpers ---

function derLength(length: number): Buffer {
    if (length < 0x80) return Buffer.from([length]);
    if (length < 0x100) return Buffer.from([0x81, length]);
    return Buffer.from([0x82, (length >> 8) & 0xff, length & 0xff]);
}

function derWrap(tag: number, content: Buffer): Buffer {
    return Buffer.concat([Buffer.from([tag]), derLength(content.length), content]);
}

function derSequence(items: Buffer[]): Buffer {
    return derWrap(0x30, Buffer.concat(items));
}

function derSet(items: Buffer[]): Buffer {
    return derWrap(0x31, Buffer.concat(items));
}

function derInteger(value: Buffer): Buffer {
    // Ensure positive by prepending 0x00 if high bit is set.
    const needsPad = value[0]! >= 0x80;
    const content = needsPad
        ? Buffer.concat([Buffer.from([0x00]), value])
        : value;
    return derWrap(0x02, content);
}

function derBitString(content: Buffer): Buffer {
    // Bit string: first byte is the number of unused bits (0).
    return derWrap(0x03, Buffer.concat([Buffer.from([0x00]), content]));
}

function derOctetString(content: Buffer): Buffer {
    return derWrap(0x04, content);
}

function derNull(): Buffer {
    return Buffer.from([0x05, 0x00]);
}

function derOid(components: number[]): Buffer {
    const bytes: number[] = [];
    // First two components are encoded as 40*c0 + c1.
    bytes.push(40 * components[0]! + components[1]!);

    for (let i = 2; i < components.length; i++) {
        let value = components[i]!;
        if (value < 128) {
            bytes.push(value);
        } else {
            const encoded: number[] = [];
            encoded.push(value & 0x7f);
            value >>= 7;
            while (value > 0) {
                encoded.push((value & 0x7f) | 0x80);
                value >>= 7;
            }
            bytes.push(...encoded.reverse());
        }
    }

    return derWrap(0x06, Buffer.from(bytes));
}

function derUtf8String(str: string): Buffer {
    return derWrap(0x0c, Buffer.from(str, 'utf8'));
}

function derUtcTime(date: Date): Buffer {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const str =
        pad(date.getUTCFullYear() % 100) +
        pad(date.getUTCMonth() + 1) +
        pad(date.getUTCDate()) +
        pad(date.getUTCHours()) +
        pad(date.getUTCMinutes()) +
        pad(date.getUTCSeconds()) +
        'Z';
    return derWrap(0x17, Buffer.from(str, 'ascii'));
}

function derContextTag(tag: number, content: Buffer): Buffer {
    return derWrap(0x80 | tag, content);
}

function derContextConstructed(tag: number, content: Buffer): Buffer {
    return derWrap(0xa0 | tag, content);
}
