
import React, { useState } from 'react';
import { UserAccount } from '../types';
import { api } from '../services/api';
import { User, Lock, Activity, UserPlus, LogIn, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';

interface Props {
  onLogin: (account: UserAccount) => void;
  onAdminAccess: () => void;
}

const UserAuth: React.FC<Props> = ({ onLogin, onAdminAccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        const account = await api.login(email, password);
        if (account) {
            onLogin(account);
        } else {
            setError('Correo o contraseña incorrectos.');
        }
    } catch (err) {
        setError('Error al conectar con la base de datos.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    
    if (!email.includes('@')) {
      setError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setIsLoading(true);

    const newAccount: UserAccount = {
      id: crypto.randomUUID(),
      email,
      password,
    };

    await api.register(newAccount);
    onLogin(newAccount);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-brand-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>

      <div className="w-full max-w-md glass-card rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-fadeIn border border-white/5">
        <div className="bg-slate-900/50 p-8 text-center relative">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20">
             <Activity className="text-white w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {isRegistering ? 'Crear Cuenta' : 'Bienvenido Atleta'}
          </h2>
          <p className="text-slate-400 text-sm">
            {isRegistering ? 'Únete a la comunidad FitGenius' : 'Ingresa para continuar tu progreso'}
          </p>
        </div>

        <div className="flex border-b border-white/5 bg-slate-900/30">
            <button 
                onClick={() => { setIsRegistering(false); setError(''); }}
                className={`flex-1 py-4 text-sm font-bold transition-all ${!isRegistering ? 'text-brand-400 border-b-2 border-brand-500 bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Iniciar Sesión
            </button>
            <button 
                onClick={() => { setIsRegistering(true); setError(''); }}
                className={`flex-1 py-4 text-sm font-bold transition-all ${isRegistering ? 'text-brand-400 border-b-2 border-brand-500 bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Registrarse
            </button>
        </div>

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="p-8 space-y-5">
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                <div className="relative mt-1">
                    <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-brand-500 transition-all placeholder-slate-600"
                        placeholder="tu@email.com"
                        required
                    />
                </div>
            </div>
            
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                <div className="relative mt-1">
                    <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-brand-500 transition-all placeholder-slate-600"
                        placeholder="••••••••"
                        required
                    />
                </div>
            </div>

            {isRegistering && (
                <div className="animate-slideUp">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Confirmar Contraseña</label>
                    <div className="relative mt-1">
                        <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            type="password" 
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-brand-500 transition-all placeholder-slate-600"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-red-400 text-sm font-medium animate-bounce-in">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-500/25 transition-all mt-4 flex items-center justify-center gap-2 hover:-translate-y-0.5"
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : isRegistering ? (
                    <><UserPlus className="w-5 h-5" /> Crear Cuenta</>
                ) : (
                    <><LogIn className="w-5 h-5" /> Ingresar</>
                )}
            </button>
        </form>

        <div className="bg-slate-900/50 p-4 text-center border-t border-white/5">
            <button 
                onClick={onAdminAccess}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-2 mx-auto"
            >
                <ShieldCheck className="w-3 h-3" />
                Acceso Administrador de Gimnasio
            </button>
        </div>
      </div>
    </div>
  );
};

export default UserAuth;
