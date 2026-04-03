require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');

const raw = process.env.GOOGLE_PRIVATE_KEY || "";
const replaced = raw.replace(/\\n/g, '\n');

let error = "none";
try {
  crypto.createPrivateKey(replaced);
} catch(e) {
  error = e.message;
}

const out = {
  rawLength: raw.length,
  rawStart: raw.substring(0, 50),
  rawHasN: raw.includes('\n'),
  rawHasSlashN: raw.includes('\\n'),
  replacedLength: replaced.length,
  error: error
};

fs.writeFileSync('out.json', JSON.stringify(out, null, 2));
