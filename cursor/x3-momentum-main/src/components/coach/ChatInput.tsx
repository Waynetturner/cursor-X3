import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
}

export const ChatInput = ({ 
  inputMessage, 
  setInputMessage, 
  onSendMessage, 
  isLoading 
}: ChatInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    onSendMessage();
    // Keep focus on input after sending for better UX
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <div className="flex gap-2 sticky bottom-0 bg-white p-2 rounded-lg border">
      <Input
        ref={inputRef}
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Ask your coach anything about X3 training..."
        disabled={isLoading}
        className="flex-1"
      />
      <Button
        onClick={handleSend}
        disabled={!inputMessage.trim() || isLoading}
        className="bg-blue-500 hover:bg-blue-600"
      >
        Send
      </Button>
    </div>
  );
};
