import React, { useState } from 'react';
import { UserProfile, Gender, Goal, ActivityLevel, BodyType } from '../types';
import { Dumbbell, User, Target, Activity, Check, ChevronRight, ChevronLeft, X, Scale, ArrowLeft, AlertCircle, CalendarHeart } from 'lucide-react';

interface Props {
  onComplete: (profile: UserProfile) => void;
  initialData?: UserProfile | null;
  onCancel?: () => void;
}

const ProfileSetup: React.FC<Props> = ({ onComplete, initialData, onCancel }) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>(initialData || {
    name: '',
    age: undefined,
    height: undefined,
    weight: undefined,
    equipment: [],
    gender: Gender.Male,
    goal: Goal.LoseWeight,
    activityLevel: ActivityLevel.Sedentary,
    bodyType: BodyType.Mesomorph,
    isCycleTracking: false,
    cycleLength: 28
  });

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null); // Clear error on change
  };

  const handleEquipmentChange = (item: string) => {
    setFormData(prev => {
      const current = prev.equipment || [];
      if (current.includes(item)) {
        return { ...prev, equipment: current.filter(i => i !== item) };
      } else {
        return { ...prev, equipment: [...current, item] };
      }
    });
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      if (!formData.name || !formData.age || !formData.height || !formData.weight) {
        setError("Por favor completa todos los campos personales.");
        return;
      }
      setStep(step + 1);
    } else if (step === 2) {
      setStep(step + 1);
    } else if (step === 3) {
      // Equipment Validation
      if (!formData.equipment || formData.equipment.length === 0) {
        setError("Debes seleccionar al menos una opción de equipamiento. Selecciona 'Peso Corporal' si no tienes equipo.");
        return;
      }
      // Si lesiones está vacío, poner 'Ninguna'
      if (!formData.injuries || formData.injuries.trim() === "") {
        formData.injuries = "Ninguna";
      }
      onComplete(formData as UserProfile);
    }
  };

  const isEditing = !!initialData;

  const bodyTypeDescriptions = {
    [BodyType.Ectomorph]: "Delgado, estructura ligera, le cuesta ganar peso.",
    [BodyType.Mesomorph]: "Atlético, musculado por naturaleza, gana músculo fácil.",
    [BodyType.Endomorph]: "Estructura ósea grande, tiende a acumular grasa fácil."
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>
      
      <div className="max-w-2xl w-full glass-card rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-fadeIn">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-800 p-10 text-white relative overflow-hidden">
          {/* Cancel/Back Button */}
          {onCancel && (
             <button 
                onClick={onCancel}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors z-20 flex items-center gap-2 group"
                title={isEditing ? "Cancelar Edición" : "Volver al Inicio"}
             >
                {isEditing ? <X className="w-5 h-5 text-white" /> : <ArrowLeft className="w-5 h-5 text-white" />}
                {!isEditing && <span className="text-xs font-bold pr-2 hidden group-hover:inline transition-all animate-fadeIn">Volver</span>}
             </button>
          )}

          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Activity className="w-32 h-32" />
          </div>
          <h1 className="text-3xl font-bold mb-2 relative z-10 tracking-tight">
            {isEditing ? 'Editar Perfil' : 'Bienvenido a FitGenius'}
          </h1>
          <p className="opacity-90 relative z-10 text-brand-100">
            {isEditing ? 'Actualiza tus datos para recalcular tus planes.' : 'Configura tu perfil para generar un plan científico personalizado.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
          {/* Progress Bar */}
          <div className="flex gap-3 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-1">
                 <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'bg-brand-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]' : 'bg-slate-700'}`} />
                 <div className={`text-[10px] mt-2 text-center font-medium uppercase tracking-wider ${step >= i ? 'text-brand-400' : 'text-slate-600'}`}>
                    {i === 1 ? 'Datos' : i === 2 ? 'Objetivos' : 'Equipo'}
                 </div>
              </div>
            ))}
          </div>

          <div className="min-h-[300px]">
          {step === 1 && (
            <div className="space-y-6 animate-slideUp">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="bg-brand-500/10 p-2 rounded-lg"><User className="text-brand-400 w-6 h-6" /></div>
                ¿Quién eres?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputGroup label="Nombre" value={formData.name || ''} onChange={v => handleChange('name', v)} type="text" placeholder="Tu nombre" />
                <InputGroup label="Edad" value={formData.age || ''} onChange={v => handleChange('age', parseInt(v))} type="number" placeholder="Años" />
                <InputGroup label="Altura (cm)" value={formData.height || ''} onChange={v => handleChange('height', parseInt(v))} type="number" placeholder="cm" />
                <InputGroup label="Peso (kg)" value={formData.weight || ''} onChange={v => handleChange('weight', parseInt(v))} type="number" placeholder="kg" />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="text-slate-400 text-sm font-medium">Género</label>
                    <select
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-white focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.gender}
                        onChange={e => handleChange('gender', e.target.value)}
                    >
                        {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
              </div>

              {/* Cycle Tracking - Only for Females */}
              {formData.gender === Gender.Female && (
                  <div className="bg-pink-900/10 border border-pink-500/20 rounded-xl p-4 space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-pink-200 text-sm font-bold cursor-pointer">
                              <CalendarHeart className="w-5 h-5 text-pink-400" />
                              Activar Entrenamiento Hormonal (Cycle Syncing)
                          </label>
                          <div 
                              onClick={() => handleChange('isCycleTracking', !formData.isCycleTracking)}
                              className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${formData.isCycleTracking ? 'bg-pink-500' : 'bg-slate-700'}`}
                          >
                              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.isCycleTracking ? 'translate-x-6' : ''}`} />
                          </div>
                      </div>
                      
                      {formData.isCycleTracking && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-slideUp">
                              <div>
                                  <label className="text-[10px] font-bold text-pink-300 uppercase block mb-1">Inicio Último Periodo</label>
                                  <input 
                                      type="date" 
                                      className="w-full bg-slate-900 border border-pink-500/30 rounded-lg p-2.5 text-white text-sm focus:border-pink-500 outline-none"
                                      value={formData.lastPeriodStart || ''}
                                      onChange={e => handleChange('lastPeriodStart', e.target.value)}
                                  />
                              </div>
                              <div>
                                  <label className="text-[10px] font-bold text-pink-300 uppercase block mb-1">Duración Media del Ciclo</label>
                                  <input 
                                      type="number" 
                                      placeholder="28"
                                      className="w-full bg-slate-900 border border-pink-500/30 rounded-lg p-2.5 text-white text-sm focus:border-pink-500 outline-none"
                                      value={formData.cycleLength || 28}
                                      onChange={e => handleChange('cycleLength', parseInt(e.target.value))}
                                  />
                              </div>
                              <p className="col-span-full text-[10px] text-pink-200/60 leading-tight">
                                  La IA adaptará la intensidad y el tipo de ejercicio según tu fase (Folicular, Ovulación, Lútea, Menstruación) para evitar lesiones y mejorar resultados.
                              </p>
                          </div>
                      )}
                  </div>
              )}

               {/* Somatotype Selector */}
               <div className="space-y-3 pt-4">
                 <label className="text-slate-400 text-sm font-medium flex items-center gap-2">
                    <Scale className="w-4 h-4" /> Somatotipo (Tipo de Cuerpo)
                 </label>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Object.values(BodyType).map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => handleChange('bodyType', type)}
                            className={`group relative p-4 rounded-xl border text-center transition-all overflow-hidden ${
                                formData.bodyType === type 
                                    ? 'bg-brand-500/10 border-brand-500 ring-1 ring-brand-500' 
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:border-slate-500'
                            }`}
                        >
                            {/* SVG Illustration Placeholder based on type */}
                            <div className="mb-3 flex justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                                {type === BodyType.Ectomorph && (
                                    <svg viewBox="0 0 100 200" className="h-24 w-auto fill-current text-slate-500 group-hover:text-brand-400 transition-colors">
                                        <rect x="35" y="60" width="30" height="80" rx="5" />
                                        <circle cx="50" cy="30" r="15" />
                                        <rect x="35" y="145" width="12" height="55" rx="2" />
                                        <rect x="53" y="145" width="12" height="55" rx="2" />
                                        <rect x="20" y="60" width="10" height="70" rx="2" />
                                        <rect x="70" y="60" width="10" height="70" rx="2" />
                                    </svg>
                                )}
                                {type === BodyType.Mesomorph && (
                                    <svg viewBox="0 0 100 200" className="h-24 w-auto fill-current text-slate-500 group-hover:text-brand-400 transition-colors">
                                        <path d="M30,60 L70,60 L65,130 L35,130 Z" />
                                        <circle cx="50" cy="30" r="15" />
                                        <rect x="33" y="130" width="15" height="60" rx="3" />
                                        <rect x="52" y="130" width="15" height="60" rx="3" />
                                        <rect x="15" y="60" width="15" height="60" rx="3" />
                                        <rect x="70" y="60" width="15" height="60" rx="3" />
                                    </svg>
                                )}
                                {type === BodyType.Endomorph && (
                                    <svg viewBox="0 0 100 200" className="h-24 w-auto fill-current text-slate-500 group-hover:text-brand-400 transition-colors">
                                        <ellipse cx="50" cy="95" rx="30" ry="40" />
                                        <circle cx="50" cy="30" r="15" />
                                        <rect x="30" y="130" width="18" height="55" rx="4" />
                                        <rect x="52" y="130" width="18" height="55" rx="4" />
                                        <rect x="10" y="65" width="18" height="60" rx="4" />
                                        <rect x="72" y="65" width="18" height="60" rx="4" />
                                    </svg>
                                )}
                            </div>
                            
                            <div className={`font-bold text-sm mb-1 ${formData.bodyType === type ? 'text-brand-400' : 'text-slate-200'}`}>{type}</div>
                            <div className="text-[10px] leading-tight opacity-70">
                                {bodyTypeDescriptions[type]}
                            </div>
                        </button>
                    ))}
                 </div>
               </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-slideUp">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="bg-brand-500/10 p-2 rounded-lg"><Target className="text-brand-400 w-6 h-6" /></div>
                Tus Metas
              </h2>
              
              <div className="space-y-3">
                <label className="text-slate-400 text-sm font-medium">Objetivo Principal</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.values(Goal).map((g) => (
                    <SelectionButton 
                        key={g} 
                        selected={formData.goal === g} 
                        onClick={() => handleChange('goal', g)}
                        label={g}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-slate-400 text-sm font-medium">Nivel de Actividad Actual</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  value={formData.activityLevel}
                  onChange={e => handleChange('activityLevel', e.target.value)}
                >
                  {Object.values(ActivityLevel).map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-slideUp">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="bg-brand-500/10 p-2 rounded-lg"><Dumbbell className="text-brand-400 w-6 h-6" /></div>
                Entorno y Salud
              </h2>
              
              <div className="space-y-4">
                <label className="text-slate-400 text-sm font-medium">Equipamiento Disponible (Selecciona al menos uno)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['Gimnasio Completo', 'Mancuernas', 'Barra', 'Bandas', 'Peso Corporal', 'Banco', 'Kettlebells'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleEquipmentChange(item)}
                      className={`p-3 rounded-xl border transition-all text-sm font-medium flex items-center justify-between ${
                        formData.equipment?.includes(item)
                          ? 'bg-brand-500 text-white border-brand-400 shadow-lg shadow-brand-500/20'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                      }`}
                    >
                      {item}
                      {formData.equipment?.includes(item) && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                 <label className="text-slate-400 text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                    Lesiones, Escoliosis o Impedimentos Mecánicos
                 </label>
                 <textarea 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-brand-500 outline-none placeholder-slate-600 transition-all resize-none h-24"
                    placeholder="Describe cualquier impedimento mecánico, escoliosis, defectos de nacimiento o lesiones pasadas. La IA adaptará tu rutina para evitar daños."
                    value={formData.injuries || ''}
                    onChange={e => handleChange('injuries', e.target.value)}
                 />
                 <p className="text-[10px] text-slate-500">
                    Se clasificará por prioridad. Si detectamos un alto riesgo, te recomendaremos consultar a un médico.
                 </p>
              </div>
            </div>
          )}
          </div>

          {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-xl text-sm flex items-center gap-2 animate-bounce-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
              </div>
          )}

          <div className="flex justify-between pt-6 border-t border-slate-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 px-6 py-3 text-slate-400 hover:text-white transition-colors font-medium"
              >
                <ChevronLeft className="w-4 h-4" /> Atrás
              </button>
            ) : <div />}
            
            <button
              type="submit"
              className="group flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5"
            >
              {step === 3 ? (isEditing ? 'Guardar Cambios' : 'Crear Plan') : 'Siguiente'}
              {step !== 3 && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </form>
      </div>

      <div className="text-slate-500 text-xs font-medium pb-8 pt-8 opacity-60">
        Desarrollado por: Jesus CZ
      </div>
    </div>
  );
};

const InputGroup = ({ label, value, onChange, type, placeholder }: any) => (
    <div className="space-y-2">
        <label className="text-slate-400 text-sm font-medium">{label}</label>
        <input
        required
        type={type}
        step={type === "number" ? "any" : undefined}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder-slate-600"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        />
    </div>
)

const SelectionButton = ({ selected, onClick, label }: any) => (
    <button
        type="button"
        onClick={onClick}
        className={`p-3.5 rounded-xl border transition-all font-medium text-sm ${
        selected
            ? 'bg-brand-500/10 border-brand-500 text-brand-400 ring-1 ring-brand-500'
            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
        }`}
    >
        {label}
    </button>
)

export default ProfileSetup;