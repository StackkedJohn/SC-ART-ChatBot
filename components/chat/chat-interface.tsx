'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { SourceCard } from './source-card';
import { SuggestedQuestions } from './suggested-questions';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    contentItemId: string;
    title: string;
    categoryName: string;
    subcategoryName: string;
    excerpt: string;
    similarity: number;
  }>;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewChat = () => {
    setMessages([]);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let sources: any[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));

              if (data.chunk) {
                assistantMessage += data.chunk;
                // Update message in real-time
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.content = assistantMessage;
                  } else {
                    newMessages.push({ role: 'assistant', content: assistantMessage });
                  }
                  return newMessages;
                });
              }

              if (data.sources) {
                sources = data.sources;
              }

              if (data.done) {
                // Add sources to the final message
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.sources = sources;
                  }
                  return newMessages;
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionSelect = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-brand-sc-pink/20 bg-brand-barely-butter/30 p-6">
        <div className="container flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-sans font-extrabold text-brand-sc-pink">SC-ART Knowledge Base</h1>
            <p className="text-sm text-foreground/70 mt-1">
              Ask questions about processes, procedures, and training materials
            </p>
          </div>
          {messages.length > 0 && (
            <Button onClick={handleNewChat} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container py-6">
          {messages.length === 0 ? (
            <SuggestedQuestions onSelect={handleQuestionSelect} />
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto">
              {messages.map((message, index) => (
                <div key={index}>
                  <ChatMessage message={message} />
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-4">
                      <SourceCard sources={message.sources} />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-background p-4">
        <div className="container max-w-3xl mx-auto">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
