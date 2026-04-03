const ExcelJS = require('exceljs');
const calendarService = require('./calendar.service');
const path = require('path');

class ReportService {
  constructor() {}

  async generateReport() {
    try {
      const appointments = await calendarService.getUpcomingAppointments();
      
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Reporte de Citas');

      sheet.columns = [
        { header: 'Fecha y Hora', key: 'date', width: 25 },
        { header: 'Paciente / Evento', key: 'summary', width: 35 },
        { header: 'Estado', key: 'status', width: 15 },
      ];

      let count = 0;
      appointments.forEach(event => {
        let dateStr = 'Fecha desconocida';
        if (event.start.dateTime) {
          dateStr = new Date(event.start.dateTime).toLocaleString('es-MX');
        } else if (event.start.date) {
          dateStr = new Date(event.start.date).toLocaleDateString('es-MX');
        }

        sheet.addRow({
          date: dateStr,
          summary: event.summary || 'Bloqueo/Sin Nombre',
          status: event.status
        });
        count++;
      });

      const tempFileName = `reporte-toma-decisiones-${Date.now()}.xlsx`;
      const tempPath = path.join(__dirname, '..', tempFileName);
      
      await workbook.xlsx.writeFile(tempPath);
      
      const textSummary = `📊 *Reporte para Toma de Decisiones*\n\nEn los próximos 7 días hay *${count} citas* programadas en el calendario. Puedes ver los detalles en el archivo Excel adjunto.`;

      return {
        excelPath: tempPath,
        textSummary: textSummary
      };

    } catch (error) {
      console.error("Error al generar el reporte:", error.message);
      return { 
        textSummary: "❌ Ha ocurrido un error al intentar generar el reporte de citas. Por favor revisa los logs y tu conexión a Google Calendar.", 
        excelPath: null 
      };
    }
  }
}

module.exports = new ReportService();
