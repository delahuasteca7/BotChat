const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

class WhatsAppService {
  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      }
    });

    this.qrCode = null;
    this.status = 'disconnected';

    this.client.on('qr', (qr) => {
      console.log('\n\n======================================================');
      console.log('🤖 ESCANEA ESTE CÓDIGO QR CON TU WHATSAPP BUSINESS 🤖');
      console.log('======================================================\n');
      qrcode.generate(qr, { small: true });
      
      const qrcodeLib = require('qrcode');
      qrcodeLib.toDataURL(qr, (err, url) => {
          if (!err) {
              this.qrCode = url;
              this.status = 'qr_ready';
          }
      });
    });

    this.client.on('ready', () => {
      console.log('✅ Cliente de WhatsApp listo y conectado!');
      this.status = 'connected';
      this.qrCode = null;
    });

    this.client.on('disconnected', (reason) => {
      console.log('❌ Cliente desconectado', reason);
      this.status = 'disconnected';
    });
  }

  start() {
    this.client.initialize();
  }

  async stop() {
    try {
        if(this.status !== 'disconnected') {
            await this.client.destroy();
            this.status = 'disconnected';
            this.qrCode = null;
            console.log('🛑 Cliente de WhatsApp detenido manualmente.');
        }
    } catch(err) {
        console.error('Error al detener cliente:', err);
    }
  }

  onMessage(callback) {
    this.client.on('message', async msg => {
      // Ignorar mensajes de estados
      if(msg.from === 'status@broadcast') return;
      await callback(msg, this.client);
    });
  }

  async sendMessage(to, text) {
    return this.client.sendMessage(to, text);
  }
}

module.exports = new WhatsAppService();
