"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  MessageCircle, 
  Send, 
  Minimize2, 
  Maximize2, 
  Bot,
  User,
  Sparkles
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface AiChatWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export default function AiChatWidget({ isOpen, onToggle, className }: AiChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // Call your API endpoint for AI responses
      const response = await fetch("/api/dashboard/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          conversation: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || "I'm sorry, I couldn't process that request.",
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble connecting. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Card className="w-80 h-96 flex flex-col bg-black border-gray-800 shadow-2xl">
        {/* Header */}
        <CardHeader className="bg-gray-900 border-b border-gray-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <div className="relative">
                <Bot className="h-4 w-4 text-green-400" />
                <Sparkles className="h-2 w-2 text-green-400 absolute -top-1 -right-1" />
              </div>
              AI Assistant
              <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                Online
              </Badge>
            </CardTitle>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onToggle}
                className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            {/* Messages */}
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-64 px-4 py-3">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <Bot className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Hi! I'm your AI assistant. How can I help you today?
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setInput("Can you help me create a new SOW?")}
                          className="text-xs border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          Create SOW
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setInput("What are the pricing rates?")}
                          className="text-xs border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          Pricing Info
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setInput("Help with document formatting")}
                          className="text-xs border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          Document Help
                        </Button>
                      </div>
                    </div>
                  )}

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                          <Bot className="h-3 w-3 text-green-400" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          message.role === "user"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-gray-800 text-gray-300 border border-gray-700"
                        }`}
                      >
                        {message.content}
                      </div>
                      {message.role === "user" && (
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                          <User className="h-3 w-3 text-green-400" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                        <Bot className="h-3 w-3 text-green-400" />
                      </div>
                      <div className="bg-gray-800 text-gray-300 border border-gray-700 rounded-lg px-3 py-2 text-sm">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>
            </CardContent>

            {/* Input */}
            <div className="border-t border-gray-800 p-3">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-green-500/20"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isTyping}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-black border-0 px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Powered by Social Garden AI
              </p>
            </div>
          </>
        )}
      </Card>

      {/* Floating button when closed */}
      {!isOpen && (
        <Button
          onClick={onToggle}
          className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-black border-0 shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}