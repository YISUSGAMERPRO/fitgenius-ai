import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, ViewState, UserAccount, WorkoutPlan, DietPlan } from './types';
import ProfileSetup from './components/ProfileSetup';
import WorkoutView from './components/WorkoutView';
import DietView from './components/DietView';
import CalendarView from './components/CalendarView';
import GymAdminView from './components/GymAdminView';
import MedicalAssistantView from './components/MedicalAssistantView';
import UserAuth from './components/UserAuth';
import LandingPage from './components/LandingPage';
import LoadingScreen from './components/LoadingScreen';
import { Activity, Dumbbell, Utensils, Settings, LogOut, Stethoscope, LayoutDashboard } from 'lucide-react';
import { api } from './services/api';

type PortalType = 'landing' | 'user' | 'admin';

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentUserAccount, setCurrentUserAccount] = useState<UserAccount | null>(null);
  const [view, setView] = useState<ViewState>('calendar');
  const [isEditing, setIsEditing] = useState(false);
  const [portal, setPortal] = useState<PortalType>('landing');

  const handleViewChange = useCallback((newView: ViewState) => {
    setView(newView);
  }, []);

  const handleUserLogin = useCallback(async (account: UserAccount) => {
    setCurrentUserAccount(account);
    
    // Intentar obtener el perfil desde la base de datos
    const profile = await api.getProfile(account.id);
    if (profile) {
      setUser(profile);
    }
  }, []);

  const handleProfileComplete = useCallback(async (profile: UserProfile) => {
    if (!currentUserAccount) return;
    
    setUser(profile);
    
    // Guardar el perfil en la base de datos
    await api.saveProfile({
      id: currentUserAccount.id,
      user_id: currentUserAccount.id,
      ...profile
    });
    
    setCurrentUserAccount(prev => prev ? { ...prev, profile } : null);
  }, [currentUserAccount]);

  const handleLogout = useCallback(() => {
    setUser(null);
    setCurrentUserAccount(null);
    setPortal('landing');
  }, []);

  if (portal === 'landing') return <LandingPage onStart={() => setPortal('user')} />;
  if (portal === 'admin') return <GymAdminView onBack={() => setPortal('user')} />;
  if (portal === 'user' && !currentUserAccount) return <UserAuth onLogin={handleUserLogin} onAdminAccess={() => setPortal('admin')} />;
  if (portal === 'user' && currentUserAccount && !user) return <ProfileSetup onComplete={handleProfileComplete} onCancel={handleLogout} />;
  if (isEditing && user) return <ProfileSetup onComplete={(p) => { handleProfileComplete(p); setIsEditing(false); }} initialData={user} onCancel={() => setIsEditing(false)} />;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <aside className="w-72 hidden md:flex flex-col border-r border-white/5 bg-slate-900/40">
        <div className="p-8 pb-4 flex items-center gap-3 cursor-pointer" onClick={() => setPortal('landing')}>
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg"><Activity className="text-white" /></div>
          <span className="text-xl font-bold text-white">FitGenius<span className="text-brand-400">AI</span></span>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          <NavButton active={view === 'calendar'} onClick={() => handleViewChange('calendar')} icon={<LayoutDashboard />} label="Diario" />
          <NavButton active={view === 'workout'} onClick={() => handleViewChange('workout')} icon={<Dumbbell />} label="Rutinas" />
          <NavButton active={view === 'diet'} onClick={() => handleViewChange('diet')} icon={<Utensils />} label="Nutrición" />
          <NavButton active={view === 'medical'} onClick={() => handleViewChange('medical')} icon={<Stethoscope />} label="Médico" />
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={() => setIsEditing(true)} className="w-full text-left text-sm text-slate-400 p-2 hover:bg-white/5 rounded-lg flex items-center gap-2"><Settings className="w-4 h-4" /> Perfil</button>
          <button onClick={handleLogout} className="w-full text-left text-sm text-red-400 p-2 hover:bg-white/5 rounded-lg flex items-center gap-2"><LogOut className="w-4 h-4" /> Salir</button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {view === 'calendar' && <CalendarView userId={currentUserAccount!.id} onNavigate={handleViewChange} />}
        {view === 'workout' && <WorkoutView user={user!} userId={currentUserAccount!.id} />}
        {view === 'diet' && <DietView user={user!} userId={currentUserAccount!.id} />}
        {view === 'medical' && <MedicalAssistantView user={user!} userId={currentUserAccount!.id} />}
      </main>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
    {icon} <span className="font-semibold text-sm">{label}</span>
  </button>
);

export default App;