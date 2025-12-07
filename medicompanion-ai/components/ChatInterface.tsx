import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { ChatMessage, ChatAttachment } from '../types';
import { BotIcon, SendIcon, UserIcon, PlusIcon, FileTextIcon } from './Icons';

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Hello! I am your MediCompanion. I can help you book appointments, manage your medical reports, or order medicine. You can also upload a medical report for me to analyze and save.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<ChatAttachment | undefined>(undefined);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        // Extract base64 part
        const base64Data = result.split(',')[1];
        setAttachment({
          name: file.name,
          type: file.type,
          data: base64Data
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      attachment: attachment,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachment(undefined);
    setIsLoading(true);

    try {
      const responseText = await geminiService.sendMessage(userMsg.text, userMsg.attachment ? {
          mimeType: userMsg.attachment.type,
          data: userMsg.attachment.data
      } : undefined);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        text: 'Something went wrong. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white max-w-4xl mx-auto shadow-sm border-x border-gray-200">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start max-w-[80%] space-x-2 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {msg.role === 'user' ? <UserIcon className="w-5 h-5" /> : <BotIcon className="w-5 h-5" />}
              </div>
              
              <div className="flex flex-col space-y-2">
                {/* Render Attachment if exists */}
                {msg.attachment && (
                  <div className={`p-2 rounded-lg border ${msg.role === 'user' ? 'bg-primary-700 border-primary-600 text-white' : 'bg-gray-200 border-gray-300'}`}>
                    <div className="flex items-center space-x-2">
                      <FileTextIcon className="w-5 h-5" />
                      <span className="text-sm truncate max-w-[150px]">{msg.attachment.name}</span>
                    </div>
                  </div>
                )}
                
                {msg.text && (
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user' 
                        ? 'bg-primary-600 text-white rounded-tr-none' 
                        : msg.role === 'system'
                        ? 'bg-red-50 text-red-600 border border-red-100'
                        : 'bg-gray-100 text-gray-800 rounded-tl-none'
                    }`}>
                        {msg.text.split('\n').map((line, i) => (
                            <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                        ))}
                    </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex justify-start">
             <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white">
                  <BotIcon className="w-5 h-5" />
                </div>
                <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        {attachment && (
            <div className="mb-2 flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-200 w-fit">
                <FileTextIcon className="w-4 h-4 text-primary-600" />
                <span className="text-sm text-gray-700">{attachment.name}</span>
                <button onClick={() => setAttachment(undefined)} className="text-red-500 hover:text-red-700 ml-2">×</button>
            </div>
        )}
        
        <div className="flex items-center bg-white rounded-full border border-gray-300 px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="mr-2 text-gray-400 hover:text-primary-600 transition-colors"
            title="Attach file"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
            accept=".txt,.pdf,.jpg,.jpeg,.png"
          />
          
          <input
            type="text"
            className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !attachment)}
            className={`ml-2 p-2 rounded-full transition-colors ${
              (!input.trim() && !attachment) || isLoading 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-primary-600 hover:bg-primary-50'
            }`}
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center mt-2">
            <p className="text-xs text-gray-400">AI can make mistakes. Verify important medical info.</p>
        </div>
      </div>
    </div>
  );
};