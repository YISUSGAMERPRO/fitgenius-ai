
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, WorkoutPlan, DietPlan } from '../types';
import { api } from '../services/api';
import { Stethoscope, Send, User, Bot, AlertTriangle, Info, PlusCircle, ArrowDown, Activity, ShieldCheck, Thermometer, Trash2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface Props {
  user: UserProfile;
  userId: string;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

const QUICK_PROMPTS = [
    "Me duele la rodilla al hacer sentadillas",
    "Siento un pinchazo en la espalda baja",
    "¿Cuánta proteína debo consumir al día?",
    "¿Es seguro tomar Creatina?",
    "Protocolo para dormir mejor",
    "Mareos durante el entrenamiento",
    "¿Hielo o calor para una contractura?",
    "Tengo agujetas muy fuertes",
    "¿Puedo entrenar estando resfriado?",
    "Calambres musculares frecuentes"
];

const MedicalAssistantView: React.FC<Props> = ({ user, userId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showClearModal, setShowClearModal] = useState(false);

  // Context Data
  const [activeWorkout, setActiveWorkout] = useState<WorkoutPlan | undefined>(undefined);
  const [activeDiet, setActiveDiet] = useState<DietPlan | undefined>(undefined);

  // Keys
  const STORAGE_KEY_CHAT = `fitgenius_medical_chat_${userId}`;
  const STORAGE_KEY_WORKOUT = `fitgenius_workout_${userId}`;
  const STORAGE_KEY_DIET = `fitgenius_diet_${userId}`;

  useEffect(() => {
    // Load context from local storage
    const savedWorkout = localStorage.getItem(STORAGE_KEY_WORKOUT);
    if (savedWorkout) {
        try { setActiveWorkout(JSON.parse(savedWorkout)); } catch(e) {}
    }

    const savedDiet = localStorage.getItem(STORAGE_KEY_DIET);
    if (savedDiet) {
        try { setActiveDiet(JSON.parse(savedDiet)); } catch(e) {}
    }

    // Load Chat History
    const savedChat = localStorage.getItem(STORAGE_KEY_CHAT);
    if (savedChat) {
        try {
            setMessages(JSON.parse(savedChat));
        } catch(e) { console.error("Error loading chat", e); }
    } else {
        // Initial Greeting
        const initialMsg: Message = {
            id: 'init-1',
            role: 'model',
            text: `Hola ${user.name}, soy el Dr. FitGenius. Cuento con acceso a tu **${savedWorkout ? 'Plan de Entrenamiento' : 'Perfil'}** y **${savedDiet ? 'Dieta Actual' : 'Datos Nutricionales'}** para darte consejos precisos.\n\nPuedo ayudarte con:\n• Dolores y molestias\n• Suplementación deportiva\n• Protocolos de sueño y recuperación\n• Dudas sobre lesiones\n\n¿En qué te ayudo hoy?`,
            timestamp: Date.now()
        };
        setMessages([initialMsg]);
    }
  }, [userId]);

  useEffect(() => {
      if (messages.length > 0) {
          localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(messages));
          scrollToBottom();
      }
  }, [messages, userId]);

  // Reset textarea height when input clears
  useEffect(() => {
      if (input === '' && textareaRef.current) {
          textareaRef.current.style.height = 'auto';
      }
  }, [input]);

  const scrollToBottom = () => {
      setTimeout(() => {
          if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
      }, 100);
  };

  const handleSend = async (text: string = input) => {
      if (!text.trim()) return;

      const userMsg: Message = {
          id: crypto.randomUUID(),
          role: 'user',
          text: text,
          timestamp: Date.now()
      };

      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      try {
          // Prepare history for API (excluding IDs and timestamps)
          const historyForAi = messages.concat(userMsg).map(m => ({ role: m.role, text: m.text }));
          
          // Llamar al asistente médico
          const responseText = await api.getMedicalAdvice(historyForAi, user, activeWorkout, activeDiet);

          const aiMsg: Message = {
              id: crypto.randomUUID(),
              role: 'model',
              text: responseText,
              timestamp: Date.now()
          };
          setMessages(prev => [...prev, aiMsg]);
      } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error('Error medico detallado:', error);
          const aiMsg: Message = {
              id: crypto.randomUUID(),
              role: 'model',
              text: `Lo siento, hubo un error: ${errorMsg}`,
              timestamp: Date.now()
          };
          setMessages(prev => [...prev, aiMsg]);
      } finally {
          setLoading(false);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
      }
  };

  const clearChat = () => {
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY_CHAT);
      // Re-init
      const initialMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: `Historial borrado. Hola de nuevo ${user.name}, ¿en qué puedo asesorarte ahora?`,
        timestamp: Date.now()
    };
    setMessages([initialMsg]);
  }

  // Formatting helper for Markdown-like bold text
  const formatText = (text: string) => {
      // Bold
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={index} className="text-white font-bold">{part.slice(2, -2)}</strong>;
          }
          // New lines
          return <span key={index}>{part}</span>;
      });
  };

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  return (
    // Expanded height: Tries to fill as much of the visible area as possible minus padding and parent layout constraints
    <div className="h-[calc(100dvh-120px)] md:h-[calc(100vh-60px)] flex flex-col gap-3 animate-fadeIn relative">
        
        <ConfirmModal 
            isOpen={showClearModal}
            onClose={() => setShowClearModal(false)}
            onConfirm={clearChat}
            title="Borrar Historial"
            message="¿Estás seguro de que quieres borrar toda la conversación? Se perderá el contexto médico actual."
            confirmText="Borrar Chat"
        />

        {/* Compact Header - Reduced Size */}
        <div className="glass-card p-3 rounded-2xl border border-blue-500/20 flex flex-row justify-between items-center gap-3 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20 shrink-0">
                    <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div className="overflow-hidden">
                    <h2 className="text-sm md:text-base font-bold text-white tracking-tight truncate leading-tight">Dr. FitGenius</h2>
                    <p className="text-slate-400 text-[10px] flex items-center gap-1 truncate leading-tight">
                        <ShieldCheck className="w-3 h-3 text-green-400 shrink-0" />
                        <span className="truncate">Asistente Médico IA</span>
                    </p>
                </div>
            </div>
            
            <div className="flex gap-2 shrink-0">
                <button 
                    onClick={() => setShowClearModal(true)}
                    className="p-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-bold border border-slate-700 transition-colors flex items-center gap-1"
                    title="Borrar Chat"
                >
                    <Trash2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Reiniciar</span>
                </button>
            </div>
        </div>

        {/* Chat Area - Expanded */}
        <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden flex flex-col relative shadow-inner">
            
            {/* Messages Scroll */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
                {messages.map((msg) => {
                    const isAi = msg.role === 'model';
                    const isAlert = msg.text.includes("[ALERTA MÉDICA]");
                    
                    return (
                        <div key={msg.id} className={`flex ${isAi ? 'justify-start' : 'justify-end'} animate-slideUp`}>
                            <div className={`max-w-[90%] md:max-w-[75%] flex gap-2 md:gap-3 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                                    isAi 
                                        ? isAlert ? 'bg-red-500' : 'bg-blue-600' 
                                        : 'bg-slate-700'
                                }`}>
                                    {isAi ? (isAlert ? <AlertTriangle className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />) : <User className="w-4 h-4 text-slate-300" />}
                                </div>
                                
                                <div className={`p-3 md:p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-md ${
                                    isAi 
                                        ? isAlert 
                                            ? 'bg-red-900/20 border border-red-500/30 text-red-100 rounded-tl-none' 
                                            : 'bg-slate-800 border border-slate-700 text-slate-300 rounded-tl-none'
                                        : 'bg-blue-600 text-white rounded-tr-none'
                                }`}>
                                    {isAi && <span className="text-[10px] font-bold opacity-50 block mb-1 uppercase tracking-wider">{isAlert ? 'ALERTA DE SEGURIDAD' : 'Dr. FitGenius'}</span>}
                                    {formatText(msg.text.replace("[ALERTA MÉDICA]", ""))}
                                    
                                    {isAi && (
                                        <div className="mt-2 pt-2 border-t border-white/5 text-[10px] opacity-40 flex items-center gap-1">
                                            <Info className="w-3 h-3" /> IA Experimental. Consulta a un médico real.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                
                {loading && (
                    <div className="flex justify-start animate-pulse">
                        <div className="flex gap-3 max-w-[70%]">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-white animate-spin" />
                            </div>
                            <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-200"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 md:p-4 bg-slate-900 border-t border-slate-800 shrink-0">
                
                {/* Quick Prompts - Horizontal Scroll */}
                <div className="flex gap-2 overflow-x-auto pb-3 mb-1 scrollbar-hide">
                    {QUICK_PROMPTS.map((prompt, i) => (
                        <button
                            key={i}
                            onClick={() => handleSend(prompt)}
                            disabled={loading}
                            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] md:text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 shrink-0"
                        >
                            <PlusCircle className="w-3 h-3" />
                            {prompt}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputResize}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe tu síntoma o duda..."
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 pl-4 pr-12 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-500 resize-none min-h-[48px] max-h-[120px] scrollbar-thin scrollbar-thumb-slate-600 text-sm"
                        disabled={loading}
                        rows={1}
                        style={{ height: '48px' }}
                    />
                    <button
                                                onClick={() => {
                                                    if (input.trim()) handleSend();
                                                }}
                                                disabled={loading || !input.trim()}
                        className={`absolute right-1.5 bottom-1.5 p-2 rounded-lg transition-all ${
                            loading || !input.trim() 
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                        }`}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default MedicalAssistantView;
