import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Bot, User, X, MessageSquare, Loader2, Shield, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Article } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatProps {
  articles: Article[];
  userRole: 'employee' | 'internal';
}

export default function Chat({ articles, userRole }: ChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      // Prepare context based on role, limited to 20 articles to avoid token limits
      const context = articles.slice(0, 20).map(article => {
        const base = {
          title: article.title,
          systems: article.metadata.systems.join(', '),
          tags: article.metadata.tags.join(', '),
          summary: article.content.employee.summary,
          steps: article.content.employee.steps,
          escalation: article.content.employee.escalation,
        };

        if (userRole === 'internal') {
          return {
            ...base,
            internal_diagnostics: article.content.internal.diagnostics,
            internal_remediation: article.content.internal.remediation,
            internal_admin_links: article.content.internal.admin_links,
          };
        }
        return base;
      });

      const systemInstruction = `
        You are a Studio Tech Assistant for the Gap Inc. Photo Studio.
        Current User Role: ${userRole === 'internal' ? 'STUDIO TECH' : 'STUDIO CREW'}
        
        ${userRole === 'internal' 
          ? "You have FULL ACCESS to technical diagnostics, remediation steps, and internal admin links for studio equipment (Capture One, Lighting, NAS). Provide detailed technical support and use all available data to assist the studio tech team." 
          : "You have CREW ACCESS only. You MUST NOT reveal internal diagnostics, remediation steps, or admin links. These are strictly confidential for the Studio Tech team. Focus ONLY on high-level summaries, crew-safe steps, and escalation paths. If a crew member asks for technical details not in the public summary/steps, inform them that those details are restricted to the Studio Tech team."}
        
        Use the following Knowledge Base articles to answer the user's question:
        ${JSON.stringify(context, null, 2)}
        
        If the answer is not in the articles, politely inform the user that you don't have that information in the current Studio KB index.
        Keep your responses professional, concise, and formatted with markdown.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })), { role: 'user', parts: [{ text: userMessage }] }],
        config: {
          systemInstruction,
        },
      });

      const aiResponse = response.text || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Error: Failed to connect to AI service. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white border border-charcoal/10 w-[400px] h-[600px] shadow-2xl flex flex-col overflow-hidden mb-6 rounded-3xl"
          >
            {/* Chat Header */}
            <div className="bg-charcoal text-white p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Bot size={20} className="text-accent" />
                <div>
                  <h3 className="text-[10px] font-display font-bold uppercase tracking-[0.2em]">Studio Tech Assistant</h3>
                  <div className="flex items-center gap-1 text-[8px] opacity-60 uppercase tracking-widest">
                    {userRole === 'internal' ? <Shield size={8} /> : <Globe size={8} />}
                    {userRole === 'internal' ? 'Studio Tech' : 'Studio Crew'} Mode
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="opacity-40 hover:opacity-100 transition-opacity">
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-ivory/30">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-30">
                  <Bot size={40} className="mb-6 text-charcoal" />
                  <p className="text-sm italic font-display font-medium text-charcoal">How can I help you with Photo Studio technology today?</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 text-xs leading-relaxed rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-charcoal text-white shadow-md' 
                      : 'bg-white border border-charcoal/5 shadow-sm text-charcoal'
                  }`}>
                    <div className="flex items-center gap-1 mb-2 opacity-40 text-[8px] uppercase tracking-widest font-bold">
                      {msg.role === 'user' ? <User size={10} /> : <Bot size={10} />}
                      {msg.role}
                    </div>
                    <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-charcoal/5 p-4 rounded-2xl shadow-sm flex items-center gap-3">
                    <Loader2 size={12} className="animate-spin opacity-30 text-charcoal" />
                    <span className="text-[8px] uppercase tracking-widest font-bold opacity-30 text-charcoal">Analyzing...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-6 border-t border-charcoal/5 bg-white">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about Capture One, Lighting, Studio Network..."
                  className="w-full pl-0 pr-12 py-3 bg-transparent border-b border-charcoal/20 text-xs focus:outline-none focus:border-accent transition-all placeholder:opacity-30 text-charcoal"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-charcoal disabled:opacity-10 transition-opacity"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-charcoal text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95"
      >
        {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
      </button>
    </div>
  );
}
