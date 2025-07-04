
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Brain, Globe, Zap } from 'lucide-react';

interface KnowledgeSourceProps {
  sourceType?: string;
  similarQueriesUsed?: number;
  metadata?: any;
}

export const KnowledgeSource = ({ sourceType = 'openai', similarQueriesUsed = 0, metadata }: KnowledgeSourceProps) => {
  const getSourceIcon = () => {
    switch (sourceType) {
      case 'n8n_perplexity':
        return <Globe className="w-3 h-3" />;
      case 'anthropic':
        return <Brain className="w-3 h-3" />;
      default:
        return <Zap className="w-3 h-3" />;
    }
  };

  const getSourceLabel = () => {
    switch (sourceType) {
      case 'n8n_perplexity':
        return 'Enhanced with Web Search';
      case 'anthropic':
        return 'Claude AI';
      default:
        return 'OpenAI GPT-4';
    }
  };

  const getSourceColor = () => {
    switch (sourceType) {
      case 'n8n_perplexity':
        return 'bg-green-100 text-green-700';
      case 'anthropic':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <Badge variant="outline" className={`text-xs ${getSourceColor()}`}>
        {getSourceIcon()}
        <span className="ml-1">{getSourceLabel()}</span>
      </Badge>
      
      {similarQueriesUsed > 0 && (
        <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700">
          <Brain className="w-3 h-3 mr-1" />
          {similarQueriesUsed} past insights used
        </Badge>
      )}
      
      {metadata?.model && (
        <span className="text-xs text-gray-500">
          {metadata.model}
        </span>
      )}
    </div>
  );
};
