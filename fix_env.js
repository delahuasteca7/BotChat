const fs = require('fs');
try {
  const jsonPath = 'c:\\Users\\Jdaniel\\Downloads\\intrepid-hour-491901-g1-26e656239fb9.json';
  const json = require(jsonPath);
  
  // Convertimos los \n reales de la llave en el literal \\n para que .env no se rompa
  const safeKey = json.private_key.replace(/\n/g, '\\n');
  
  let env = fs.readFileSync('.env', 'utf8');
  // Sustituimos la firma dañada por la oficial del archivo
  env = env.replace(/GOOGLE_PRIVATE_KEY=".*?"/s, `GOOGLE_PRIVATE_KEY="${safeKey}"`);
  
  fs.writeFileSync('.env', env);
  console.log("¡Arreglado el .env automáticamente!");
} catch(e) {
  console.error("Error al parchar:", e.message);
}
