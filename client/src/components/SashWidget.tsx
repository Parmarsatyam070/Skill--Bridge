import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Minimize2,
  Maximize2,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  toolData?: any;
  timestamp: string;
}

const SashWidgetComponent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    'What are my biggest skill gaps?',
    'Show my top matched internships',
    'Recommend courses to improve my score',
    'What do you remember about my goals?',
  ]);

  const [activeDomain, setActiveDomain] = useState<string>(
    user?.studentProfile?.targetDomain || 'Full-Stack Web'
  );

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello ${user?.name || 'there'}! I'm **Sash**, your AI career navigator on SkillBridge. I remember your goals, struggles, and verified progress to help guide your career.\n\nAsk me about your domain skill gaps, roadmap courses, or match score breakdowns!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Keep activeDomain synced if profile targetDomain updates
  useEffect(() => {
    if (user?.studentProfile?.targetDomain) {
      setActiveDomain(user.studentProfile.targetDomain);
    }
  }, [user?.studentProfile?.targetDomain]);

  if (!user) return null;

  const handleSend = async (promptToSend?: string) => {
    const text = promptToSend || input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!promptToSend) setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-8).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));
      const pageContext = {
        path: window.location.pathname,
      };

      const res = await api.post<{
        message: string;
        toolCalls?: any[];
        suggestedPrompts?: string[];
      }>('/ai/chat', { prompt: text, activeDomain, history, pageContext });

      const assistantMsg: ChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'assistant',
        text: res.message,
        toolData: res.toolCalls,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
      if (res.suggestedPrompts && res.suggestedPrompts.length > 0) {
        setSuggestedPrompts(res.suggestedPrompts);
      }

      // Check if tool triggered client navigation
      if (res.toolCalls) {
        for (const tc of res.toolCalls) {
          if (tc.action && tc.action.type === 'NAVIGATE' && tc.action.path) {
            setTimeout(() => {
              navigate(tc.action.path);
            }, 600);
          }
        }
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          sender: 'assistant',
          text: `⚠️ Sash encountered a temporary issue connecting to the intelligence engine. Please try asking again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 font-sans gpu-accel">
      {!isOpen ? (
        /* Collapsed Floating Trigger Button */
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-bridge-teal hover:bg-bridge-teal/90 text-white shadow-lg shadow-bridge-teal/20 transition-all duration-200 transform hover:scale-105 group border border-white/20"
          aria-label="Open Sash AI Career Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-status-green rounded-full border-2 border-bridge-teal animate-pulse" />
          </div>
          <span className="text-xs font-semibold tracking-wide">Sash</span>
          <Sparkles className="w-4 h-4 text-status-amber animate-spin" style={{ animationDuration: '8s' }} />
        </button>
      ) : (
        /* Active Chat Drawer Panel */
        <div
          className={`flex flex-col bg-console-panel border border-console-border rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 ${
            isExpanded
              ? 'w-[90vw] md:w-[680px] h-[85vh]'
              : 'w-[92vw] sm:w-[400px] h-[540px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-console-panel-raised border-b border-console-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-bridge-teal/20 border border-bridge-teal/30 flex items-center justify-center text-bridge-teal">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-console-text">Sash AI</h4>
                  <select
                    value={activeDomain}
                    onChange={e => {
                      const newDom = e.target.value;
                      setActiveDomain(newDom);
                      setMessages(prev => [
                        ...prev,
                        {
                          id: 'system-' + Date.now(),
                          sender: 'assistant',
                          text: `🔄 Switched active domain context to **${newDom}**. Live tools are now querying **${newDom}** skills, gaps, and matching courses.`,
                          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        },
                      ]);
                      setSuggestedPrompts([
                        `What are my biggest ${newDom} skill gaps?`,
                        `Show my top matched internships in ${newDom}`,
                        `Recommend courses for ${newDom}`,
                      ]);
                    }}
                    className="px-1.5 py-0.5 text-[9.5px] font-mono font-semibold rounded bg-bridge-teal/15 text-bridge-teal border border-bridge-teal/30 focus:outline-none cursor-pointer"
                  >
                    <option value="Full-Stack Web" className="bg-console-panel text-console-text">Full-Stack Web</option>
                    <option value="AI/Data Science" className="bg-console-panel text-console-text">AI/Data Science</option>
                    <option value="Cloud/DevOps" className="bg-console-panel text-console-text">Cloud/DevOps</option>
                    <option value="UI/UX Product Design" className="bg-console-panel text-console-text">UI/UX Product Design</option>
                    <option value="Embedded/IoT" className="bg-console-panel text-console-text">Embedded/IoT</option>
                  </select>
                </div>
                <span className="text-[10px] text-console-text-muted">
                  Personalized to {user.name} • {activeDomain}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-console-text-muted hover:text-console-text hover:bg-console-panel"
                title={isExpanded ? 'Minimize size' : 'Expand size'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-console-text-muted hover:text-console-text hover:bg-console-panel"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-console-bg/40">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-bridge-teal/20 border border-bridge-teal/30 flex items-center justify-center text-bridge-teal flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                    msg.sender === 'user'
                      ? 'bg-bridge-teal text-white rounded-tr-none'
                      : 'bg-console-panel-raised border border-console-border text-console-text rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </div>

                  <div className={`mt-1 text-[9px] font-mono ${msg.sender === 'user' ? 'text-white/70 text-right' : 'text-console-text-muted'}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-campus-blue/30 border border-campus-blue flex items-center justify-center text-console-text flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center">
                <div className="w-6 h-6 rounded-full bg-bridge-teal/20 border border-bridge-teal/30 flex items-center justify-center text-bridge-teal flex-shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-console-panel-raised border border-console-border rounded-2xl rounded-tl-none px-4 py-2.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-bridge-teal rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-bridge-teal rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-bridge-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[11px] font-mono text-console-text-muted ml-2">Sash is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Suggestion Chips */}
          {suggestedPrompts.length > 0 && !loading && (
            <div className="px-3 py-2 bg-console-panel border-t border-console-border/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <Compass className="w-3.5 h-3.5 text-bridge-teal flex-shrink-0" />
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p)}
                  className="px-2.5 py-1 rounded-full bg-console-panel-raised hover:bg-console-border border border-console-border text-[10.5px] text-console-text-muted hover:text-console-text whitespace-nowrap transition-colors flex-shrink-0"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 bg-console-panel border-t border-console-border">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask Sash about skills, career goals, or platform tools..."
                disabled={loading}
                className="flex-1 bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder:text-console-text-muted focus:outline-none focus:border-bridge-teal"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                aria-label="Send message to Sash"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const SashWidget = React.memo(SashWidgetComponent);
export const BridgeBotWidget = SashWidget; // Backward-compatibility export alias
