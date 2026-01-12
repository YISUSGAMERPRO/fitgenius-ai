
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export const ConfirmModal: React.FC<Props> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = "Confirmar", 
    cancelText = "Cancelar", 
    isDestructive = true 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl p-6 relative transform transition-all scale-100">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-full flex-shrink-0 ${isDestructive ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-brand-500/10 text-brand-500 border border-brand-500/20'}`}>
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-white text-lg leading-tight">{title}</h3>
                </div>
                
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                    {message}
                </p>
                
                <div className="flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold text-sm transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={() => { onConfirm(); onClose(); }} 
                        className={`flex-1 py-3 rounded-xl font-bold text-white text-sm transition-all shadow-lg hover:scale-[1.02] ${
                            isDestructive 
                                ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' 
                                : 'bg-brand-600 hover:bg-brand-500 shadow-brand-500/20'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
