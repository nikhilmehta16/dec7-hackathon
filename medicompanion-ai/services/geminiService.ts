import { AGENT_API_URL, AGENT_APP_NAME, AGENT_USER_ID } from '../config';

export interface Attachment {
    mimeType: string;
    data: string; // Base64
}

export class GeminiService {
  private sessionId: string;
  private sessionCreated: boolean = false;

  constructor() {
    // Generate a simple session ID for the backend to track context
    // Using s_ prefix as per examples
    this.sessionId = 's_' + Math.random().toString(36).substring(7);
  }

  private async ensureSession() {
    if (this.sessionCreated) return;

    try {
        const url = `${AGENT_API_URL}/apps/${AGENT_APP_NAME}/users/${AGENT_USER_ID}/sessions/${this.sessionId}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}) // Optional initial state
        });
        
        // If 200 OK, session created.
        if (response.ok) {
            this.sessionCreated = true;
        } else {
             const errorText = await response.text();
             // If session already exists (unlikely with random ID) or other error
             console.warn("Session creation warning:", response.status, errorText);
             // We'll mark as created to avoid loop, and hope /run handles it or it was a non-fatal issue
             this.sessionCreated = true; 
        }
    } catch (e) {
        console.error("Failed to create session", e);
    }
  }

  public async sendMessage(message: string, attachment?: Attachment): Promise<string> {
    await this.ensureSession();

    try {
      const parts: any[] = [{ text: message }];
      
      if (attachment) {
          parts.push({
              inlineData: {
                  mimeType: attachment.mimeType,
                  data: attachment.data,
                  displayName: "attachment"
              }
          });
      }

      const payload = {
          appName: AGENT_APP_NAME,
          userId: AGENT_USER_ID,
          sessionId: this.sessionId,
          newMessage: {
              role: "user",
              parts: parts
          },
          streaming: false 
      };

      const response = await fetch(`${AGENT_API_URL}/run`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
      });

      if (!response.ok) {
          if (response.status === 429) {
              return "I'm receiving too many requests right now (Rate Limit Exceeded). Please try again in a minute.";
          }
          throw new Error(`Backend Error: ${response.statusText}`);
      }

      const events = await response.json();
      
      // Parse events to find the model response
      // The events array contains all interactions (tool calls, tool outputs, model text)
      // We want to extract the final text response from the model.
      
      let finalResponse = "";
      
      if (Array.isArray(events)) {
          // Iterate through events to collect model text responses
          for (const event of events) {
              if (event.content && event.content.role === 'model' && event.content.parts) {
                  for (const part of event.content.parts) {
                      if (part.text) {
                          finalResponse += part.text;
                      }
                  }
              }
          }
      }

      return finalResponse || "I processed your request but didn't have a text response.";

    } catch (error) {
      console.error("Agent API Error:", error);
      return "I'm having trouble connecting to the Agent. Please ensure the backend is running.";
    }
  }
}

export const geminiService = new GeminiService();
