require('dotenv').config();

const raw = process.env.GOOGLE_PRIVATE_KEY;
const b64 = raw.split('-----')[2].replace(/\n/g, '').replace(/\\n/g, '');

const buf = Buffer.from(b64, 'base64');
console.log("Base64 string length:", b64.length);
console.log("Is divisible by 4?", b64.length % 4);

// Trying to parse standard RSA ASN.1 headers (0x30 0x82 ...)
console.log("First bytes:", buf.slice(0, 10).toString('hex'));
console.log("Last bytes:", buf.slice(-10).toString('hex'));
