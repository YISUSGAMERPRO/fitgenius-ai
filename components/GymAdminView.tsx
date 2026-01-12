
import React, { useState, useEffect } from 'react';
import { GymMember, GymEquipment, GymSubscriptionPlan, GymExpense } from '../types';
import { api } from '../services/api';
// Added ShieldCheck to the imports to resolve the missing name error
import { Users, DollarSign, Wrench, Plus, Trash2, Search, CheckCircle2, AlertCircle, Wallet, TrendingUp, Crown, Check, ArrowLeft, LogOut, Bell, Send, CalendarClock, Database, Globe, WifiOff, ShieldCheck } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface Props {
    onBack: () => void;
}

const GymAdminView: React.FC<Props> = ({ onBack }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'finances' | 'database'>('dashboard');
    const [members, setMembers] = useState<GymMember[]>([]);
    const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
    const [deleteState, setDeleteState] = useState<{isOpen: boolean, id: string}>({isOpen: false, id: ''});
    const [dbStatus, setDbStatus] = useState<'local' | 'cloud'>('local');

    const [newMember, setNewMember] = useState<Partial<GymMember>>({ 
        name: '', 
        plan: 'Mensual', 
        status: 'Activo', 
        lastPaymentDate: new Date().toISOString().split('T')[0],
        lastPaymentAmount: 0 
    });

    useEffect(() => {
        const session = sessionStorage.getItem('fitgenius_admin_session');
        if (session === 'active') {
            setIsAuthenticated(true);
            loadMembers();
        }
    }, []);

    const loadMembers = async () => {
        const data = await api.getMembers();
        setMembers(data);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Credenciales por defecto para el admin (puedes cambiarlas en MySQL después)
        if (username === 'admin' && password === 'admin123') {
            setIsAuthenticated(true);
            sessionStorage.setItem('fitgenius_admin_session', 'active');
            await loadMembers();
        } else {
            alert("Acceso denegado. Revisa tu usuario y contraseña.");
        }
        setIsLoading(false);
    };

    const handleAddMember = async () => {
        if (newMember.name) {
            const member: GymMember = {
                id: crypto.randomUUID(),
                name: newMember.name!,
                joinDate: new Date().toISOString(),
                plan: newMember.plan as any,
                status: 'Activo',
                lastPaymentDate: newMember.lastPaymentDate!,
                lastPaymentAmount: Number(newMember.lastPaymentAmount),
                subscriptionEndDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            };
            try {
                await api.saveMember(member);
                await loadMembers();
                setIsMemberFormOpen(false);
                setNewMember({ name: '', plan: 'Mensual', lastPaymentAmount: 0 });
                alert('✅ Miembro agregado correctamente');
            } catch (error) {
                alert('❌ Error al guardar miembro: ' + (error as any).message);
            }
        }
    };

    const confirmDelete = async () => {
        await api.deleteMember(deleteState.id);
        await loadMembers();
        setDeleteState({ isOpen: false, id: '' });
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <form onSubmit={handleLogin} className="glass-card p-10 rounded-3xl w-full max-w-md border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Database className="w-32 h-32" />
                    </div>
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20">
                            <ShieldCheck className="text-white w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Panel de Administración</h2>
                        <p className="text-slate-400 text-sm mt-2">Gestiona tu gimnasio FitGenius</p>
                    </div>
                    
                    <div className="space-y-4">
                        <input 
                            type="text" 
                            placeholder="Usuario Admin" 
                            className="w-full bg-slate-800/50 border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-brand-500 transition-all" 
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                        />
                        <input 
                            type="password" 
                            placeholder="Contraseña" 
                            className="w-full bg-slate-800/50 border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-brand-500 transition-all" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                        />
                        <button 
                            disabled={isLoading}
                            type="submit" 
                            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? "Conectando..." : "Ingresar al Sistema"}
                        </button>
                    </div>
                    <button type="button" onClick={onBack} className="w-full text-slate-500 mt-6 text-sm hover:text-slate-300 transition-colors">Volver a la App</button>
                </form>
            </div>
        );
    }

    const totalRevenue = members.reduce((acc, m) => acc + (m.lastPaymentAmount || 0), 0);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <ConfirmModal 
                isOpen={deleteState.isOpen} 
                onClose={() => setDeleteState({isOpen: false, id: ''})} 
                onConfirm={confirmDelete} 
                title="Eliminar Miembro" 
                message="¿Estás seguro de eliminar a este socio? Se perderá todo su historial de pagos." 
            />

            <header className="bg-slate-900 border-b border-white/5 p-4 sticky top-0 z-40 backdrop-blur-md bg-slate-900/80">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand-600 p-2 rounded-lg">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="font-bold text-white text-lg">Administración <span className="text-brand-400">Gimnasio</span></h1>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${dbStatus === 'local' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                            {dbStatus === 'local' ? <WifiOff className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                            {dbStatus === 'local' ? 'Modo Local' : 'Conectado a MySQL'}
                         </div>
                        <button onClick={() => {
                            sessionStorage.removeItem('fitgenius_admin_session');
                            setIsAuthenticated(false);
                        }} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6">
                {/* Navigation Tabs */}
                <div className="flex gap-2 mb-8 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 w-fit overflow-x-auto">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
                        { id: 'members', label: 'Miembros', icon: Users },
                        { id: 'finances', label: 'Finanzas', icon: DollarSign },
                        { id: 'database', label: 'Base de Datos', icon: Database }
                    ].map(t => (
                        <button 
                            key={t.id} 
                            onClick={() => setActiveTab(t.id as any)} 
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === t.id ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <t.icon className="w-4 h-4" />
                            {t.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'dashboard' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slideUp">
                        <StatCard icon={Users} label="Total Socios" value={members.length} color="blue" />
                        <StatCard icon={TrendingUp} label="Ingresos Totales" value={`$${totalRevenue}`} color="green" />
                        <StatCard icon={AlertCircle} label="Pagos Pendientes" value={members.filter(m => m.status === 'Pendiente').length} color="amber" />
                        
                        <div className="md:col-span-3 glass-card p-8 rounded-3xl border border-white/5">
                             <h3 className="text-xl font-bold text-white mb-6">Actividad Reciente</h3>
                             <div className="space-y-4">
                                 {members.slice(0, 5).map(m => (
                                     <div key={m.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-white/5">
                                         <div className="flex items-center gap-3">
                                             <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-brand-400">
                                                 {m.name[0]}
                                             </div>
                                             <div>
                                                 <p className="font-bold text-white">{m.name}</p>
                                                 <p className="text-xs text-slate-500">Se unió el {new Date(m.joinDate).toLocaleDateString()}</p>
                                             </div>
                                         </div>
                                         <span className="text-xs font-bold text-green-400">+$ {m.lastPaymentAmount}</span>
                                     </div>
                                 ))}
                                 {members.length === 0 && <p className="text-center text-slate-500 py-10">No hay actividad registrada aún.</p>}
                             </div>
                        </div>
                    </div>
                )}

                {activeTab === 'members' && (
                    <div className="space-y-6 animate-slideUp">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">Gestión de Miembros</h2>
                            <button 
                                onClick={() => setIsMemberFormOpen(true)} 
                                className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20"
                            >
                                <Plus className="w-4 h-4" /> Nuevo Socio
                            </button>
                        </div>

                        {isMemberFormOpen && (
                            <div className="bg-slate-900 border border-brand-500/30 p-6 rounded-2xl animate-slideDown">
                                <h3 className="text-lg font-bold text-white mb-4">Registrar Nuevo Socio</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input 
                                        placeholder="Nombre Completo" 
                                        className="bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none" 
                                        value={newMember.name} 
                                        onChange={e => setNewMember({...newMember, name: e.target.value})} 
                                    />
                                    <select 
                                        className="bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none" 
                                        value={newMember.plan} 
                                        onChange={e => setNewMember({...newMember, plan: e.target.value as any})}
                                    >
                                        <option value="Mensual">Mensual</option>
                                        <option value="Anual">Anual</option>
                                        <option value="VIP">VIP</option>
                                    </select>
                                    <input 
                                        type="number" 
                                        placeholder="Monto Pagado ($)" 
                                        className="bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none" 
                                        value={newMember.lastPaymentAmount} 
                                        onChange={e => setNewMember({...newMember, lastPaymentAmount: Number(e.target.value)})} 
                                    />
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <button onClick={handleAddMember} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold">Guardar</button>
                                    <button onClick={() => setIsMemberFormOpen(false)} className="bg-slate-800 text-slate-400 px-6 py-2 rounded-xl font-bold">Cancelar</button>
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                            <table className="w-full text-left">
                                <thead className="bg-slate-800/50 text-slate-400 text-xs font-bold uppercase">
                                    <tr>
                                        <th className="p-4">Nombre</th>
                                        <th className="p-4">Plan</th>
                                        <th className="p-4">Estado</th>
                                        <th className="p-4">Último Pago</th>
                                        <th className="p-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {members.map(m => (
                                        <tr key={m.id} className="hover:bg-slate-800/20 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-white">{m.name}</div>
                                                <div className="text-xs text-slate-500">ID: {m.id.slice(0,8)}</div>
                                            </td>
                                            <td className="p-4"><span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">{m.plan}</span></td>
                                            <td className="p-4">
                                                <span className={`flex items-center gap-1.5 text-xs font-bold ${m.status === 'Activo' ? 'text-green-400' : 'text-amber-400'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${m.status === 'Activo' ? 'bg-green-400' : 'bg-amber-400'}`}></div>
                                                    {m.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-slate-400">{new Date(m.lastPaymentDate).toLocaleDateString()}</td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => setDeleteState({isOpen: true, id: m.id})} className="p-2 text-slate-500 hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {members.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-500">No hay socios registrados.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'database' && (
                    <div className="glass-card p-8 rounded-3xl border border-brand-500/20 animate-slideUp">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-brand-500/20 p-3 rounded-2xl text-brand-400">
                                <Database className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Configuración de Base de Datos</h2>
                                <p className="text-slate-400 text-sm">Conecta tu app con MySQL para persistencia profesional.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl">
                                <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                    Estado Actual: Almacenamiento Local (LocalStorage)
                                </h3>
                                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                                    Actualmente los datos se guardan solo en este navegador. Para usar MySQL necesitas:
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3 text-sm text-slate-300">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                                        Un servidor con Node.js y Express (Backend).
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-slate-300">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                                        Una base de datos MySQL activa.
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-slate-300">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                                        Modificar la URL en <code>services/api.ts</code>.
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-brand-950/20 border border-brand-500/30 p-6 rounded-2xl">
                                <h3 className="font-bold text-brand-400 mb-2">Instrucciones de Conexión</h3>
                                <p className="text-xs text-brand-200/70 mb-4">Copia este comando para crear las tablas necesarias en tu MySQL:</p>
                                <pre className="bg-black/40 p-4 rounded-xl text-[10px] text-brand-300 overflow-x-auto font-mono">
                                    {`CREATE TABLE gym_members (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  plan ENUM('Mensual', 'Anual', 'VIP') NOT NULL,
  status VARCHAR(20) DEFAULT 'Activo',
  last_payment_date DATE,
  last_payment_amount DECIMAL(10,2),
  subscription_end_date DATE
);`}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => {
    const colorClasses: any = {
        blue: 'bg-blue-500/10 text-blue-500',
        green: 'bg-green-500/10 text-green-500',
        amber: 'bg-amber-500/10 text-amber-500'
    };
    return (
        <div className="bg-slate-900 p-6 rounded-3xl border border-white/5 flex items-center gap-5 shadow-xl transition-transform hover:scale-[1.02]">
            <div className={`p-4 rounded-2xl ${colorClasses[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-2xl font-black text-white">{value}</p>
            </div>
        </div>
    );
};

export default GymAdminView;
