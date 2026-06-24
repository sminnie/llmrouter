export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResult {
  content: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
}

export interface ProviderAdapter {
  readonly name: string;
  chat(model: string, messages: ChatMessage[]): Promise<ChatResult>;
}
