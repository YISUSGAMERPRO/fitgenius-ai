
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserProfile, DietPlan, Meal, MealAlternative } from '../types';
import { api } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend } from 'recharts';
import { BookOpen, Droplets, Utensils, RefreshCw, ChefHat, Salad, List, CheckCircle2, Filter, X, CalendarDays, GripVertical, Download, Printer, ChevronDown, ChevronUp, DollarSign, Wallet, TrendingUp, Flame, Settings2, LayoutTemplate, Info, Circle, Check, Loader2, Shuffle } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface Props {
  user: UserProfile;
  userId: string;
}

const COMMON_PREFERENCES = [
  "Sin Gluten",
  "Sin Lácteos",
  "Bajo en Sodio",
  "Alto en Fibra",
  "Vegetariano",
  "Vegano",
  "Sin Azúcar Añadido",
  "Sin Frutos Secos",
  "Bajo en Carbohidratos",
  "Económico"
];

// Definition of Diet Types with Descriptions
const DIET_OPTIONS = [
    { 
        id: 'Déficit Calórico (Pérdida de Peso)', 
        label: 'Déficit Calórico (Bajar Peso)', 
        desc: 'Consume menos calorías de las que quemas. Ideal para definir y reducir grasa corporal manteniendo la masa muscular.' 
    },
    { 
        id: 'Volumen (Ganancia Muscular)', 
        label: 'Volumen (Ganar Músculo)', 
        desc: 'Superávit calórico controlado. Alta ingesta de proteínas y carbohidratos para maximizar la hipertrofia muscular.' 
    },
    { 
        id: 'Equilibrada', 
        label: 'Equilibrada (Mantenimiento)', 
        desc: 'Balance perfecto de macros para salud general, energía y mantenimiento del peso actual.' 
    },
    { 
        id: 'Keto', 
        label: 'Keto / Cetogénica', 
        desc: 'Muy baja en carbohidratos y alta en grasas saludables. Fuerza al cuerpo a usar grasa como combustible principal.' 
    },
    { 
        id: 'Ayuno Intermitente', 
        label: 'Ayuno Intermitente', 
        desc: 'Concentra la alimentación en una ventana de horas específica para mejorar la sensibilidad a la insulina y digestión.' 
    },
    { 
        id: 'Vegetariana', 
        label: 'Vegetariana', 
        desc: 'Excluye carne y pescado, pero permite lácteos y huevos. Rica en vegetales, legumbres y granos.' 
    },
    { 
        id: 'Vegana', 
        label: 'Vegana', 
        desc: 'Excluye todos los productos de origen animal. Basada 100% en plantas.' 
    },
    { 
        id: 'Paleo', 
        label: 'Paleo', 
        desc: 'Comida "cavernícola": carnes magras, pescados, frutas, verduras, nueces. Sin procesados, lácteos ni granos.' 
    }
];

const DietView: React.FC<Props> = ({ user, userId }) => {
  const [loading, setLoading] = useState(false);
  const [diet, setDiet] = useState<DietPlan | null>(null);
  
  // UI State: 'plan' (View) or 'generator' (Create/Edit)
  const [activeTab, setActiveTab] = useState<'plan' | 'generator'>('generator');

  const [dietType, setDietType] = useState('Déficit Calórico (Pérdida de Peso)');
  const [preferences, setPreferences] = useState<string[]>([]);
  const [customPreference, setCustomPreference] = useState('');
  const [error, setError] = useState('');
  const [regeneratingMealIndex, setRegeneratingMealIndex] = useState<number | null>(null);
  const [showMealAlternativesModal, setShowMealAlternativesModal] = useState<{ dayIdx: number; mealIdx: number; meal: Meal } | null>(null);
  
  // Budget State
  const [budgetAmount, setBudgetAmount] = useState<string>('');
  const [budgetFrequency, setBudgetFrequency] = useState('Semanal');

  // Weekly Schedule State
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Print Frequency State
  const [printFrequency, setPrintFrequency] = useState<'diaria' | 'semanal' | 'mensual'>('diaria');

  // Print Reference
  const printRef = useRef<HTMLDivElement>(null);

  // Meal Completion State: Key format "dayIndex-mealIndex" (e.g., "0-2")
  // Used for stats only in this view
  const [completedMeals, setCompletedMeals] = useState<Record<string, boolean>>({});

  // Keys
  const STORAGE_KEY_DIET = `fitgenius_diet_${userId}`;
  const STORAGE_KEY_TYPE = `fitgenius_diet_type_${userId}`;
  const STORAGE_KEY_PREFS = `fitgenius_diet_preferences_${userId}`;
  const STORAGE_KEY_BUDGET = `fitgenius_diet_budget_${userId}`;
  const STORAGE_KEY_DAY = `fitgenius_diet_day_index_${userId}`;
  const STORAGE_KEY_COMPLETED = `fitgenius_diet_completed_${userId}`;

  // --- PERSISTENCE ---
  useEffect(() => {
    // Cargar dieta guardada
    const savedDiet = localStorage.getItem(STORAGE_KEY_DIET);
    if (savedDiet) {
        try {
            const parsed = JSON.parse(savedDiet);
            // Backward compatibility check
            if (parsed.schedule && Array.isArray(parsed.schedule)) {
                setDiet(parsed);
                setActiveTab('plan'); // Default to plan if exists
            } else if (parsed.meals && Array.isArray(parsed.meals)) {
                setDiet({
                    ...parsed,
                    schedule: [{ day: 'Día Estándar', meals: parsed.meals }]
                });
                setActiveTab('plan');
            }
        } catch (e) { console.error("Error loading diet", e); }
    }

    // Cargar otros ajustes
    const savedType = localStorage.getItem(STORAGE_KEY_TYPE);
    if (savedType) setDietType(savedType);

    const savedPreferences = localStorage.getItem(STORAGE_KEY_PREFS);
    if (savedPreferences) {
        try { setPreferences(JSON.parse(savedPreferences)); } catch (e) {}
    }

    const savedBudget = localStorage.getItem(STORAGE_KEY_BUDGET);
    if (savedBudget) {
        try {
            const { amount, frequency } = JSON.parse(savedBudget);
            setBudgetAmount(amount);
            setBudgetFrequency(frequency);
        } catch (e) {}
    }

    const savedDayIndex = localStorage.getItem(STORAGE_KEY_DAY);
    if (savedDayIndex) {
        const idx = parseInt(savedDayIndex);
        if (!isNaN(idx)) setSelectedDayIndex(idx);
    }

    const savedCompleted = localStorage.getItem(STORAGE_KEY_COMPLETED);
    if (savedCompleted) {
        try { setCompletedMeals(JSON.parse(savedCompleted)); } catch(e) {}
    }
  }, [userId]);

  useEffect(() => {
    if (diet) localStorage.setItem(STORAGE_KEY_DIET, JSON.stringify(diet));
  }, [diet, userId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TYPE, dietType);
  }, [dietType, userId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(preferences));
  }, [preferences, userId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BUDGET, JSON.stringify({ amount: budgetAmount, frequency: budgetFrequency }));
  }, [budgetAmount, budgetFrequency, userId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DAY, selectedDayIndex.toString());
  }, [selectedDayIndex, userId]);

  // Read-only sync for stats
  useEffect(() => {
      localStorage.setItem(STORAGE_KEY_COMPLETED, JSON.stringify(completedMeals));
  }, [completedMeals, userId]);


  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    const timeoutId = setTimeout(() => {
      console.error('Timeout: generar dieta tomó más de 60 segundos');
      setLoading(false);
      setError('La generación de dieta tardó demasiado. Intenta de nuevo.');
    }, 60000);
    
    try {
      console.log('🍽️ Iniciando generación de dieta...');
      const budgetVal = parseFloat(budgetAmount);
      const budget = (budgetVal > 0) ? { amount: budgetVal, frequency: budgetFrequency } : undefined;
      
      const plan = await api.generateDiet(userId, user, dietType, preferences, budget);
      clearTimeout(timeoutId);
      
      if (!plan) {
        throw new Error('La función no devolvió un plan de dieta');
      }
      
      console.log('✅ Plan de dieta recibido:', plan);
      
      // Validar que tiene la estructura correcta
      if (!plan.schedule || !Array.isArray(plan.schedule) || plan.schedule.length === 0) {
        throw new Error('Estructura inválida: falta schedule o está vacío');
      }
      
      // Inject start date to track the week accurately
      plan.startDate = new Date().toISOString();

      setDiet(plan);
      setSelectedDayIndex(0);
      setCompletedMeals({}); // Reset progress on new diet
      setActiveTab('plan'); // Switch to view mode
    } catch (e) {
      clearTimeout(timeoutId);
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error('❌ Error detallado:', e);
      setError(`Error al generar dieta: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSwapMeal = async (mealIndex: number) => {
    if (!diet || !diet.schedule) return;
    
    const currentDay = diet.schedule[selectedDayIndex];
    const meal = currentDay.meals[mealIndex];
    
    // Si el platillo tiene alternativas de ingredientes, mostrar modal informativo
    if (meal.alternatives && meal.alternatives.length > 0) {
      setShowMealAlternativesModal({ dayIdx: selectedDayIndex, mealIdx: mealIndex, meal });
      return;
    }
    
    // Si no tiene alternativas, generar un platillo nuevo con IA
    await generateNewMealAlternative(mealIndex);
  };

  const generateNewMealAlternative = async (mealIndex: number) => {
    if (!diet || !diet.schedule) return;
    
    setRegeneratingMealIndex(mealIndex);
    try {
        const currentDay = diet.schedule[selectedDayIndex];
        const originalMeal = currentDay.meals[mealIndex];
        
        // Obtener todos los platillos del plan para evitar repeticiones
        const mealsToAvoid = diet.schedule.flatMap(day => day.meals.map(m => m.name));
        
        // Calcular macros objetivo basados en el platillo actual
        const targetMacros = {
            calories: originalMeal.calories,
            protein: originalMeal.protein,
            carbs: originalMeal.carbs,
            fats: originalMeal.fats
        };
        
        const newMeal = await api.swapMeal(
            originalMeal,
            originalMeal.type || 'Comida',
            dietType,
            targetMacros,
            preferences,
            mealsToAvoid,
            user
        );
        
        if (newMeal) {
            // Deep clone to update
            const updatedSchedule = [...diet.schedule];
            updatedSchedule[selectedDayIndex] = {
                ...currentDay,
                meals: [...currentDay.meals]
            };
            updatedSchedule[selectedDayIndex].meals[mealIndex] = newMeal;

            setDiet({ ...diet, schedule: updatedSchedule });
            
            // Reset completion status for this specific meal slot
            const key = `${selectedDayIndex}-${mealIndex}`;
            if(completedMeals[key]) {
                const newCompleted = {...completedMeals};
                delete newCompleted[key];
                setCompletedMeals(newCompleted);
            }
        }
    } catch (e) {
        console.error(e);
        alert('No se pudo regenerar el platillo. Intenta de nuevo.');
    } finally {
        setRegeneratingMealIndex(null);
    }
  };

  const handleGenerateNewMealFromModal = async () => {
    if (!showMealAlternativesModal) return;
    const { mealIdx } = showMealAlternativesModal;
    setShowMealAlternativesModal(null);
    await generateNewMealAlternative(mealIdx);
  };

  const toggleMealCheck = (mealIndex: number) => {
      const key = `${selectedDayIndex}-${mealIndex}`;
      setCompletedMeals(prev => ({
          ...prev,
          [key]: !prev[key]
      }));
  };

  const moveMeal = (dragIndex: number, hoverIndex: number) => {
    if (!diet || !diet.schedule) return;
    
    const updatedSchedule = [...diet.schedule];
    const currentDay = updatedSchedule[selectedDayIndex];
    const newMeals = [...currentDay.meals];
    
    const [removed] = newMeals.splice(dragIndex, 1);
    newMeals.splice(hoverIndex, 0, removed);
    
    updatedSchedule[selectedDayIndex] = {
        ...currentDay,
        meals: newMeals
    };
    
    setDiet({ ...diet, schedule: updatedSchedule });

    const key1 = `${selectedDayIndex}-${dragIndex}`;
    const key2 = `${selectedDayIndex}-${hoverIndex}`;
    const val1 = completedMeals[key1];
    const val2 = completedMeals[key2];
    
    const newCompleted = { ...completedMeals };
    if (val1) newCompleted[key2] = val1; else delete newCompleted[key2];
    if (val2) newCompleted[key1] = val2; else delete newCompleted[key1];
    setCompletedMeals(newCompleted);
  };

  const togglePreference = (pref: string) => {
    setPreferences(prev => 
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const addCustomPreference = () => {
      if (customPreference.trim() && !preferences.includes(customPreference.trim())) {
          setPreferences([...preferences, customPreference.trim()]);
          setCustomPreference('');
      }
  };

  const downloadRecipePDF = async () => {
    if (!currentDayMeals || currentDayMeals.length === 0) {
      setError('No hay recetas para descargar');
      return;
    }

    try {
      // Descargar cada receta del día seleccionado
      for (const meal of currentDayMeals) {
        await api.generateRecipePDF(meal);
        // Pequeña pausa entre descargas para que no se solapen
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (err) {
      setError('Error al generar PDFs: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      console.error('Error:', err);
    }
  };

  const downloadPDF = async () => {
    if (!diet) return;
    
    try {
      if (printFrequency === 'diaria' && currentDayMeals && currentDayMeals.length > 0) {
        // Descargar recetas del día actual
        await downloadRecipePDF();
      } else {
        // Para frecuencia semanal/mensual, usar el método anterior (captura)
        if (!printRef.current) return;
        const element = printRef.current;
        const opt = {
          margin: 10,
          filename: `Plan-Nutricional-${new Date().toLocaleDateString()}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };
        html2pdf().set(opt).from(element).save();
      }
    } catch (err) {
      setError('Error al descargar: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const macroData = diet ? [
    { name: 'Proteína', value: diet.dailyTargets.protein, color: '#0ea5e9' }, // Brand 500
    { name: 'Carbos', value: diet.dailyTargets.carbs, color: '#22c55e' }, // Green 500
    { name: 'Grasas', value: diet.dailyTargets.fats, color: '#eab308' }, // Yellow 500
  ] : [];

  const currentDayMeals = diet?.schedule ? diet.schedule[selectedDayIndex]?.meals : [];

  // --- PROGRESS CALCULATION ---
  const dailyProgress = useMemo(() => {
      if (!currentDayMeals) return { calories: 0, protein: 0, carbs: 0, fats: 0 };
      
      return currentDayMeals.reduce((acc, meal, idx) => {
          const isCompleted = completedMeals[`${selectedDayIndex}-${idx}`];
          if (isCompleted) {
              return {
                  calories: acc.calories + meal.calories,
                  protein: acc.protein + meal.protein,
                  carbs: acc.carbs + meal.carbs,
                  fats: acc.fats + meal.fats
              };
          }
          return acc;
      }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
  }, [currentDayMeals, completedMeals, selectedDayIndex]);

  // Current Diet Description
  // Current Diet Description
  const selectedDietDesc = DIET_OPTIONS.find(d => d.id === dietType)?.desc;

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="glass-card p-12 rounded-3xl text-center max-w-md border border-white/5 animate-fadeIn">
          <div className="mb-6 flex justify-center">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-green-400 animate-spin" />
              </div>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Diseñando tu Plan Nutricional</h3>
          <p className="text-slate-400 mb-4">Nuestro nutricionista IA está analizando tus preferencias...</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-slate-300 text-sm">
              <Circle className="w-2 h-2 fill-green-400 text-green-400" />
              Procesando datos
            </div>
            <div className="flex items-center gap-3 text-slate-300 text-sm">
              <Circle className="w-2 h-2 fill-green-400 text-green-400" />
              Generando comidas balanceadas
            </div>
            <div className="flex items-center gap-3 text-slate-300 text-sm">
              <Circle className="w-2 h-2 fill-green-400 text-green-400" />
              Optimizando macronutrientes
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn print:space-y-4">
        <style>{`
        @media print {
            aside, header, .no-print, .tab-switcher {
                display: none !important;
            }
                background: white !important;
                color: black !important;
                border: none !important;
                box-shadow: none !important;
            }
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
        `}</style>

      {/* Modal de Alternativas de Ingredientes */}
      {showMealAlternativesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full border border-white/10 animate-slideUp max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Alternativas de Ingredientes</h3>
                <p className="text-sm text-slate-400 mt-1">Para: <span className="text-green-400 font-semibold">{showMealAlternativesModal.meal.name}</span></p>
              </div>
              <button 
                onClick={() => setShowMealAlternativesModal(null)}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-slate-500 mb-3">Puedes reemplazar estos ingredientes si no los tienes:</p>
            
            <div className="space-y-2 mb-4">
              {showMealAlternativesModal.meal.alternatives?.map((alt, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <Shuffle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white">{alt.name}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Reemplaza: <span className="text-orange-400">{alt.swapFor}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{alt.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-slate-700 pt-4 space-y-2">
              <p className="text-xs text-slate-500 text-center mb-2">¿Prefieres un platillo completamente diferente?</p>
              <button
                onClick={handleGenerateNewMealFromModal}
                className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Generar Platillo Nuevo con IA
              </button>
              <button
                onClick={() => setShowMealAlternativesModal(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-sm"
              >
                Mantener Este Platillo
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tab Switcher */}
      <div className="flex justify-center mb-6 tab-switcher no-print">
          <div className="bg-slate-800 p-1 rounded-xl flex gap-1 border border-slate-700">
              <button 
                onClick={() => setActiveTab('plan')}
                disabled={!diet}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'plan' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'}`}
              >
                <LayoutTemplate className="w-4 h-4" /> Mi Menú Semanal
              </button>
              <button 
                onClick={() => setActiveTab('generator')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'generator' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                <Settings2 className="w-4 h-4" /> Generador & Ajustes
              </button>
          </div>
      </div>

      {/* --- GENERATOR TAB --- */}
      {activeTab === 'generator' && (
        <div className="glass-card p-6 md:p-8 rounded-3xl relative overflow-hidden animate-slideUp">
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-green-500/20 p-2 rounded-xl text-green-400">
                        <ChefHat className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Diseñador de Dieta IA</h2>
                        <p className="text-slate-400 text-sm">Configura tus preferencias y genera un plan completo.</p>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Tipo de Dieta / Objetivo</label>
                            <select
                                value={dietType}
                                onChange={(e) => setDietType(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-green-500 appearance-none transition-all hover:bg-slate-800"
                            >
                                {DIET_OPTIONS.map((opt) => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-[38px] pointer-events-none text-slate-500">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                            
                            {/* Diet Description Snippet */}
                            {selectedDietDesc && (
                                <div className="mt-2 text-xs text-green-300 bg-green-500/10 p-2 rounded-lg border border-green-500/20 flex items-start gap-2">
                                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>{selectedDietDesc}</span>
                                </div>
                            )}
                        </div>

                        {/* Budget Section */}
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <Wallet className="w-3 h-3" /> Presupuesto (MXN)
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                                    <input 
                                        type="number" 
                                        placeholder="ej: 1500" 
                                        value={budgetAmount}
                                        onChange={(e) => setBudgetAmount(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-7 pr-3 text-white outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-600"
                                    />
                                </div>
                                <div className="relative w-32">
                                    <select 
                                        value={budgetFrequency}
                                        onChange={(e) => setBudgetFrequency(e.target.value)}
                                        className="w-full h-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 text-sm text-white outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                                    >
                                        <option value="Diario">Diario</option>
                                        <option value="Semanal">Semanal</option>
                                        <option value="Mensual">Mensual</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dietary Preferences Section */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Filter className="w-3 h-3" /> Filtros y Restricciones
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {COMMON_PREFERENCES.map(pref => {
                                const isSelected = preferences.includes(pref);
                                return (
                                    <button
                                        key={pref}
                                        onClick={() => togglePreference(pref)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                                            isSelected
                                                ? 'bg-green-500/20 border-green-500 text-green-300'
                                                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
                                        }`}
                                    >
                                        {isSelected && <X className="w-3 h-3" />}
                                        {pref}
                                    </button>
                                );
                            })}
                        </div>
                        {/* Custom Preference Input */}
                        <div className="flex gap-2 max-w-md mt-2">
                            <input 
                                type="text" 
                                value={customPreference}
                                onChange={(e) => setCustomPreference(e.target.value)}
                                placeholder="Ej: Alergia al maní..."
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && addCustomPreference()}
                            />
                            <button 
                                onClick={addCustomPreference}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg border border-slate-700 transition-colors"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-xl flex items-center justify-center gap-2 group mt-4 ${
                        loading
                            ? 'bg-slate-700 cursor-wait'
                            : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 shadow-green-500/20 hover:shadow-green-500/40 hover:-translate-y-0.5'
                        }`}
                    >
                        {loading ? 'Diseñando Menú Semanal...' : <><Salad className="w-5 h-5 group-hover:rotate-12 transition-transform"/> Generar Nuevo Plan Semanal</>}
                    </button>
                </div>

                {error && <p className="text-red-400 mt-4 bg-red-500/10 p-2 rounded-lg text-center text-sm">{error}</p>}
            </div>
        </div>
      )}

      {/* --- PLAN VIEW TAB --- */}
      {activeTab === 'plan' && diet && (
        <div ref={printRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slideUp print:gap-4 print:p-4">
            {/* Left Col: Stats */}
            <div className="lg:col-span-1 space-y-6 print:space-y-3">
                 {/* Macro Chart */}
                <div className="glass-card p-6 rounded-3xl border border-white/5 no-print">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center mb-6">Objetivos Diarios (Promedio)</h3>
                    <div className="h-64 relative">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={macroData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {macroData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <ReTooltip 
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                            </PieChart>
                         </ResponsiveContainer>
                         {/* Center Calories */}
                         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center">
                             <div className="text-3xl font-black text-white">{diet.dailyTargets.calories}</div>
                             <div className="text-[10px] text-slate-500 uppercase font-bold">Kcal</div>
                         </div>
                    </div>
                </div>

                {/* Progress Stats - READ ONLY HERE, tracked in Calendar */}
                <div className="glass-card p-6 rounded-3xl border border-white/5 no-print">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-orange-500/20 p-2 rounded-lg">
                            <TrendingUp className="text-orange-400 w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-white">Progreso Diario</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <ProgressBar label="Calorías" current={dailyProgress.calories} target={diet.dailyTargets.calories} color="text-orange-400" bg="bg-orange-500" />
                        <ProgressBar label="Proteína" current={dailyProgress.protein} target={diet.dailyTargets.protein} color="text-blue-400" bg="bg-blue-500" unit="g" />
                        <ProgressBar label="Carbohidratos" current={dailyProgress.carbs} target={diet.dailyTargets.carbs} color="text-green-400" bg="bg-green-500" unit="g" />
                        <ProgressBar label="Grasas" current={dailyProgress.fats} target={diet.dailyTargets.fats} color="text-yellow-400" bg="bg-yellow-500" unit="g" />
                    </div>
                    <div className="mt-4 text-center">
                        <span className="text-[10px] text-slate-500 italic">Marca tus comidas para ver el progreso</span>
                    </div>
                </div>

                {/* Hydration */}
                <div className="bg-blue-500/10 p-6 rounded-3xl border border-blue-500/20 backdrop-blur-sm print:border-0 print:p-0">
                     <div className="flex items-center gap-3 mb-3">
                        <div className="bg-blue-500/20 p-2 rounded-lg print:hidden">
                            <Droplets className="text-blue-400 w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-blue-100">Hidratación</h3>
                     </div>
                     <p className="text-blue-200 text-sm leading-relaxed">{diet.hydrationRecommendation}</p>
                </div>

                {/* Scientific Basis */}
                <div className="glass-card p-6 rounded-3xl border border-white/5 no-print">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="bg-purple-500/20 p-2 rounded-lg">
                            <BookOpen className="text-purple-400 w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-white">Evidencia Científica</h3>
                     </div>
                     <ul className="space-y-3">
                        {(diet?.scientificBasis || []).map((source, idx) => (
                            <li key={idx} className="text-xs text-slate-400 flex items-start gap-2 leading-relaxed">
                                <span className="bg-slate-800 text-slate-300 rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 text-[9px] mt-0.5 border border-slate-700">{idx + 1}</span>
                                {source}
                            </li>
                        ))}
                     </ul>
                </div>
            </div>

            {/* Right Col: Meals & Schedule */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 rounded-3xl border border-white/5 shadow-lg print:bg-white print:p-0 print:shadow-none relative">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                            <span className="text-green-400 text-xs font-bold uppercase tracking-widest mb-2 block">Resumen del Plan</span>
                            <h2 className="text-3xl font-bold text-white mb-3">{diet.title}</h2>
                            <p className="text-slate-300 leading-relaxed font-light">{diet.summary}</p>
                        </div>
                    </div>
                    {preferences.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4 no-print">
                            {preferences.map(p => (
                                <span key={p} className="text-[10px] font-bold bg-white/5 border border-white/10 px-2 py-1 rounded-md text-slate-400 uppercase tracking-wide">
                                    {p}
                                </span>
                            ))}
                        </div>
                    )}
                    {budgetAmount && (
                         <div className="flex items-center gap-2 mt-4 text-xs font-bold text-green-300 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 w-fit">
                             <DollarSign className="w-3 h-3" />
                             Presupuesto: {budgetAmount} MXN ({budgetFrequency})
                         </div>
                    )}
                </div>

                {/* Day Selector Tabs */}
                {(diet?.schedule || []).length > 0 && (
                    <div className="no-print" style={{scrollbarColor: '#475569 transparent', overflowX: 'auto'}}>
                         <div className="flex gap-3 pb-2 snap-x">
                            {(diet?.schedule || []).map((day, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDayIndex(idx)}
                                    className={`snap-start flex items-center justify-center min-w-[120px] p-3 rounded-xl border transition-all duration-300 ${
                                        selectedDayIndex === idx
                                            ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-500/20 scale-105'
                                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
                                    }`}
                                >
                                    <div className="flex flex-col items-center">
                                         <span className="text-sm font-bold uppercase">{day.day}</span>
                                         {selectedDayIndex === idx && <div className="w-1.5 h-1.5 bg-white rounded-full mt-1"></div>}
                                    </div>
                                </button>
                            ))}
                         </div>
                    </div>
                )}

                {/* Print-only Recipe Table */}
                <div className="print-only hidden print:block mb-8">
                    <div className="print-table-container">
                        <h3 className="text-2xl font-bold mb-4 text-black">Plan Nutricional - {diet.title}</h3>
                        <p className="text-gray-700 mb-6">{diet.summary}</p>
                        
                        {printFrequency === 'diaria' && (
                            <div>
                                <h4 className="text-lg font-bold mb-4 text-black">Menú del Día: {diet.schedule?.[selectedDayIndex]?.day || 'Día Estándar'}</h4>
                                {(currentDayMeals || []).map((meal, idx) => (
                                    <div key={idx} className="mb-6 page-break-inside-avoid">
                                        <table className="w-full border-collapse border border-gray-400 mb-4">
                                            <thead>
                                                <tr className="bg-gray-200">
                                                    <th className="border border-gray-400 p-2 text-left font-bold">{meal.name}</th>
                                                    <th className="border border-gray-400 p-2 text-right font-bold">Calorías: {meal.calories}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="border border-gray-400 p-2 font-semibold">Ingredientes:</td>
                                                    <td className="border border-gray-400 p-2"></td>
                                                </tr>
                                                {meal.ingredients?.map((ing, i) => (
                                                    <tr key={i}>
                                                        <td className="border border-gray-400 p-2 pl-4">• {ing}</td>
                                                        <td className="border border-gray-400 p-2"></td>
                                                    </tr>
                                                ))}
                                                <tr>
                                                    <td className="border border-gray-400 p-2 font-semibold" colSpan={2}>Instrucciones:</td>
                                                </tr>
                                                {meal.instructions?.map((instr, i) => (
                                                    <tr key={i}>
                                                        <td className="border border-gray-400 p-2 pl-4" colSpan={2}>{i + 1}. {instr}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        )}

                        {printFrequency === 'semanal' && (
                            <div>
                                <h4 className="text-lg font-bold mb-4 text-black">Plan Semanal Completo</h4>
                                {diet.schedule?.map((day, dayIdx) => (
                                    <div key={dayIdx} className="mb-8">
                                        <h5 className="text-base font-bold mb-2 text-black">{day.day}</h5>
                                        {day.meals?.map((meal, mealIdx) => (
                                            <div key={mealIdx} className="mb-4 text-sm">
                                                <div className="font-semibold text-black">{meal.name} - {meal.calories} cal</div>
                                                <div className="pl-4">
                                                    <div className="font-semibold text-gray-700">Ingredientes:</div>
                                                    <div className="pl-4 text-gray-700">
                                                        {meal.ingredients?.join(', ')}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}

                        {printFrequency === 'mensual' && (
                            <div>
                                <h4 className="text-lg font-bold mb-4 text-black">Resumen Mensual</h4>
                                <table className="w-full border-collapse border border-gray-400">
                                    <thead>
                                        <tr className="bg-gray-200">
                                            <th className="border border-gray-400 p-2 text-left">Día</th>
                                            <th className="border border-gray-400 p-2 text-left">Comida</th>
                                            <th className="border border-gray-400 p-2 text-right">Calorías</th>
                                            <th className="border border-gray-400 p-2 text-right">Proteína</th>
                                            <th className="border border-gray-400 p-2 text-right">Carbos</th>
                                            <th className="border border-gray-400 p-2 text-right">Grasas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {diet.schedule?.map((day, dayIdx) => 
                                            day.meals?.map((meal, mealIdx) => (
                                                <tr key={`${dayIdx}-${mealIdx}`}>
                                                    <td className="border border-gray-400 p-2">{day.day}</td>
                                                    <td className="border border-gray-400 p-2">{meal.name}</td>
                                                    <td className="border border-gray-400 p-2 text-right">{meal.calories}</td>
                                                    <td className="border border-gray-400 p-2 text-right">{meal.protein}g</td>
                                                    <td className="border border-gray-400 p-2 text-right">{meal.carbs}g</td>
                                                    <td className="border border-gray-400 p-2 text-right">{meal.fats}g</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Day Header */}
                <div className="flex items-center gap-2 mb-4">
                    <CalendarDays className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-bold text-white">Menú para: <span className="text-green-400">{diet.schedule ? diet.schedule[selectedDayIndex]?.day : 'Día Estándar'}</span></h3>
                </div>

                <div className="space-y-5">
                    {(currentDayMeals || []).map((meal, idx) => {
                        const isCompleted = completedMeals[`${selectedDayIndex}-${idx}`];
                        return (
                        <div 
                            key={idx}
                            draggable={!regeneratingMealIndex}
                            onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', idx.toString());
                                e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragOver={(e) => {
                                e.preventDefault(); // Necessary to allow dropping
                                e.dataTransfer.dropEffect = 'move';
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                if (!isNaN(dragIndex) && dragIndex !== idx) {
                                    moveMeal(dragIndex, idx);
                                }
                            }}
                            className="cursor-grab active:cursor-grabbing transition-transform active:scale-[0.99]"
                        >
                            <MealCard 
                                meal={meal} 
                                onSwap={() => handleSwapMeal(idx)}
                                isRegenerating={regeneratingMealIndex === idx}
                                isCompleted={isCompleted}
                                onToggle={() => toggleMealCheck(idx)}
                            />
                        </div>
                    )})}
                    {(!currentDayMeals || currentDayMeals.length === 0) && (
                        <div className="text-center p-8 text-slate-500">No hay comidas asignadas para este día.</div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const ProgressBar = ({ label, current, target, color, bg, unit = '' }: any) => {
    const percentage = Math.min(100, Math.round((current / target) * 100));
    
    return (
        <div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-wide mb-1">
                <span className="text-slate-400">{label}</span>
                <span className={color}>{Math.round(current)} / {target}{unit} ({percentage}%)</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${bg} transition-all duration-500 ease-out`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    )
}

const MealCard: React.FC<{ meal: Meal, onSwap: () => void, isRegenerating: boolean, isCompleted: boolean, onToggle: () => void }> = React.memo(({ meal, onSwap, isRegenerating, isCompleted, onToggle }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasAlternatives = meal.alternatives && meal.alternatives.length > 0;

    return (
        <div className={`group bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden hover:border-green-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/5 relative ${isRegenerating ? 'opacity-70' : ''} ${isCompleted ? 'opacity-60 bg-slate-900/20' : ''}`}>
            
            {/* Loading Overlay */}
            {isRegenerating && (
                <div className="absolute inset-0 z-20 bg-slate-900/80 flex items-center justify-center backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
                        <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Cocinando nueva opción...</span>
                    </div>
                </div>
            )}

            <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-start mb-4 gap-4">
                    <div className="flex items-start gap-4 flex-1">
                        {/* Checkbox */}
                        <button 
                            onClick={onToggle}
                            className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                                isCompleted 
                                ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20' 
                                : 'border-slate-600 text-transparent hover:border-green-500'
                            }`}
                            title="Marcar como comida realizada"
                        >
                            {isCompleted ? <Check className="w-5 h-5" /> : <Circle className="w-5 h-5 text-slate-700" />}
                        </button>

                        <div className="mt-1.5 cursor-grab text-slate-600 hover:text-slate-400 transition-colors no-print" title="Arrastrar para reordenar">
                            <GripVertical className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className={`text-xl font-bold transition-all ${isCompleted ? 'text-slate-500 line-through' : 'text-white group-hover:text-green-100'}`}>
                                    {meal.name}
                                </h3>
                                {meal.type && (
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded uppercase">
                                        {meal.type}
                                    </span>
                                )}
                            </div>
                            <div className={`flex flex-wrap gap-3 mt-2 text-sm font-medium ${isCompleted ? 'opacity-50 grayscale' : ''}`}>
                                <span className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">{meal.calories} kcal</span>
                                <span className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">P: {meal.protein}g</span>
                                <span className="text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">C: {meal.carbs}g</span>
                                <span className="text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">G: {meal.fats}g</span>
                                {meal.prepTime && (
                                    <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-xs">⏱️ {meal.prepTime}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {!isCompleted && (
                        <button 
                            onClick={onSwap}
                            disabled={isRegenerating}
                            className={`self-start p-2 rounded-lg transition-colors border no-print flex items-center gap-1 ${
                                hasAlternatives 
                                    ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20' 
                                    : 'hover:bg-slate-800 text-slate-500 hover:text-green-400 border-transparent hover:border-slate-700'
                            }`}
                            title={hasAlternatives ? 'Ver alternativas de ingredientes' : 'Generar platillo alternativo'}
                        >
                            {hasAlternatives ? (
                                <>
                                    <Shuffle className="w-4 h-4" />
                                    <span className="text-[10px] font-bold">{meal.alternatives?.length}</span>
                                </>
                            ) : (
                                <RefreshCw className="w-4 h-4" />
                            )}
                        </button>
                    )}
                </div>
                
                <p className={`text-slate-400 mb-6 text-sm leading-relaxed border-b border-white/5 pb-6 ${isCompleted ? 'line-through opacity-50' : ''}`}>
                    {meal.description}
                </p>

                {/* Collapsible Details Section */}
                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-4">
                        {/* Ingredients Column */}
                        <div>
                            <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                                <List className="w-4 h-4 text-green-400" /> Ingredientes
                            </h4>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                {meal.ingredients.map((ing, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300 group/ing">
                                        <div className="mt-0.5 text-green-500/50 group-hover/ing:text-green-400 transition-colors">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="group-hover/ing:text-white transition-colors">{ing}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Instructions Column (Timeline Style) */}
                        <div>
                            <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                                <ChefHat className="w-4 h-4 text-green-400" /> Preparación
                            </h4>
                            {meal.instructions && meal.instructions.length > 0 ? (
                                <div className="relative pl-2">
                                    {/* Vertical Timeline Line */}
                                    <div className="absolute left-[11px] top-3 bottom-3 w-px bg-slate-800"></div>
                                    
                                    <div className="space-y-4">
                                        {meal.instructions.map((step, i) => (
                                            <div key={i} className="relative pl-8 group/step">
                                                {/* Number Dot */}
                                                <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 group-hover/step:border-green-500 group-hover/step:text-green-400 transition-colors z-10 shadow-sm">
                                                    {i + 1}
                                                </div>
                                                <p className="text-sm text-slate-400 leading-relaxed group-hover/step:text-slate-300 transition-colors">
                                                    {step}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 text-center">
                                    <p className="text-xs text-slate-500 italic">Instrucciones detalladas no disponibles. Regenera el plato para ver los pasos.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Expand Toggle Button */}
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-500 hover:text-green-400 transition-colors uppercase tracking-widest border-t border-white/5 hover:bg-white/5 rounded-b-xl"
                >
                    {isExpanded ? (
                        <>Ocultar Receta <ChevronUp className="w-4 h-4" /></>
                    ) : (
                        <>Ver Receta Completa <ChevronDown className="w-4 h-4" /></>
                    )}
                </button>
            </div>
        </div>
    )
})

export default DietView;
