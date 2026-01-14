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
import { Activity, Dumbbell, Utensils, Settings, LogOut, Stethoscope, LayoutDashboard, Menu, X } from 'lucide-react';
import { api } from './services/api';

type PortalType = 'landing' | 'user' | 'admin';

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentUserAccount, setCurrentUserAccount] = useState<UserAccount | null>(null);
  const [view, setView] = useState<ViewState>('calendar');
  const [isEditing, setIsEditing] = useState(false);
  const [portal, setPortal] = useState<PortalType>('landing');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Recuperar sesión guardada al cargar la app
  useEffect(() => {
    const savedAccount = localStorage.getItem('currentUserAccount');
    const savedUser = localStorage.getItem('userProfile');
    
    if (savedAccount) {
      try {
        const account = JSON.parse(savedAccount);
        setCurrentUserAccount(account);
        setPortal('user');
        
        if (savedUser) {
          const profile = JSON.parse(savedUser);
          setUser(profile);
        }
      } catch (error) {
        console.error('Error recuperando sesión:', error);
        localStorage.removeItem('currentUserAccount');
        localStorage.removeItem('userProfile');
      }
    }
    
    setIsLoadingSession(false);
  }, []);

  const handleViewChange = useCallback((newView: ViewState) => {
    setView(newView);
  }, []);

  const handleUserLogin = useCallback(async (account: UserAccount) => {
    setCurrentUserAccount(account);
    
    // Guardar en localStorage
    localStorage.setItem('currentUserAccount', JSON.stringify(account));
    
    // Intentar obtener el perfil desde la base de datos
    const profile = await api.getProfile(account.id);
    if (profile) {
      setUser(profile);
      localStorage.setItem('userProfile', JSON.stringify(profile));
    }
  }, []);

  const handleProfileComplete = useCallback(async (profile: UserProfile) => {
    if (!currentUserAccount) return;
    
    setUser(profile);
    
    // Guardar en localStorage
    localStorage.setItem('userProfile', JSON.stringify(profile));
    
    // Guardar el perfil en la base de datos
    try {
      const profileData = {
        id: profile.id || `profile_${Date.now()}`,
        user_id: currentUserAccount.id,
        ...profile
      };
      console.log('📤 Enviando perfil al servidor:', {
        id: profileData.id,
        user_id: profileData.user_id,
        name: profileData.name,
        age: profileData.age,
        height: profileData.height,
        weight: profileData.weight,
        gender: profileData.gender
      });
      
      await api.saveProfile(profileData);
    } catch (err) {
      console.warn('⚠️ No se pudo guardar perfil en BD:', err);
    }
    
    setCurrentUserAccount(prev => prev ? { ...prev, profile } : null);
    
    // Ir directamente al dashboard
    setView('calendar');
  }, [currentUserAccount]);

  const handleLogout = useCallback(() => {
    setUser(null);
    setCurrentUserAccount(null);
    setPortal('landing');
    
    // Limpiar localStorage
    localStorage.removeItem('currentUserAccount');
    localStorage.removeItem('userProfile');
  }, []);

  // Mostrar pantalla de carga mientras se recupera la sesión
  if (isLoadingSession) {
    return <LoadingScreen />;
  }

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
      <main className="flex-1 overflow-y-auto">
        {/* Encabezado móvil */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/50 sticky top-0 z-20">
          <button className="flex items-center gap-2" onClick={() => setPortal('landing')}>
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow"><Activity className="text-white w-5 h-5" /></div>
            <span className="text-white font-bold">FitGenius<span className="text-brand-400">AI</span></span>
          </button>
          <button aria-label="Abrir menú" onClick={() => setIsMobileNavOpen(true)} className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 md:p-8">
          {view === 'calendar' && <CalendarView userId={currentUserAccount!.id} onNavigate={handleViewChange} />}
          {view === 'workout' && <WorkoutView user={user!} userId={currentUserAccount!.id} />}
          {view === 'diet' && <DietView user={user!} userId={currentUserAccount!.id} />}
          {view === 'medical' && <MedicalAssistantView user={user!} userId={currentUserAccount!.id} />}
        </div>

        {/* Drawer lateral móvil */}
        <div className={`md:hidden fixed inset-0 z-30 ${isMobileNavOpen ? '' : 'pointer-events-none'}`}>
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileNavOpen(false)}
            className={`absolute inset-0 bg-black/50 transition-opacity ${isMobileNavOpen ? 'opacity-100' : 'opacity-0'}`}
          />
          {/* Panel */}
          <div className={`absolute top-0 left-0 h-full w-72 bg-slate-900/95 border-r border-white/10 backdrop-blur-sm transform transition-transform ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <span className="text-white font-bold">Menú</span>
              <button aria-label="Cerrar menú" onClick={() => setIsMobileNavOpen(false)} className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="px-3 py-4 space-y-2">
              <NavButton active={view === 'calendar'} onClick={() => { handleViewChange('calendar'); setIsMobileNavOpen(false); }} icon={<LayoutDashboard />} label="Diario" />
              <NavButton active={view === 'workout'} onClick={() => { handleViewChange('workout'); setIsMobileNavOpen(false); }} icon={<Dumbbell />} label="Rutinas" />
              <NavButton active={view === 'diet'} onClick={() => { handleViewChange('diet'); setIsMobileNavOpen(false); }} icon={<Utensils />} label="Nutrición" />
              <NavButton active={view === 'medical'} onClick={() => { handleViewChange('medical'); setIsMobileNavOpen(false); }} icon={<Stethoscope />} label="Médico" />
            </nav>
            <div className="p-3 border-t border-white/10 space-y-2">
              <button onClick={() => { setIsEditing(true); setIsMobileNavOpen(false); }} className="w-full text-left text-sm text-slate-400 p-2 hover:bg-white/5 rounded-lg flex items-center gap-2"><Settings className="w-4 h-4" /> Perfil</button>
              <button onClick={() => { handleLogout(); setIsMobileNavOpen(false); }} className="w-full text-left text-sm text-red-400 p-2 hover:bg-white/5 rounded-lg flex items-center gap-2"><LogOut className="w-4 h-4" /> Salir</button>
            </div>
          </div>
        </div>
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