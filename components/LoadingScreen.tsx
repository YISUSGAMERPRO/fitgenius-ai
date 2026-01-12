
import React, { useState, useEffect } from 'react';
import { Activity, Zap } from 'lucide-react';

const MOTIVATIONAL_QUOTES = [
    "El dolor de hoy es la fuerza de mañana.",
    "No cuentes los días, haz que los días cuenten.",
    "Tu cuerpo puede aguantar casi todo. Es a tu mente a la que tienes que convencer.",
    "La disciplina es hacer lo que hay que hacer, incluso cuando no quieres hacerlo.",
    "El sudor es la grasa llorando.",
    "Cada repetición te acerca a tu meta.",
    "No pares cuando estés cansado, para cuando hayas terminado.",
    "La única mala rutina es la que no se hace.",
    "Crea hábitos saludables, no restricciones.",
    "Tu salud es tu mayor riqueza."
];

interface Props {
    message?: string;
}

const LoadingScreen: React.FC<Props> = ({ message }) => {
    const [quoteIndex, setQuoteIndex] = useState(Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));

    useEffect(() => {
        const interval = setInterval(() => {
            setQuoteIndex(prev => (prev + 1) % MOTIVATIONAL_QUOTES.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6 animate-fadeIn">
            {/* Background Ambient Light */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center">
                {/* Logo Animation */}
                <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center mb-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-600/20 to-transparent"></div>
                    <Activity className="w-10 h-10 text-brand-400 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-500 animate-[loading_2s_ease-in-out_infinite]"></div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                    FitGenius<span className="text-brand-400">AI</span>
                </h2>
                
                <div className="h-16 flex items-center justify-center">
                    <p className="text-slate-400 text-sm font-medium animate-fadeIn key={quoteIndex}">
                        "{MOTIVATIONAL_QUOTES[quoteIndex]}"
                    </p>
                </div>

                {message && (
                    <div className="mt-8 bg-slate-900/50 border border-slate-800 px-6 py-3 rounded-full flex items-center gap-3">
                        <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-bold text-brand-200 uppercase tracking-wider">{message}</span>
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export default LoadingScreen;
