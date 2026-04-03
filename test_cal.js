require('dotenv').config();

console.log("GOOGLE_PRIVATE_KEY exists?", !!process.env.GOOGLE_PRIVATE_KEY);
console.log("Length:", process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.length : 0);
console.log("First 30 chars:", process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.substring(0,30) : "");

const privateKey = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : null;
console.log("privateKey parsed exists?", !!privateKey);
console.log("privateKey parsed auth:", privateKey ? privateKey.substring(0,30) : "");

const { google } = require('googleapis');
try {
  const jwt = new google.auth.JWT(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, null, privateKey, ['https://www.googleapis.com/auth/calendar']);
  console.log("JWT Instance created.");
  jwt.authorize().then(() => console.log("Auth success")).catch(e => console.log("Auth failed:", e.message));
} catch(e) {
  console.log("JWT Error:", e.message);
}
