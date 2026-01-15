import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, WorkoutPlan, Exercise, WorkoutLog, ExerciseSet, ExerciseAlternative } from '../types';
import { api } from '../services/api';
import { Play, Pause, Power, Trophy, Loader2, RefreshCw, ChevronDown, ChevronUp, Video, CheckCircle2, Circle, Dumbbell, Calendar, Info, AlertTriangle, ArrowRight, Settings2, Youtube, Shuffle, X, Timer, Volume2, VolumeX } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

// Opciones de tiempo de descanso predefinidas (en segundos)
const REST_TIME_OPTIONS = [30, 45, 60, 90, 120, 180];

interface Props {
  user: UserProfile;
  userId: string;
}

const WORKOUT_TYPES = [
    "Weider (Frecuencia 1)",
    "Torso / Pierna",
    "Full Body",
    "Push / Pull / Legs",
    "Upper / Lower",
    "Arnold Split",
    "Calistenia",
    "Cardio Estricto",
    "HIIT / Tabata",
    "Pilates",
    "Yoga Power",
    "Zumba / Baile",
    "Kickboxing"
];

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const WorkoutView: React.FC<Props> = ({ user, userId }) => {
    // Persistence Keys
    const STORAGE_KEY_PLAN = `fitgenius_workout_${userId}`;
    const STORAGE_KEY_HISTORY = `fitgenius_history_${userId}`;
    const STORAGE_KEY_SESSION = `fitgenius_session_${userId}`;
    const STORAGE_KEY_COMPLETED_DAYS = `fitgenius_completed_days_${userId}`;

    // State
    const [plan, setPlan] = useState<WorkoutPlan | null>(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showGenerator, setShowGenerator] = useState(false);

    // Generator State
    const [genType, setGenType] = useState(WORKOUT_TYPES[0]);
    const [genFocus, setGenFocus] = useState('');
    const [genDuration, setGenDuration] = useState('expert'); // 'expert' or weeks

    // Session State
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const [isSessionPaused, setIsSessionPaused] = useState(false);
    const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({}); // Key: "exerciseIdx-setIdx"
    const [completedDays, setCompletedDays] = useState<Record<string, boolean>>({}); // Key: "planId-dayIndex"
    const [showCelebration, setShowCelebration] = useState(false);
    
    // UI State
    const [regeneratingExerciseId, setRegeneratingExerciseId] = useState<string | null>(null);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showAlternativesModal, setShowAlternativesModal] = useState<{ dayIdx: number; exerciseIdx: number; exercise: Exercise } | null>(null);

    // Rest Timer State
    const [restTimeSeconds, setRestTimeSeconds] = useState(60); // Tiempo de descanso seleccionado
    const [restTimerActive, setRestTimerActive] = useState(false);
    const [restTimerRemaining, setRestTimerRemaining] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Timer Ref
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Load Plan
    useEffect(() => {
        const savedPlan = localStorage.getItem(STORAGE_KEY_PLAN);
        if (savedPlan) {
            try {
                setPlan(JSON.parse(savedPlan));
            } catch (e) {
                console.error("Error parsing plan", e);
                setShowGenerator(true);
            }
        } else {
            setShowGenerator(true);
        }
        
        // Load completed days
        const savedCompletedDays = localStorage.getItem(STORAGE_KEY_COMPLETED_DAYS);
        if (savedCompletedDays) {
            try {
                setCompletedDays(JSON.parse(savedCompletedDays));
            } catch (e) {
                console.error("Error parsing completed days", e);
            }
        }

        // Check for active session recovery
        const savedSession = localStorage.getItem(STORAGE_KEY_SESSION);
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                setIsSessionActive(true);
                setSessionSeconds(session.seconds || 0);
                setCompletedSets(session.completed || {});
                setSelectedDayIndex(session.dayIndex || 0);
                setIsSessionPaused(true); // Start paused to avoid jump
            } catch (e) {
                console.error("Error restoring session", e);
            }
        }
    }, [userId]);

    // Timer Logic
    useEffect(() => {
        if (isSessionActive && !isSessionPaused) {
            timerRef.current = setInterval(() => {
                setSessionSeconds(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isSessionActive, isSessionPaused]);

    // Save Session State on Change
    useEffect(() => {
        if (isSessionActive) {
            localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify({
                seconds: sessionSeconds,
                completed: completedSets,
                dayIndex: selectedDayIndex,
                date: new Date().toISOString()
            }));
        }
    }, [sessionSeconds, completedSets, isSessionActive, selectedDayIndex, userId]);

    // Rest Timer Logic
    useEffect(() => {
        if (restTimerActive && restTimerRemaining > 0) {
            restTimerRef.current = setInterval(() => {
                setRestTimerRemaining(prev => {
                    if (prev <= 1) {
                        // Timer finished
                        setRestTimerActive(false);
                        if (soundEnabled) {
                            playNotificationSound();
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (restTimerRef.current) clearInterval(restTimerRef.current);
        }
        return () => {
            if (restTimerRef.current) clearInterval(restTimerRef.current);
        };
    }, [restTimerActive, soundEnabled]);

    // Cargar preferencia de tiempo de descanso
    useEffect(() => {
        const savedRestTime = localStorage.getItem(`fitgenius_rest_time_${userId}`);
        if (savedRestTime) {
            setRestTimeSeconds(parseInt(savedRestTime) || 60);
        }
    }, [userId]);

    // Play notification sound when timer ends
    const playNotificationSound = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.3;
            
            oscillator.start();
            setTimeout(() => {
                oscillator.frequency.value = 1000;
            }, 150);
            setTimeout(() => {
                oscillator.frequency.value = 1200;
            }, 300);
            setTimeout(() => {
                oscillator.stop();
                audioContext.close();
            }, 500);
        } catch (e) {
            console.log('Audio not supported');
        }
    };

    // Start rest timer
    const startRestTimer = (customTime?: number) => {
        const time = customTime || restTimeSeconds;
        setRestTimerRemaining(time);
        setRestTimerActive(true);
    };

    // Stop rest timer
    const stopRestTimer = () => {
        setRestTimerActive(false);
        setRestTimerRemaining(0);
    };

    // Update rest time preference
    const updateRestTime = (seconds: number) => {
        setRestTimeSeconds(seconds);
        localStorage.setItem(`fitgenius_rest_time_${userId}`, seconds.toString());
    };

    // Helper: Fail-safe ID Generator
    const generateSafeId = () => {
        try {
            if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
                return crypto.randomUUID();
            }
        } catch (e) {
            // Ignore crypto errors
        }
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    };

    const handleGenerate = async () => {
        setLoading(true);
        const timeoutId = setTimeout(() => {
            console.error('Timeout: generar rutina tomó más de 60 segundos');
            setLoading(false);
            alert('La generación de rutina tardó demasiado. Intenta de nuevo.');
        }, 60000);
        
        try {
            console.log('🏋️ Iniciando generación de rutina...');
            const newPlan = await api.generateWorkout(userId, user, genType);
            clearTimeout(timeoutId);
            
            if (!newPlan) {
                throw new Error('La función no devolvió un plan');
            }
            
            console.log('✅ Plan recibido:', newPlan);
            
            // Validar que tiene la estructura correcta
            if (!newPlan.schedule || !Array.isArray(newPlan.schedule) || newPlan.schedule.length === 0) {
                throw new Error('Estructura inválida: falta schedule o está vacío');
            }
            
            newPlan.startDate = new Date().toISOString();
            setPlan(newPlan);
            localStorage.setItem(STORAGE_KEY_PLAN, JSON.stringify(newPlan));
            setShowGenerator(false);
            setSelectedDayIndex(0);
        } catch (error) {
            clearTimeout(timeoutId);
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error("❌ Error detallado:", error);
            alert(`Error generando rutina: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSwapExercise = async (dayIdx: number, exerciseIdx: number) => {
        if (!plan) return;
        const exercise = plan.schedule[dayIdx].exercises[exerciseIdx];
        
        // Si el ejercicio tiene alternativas pre-generadas, mostrar el modal
        if (exercise.alternatives && exercise.alternatives.length > 0) {
            setShowAlternativesModal({ dayIdx, exerciseIdx, exercise });
            return;
        }
        
        // Si no tiene alternativas, generar una nueva con IA
        const regenId = `${dayIdx}-${exerciseIdx}`;
        setRegeneratingExerciseId(regenId);

        try {
            const exercisesToAvoid = plan.schedule[dayIdx].exercises.map(e => e.name);
            const newExercise = await api.swapExercise(
                exercise.name,
                exercise.muscleGroup,
                user.equipment || [],
                exercisesToAvoid,
                user
            );
            
            if (newExercise) {
                const newSchedule = [...plan.schedule];
                newSchedule[dayIdx].exercises[exerciseIdx] = {
                    ...newExercise,
                    category: exercise.category // Mantener la categoría original
                };
                const updatedPlan = { ...plan, schedule: newSchedule };
                
                setPlan(updatedPlan);
                localStorage.setItem(STORAGE_KEY_PLAN, JSON.stringify(updatedPlan));
            }
        } catch (e) {
            console.error(e);
            alert("No se pudo regenerar el ejercicio. Intenta de nuevo.");
        } finally {
            setRegeneratingExerciseId(null);
        }
    };

    const handleSelectAlternative = (alternativeName: string) => {
        if (!plan || !showAlternativesModal) return;
        
        const { dayIdx, exerciseIdx, exercise } = showAlternativesModal;
        
        // Crear el ejercicio alternativo con los mismos parámetros base
        const alternativeExercise: Exercise = {
            ...exercise,
            name: alternativeName,
            videoQuery: alternativeName, // Actualizar para búsqueda de video
            alternatives: [
                { name: exercise.name, reason: 'Ejercicio original' },
                ...(exercise.alternatives || []).filter(a => a.name !== alternativeName)
            ]
        };
        
        const newSchedule = [...plan.schedule];
        newSchedule[dayIdx].exercises[exerciseIdx] = alternativeExercise;
        const updatedPlan = { ...plan, schedule: newSchedule };
        
        setPlan(updatedPlan);
        localStorage.setItem(STORAGE_KEY_PLAN, JSON.stringify(updatedPlan));
        setShowAlternativesModal(null);
    };

    const handleGenerateNewAlternative = async () => {
        if (!plan || !showAlternativesModal) return;
        
        const { dayIdx, exerciseIdx, exercise } = showAlternativesModal;
        setShowAlternativesModal(null);
        
        const regenId = `${dayIdx}-${exerciseIdx}`;
        setRegeneratingExerciseId(regenId);

        try {
            const exercisesToAvoid = [
                ...plan.schedule[dayIdx].exercises.map(e => e.name),
                ...(exercise.alternatives?.map(a => a.name) || [])
            ];
            
            const newExercise = await api.swapExercise(
                exercise.name,
                exercise.muscleGroup,
                user.equipment || [],
                exercisesToAvoid,
                user
            );
            
            if (newExercise) {
                const newSchedule = [...plan.schedule];
                newSchedule[dayIdx].exercises[exerciseIdx] = {
                    ...newExercise,
                    category: exercise.category
                };
                const updatedPlan = { ...plan, schedule: newSchedule };
                
                setPlan(updatedPlan);
                localStorage.setItem(STORAGE_KEY_PLAN, JSON.stringify(updatedPlan));
            }
        } catch (e) {
            console.error(e);
            alert("No se pudo generar alternativa. Intenta de nuevo.");
        } finally {
            setRegeneratingExerciseId(null);
        }
    };

    const startSession = () => {
        setIsSessionActive(true);
        setSessionSeconds(0);
        setCompletedSets({});
        setIsSessionPaused(false);
    };

    const handleSuspendSession = () => {
        setIsSessionActive(false);
        setIsSessionPaused(false);
        // Session data remains in localStorage due to effect, but we stop the view
        setIsSessionPaused(true);
        alert("Sesión pausada y guardada. Puedes retomarla cuando quieras.");
    };

    const onConfirmFinishWorkout = () => {
        if (!plan || !plan.schedule) return;

        try {
            const currentDay = plan.schedule[selectedDayIndex];
            if (!currentDay) throw new Error("Plan day not found");
            
            // Calculate stats
            const completedCount = Object.keys(completedSets).length;
            
            // Construct Log safely
            const log: WorkoutLog = {
                id: generateSafeId(),
                date: new Date().toISOString(),
                workoutTitle: currentDay.dayName || "Entrenamiento",
                durationSeconds: sessionSeconds,
                exercisesCompleted: completedCount,
                totalExercises: currentDay.exercises ? currentDay.exercises.length : 0,
                exercises: (currentDay.exercises || []).map((ex, idx) => {
                   // Safely get sets count
                   const setsCount = Number(ex.sets) || 0;
                   
                   // Calculate how many sets were actually marked completed
                   let setsDone = 0;
                   for(let i = 0; i < setsCount; i++) {
                       if (completedSets[`${idx}-${i}`]) setsDone++;
                   }
                   
                   // Create performedSets array safely using a classic loop to avoid Array.from issues
                   const performedSets: ExerciseSet[] = [];
                   for (let i = 0; i < setsDone; i++) {
                       performedSets.push({
                           weight: 0,
                           reps: parseInt(ex.reps as string) || 0
                       });
                   }
                   
                   return {
                       ...ex,
                       performedSets: performedSets
                   };
                })
            };

            // Save History
            const existingHistoryStr = localStorage.getItem(STORAGE_KEY_HISTORY);
            let history: WorkoutLog[] = [];
            try {
                history = existingHistoryStr ? JSON.parse(existingHistoryStr) : [];
            } catch(e) { history = []; }
            
            history.push(log);
            localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));

            // Mark day as completed
            const dayKey = `${plan.id}-${selectedDayIndex}`;
            const updatedCompletedDays = { ...completedDays, [dayKey]: true };
            setCompletedDays(updatedCompletedDays);
            localStorage.setItem(STORAGE_KEY_COMPLETED_DAYS, JSON.stringify(updatedCompletedDays));

            // Clear Session
            localStorage.removeItem(STORAGE_KEY_SESSION);
            setIsSessionActive(false);
            setSessionSeconds(0);
            setCompletedSets({});
            setShowFinishModal(false);
            
            // Show celebration animation
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 3000);
            
        } catch (error) {
            console.error("Error saving workout:", error);
            alert("Error al guardar el progreso. Verifica que tu rutina sea válida.");
        }
    };

    const handleFinishClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowFinishModal(true);
    };

    const toggleSet = (exerciseIdx: number, setIdx: number) => {
        const key = `${exerciseIdx}-${setIdx}`;
        const wasCompleted = completedSets[key];
        
        setCompletedSets(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
        
        // Si se marca como completada (no estaba completada antes), iniciar timer
        if (!wasCompleted && isSessionActive) {
            startRestTimer();
        }
    };

    const getYoutubeLink = (query: string) => {
        // Redirect to YouTube search with the exercise query
        // YouTube will show relevant results immediately
        return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=mAEB`;
    };

    // Loading Screen for Workout Generation
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="glass-card p-12 rounded-3xl text-center max-w-md border border-white/5 animate-fadeIn">
                    <div className="mb-6 flex justify-center">
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 bg-brand-500/20 rounded-full animate-pulse"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
                            </div>
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Generando tu Rutina Personalizada</h3>
                    <p className="text-slate-400 mb-4">Nuestro entrenador IA está diseñando un plan optimizado para ti...</p>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-slate-300 text-sm">
                            <Circle className="w-2 h-2 fill-brand-400 text-brand-400" />
                            Analizando tu perfil
                        </div>
                        <div className="flex items-center gap-3 text-slate-300 text-sm">
                            <Circle className="w-2 h-2 fill-brand-400 text-brand-400" />
                            Seleccionando ejercicios
                        </div>
                        <div className="flex items-center gap-3 text-slate-300 text-sm">
                            <Circle className="w-2 h-2 fill-brand-400 text-brand-400" />
                            Optimizando progresión
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (showGenerator || !plan) {
        return (
            <div className="glass-card p-8 rounded-3xl animate-fadeIn max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-brand-500/20 p-2 rounded-xl text-brand-400">
                        <Settings2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Generador de Rutinas</h2>
                        <p className="text-slate-400 text-sm">Configura tu plan de entrenamiento.</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo de Entrenamiento</label>
                        <select 
                            className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                            value={genType}
                            onChange={e => setGenType(e.target.value)}
                        >
                            {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enfoque Muscular (Opcional)</label>
                        <input 
                            type="text"
                            placeholder="Ej: Glúteos, Hombros, Espalda Alta..." 
                            className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-brand-500 placeholder-slate-600"
                            value={genFocus}
                            onChange={e => setGenFocus(e.target.value)}
                        />
                    </div>

                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Duración del Ciclo</label>
                        <select 
                            className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                            value={genDuration}
                            onChange={e => setGenDuration(e.target.value)}
                        >
                            <option value="expert">Automático (Recomendado por IA)</option>
                            <option value="4">4 Semanas</option>
                            <option value="8">8 Semanas</option>
                            <option value="12">12 Semanas</option>
                        </select>
                    </div>

                    <button 
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all mt-4"
                    >
                        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creando Plan...</> : <><Dumbbell className="w-5 h-5" /> Generar Rutina</>}
                    </button>
                    
                    {plan && (
                         <button 
                            onClick={() => setShowGenerator(false)}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm"
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Guard against schedule not existing or index out of bounds
    const currentDay = (plan.schedule && plan.schedule[selectedDayIndex]) 
        ? plan.schedule[selectedDayIndex] 
        : { dayName: 'Día no encontrado', focus: '', exercises: [] };

    return (
        <div className="space-y-6 animate-slideUp pb-20 md:pb-0">
             
             {/* Celebration Animation */}
             <CelebrationOverlay show={showCelebration} />
             
             {/* Confirmation Modal */}
             <ConfirmModal 
                isOpen={showFinishModal}
                onClose={() => setShowFinishModal(false)}
                onConfirm={onConfirmFinishWorkout}
                title="Finalizar Entrenamiento"
                message="¿Estás seguro de que quieres terminar la rutina y guardar tu progreso?"
                confirmText="Terminar y Guardar"
                isDestructive={false}
             />

             {/* Alternatives Modal */}
             {showAlternativesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
                    <div className="glass-card p-6 rounded-2xl max-w-md w-full border border-white/10 animate-slideUp">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white">Cambiar Ejercicio</h3>
                                <p className="text-sm text-slate-400">Selecciona una alternativa para:</p>
                                <p className="text-brand-400 font-semibold mt-1">{showAlternativesModal.exercise.name}</p>
                            </div>
                            <button 
                                onClick={() => setShowAlternativesModal(null)}
                                className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                            {showAlternativesModal.exercise.alternatives?.map((alt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectAlternative(alt.name)}
                                    className="w-full p-4 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 hover:border-brand-500/50 rounded-xl text-left transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-white group-hover:text-brand-300">{alt.name}</p>
                                            <p className="text-xs text-slate-400 mt-1">{alt.reason}</p>
                                        </div>
                                        <Shuffle className="w-4 h-4 text-slate-500 group-hover:text-brand-400" />
                                    </div>
                                </button>
                            ))}
                        </div>
                        
                        <div className="border-t border-slate-700 pt-4">
                            <button
                                onClick={handleGenerateNewAlternative}
                                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Generar Nueva Alternativa con IA
                            </button>
                        </div>
                    </div>
                </div>
             )}

             {/* Rest Timer Overlay */}
             {restTimerActive && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
                    <div className="glass-card p-8 rounded-3xl max-w-sm w-full border border-brand-500/30 animate-slideUp text-center">
                        {/* Timer Icon */}
                        <div className="mb-6">
                            <div className="w-24 h-24 mx-auto bg-brand-500/20 rounded-full flex items-center justify-center animate-pulse">
                                <Timer className="w-12 h-12 text-brand-400" />
                            </div>
                        </div>

                        {/* Timer Display */}
                        <h2 className="text-lg font-bold text-slate-300 uppercase tracking-widest mb-2">Tiempo de Descanso</h2>
                        <div className="text-7xl font-mono font-black text-white mb-6 tabular-nums">
                            {Math.floor(restTimerRemaining / 60)}:{(restTimerRemaining % 60).toString().padStart(2, '0')}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-800 rounded-full h-3 mb-6 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-brand-500 to-brand-400 h-full rounded-full transition-all duration-1000 ease-linear"
                                style={{ width: `${(restTimerRemaining / restTimeSeconds) * 100}%` }}
                            />
                        </div>

                        {/* Quick Time Selection */}
                        <div className="mb-6">
                            <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Cambiar tiempo</p>
                            <div className="grid grid-cols-3 gap-2">
                                {REST_TIME_OPTIONS.map(time => (
                                    <button
                                        key={time}
                                        onClick={() => {
                                            updateRestTime(time);
                                            startRestTimer(time);
                                        }}
                                        className={`py-2 px-3 rounded-xl text-sm font-bold transition-all ${
                                            restTimeSeconds === time 
                                                ? 'bg-brand-600 text-white border-2 border-brand-400' 
                                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white'
                                        }`}
                                    >
                                        {time < 60 ? `${time}s` : `${time / 60}m`}{time === 90 && '30s'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sound Toggle & Skip */}
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                className={`p-3 rounded-xl border transition-all ${
                                    soundEnabled 
                                        ? 'bg-slate-800 text-brand-400 border-brand-500/30' 
                                        : 'bg-slate-800/50 text-slate-500 border-slate-700'
                                }`}
                                title={soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
                            >
                                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                            </button>
                            
                            <button
                                onClick={stopRestTimer}
                                className="flex-1 py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                            >
                                <X className="w-5 h-5" />
                                Saltar Descanso
                            </button>
                        </div>
                    </div>
                </div>
             )}

             {/* Header Section */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div>
                     <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                         {plan.title}
                         {plan.cyclePhase && (
                             <span className="text-xs font-bold bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full border border-pink-500/30">
                                 Fase {plan.cyclePhase}
                             </span>
                         )}
                     </h2>
                     <p className="text-slate-400 text-sm max-w-2xl">{plan.description}</p>
                 </div>
                 <div className="flex gap-2">
                     <button 
                        onClick={() => setShowGenerator(true)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors border border-slate-700"
                        title="Regenerar Rutina"
                     >
                         <Settings2 className="w-5 h-5" />
                     </button>
                 </div>
             </div>

             {/* Days Navigation - Scrollbar Enabled */}
             <div className="flex overflow-x-auto pb-4 gap-3">
                 {(plan?.schedule || []).map((day, idx) => {
                     const dayKey = `${plan.id}-${idx}`;
                     const isCompleted = completedDays[dayKey];
                     
                     return (
                         <button
                            key={idx}
                            onClick={() => setSelectedDayIndex(idx)}
                            className={`flex-shrink-0 px-5 py-3 rounded-xl border transition-all whitespace-nowrap relative ${
                                selectedDayIndex === idx 
                                    ? 'bg-brand-600 text-white border-brand-500 shadow-lg shadow-brand-500/20' 
                                    : isCompleted
                                    ? 'bg-green-900/30 text-green-400 border-green-500/50 hover:bg-green-900/40'
                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                            }`}
                         >
                             {isCompleted && (
                                 <CheckCircle2 className="w-4 h-4 absolute top-1 right-1 text-green-400" />
                             )}
                             <span className="block text-xs font-bold uppercase opacity-70">Día {idx + 1}</span>
                             <span className="font-bold">{day.dayName}</span>
                         </button>
                     );
                 })}
             </div>

             {/* Active Session Header Sticky */}
             {isSessionActive && (
                  <div className="sticky top-0 z-30 animate-slideUp">
                      <div className="bg-slate-900/90 backdrop-blur-xl p-4 rounded-2xl border border-brand-500/30 flex items-center justify-between shadow-2xl">
                          <div className="flex items-center gap-4">
                              <div className="flex flex-col">
                                  <div className="text-[10px] text-brand-300 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
                                      <div className={`w-2 h-2 rounded-full ${isSessionPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}></div>
                                      {isSessionPaused ? 'En Pausa' : 'Entrenando'}
                                  </div>
                                  <div className="text-2xl font-mono font-black text-white tabular-nums leading-none">
                                      {formatTime(sessionSeconds)}
                                  </div>
                              </div>
                              
                              <div className="h-8 w-px bg-slate-700 mx-2 hidden sm:block"></div>
                              
                              <div className="hidden sm:block">
                                  <h3 className="text-sm font-bold text-white truncate max-w-[150px]">{currentDay.dayName}</h3>
                                  <span className="text-xs text-slate-400">Progreso: {Object.keys(completedSets).length} series</span>
                              </div>
                          </div>

                          <div className="flex items-center gap-2">
                              {/* Rest Timer Quick Settings */}
                              <div className="hidden sm:flex items-center gap-1 mr-2 bg-slate-800/50 rounded-xl px-2 py-1 border border-slate-700">
                                  <Timer className="w-4 h-4 text-brand-400" />
                                  <select
                                      value={restTimeSeconds}
                                      onChange={(e) => updateRestTime(parseInt(e.target.value))}
                                      className="bg-transparent text-xs text-slate-300 font-mono border-none outline-none cursor-pointer"
                                      title="Tiempo de descanso entre series"
                                  >
                                      {REST_TIME_OPTIONS.map(time => (
                                          <option key={time} value={time} className="bg-slate-800">
                                              {time < 60 ? `${time}s` : time === 60 ? '1m' : time === 90 ? '1m30s' : time === 120 ? '2m' : '3m'}
                                          </option>
                                      ))}
                                  </select>
                              </div>

                              <button 
                                  onClick={handleSuspendSession}
                                  className="p-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                                  title="Guardar y Salir (Suspender)"
                              >
                                  <Power className="w-5 h-5" />
                              </button>

                              <button 
                                  onClick={() => setIsSessionPaused(!isSessionPaused)}
                                  className={`p-3 rounded-xl border transition-all ${
                                      isSessionPaused 
                                          ? 'bg-green-600 text-white border-green-500 shadow-lg shadow-green-500/20' 
                                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                                  }`}
                              >
                                  {isSessionPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                              </button>
                          </div>
                      </div>
                  </div>
              )}

              {!isSessionActive && (
                  <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          {currentDay.dayName} <span className="text-slate-500 text-sm font-normal">({currentDay.focus})</span>
                      </h3>
                  </div>
              )}
              
              {currentDay.exercises && currentDay.exercises.length > 0 ? (
                  <>
                    {/* START BUTTON (Plan View Only) */}
                    {!isSessionActive && (
                        <button 
                            onClick={startSession}
                            className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-500/20 flex items-center justify-center gap-3 transition-transform hover:scale-[1.01] animate-bounce-in"
                        >
                            <Play className="w-6 h-6 fill-current" />
                            INICIAR RUTINA
                        </button>
                    )}

                    <div className={`grid grid-cols-1 gap-4 ${isSessionActive ? 'pb-48' : ''}`}>
                        {(currentDay.exercises || []).map((ex, idx) => (
                            <ExerciseCard 
                                key={`${selectedDayIndex}-${idx}`} 
                                exercise={ex} 
                                onSwap={() => handleSwapExercise(selectedDayIndex, idx)}
                                isRegenerating={regeneratingExerciseId === `${selectedDayIndex}-${idx}`}
                                getYoutubeLink={getYoutubeLink}
                                isActiveMode={isSessionActive}
                                completedSets={completedSets}
                                onToggleSet={(setIdx) => toggleSet(idx, setIdx)}
                                exerciseIndex={idx}
                            />
                        ))}
                    </div>
                    
                    {/* FIXED FINISH BUTTON (Updated to prevent obstruction) */}
                    {isSessionActive && (
                        <div className="fixed bottom-24 left-4 right-4 md:bottom-8 md:right-8 md:left-auto md:w-auto z-40 animate-slideUp">
                            <button 
                                type="button"
                                onClick={handleFinishClick}
                                className="w-full md:w-auto px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-red-900/50 flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] cursor-pointer active:scale-95 border-2 border-red-400/20 backdrop-blur-sm"
                            >
                                <Trophy className="w-6 h-6 fill-current" />
                                Finalizar Entrenamiento
                            </button>
                        </div>
                    )}
                  </>
              ) : (
                  <div className="bg-slate-800/50 rounded-3xl border border-slate-800 p-12 text-center">
                      <p className="text-slate-400 text-lg">Día de Descanso / Recuperación</p>
                      <p className="text-slate-600 text-sm">Aprovecha para realizar estiramientos suaves o caminar.</p>
                  </div>
              )}
        </div>
    );
};

const ExerciseCard: React.FC<{
    exercise: Exercise;
    onSwap: () => void;
    isRegenerating: boolean;
    getYoutubeLink: (q: string) => string;
    isActiveMode: boolean;
    completedSets: Record<string, boolean>;
    onToggleSet: (setIdx: number) => void;
    exerciseIndex: number;
}> = ({ exercise, onSwap, isRegenerating, getYoutubeLink, isActiveMode, completedSets, onToggleSet, exerciseIndex }) => {
    const [expanded, setExpanded] = useState(false);
    
    // Ensure sets is a number
    const setsCount = Number(exercise.sets) || 0;
    const hasAlternatives = exercise.alternatives && exercise.alternatives.length > 0;

    return (
        <div className={`glass-card rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 ${isActiveMode ? 'bg-slate-900/80 border-slate-700' : 'hover:border-brand-500/30'} relative group`}>
            
            {isRegenerating && (
                <div className="absolute inset-0 z-20 bg-slate-900/80 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                </div>
            )}

            <div className="p-5">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            {exercise.category === 'warmup' && <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 uppercase">Calentamiento</div>}
                            {exercise.category === 'cooldown' && <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/20 uppercase">Enfriamiento</div>}
                            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">{exercise.muscleGroup}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-brand-100 transition-colors">{exercise.name}</h3>
                    </div>
                    
                    {!isActiveMode && (
                        <button 
                            onClick={onSwap}
                            className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                                hasAlternatives 
                                    ? 'bg-brand-500/10 text-brand-400 hover:bg-brand-500/20' 
                                    : 'hover:bg-slate-800 text-slate-500 hover:text-brand-400'
                            }`}
                            title={hasAlternatives ? 'Ver Alternativas' : 'Generar Alternativa'}
                        >
                            {hasAlternatives ? (
                                <>
                                    <Shuffle className="w-4 h-4" />
                                    <span className="text-[10px] font-bold">{exercise.alternatives?.length}</span>
                                </>
                            ) : (
                                <RefreshCw className="w-4 h-4" />
                            )}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4 mb-4">
                     <div className="bg-slate-950/50 rounded-lg p-2 text-center border border-slate-800/50">
                         <div className="text-[10px] text-slate-500 uppercase font-bold">Series</div>
                         <div className="text-brand-400 font-mono font-bold">{exercise.sets}</div>
                     </div>
                     <div className="bg-slate-950/50 rounded-lg p-2 text-center border border-slate-800/50">
                         <div className="text-[10px] text-slate-500 uppercase font-bold">Reps</div>
                         <div className="text-white font-mono font-bold">{exercise.reps}</div>
                     </div>
                     <div className="bg-slate-950/50 rounded-lg p-2 text-center border border-slate-800/50">
                         <div className="text-[10px] text-slate-500 uppercase font-bold">Descanso</div>
                         <div className="text-slate-300 font-mono font-bold">{exercise.rest}</div>
                     </div>
                </div>

                {/* Active Mode Sets Tracker */}
                {isActiveMode && (
                    <div className="mb-4 space-y-2">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Registro de Series</p>
                        <div className="flex flex-wrap gap-2">
                            {/* Create array manually to avoid Array.from issues in older environments */}
                            {(() => {
                                const buttons = [];
                                for(let idx = 0; idx < setsCount; idx++) {
                                    const isDone = completedSets[`${exerciseIndex}-${idx}`];
                                    buttons.push(
                                        <button
                                            key={idx}
                                            onClick={() => onToggleSet(idx)}
                                            className={`h-10 w-10 rounded-lg border flex items-center justify-center font-bold text-sm transition-all ${
                                                isDone 
                                                    ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20' 
                                                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-brand-500/50'
                                            }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                }
                                return buttons;
                            })()}
                        </div>
                    </div>
                )}

                <div className={`text-sm text-slate-400 leading-relaxed transition-all duration-300 overflow-hidden ${expanded ? 'max-h-96 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                    <p className="mb-3">{exercise.description}</p>
                    {exercise.tips && (
                        <div className="flex gap-2 items-start bg-brand-500/5 p-3 rounded-lg border border-brand-500/10">
                            <Info className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-brand-200">{exercise.tips}</p>
                        </div>
                    )}
                    <a 
                        href={getYoutubeLink(exercise.videoQuery)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 mt-3 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-colors"
                    >
                        <Youtube className="w-4 h-4" /> Ver Tutorial
                    </a>
                </div>

                <button 
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors border-t border-white/5 mt-2"
                >
                    {expanded ? 'Menos Detalles' : 'Ver Instrucciones'} {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
            </div>
        </div>
    );
};

// Celebration Animation Component
const CelebrationOverlay: React.FC<{ show: boolean }> = ({ show }) => {
    if (!show) return null;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/60 animate-fadeIn"></div>
            <div className="relative z-10 animate-bounce">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-8 shadow-2xl">
                    <Trophy className="w-24 h-24 text-white" />
                </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center animate-slideUp">
                    <h2 className="text-5xl font-black text-white mb-2 drop-shadow-lg">¡COMPLETADO!</h2>
                    <p className="text-2xl text-green-400 font-bold">Día de entrenamiento finalizado</p>
                </div>
            </div>
            {/* Confetti Effect */}
            <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
            <div className="absolute bottom-1/3 left-1/3 w-5 h-5 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
            <div className="absolute top-1/2 right-1/3 w-4 h-4 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '0.1s' }}></div>
            <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
        </div>
    );
};

export default WorkoutView;