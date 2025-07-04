
import React from 'react';
import { KnowledgeSource } from './KnowledgeSource';

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'coach';
    content: string;
    timestamp: string;
    metadata?: any;
    sourceType?: string;
    similarQueriesUsed?: number;
  };
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const formatTimestamp = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    
    // Check if the message is from today
    const isToday = messageDate.toDateString() === today.toDateString();
    
    if (isToday) {
      // Just show time for today's messages
      return messageDate.toLocaleTimeString();
    } else {
      // Show date and time for older messages
      return messageDate.toLocaleDateString() + ' ' + messageDate.toLocaleTimeString();
    }
  };

  // Function to parse markdown-like formatting for coach messages
  const parseMarkdownFormatting = (content: string) => {
    if (message.role === 'user') return content;

    // Split content into sections based on headings and formatting
    const sections = content.split(/(?=###\s)/g).filter(section => section.trim());
    
    return sections.map((section, sectionIndex) => {
      // Check if this section starts with a heading
      const headingMatch = section.match(/^###\s(.+?)(?:\n|$)/);
      
      if (headingMatch) {
        const heading = headingMatch[1];
        const restOfContent = section.replace(headingMatch[0], '');
        
        return (
          <div key={sectionIndex} className="mb-4">
            <h3 className="font-bold text-lg text-gray-900 mb-2">{heading}</h3>
            {restOfContent && (
              <div className="space-y-2">
                {parseContentWithBold(restOfContent)}
              </div>
            )}
          </div>
        );
      } else {
        // Regular content without heading
        return (
          <div key={sectionIndex} className="mb-3">
            {parseContentWithBold(section)}
          </div>
        );
      }
    });
  };

  // Function to parse bold text formatting
  const parseContentWithBold = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    
    return lines.map((line, lineIndex) => {
      // Split by **bold** patterns
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      
      const formattedLine = parts.map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          // Bold text
          const boldText = part.slice(2, -2);
          return <strong key={partIndex} className="font-semibold text-gray-900">{boldText}</strong>;
        } else {
          // Regular text
          return <span key={partIndex}>{part}</span>;
        }
      });
      
      return (
        <p key={lineIndex} className="text-sm leading-relaxed">
          {formattedLine}
        </p>
      );
    });
  };

  // Function to format coach messages into paragraphs (fallback for non-markdown content)
  const formatCoachMessage = (content: string) => {
    if (message.role === 'user') return content;

    // Check if content has markdown-style formatting
    if (content.includes('###') || content.includes('**')) {
      return parseMarkdownFormatting(content);
    }

    // Fallback to original paragraph formatting
    // Split by double newlines first (explicit paragraphs)
    let paragraphs = content.split('\n\n');
    
    // If no double newlines, try to split by single newlines that look like paragraph breaks
    if (paragraphs.length === 1) {
      // Split by sentences that end with periods, exclamation marks, or question marks followed by space
      const sentences = content.split(/(?<=[.!?])\s+/);
      
      // Group sentences into logical paragraphs (every 3-4 sentences or when we detect topic changes)
      paragraphs = [];
      let currentParagraph = '';
      
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim();
        if (!sentence) continue;
        
        currentParagraph += (currentParagraph ? ' ' : '') + sentence;
        
        // Create paragraph breaks based on various criteria
        const shouldBreak = 
          // Every 3-4 sentences
          (i > 0 && (i + 1) % 3 === 0) ||
          // When we detect topic transition words
          (i < sentences.length - 1 && /\b(however|meanwhile|additionally|furthermore|in addition|on the other hand|next|finally|also)\b/i.test(sentences[i + 1])) ||
          // When we detect lists or numbered items
          (i < sentences.length - 1 && /^\d+\.|\*|\-/.test(sentences[i + 1].trim())) ||
          // When current paragraph is getting long (over 200 chars)
          currentParagraph.length > 200;
          
        if (shouldBreak || i === sentences.length - 1) {
          if (currentParagraph.trim()) {
            paragraphs.push(currentParagraph.trim());
          }
          currentParagraph = '';
        }
      }
    }
    
    // Clean up empty paragraphs and ensure we have content
    paragraphs = paragraphs.filter(p => p.trim().length > 0);
    
    return paragraphs;
  };

  const formattedContent = formatCoachMessage(message.content);

  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] p-4 rounded-lg ${
          message.role === 'user'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {message.role === 'coach' && (Array.isArray(formattedContent) || React.isValidElement(formattedContent)) ? (
          <div className="space-y-3">
            {Array.isArray(formattedContent) ? (
              formattedContent.map((content, index) => {
                if (React.isValidElement(content)) {
                  return content;
                } else {
                  return (
                    <p key={index} className="text-sm leading-relaxed">
                      {content}
                    </p>
                  );
                }
              })
            ) : (
              formattedContent
            )}
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{message.content}</p>
        )}
        
        {message.role === 'coach' && (message.sourceType || message.similarQueriesUsed) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <KnowledgeSource 
              sourceType={message.sourceType}
              similarQueriesUsed={message.similarQueriesUsed}
              metadata={message.metadata}
            />
          </div>
        )}
        
        <p className={`text-xs mt-2 ${
          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {formatTimestamp(message.timestamp)}
        </p>
      </div>
    </div>
  );
};
