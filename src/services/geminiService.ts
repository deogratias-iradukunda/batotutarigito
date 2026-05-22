import { Message, Role } from "../types";

export async function sendMessage(history: Message[], message: string) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history, message })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

export class GeminiError extends Error {
  constructor(public message: string, public type: 'AUTH' | 'RATE_LIMIT' | 'SAFETY' | 'NETWORK' | 'UNKNOWN') {
    super(message);
    this.name = 'GeminiError';
  }
}

export async function* sendMessageStream(history: Message[], message: string) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history, message })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Response body is null");

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  } catch (error: any) {
    console.error("Error streaming message:", error);
    
    let type: 'AUTH' | 'RATE_LIMIT' | 'SAFETY' | 'NETWORK' | 'UNKNOWN' = 'UNKNOWN';
    let errorMessage = "An unexpected error occurred. Please try again.";

    if (error.message?.includes('API key')) {
      type = 'AUTH';
      errorMessage = "Invalid API key. Please check your configuration.";
    } else if (error.message?.includes('429') || error.message?.includes('quota')) {
      type = 'RATE_LIMIT';
      errorMessage = "Rate limit exceeded. Please wait a moment before trying again.";
    } else if (error.message?.includes('safety')) {
      type = 'SAFETY';
      errorMessage = "The response was blocked due to safety filters. Please try a different prompt.";
    } else if (error.name === 'TypeError' || error.message?.includes('fetch')) {
      type = 'NETWORK';
      errorMessage = "Network error. Please check your internet connection.";
    }

    throw new GeminiError(errorMessage, type);
  }
}
