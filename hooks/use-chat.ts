import { useState, useCallback } from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

interface UseChatProps {
  apiUrl: string;
}

export function useChat({ apiUrl }: UseChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    try {
      setIsLoading(true);
      
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        role: 'user'
      };
      setMessages(prev => [...prev, userMessage]);

      // Make API request
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content }),
      });

      const data = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant'
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  return {
    messages,
    isLoading,
    sendMessage
  };
}