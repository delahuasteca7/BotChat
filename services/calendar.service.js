const { google } = require('googleapis');

class CalendarService {
  constructor() {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.warn("⚠️ Credenciales de Google Calendar no encontradas en .env");
      return;
    }

    // Tratamos los saltos de línea de la llave privada
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

    this.jwtClient = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });

    this.calendar = google.calendar({ version: 'v3', auth: this.jwtClient });
    this.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  }

  async createAppointment(summary, description, startTime, endTime) {
    if (!this.calendar) throw new Error("Google Calendar no está configurado");

    // Verificar si hay eventos que se superpongan en ese rango de tiempo
    const overlaps = await this.calendar.events.list({
      calendarId: this.calendarId,
      timeMin: startTime,
      timeMax: endTime,
      singleEvents: true,
    });

    if (overlaps.data.items && overlaps.data.items.length > 0) {
      throw new Error("HORARIO_OCUPADO");
    }


    const event = {
      summary: summary,
      description: description,
      start: { dateTime: startTime },
      end: { dateTime: endTime },
    };

    const res = await this.calendar.events.insert({
      calendarId: this.calendarId,
      requestBody: event,
    });

    return res.data;
  }

  async getUpcomingAppointments() {
    if (!this.calendar) {
      console.warn("Calendar service no configurado, devolviendo mock de citas.");
      return [];
    }

    const now = new Date().toISOString();
    const future = new Date();
    future.setDate(future.getDate() + 7); // Reporte de los próximos 7 días

    const res = await this.calendar.events.list({
      calendarId: this.calendarId,
      timeMin: now,
      timeMax: future.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
    return res.data.items;
  }
}

module.exports = new CalendarService();
