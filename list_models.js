require('dotenv').config();
const fs = require('fs');

async function listAllModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    if(data.models) {
      const names = data.models.map(m => m.name).join(', ');
      fs.writeFileSync('models.txt', names, 'utf8');
    } else {
      fs.writeFileSync('models.txt', JSON.stringify(data), 'utf8');
    }
  } catch(e) {
    fs.writeFileSync('models.txt', e.message, 'utf8');
  }
}
listAllModels();
