const Groq = require("groq-sdk");
const calendarService = require('./calendar.service');

class AIService {
  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    this.chats = new Map();
    
    // Aquí le enseñamos a la IA su "Súper Poder" de usar Herramientas
    this.tools = [
      {
        type: "function",
        function: {
          name: "agendar_cita_calendario",
          description: "Agenda un evento oficial en Google Calendar de la clinica. Úsala SOLO cuando el paciente ya acordó Nombre, Servicio, Día y Hora exacta. Asigna duracion de 1 hora.",
          parameters: {
            type: "object",
            properties: {
              fecha_hora: {
                type: "string",
                description: "Fecha y hora en formato ISO 8601 de inicio de la cita. (Ejemplo '2026-04-10T16:00:00-06:00'). Respeta el huso horario local de la clínica."
              },
              paciente: {
                type: "string",
                description: "Nombre del paciente o persona interesada."
              },
              motivo: {
                type: "string",
                description: "Breve descripción del servicio, ej: 'Terapia individual', o 'Taller jóvenes'."
              }
            },
            required: ["fecha_hora", "paciente", "motivo"]
          }
        }
      }
    ];
  }

  getSystemPrompt() {
    let basePrompt = "";
    try {
      const fs = require('fs');
      const path = require('path');
      const filepath = path.join(__dirname, '..', 'conocimiento.txt');
      basePrompt = fs.readFileSync(filepath, 'utf8');
    } catch(e) {
      basePrompt = "Eres un asistente amable.";
    }
    
    // Inyectamos la fecha actual de forma invisible para que la IA sepa cuando es "mañana" o "el martes"
    const dateContext = `\n\n[CONTEXTO DEL SISTEMA INVISIBLE PARA EL USUARIO]\nLa fecha y hora actual en tiempo real es: ${new Date().toLocaleString('es-MX')}. Usa esto como referencia para calcular fechas absolutas.\nUsa formato ISO para programar eventos en tu herramienta.`;
    
    return basePrompt + dateContext;
  }

  async getResponse(userId, text) {
    try {
      if (!this.chats.has(userId)) {
        this.chats.set(userId, [
          { role: 'system', content: this.getSystemPrompt() }
        ]);
      }
      
      const userHistory = this.chats.get(userId);
      userHistory.push({ role: 'user', content: text });

      if (userHistory.length > 20) {
        userHistory.splice(1, 2);
      }

      // PRIMERA LLAMADA: Le preguntamos a Llama 3
      let response = await this.groq.chat.completions.create({
        messages: userHistory,
        model: "llama-3.3-70b-versatile", 
        tools: this.tools,
        tool_choice: "auto", // Le permitimos usar herramientas si lo cree necesario
      });

      let responseMessage = response.choices[0]?.message;

      // DETECCIÓN: Si la IA mandó a llamar a nuestra Función de Calendario
      if (responseMessage.tool_calls) {
        // 1. Guardamos este intento de llamada al historial
        userHistory.push(responseMessage); 
        
        // 2. Por cada herramienta que quiso llamar...
        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.function.name === 'agendar_cita_calendario') {
            const args = JSON.parse(toolCall.function.arguments);
            console.log(`[BOT🤖] Disparando herramienta externa: Agendando Cita para ${args.paciente} el ${args.fecha_hora}`);
            
            try {
              // Calculamos 1 hora extra para el final del evento
              const inicio = new Date(args.fecha_hora);
              const fin = new Date(inicio.getTime() + (60 * 60 * 1000)); 
              
              const title = `${args.motivo} - ${args.paciente}`;
              const description = `Agenda BotChat IA\nPaciente: ${args.paciente}\nMotivo: ${args.motivo}`;
              
              // GUARDAMOS EN GOOGLE CALENDAR
              await calendarService.createAppointment(title, description, inicio.toISOString(), fin.toISOString());
              
              // Le respondemos a la IA confirmando que guardamos todo exitosamente
              userHistory.push({
                tool_call_id: toolCall.id,
                role: "tool",
                name: "agendar_cita_calendario",
                content: "CITA CREADA CON ÉXITO EN GOOGLE CALENDAR.",
              });
              
            } catch (err) {
              console.error("[ERROR CALENDARIO]", err.message);
              
              let aiReplyContent = "ERROR AL CREAR CITA. Informa muy sutilmente al paciente que hubo un problema técnico con tu sistema satelital y pídele volver a intentarlo más tarde.";
              
              // Si fue por empalme de horarios:
              if (err.message === "HORARIO_OCUPADO") {
                 aiReplyContent = "ERROR: ESE HORARIO YA ESTA OCUPADO EN EL CALENDARIO. Informa amablemente al paciente que ese horario acaba de ser ocupado, y ofrécele inmediatamente explorar otra hora u otro día diferente.";
              }

              userHistory.push({
                tool_call_id: toolCall.id,
                role: "tool",
                name: "agendar_cita_calendario",
                content: aiReplyContent,
              });
            }
          }
        }
        
        // SEGUNDA LLAMADA: La IA hace un análisis final teniendo en cuenta que ya vimos si fue Éxito o Error
        response = await this.groq.chat.completions.create({
           messages: userHistory,
           model: "llama-3.3-70b-versatile",
           tools: this.tools, // Pasamos de nuevo por si acaso
        });
        responseMessage = response.choices[0]?.message;
      }

      // Respuesta final mostrada al usuario en WhatsApp
      const reply = responseMessage?.content || "";
      userHistory.push({ role: 'assistant', content: reply });
      
      return reply;
      
    } catch (error) {
      console.error('Error con Groq AI:', error.message);
      return 'Lo siento, experimentamos alta demanda. Por favor intenta más tarde.';
    }
  }
}

module.exports = new AIService();
