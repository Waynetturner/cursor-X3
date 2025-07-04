
import { useState, useEffect } from 'react';
import { Message } from '@/types/coach';
import { loadConversationHistory } from '@/services/coachService';

export const useCoachMessages = (userId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (userId) {
      initializeConversation();
    }
  }, [userId]);

  const initializeConversation = async () => {
    if (!userId) return;

    const formattedMessages = await loadConversationHistory(userId);
    setMessages(formattedMessages);

    // If no previous conversation, send welcome message
    if (formattedMessages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'coach',
        content: "Hey there! 💪 I'm your X3 fitness coach. I'm here to help you maximize your variable resistance training, track your progress, and answer any questions about your workout routine. How can I help you today?",
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const createUserMessage = (content: string): Message => ({
    id: Date.now().toString(),
    role: 'user',
    content,
    timestamp: new Date().toISOString()
  });

  const createCoachMessage = (content: string): Message => ({
    id: (Date.now() + 1).toString(),
    role: 'coach',
    content,
    timestamp: new Date().toISOString()
  });

  const createErrorMessage = (): Message => ({
    id: (Date.now() + 1).toString(),
    role: 'coach',
    content: "Sorry, I'm having trouble connecting right now. Please try again in a moment. 🤖💭",
    timestamp: new Date().toISOString()
  });

  return {
    messages,
    addMessage,
    createUserMessage,
    createCoachMessage,
    createErrorMessage
  };
};
