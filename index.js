require('dotenv').config();
const fs = require('fs');
const express = require('express');

// Servicios
const whatsappService = require('./services/whatsapp.service');
const aiService = require('./services/ai.service');
const reportService = require('./services/report.service');
const { MessageMedia } = require('whatsapp-web.js');

console.log("Iniciando BotChat: Asistente Virtual para Clínica...");

// Evento: Recepción de mensajes en WhatsApp
whatsappService.onMessage(async (msg, client) => {
  const userId = msg.from;
  const messageText = msg.body.trim();

  // COMANDO DE ADMINISTRADOR: Para la toma de decisiones
  if (messageText.toLowerCase() === '!reporte') {
    console.log(`Comando !reporte ejecutado por ${userId}`);
    await client.sendMessage(userId, "⏳ Generando el reporte de citas para la toma de decisiones, un momento por favor...");
    
    const report = await reportService.generateReport();
    
    // Enviar el texto resumen
    await client.sendMessage(userId, report.textSummary);
    
    // Enviar el archivo Excel si se generó correctamente
    if (report.excelPath && fs.existsSync(report.excelPath)) {
      const media = MessageMedia.fromFilePath(report.excelPath);
      await client.sendMessage(userId, media, { caption: 'Reporte de Citas en Excel' });
      // Limpiar archivo temporal para no ocupar espacio
      fs.unlinkSync(report.excelPath);
    }
    return;
  }

  // Interacción normal con el paciente manejada por la Inteligencia Artificial (Claude)
  console.log(`Mensaje de ${userId}: ${messageText}`);
  const reply = await aiService.getResponse(userId, messageText);
  
  await client.sendMessage(userId, reply);
});

// La conexión a WhatsApp se inicializará desde la web: /api/start-whatsapp

// Opcional: Servidor Express para Health Check o posible integración futura de Webhooks
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.post('/api/start-whatsapp', (req, res) => {
    // Si no ha iniciado, lo inicia. Si ya estaba iniciado, reseteará el cliente.
    // Para simplificar, asumimos que se llamará solo para inicializar.
    if(whatsappService.status === 'disconnected') {
      whatsappService.start();
    }
    res.json({ success: true, message: 'Inicialización solicitada' });
});

app.post('/api/stop-whatsapp', async (req, res) => {
    if(whatsappService.status !== 'disconnected') {
        await whatsappService.stop();
    }
    res.json({ success: true, message: 'Servidor de WhatsApp detenido' });
});

app.get('/api/whatsapp-status', (req, res) => {
    res.json({
        status: whatsappService.status,
        qrCode: whatsappService.qrCode
    });
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor activo. Visita http://localhost:${PORT} para vincular WhatsApp`);
});
