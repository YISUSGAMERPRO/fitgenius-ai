import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Trophy, Calendar as CalendarIcon, Clock, Dumbbell, Hash, Trash2, Flame, RotateCcw, Scale, Layers, Activity, PieChart as PieChartIcon, TrendingUp, Plus, CalendarPlus, Utensils, ArrowRight, MapPin, Coffee, AlertCircle, CheckSquare, Square, Play, Stethoscope, ChevronDown, CalendarClock, Eye, X, List, ChefHat, PartyPopper, Star, Circle, Check, Target, Info } from 'lucide-react';
import { WorkoutLog, WorkoutPlan, DietPlan, ViewState, Exercise, Meal, WorkoutDay, UserProfile, calculateIMC, getIMCCategory } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ConfirmModal } from './ConfirmModal';
import { api } from '../services/api';

interface Props {
  userId: string;
  onNavigate?: (view: ViewState) => void;
}

const DIET_CELEBRATIONS = [
    "¡Nutrición perfecta hoy!",
    "¡Eres lo que comes, y hoy comiste éxito!",
    "¡Objetivo de macros cumplido!",
    "¡Disciplina de acero en la cocina!",
    "¡Tu cuerpo te lo agradece!"
];

const CalendarView: React.FC<Props> = ({ userId, onNavigate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [history, setHistory] = useState<WorkoutLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Current Plan State
  const [activeWorkout, setActiveWorkout] = useState<WorkoutPlan | null>(null);
  const [activeDiet, setActiveDiet] = useState<DietPlan | null>(null);
  const [completedMeals, setCompletedMeals] = useState<Record<string, boolean>>({});
  
  // User Profile for IMC
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Modals State
  const [viewWorkoutModal, setViewWorkoutModal] = useState<WorkoutDay | null>(null);
  const [viewMealModal, setViewMealModal] = useState<Meal | null>(null);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);
  const [showIMCModal, setShowIMCModal] = useState(false);

  // Toast State
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null);

  // Keys
  const STORAGE_KEY_HISTORY = `fitgenius_history_${userId}`;
  const STORAGE_KEY_DIET = `fitgenius_diet_${userId}`;
  const STORAGE_KEY_WORKOUT = `fitgenius_workout_${userId}`;
  const STORAGE_KEY_COMPLETED = `fitgenius_diet_completed_${userId}`;

  // Calculate IMC
  const imcResult = useMemo(() => {
    if (!userProfile?.weight || !userProfile?.height) return null;
    const imcValue = calculateIMC(userProfile.weight, userProfile.height);
    return getIMCCategory(imcValue);
  }, [userProfile?.weight, userProfile?.height]);

  useEffect(() => {
    loadHistory();
    loadActivePlans();
    
    const savedCompleted = localStorage.getItem(STORAGE_KEY_COMPLETED);
    if (savedCompleted) {
        try { setCompletedMeals(JSON.parse(savedCompleted)); } catch(e) {}
    }
    
    // Load user profile for IMC
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
        try { setUserProfile(JSON.parse(savedProfile)); } catch(e) {}
    }

    // Select today by default
    setSelectedDate(new Date().toDateString());
  }, [userId]);

  // Función para cargar planes activos (localStorage primero, API como fallback)
  const loadActivePlans = async () => {
    // Intentar cargar workout de localStorage primero
    const savedWorkout = localStorage.getItem(STORAGE_KEY_WORKOUT);
    if (savedWorkout) {
      setActiveWorkout(JSON.parse(savedWorkout));
    } else {
      // Si no hay en localStorage, intentar cargar de la API
      try {
        const workoutFromDb = await api.getWorkout(userId);
        if (workoutFromDb) {
          setActiveWorkout(workoutFromDb);
          localStorage.setItem(STORAGE_KEY_WORKOUT, JSON.stringify(workoutFromDb));
        }
      } catch (e) {
        console.log('No se pudo cargar rutina de la BD:', e);
      }
    }
    
    // Intentar cargar dieta de localStorage primero
    const savedDiet = localStorage.getItem(STORAGE_KEY_DIET);
    if (savedDiet) {
      setActiveDiet(JSON.parse(savedDiet));
    } else {
      // Si no hay en localStorage, intentar cargar de la API
      try {
        const dietFromDb = await api.getDiet(userId);
        if (dietFromDb) {
          setActiveDiet(dietFromDb);
          localStorage.setItem(STORAGE_KEY_DIET, JSON.stringify(dietFromDb));
        }
      } catch (e) {
        console.log('No se pudo cargar dieta de la BD:', e);
      }
    }
  };

  useEffect(() => {
      localStorage.setItem(STORAGE_KEY_COMPLETED, JSON.stringify(completedMeals));
  }, [completedMeals, userId]);

  const loadHistory = () => {
    const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (saved) {
      setHistory(JSON.parse(saved));
    } else {
        setHistory([]);
    }
  };

  const confirmDeleteLog = () => {
    if (logToDelete) {
        const updatedHistory = history.filter(h => h.id !== logToDelete);
        setHistory(updatedHistory);
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory));
        setLogToDelete(null);
    }
  };

  const requestDeleteLog = (logId: string) => {
      setLogToDelete(logId);
  };

  const goToToday = () => {
      setCurrentDate(new Date());
      setSelectedDate(new Date().toDateString());
  };

  const toggleDietCheck = (e: React.MouseEvent, mealIdx: number) => {
      e.stopPropagation(); // Prevent opening modal when clicking checkbox
      if (!selectedDate && !activeDiet) {
          // If called from Today's card without active selection, imply today
          // Need to handle this carefully.
      }
      
      // Determine context. If selectedDate exists, use it. If not (Today card), use Today.
      // The Today card uses 'todayDayIndex'.
      // The Calendar logic uses 'selectedDate'. 
      // This function needs to be robust.
      
      let targetDayIndex = -1;
      
      // If called from the Today Card
      if (e.currentTarget.getAttribute('data-is-today-card') === 'true') {
          targetDayIndex = (new Date().getDay() + 6) % 7;
      } else if (selectedDate) {
          targetDayIndex = (new Date(selectedDate).getDay() + 6) % 7;
      }

      if (targetDayIndex === -1 || !activeDiet) return;

      const key = `${targetDayIndex}-${mealIdx}`;
      const isChecking = !completedMeals[key]; // We are checking it now
      
      setCompletedMeals(prev => ({
          ...prev,
          [key]: isChecking
      }));

      // Check for Celebration (If marking as checked)
      if (isChecking) {
          const currentDayMeals = activeDiet.schedule[targetDayIndex]?.meals || [];
          // We need to check if ALL other meals are already done
          const otherMealsDone = currentDayMeals.every((_, idx) => idx === mealIdx || completedMeals[`${targetDayIndex}-${idx}`]);
          
          if (otherMealsDone && currentDayMeals.length > 0) {
              triggerCelebration();
          }
      }
  };

  const triggerCelebration = () => {
      const msg = DIET_CELEBRATIONS[Math.floor(Math.random() * DIET_CELEBRATIONS.length)];
      setCelebrationMsg(msg);
      setTimeout(() => setCelebrationMsg(null), 4000);
  };

  // --- STATISTICS CALCULATION ---
  const stats = useMemo(() => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Filter logs for the currently viewed month
    const monthlyLogs = history.filter(log => {
        const d = new Date(log.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalWorkouts = monthlyLogs.length;
    
    const totalSeconds = monthlyLogs.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
    const totalHours = Math.floor(totalSeconds / 3600);
    const remainingMinutes = Math.floor((totalSeconds % 3600) / 60);

    // Advanced Stats
    let totalSets = 0;
    let totalVolumeKg = 0;
    const muscleFrequency: Record<string, number> = {};
    let totalExercisesCounted = 0;
    
    // Daily Volume Data for Chart
    const dailyVolumeMap: Record<number, number> = {};

    monthlyLogs.forEach(log => {
        const day = new Date(log.date).getDate();
        let logVolume = 0;

        if (log.exercises) {
            log.exercises.forEach(ex => {
                totalExercisesCounted++;
                
                // Count Muscle Frequency
                if (ex.muscleGroup) {
                    const mg = ex.muscleGroup.trim(); 
                    muscleFrequency[mg] = (muscleFrequency[mg] || 0) + 1;
                }

                // Count Sets & Volume
                if (ex.performedSets && ex.performedSets.length > 0) {
                    totalSets += ex.performedSets.length;
                    // Calculate Volume (Weight * Reps)
                    ex.performedSets.forEach(s => {
                        const setVol = s.weight * s.reps;
                        totalVolumeKg += setVol;
                        logVolume += setVol;
                    });
                } else {
                    // Fallback for AI/Standard workouts
                    totalSets += ex.sets || 0;
                }
            });
        }
        
        // Aggregate volume per day (in case of multiple workouts)
        if (logVolume > 0) {
            dailyVolumeMap[day] = (dailyVolumeMap[day] || 0) + logVolume;
        }
    });

    const avgSets = totalWorkouts > 0 ? Math.round(totalSets / totalWorkouts) : 0;
    
    // Format muscle distribution for Pie Chart
    const muscleChartData = Object.entries(muscleFrequency)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5

    // Format daily volume for Bar Chart
    const volumeChartData = Object.entries(dailyVolumeMap)
        .map(([day, volume]) => ({ day: parseInt(day), volume }))
        .sort((a, b) => a.day - b.day);

    // Streak Calculation
    let streak = 0;
    const sortedDates = [...new Set(history.map(h => new Date(h.date).toDateString()))]
        .map((d: string) => new Date(d).getTime())
        .sort((a, b) => b - a); // Descending

    if (sortedDates.length > 0) {
        const today = new Date().setHours(0,0,0,0);
        const yesterday = new Date(today - 86400000).getTime();
        const lastWorkout = sortedDates[0];

        // If last workout was today or yesterday, streak is alive
        if (lastWorkout === today || lastWorkout === yesterday) {
            streak = 1;
            for (let i = 0; i < sortedDates.length - 1; i++) {
                const current = sortedDates[i];
                const prev = sortedDates[i+1];
                const diffTime = Math.abs(current - prev);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

                if (diffDays === 1) {
                    streak++;
                } else {
                    break;
                }
            }
        }
    }

    return { 
        totalWorkouts, 
        totalTime: `${totalHours}h ${remainingMinutes}m`, 
        streak,
        totalVolumeKg,
        avgSets,
        muscleChartData,
        volumeChartData
    };
  }, [history, currentDate]);


  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 = Sunday
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const formatVolume = (kg: number) => {
      if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`; // Tonnes
      return `${kg}kg`;
  };

  const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#a855f7'];

  // --- HELPER: CHECK IF DATE IS WITHIN DIET WEEK ---
  const isDateWithinDietWeek = (date: Date, diet: DietPlan | null) => {
      if (!diet || !diet.startDate) return false;
      const dietStart = new Date(diet.startDate);
      // Reset hours to compare dates only
      dietStart.setHours(0,0,0,0);
      const checkDate = new Date(date);
      checkDate.setHours(0,0,0,0);

      const diffTime = checkDate.getTime() - dietStart.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Diet is valid for 7 days starting from startDate (0 to 6)
      return diffDays >= 0 && diffDays < 7;
  };

  // --- HELPER: CHECK IF DATE IS WITHIN WORKOUT CYCLE ---
  const isDateWithinWorkoutPeriod = (date: Date, workout: WorkoutPlan | null) => {
      if (!workout || !workout.startDate) return false;
      const start = new Date(workout.startDate);
      start.setHours(0,0,0,0);
      
      const check = new Date(date);
      check.setHours(0,0,0,0);

      // Workout cycles are typically longer (weeks)
      // Fallback to 4 weeks if durationWeeks is missing, but schema enforces it
      const durationWeeks = workout.durationWeeks || 4; 
      const durationDays = durationWeeks * 7;

      const diffTime = check.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Valid if current date is after start date AND before end of cycle
      return diffDays >= 0 && diffDays < durationDays;
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month);
    
    const days = [];

    // Empty cells for previous month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-14 sm:h-20 bg-slate-800/30 border border-slate-700/50"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDayDate = new Date(year, month, day);
      const dateString = currentDayDate.toDateString();
      const logsForDay = history.filter(log => new Date(log.date).toDateString() === dateString);
      const isToday = new Date().toDateString() === dateString;
      const isSelected = selectedDate === dateString;
      const hasWorkoutLog = logsForDay.length > 0;

      // --- PLAN PROJECTION LOGIC ---
      const dayOfWeekIndex = (currentDayDate.getDay() + 6) % 7;
      
      // Workout Logic
      const isWorkoutActiveDate = isDateWithinWorkoutPeriod(currentDayDate, activeWorkout);
      const plannedWorkout = isWorkoutActiveDate ? activeWorkout?.schedule?.[dayOfWeekIndex] : null;
      
      const isRestDay = plannedWorkout?.dayName?.toLowerCase().includes('descanso') || 
                        plannedWorkout?.focus?.toLowerCase().includes('descanso') || 
                        (plannedWorkout?.exercises?.length === 0);
      
      // Diet Logic
      const isDietWeek = isDateWithinDietWeek(currentDayDate, activeDiet);
      const hasDietPlan = isDietWeek && activeDiet?.schedule?.[dayOfWeekIndex];

      // Check diet completion
      let isDietCompleted = false;
      if (hasDietPlan && hasDietPlan.meals && hasDietPlan.meals.length > 0) {
          const completedCount = hasDietPlan.meals.reduce((count, _, idx) => {
              return count + (completedMeals[`${dayOfWeekIndex}-${idx}`] ? 1 : 0);
          }, 0);
          isDietCompleted = completedCount === hasDietPlan.meals.length;
      }

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(dateString)}
          className={`h-14 sm:h-20 border transition-all relative flex flex-col items-start justify-start p-1 sm:p-2 group overflow-hidden
            ${isSelected ? 'bg-slate-700 border-brand-500 ring-1 ring-brand-500 z-10' : 'bg-slate-800 border-slate-700 hover:bg-slate-750'}
            ${hasWorkoutLog ? 'bg-slate-800' : ''}
          `}
        >
          <div className="flex justify-between w-full items-start">
              <span className={`text-xs sm:text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full transition-colors
                ${isToday ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : 'text-slate-400'}
                ${hasWorkoutLog && !isToday ? 'text-white font-bold' : ''}
              `}>
                {day}
              </span>
              
              {/* Icons / Indicators */}
              <div className="flex gap-1">
                  {hasWorkoutLog ? (
                      // Checkmark for Workout Completed
                      <div className="text-green-500">
                          <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                      </div>
                  ) : !isRestDay && plannedWorkout ? (
                      // Dot for pending
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-400 opacity-60 mt-1"></div>
                  ) : null}
                  
                  {hasDietPlan && (
                      isDietCompleted ? (
                          // Green Utensils for Diet Completed
                          <div className="text-green-400">
                              <Utensils className="w-3 h-3" />
                          </div>
                      ) : (
                          // Orange dot for pending diet
                          <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-orange-400 opacity-60 mt-1"></div>
                      )
                  )}
              </div>
          </div>
          
          {hasWorkoutLog ? (
            <div className="mt-auto w-full">
               <div className="hidden sm:flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded text-[9px] text-green-300 w-full">
                 <span className="truncate w-full text-left font-medium">{logsForDay[0].workoutTitle}</span>
               </div>
            </div>
          ) : (
             // Show Plan Preview if no log
             <div className="mt-auto w-full opacity-60">
                 {isRestDay ? (
                     // Only show Rest indicator if within active period
                     isWorkoutActiveDate && (
                        <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 text-[9px] text-slate-500 w-full">
                            <Coffee className="w-3 h-3" /> Descanso
                        </div>
                     )
                 ) : plannedWorkout ? (
                     <div className="hidden sm:flex items-center gap-1 border border-brand-500/10 px-1.5 py-0.5 rounded text-[9px] text-brand-300 w-full">
                         <span className="truncate w-full text-left">{plannedWorkout.focus}</span>
                     </div>
                 ) : null}
             </div>
          )}
        </button>
      );
    }

    return days;
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  // Logic for the Details Panel
  const selectedLogs = selectedDate 
    ? history.filter(log => new Date(log.date).toDateString() === selectedDate)
    : [];

  // Determine what is PLANNED for the selected date
  const selectedDayIndex = selectedDate ? (new Date(selectedDate).getDay() + 6) % 7 : 0;
  const selectedDateObj = selectedDate ? new Date(selectedDate) : new Date();
  
  // Workout Day Logic: Check if within period
  const isSelectedDateInWorkoutPeriod = isDateWithinWorkoutPeriod(selectedDateObj, activeWorkout);
  const plannedWorkoutDay = isSelectedDateInWorkoutPeriod ? activeWorkout?.schedule?.[selectedDayIndex] : null;
  
  // Diet Day Logic: Check if within week
  const isSelectedDateInDietWeek = isDateWithinDietWeek(selectedDateObj, activeDiet);
  const plannedDietDay = isSelectedDateInDietWeek ? activeDiet?.schedule?.[selectedDayIndex] : null;
  
  const isSelectedDayRest = plannedWorkoutDay?.dayName?.toLowerCase().includes('descanso') || plannedWorkoutDay?.focus === 'Descanso';

  // Calculate daily diet progress
  let completedCalories = 0;
  let totalCalories = 0;
  if (plannedDietDay) {
      plannedDietDay.meals.forEach((meal, idx) => {
          totalCalories += meal.calories;
          if (completedMeals[`${selectedDayIndex}-${idx}`]) {
              completedCalories += meal.calories;
          }
      });
  }
  const dietProgress = totalCalories > 0 ? Math.round((completedCalories / totalCalories) * 100) : 0;

  // --- TODAY'S SPECIFIC DATA ---
  const todayDate = new Date();
  const todayDayIndex = (todayDate.getDay() + 6) % 7;
  
  const isTodayWorkoutPeriod = isDateWithinWorkoutPeriod(todayDate, activeWorkout);
  const todayWorkout = isTodayWorkoutPeriod ? activeWorkout?.schedule?.[todayDayIndex] : null;
  
  // Today's diet check
  const isTodayInDietWeek = isDateWithinDietWeek(todayDate, activeDiet);
  const todayDiet = isTodayInDietWeek ? activeDiet?.schedule?.[todayDayIndex] : null;
  
  const isTodayRest = todayWorkout?.dayName?.toLowerCase().includes('descanso') || todayWorkout?.focus === 'Descanso' || !todayWorkout?.exercises?.length;

  const [activeTab, setActiveTab] = useState<'workout' | 'diet'>('workout');

  const handleStartTodayWorkout = () => {
      if (onNavigate) {
          // If it's a valid workout day and not a rest day
          if (todayWorkout && !isTodayRest) {
              const sessionKey = `fitgenius_session_${userId}`;
              const existingSession = localStorage.getItem(sessionKey);
              
              // Only create new session if none exists to avoid overwriting ongoing workout
              if (!existingSession) {
                  const newSession = {
                      seconds: 0,
                      completed: {},
                      dayIndex: todayDayIndex,
                      date: new Date().toISOString()
                  };
                  localStorage.setItem(sessionKey, JSON.stringify(newSession));
              }
          }
          onNavigate('workout');
      }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 relative">
      
      {/* Toast Notification */}
      {celebrationMsg && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce-in">
              <PartyPopper className="w-5 h-5 animate-pulse" />
              <span className="font-bold text-sm">{celebrationMsg}</span>
          </div>
      )}

      {/* ... (Modals remain unchanged) ... */}
      <ConfirmModal 
          isOpen={!!logToDelete} 
          onClose={() => setLogToDelete(null)}
          onConfirm={confirmDeleteLog}
          title="Eliminar Registro"
          message="¿Estás seguro de que quieres eliminar este registro del historial? Esta acción no se puede deshacer."
          confirmText="Eliminar"
      />
      
      {/* Workout Detail Modal */}
      {viewWorkoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-700 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                             <Dumbbell className="w-5 h-5 text-brand-400" /> {viewWorkoutModal.dayName}
                        </h3>
                        <p className="text-slate-400 text-sm">{viewWorkoutModal.focus}</p>
                    </div>
                    <button onClick={() => setViewWorkoutModal(null)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-0">
                    <div className="divide-y divide-slate-800">
                        {(viewWorkoutModal.exercises || []).map((ex, idx) => (
                            <div key={idx} className="p-4 hover:bg-slate-800/30">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        {ex.category === 'warmup' && <div className="w-2 h-2 rounded-full bg-yellow-500" title="Calentamiento"></div>}
                                        {ex.category === 'cooldown' && <div className="w-2 h-2 rounded-full bg-cyan-500" title="Enfriamiento"></div>}
                                        <h4 className="font-bold text-white text-sm">{ex.name}</h4>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{ex.muscleGroup}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 mb-2">
                                    <div className="bg-slate-950/50 rounded p-2 text-center border border-slate-800">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold">Series</div>
                                        <div className="text-brand-400 font-mono font-bold text-sm">{ex.sets}</div>
                                    </div>
                                    <div className="bg-slate-950/50 rounded p-2 text-center border border-slate-800">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold">Reps</div>
                                        <div className="text-white font-mono font-bold text-sm">{ex.reps}</div>
                                    </div>
                                    <div className="bg-slate-950/50 rounded p-2 text-center border border-slate-800">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold">Descanso</div>
                                        <div className="text-slate-300 font-mono font-bold text-sm">{ex.rest}</div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                                    {ex.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 border-t border-slate-700 bg-slate-900/90">
                     <button 
                        onClick={() => {
                            setViewWorkoutModal(null);
                            if (onNavigate) onNavigate('workout');
                        }}
                        className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
                    >
                        <Play className="w-4 h-4 fill-current" /> Ir a Entrenar
                     </button>
                </div>
            </div>
        </div>
      )}

      {/* Meal Detail (Recipe) Modal */}
      {viewMealModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-700 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                <div className="relative">
                    {/* Header Image Placeholder or Gradient */}
                    <div className="h-32 bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center relative overflow-hidden">
                        <Utensils className="w-32 h-32 text-white opacity-10 absolute -bottom-8 -right-8 rotate-12" />
                        <ChefHat className="w-12 h-12 text-white/90 relative z-10" />
                    </div>
                    <button 
                        onClick={() => setViewMealModal(null)}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-md transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="p-6 -mt-6">
                        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700 shadow-xl relative z-10">
                            <h3 className="text-xl font-bold text-white mb-2">{viewMealModal.name}</h3>
                            <div className="flex flex-wrap gap-2 text-xs font-bold">
                                <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded border border-orange-500/20">{viewMealModal.calories || 0} kcal</span>
                                <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">P: {viewMealModal.protein || 0}g</span>
                                <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/20">C: {viewMealModal.carbs || 0}g</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
                     <div>
                         <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                             <List className="w-4 h-4 text-green-400" /> Ingredientes
                         </h4>
                         <ul className="space-y-2">
                             {(viewMealModal.ingredients || []).map((ing, i) => (
                                 <li key={i} className="flex items-start gap-3 text-sm text-slate-200 bg-slate-800/50 p-2 rounded-lg border border-slate-800">
                                     <div className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></div>
                                     {ing}
                                 </li>
                             ))}
                         </ul>
                     </div>

                     <div>
                         <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                             <Flame className="w-4 h-4 text-orange-400" /> Preparación
                         </h4>
                         <div className="space-y-4 relative pl-2">
                             <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-800"></div>
                             {viewMealModal.instructions?.map((step, i) => (
                                 <div key={i} className="relative pl-8">
                                     <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 z-10">
                                         {i + 1}
                                     </div>
                                     <p className="text-sm text-slate-300 leading-relaxed">{step}</p>
                                 </div>
                             ))}
                         </div>
                     </div>
                </div>
            </div>
        </div>
      )}


      {/* --- TODAY'S PLAN OVERVIEW SECTION --- */}
      <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <CalendarClock className="w-6 h-6 text-brand-400" />
                  Tu Plan para Hoy <span className="text-slate-500 text-sm font-normal">({new Date().toLocaleDateString('es-ES', { weekday: 'long' })})</span>
              </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Today's Workout Card */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-6 relative overflow-hidden shadow-lg group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Dumbbell className="w-24 h-24 text-white" />
                  </div>
                  
                  <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                          <div className="bg-brand-500/20 p-2 rounded-xl text-brand-400">
                              <Dumbbell className="w-6 h-6" />
                          </div>
                          {isTodayRest ? (
                              <span className="px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-xs font-bold uppercase">Descanso</span>
                          ) : (
                              <span className="px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-bold uppercase">Entrenamiento</span>
                          )}
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-1">
                          {todayWorkout ? todayWorkout.dayName : 'Sin rutina asignada'}
                      </h3>
                      <p className="text-slate-400 text-sm mb-6">
                          {isTodayRest ? 'Tómalo con calma, recupera energías.' : todayWorkout ? todayWorkout.focus : 'Genera una rutina para empezar.'}
                      </p>

                      {!isTodayRest && todayWorkout && (
                          <div className="flex gap-4 mb-6">
                              <div>
                                  <p className="text-[10px] text-slate-500 uppercase font-bold">Ejercicios</p>
                                  <p className="text-lg font-bold text-white">{todayWorkout.exercises.length}</p>
                              </div>
                              <div>
                                  <p className="text-[10px] text-slate-500 uppercase font-bold">Duración</p>
                                  <p className="text-lg font-bold text-white">~{activeWorkout?.estimatedDuration || '45m'}</p>
                              </div>
                          </div>
                      )}

                      <div className="flex gap-3">
                          {!isTodayRest && todayWorkout && (
                              <button 
                                  onClick={() => setViewWorkoutModal(todayWorkout)}
                                  className="flex-1 py-3 rounded-xl font-bold bg-slate-700 hover:bg-slate-600 text-white transition-all text-sm flex items-center justify-center gap-2"
                              >
                                  <Eye className="w-4 h-4" /> Ver Rutina
                              </button>
                          )}
                          <button 
                              onClick={handleStartTodayWorkout}
                              disabled={!todayWorkout || isTodayRest}
                              className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                                  !todayWorkout || isTodayRest 
                                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                                      : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20 hover:scale-[1.02] animate-pulse-slow'
                              }`}
                          >
                              {isTodayRest ? 'Ver Detalles' : <><Play className="w-4 h-4 fill-current" /> Comenzar Rutina</>}
                          </button>
                      </div>
                  </div>
              </div>

              {/* Today's Diet Card - MODIFIED VERTICAL LIST */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-6 relative overflow-hidden shadow-lg group flex flex-col h-full">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Utensils className="w-24 h-24 text-white" />
                  </div>
                  
                  <div className="relative z-10 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                          <div className="bg-green-500/20 p-2 rounded-xl text-green-400">
                              <Utensils className="w-6 h-6" />
                          </div>
                          <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-bold uppercase">Nutrición</span>
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-1">
                          {todayDiet ? `${todayDiet.day}` : 'Sin dieta asignada'}
                      </h3>
                      
                      {todayDiet ? (
                          <div className="flex-1 flex flex-col">
                              {/* Progress Bar */}
                              <div className="mb-4">
                                  <div className="flex items-baseline justify-between mb-2">
                                      <div className="flex items-baseline gap-2">
                                          <span className="text-2xl font-black text-white">{completedCalories}</span>
                                          <span className="text-xs text-slate-400 font-bold">/ {activeDiet?.dailyTargets.calories} kcal</span>
                                      </div>
                                      <span className="text-xs font-bold text-green-400">{dietProgress}%</span>
                                  </div>
                                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                      <div className="bg-green-500 h-full transition-all duration-1000 ease-out" style={{width: `${dietProgress}%`}}></div> 
                                  </div>
                              </div>
                              
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tus Comidas de Hoy</p>
                              
                              {/* New Vertical Meal List */}
                              <div className="space-y-2 mb-6 flex-1 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                                  {(todayDiet.meals || []).map((meal, i) => {
                                      const isDone = completedMeals[`${todayDayIndex}-${i}`];
                                      return (
                                          <div 
                                            key={i}
                                            onClick={() => setViewMealModal(meal)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group/meal ${
                                                isDone 
                                                    ? 'bg-slate-800/40 border-slate-800' 
                                                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                            }`}
                                          >
                                              {/* Checkbox Trigger */}
                                              <button 
                                                  onClick={(e) => {
                                                      toggleDietCheck(e, i);
                                                  }}
                                                  data-is-today-card="true"
                                                  className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                                                      isDone 
                                                          ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20 scale-110' 
                                                          : 'border-slate-600 text-transparent hover:border-green-500 hover:scale-110'
                                                  }`}
                                              >
                                                  {isDone ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4 text-slate-600 group-hover/meal:text-slate-400" />}
                                              </button>

                                              <div className="flex-1 min-w-0">
                                                  <div className="flex justify-between items-center mb-0.5">
                                                      <span className={`text-xs font-bold uppercase tracking-wider ${isDone ? 'text-slate-500' : 'text-slate-400'}`}>
                                                          {i === 0 ? 'Desayuno' : i === 1 ? 'Snack 1' : i === 2 ? 'Comida' : i === 3 ? 'Snack 2' : 'Cena'}
                                                      </span>
                                                      <span className={`text-xs font-bold ${isDone ? 'text-slate-600' : 'text-orange-400'}`}>{meal.calories} kcal</span>
                                                  </div>
                                                  <h4 className={`font-bold text-sm truncate transition-colors ${isDone ? 'text-slate-500 line-through' : 'text-white'}`}>
                                                      {meal.name}
                                                  </h4>
                                              </div>
                                              
                                              <div className={`p-1.5 rounded-lg transition-colors ${isDone ? 'bg-transparent text-slate-700' : 'bg-slate-700 text-slate-400 group-hover/meal:text-white'}`}>
                                                  <ChevronRight className="w-4 h-4" />
                                              </div>
                                          </div>
                                      )
                                  })}
                              </div>
                          </div>
                      ) : (
                          <div className="flex-1 flex flex-col justify-center">
                              <p className="text-slate-400 text-sm mb-6">Genera un plan nutricional para ver tus comidas.</p>
                          </div>
                      )}

                      <button 
                          onClick={() => onNavigate && onNavigate('diet')}
                          disabled={!todayDiet}
                          className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-auto ${
                              !todayDiet 
                                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                                  : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
                          }`}
                      >
                          {todayDiet ? 'Ver Dieta Completa' : 'Crear Dieta'}
                      </button>
                  </div>
              </div>
          </div>
      </div>

      {/* ... (Existing Stats Dashboard) ... */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border border-white/5">
              <div className="p-3 bg-brand-500/20 rounded-xl text-brand-400">
                  <Trophy className="w-6 h-6" />
              </div>
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sesiones</p>
                  <p className="text-2xl font-black text-white">{stats.totalWorkouts}</p>
              </div>
          </div>
          
          <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border border-white/5">
              <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                  <Clock className="w-6 h-6" />
              </div>
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tiempo Total</p>
                  <p className="text-xl font-black text-white tracking-tight">{stats.totalTime}</p>
              </div>
          </div>

          <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border border-white/5">
              <div className="p-3 bg-orange-500/20 rounded-xl text-orange-400 relative z-10">
                  <Flame className={`w-6 h-6 ${stats.streak > 0 ? 'animate-pulse' : ''}`} />
              </div>
              <div className="relative z-10">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Racha</p>
                  <p className="text-2xl font-black text-white">{stats.streak} <span className="text-sm font-medium text-slate-500">días</span></p>
              </div>
          </div>

          <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border border-white/5">
              <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                  <Scale className="w-6 h-6" />
              </div>
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Volumen (Kg)</p>
                  <p className="text-2xl font-black text-white">{formatVolume(stats.totalVolumeKg)}</p>
              </div>
          </div>
      </div>

      {/* IMC Card Section */}
      {imcResult && (
          <>
              {/* IMC Modal */}
              {showIMCModal && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
                      <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
                          <div className="p-6 border-b border-slate-700 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${imcResult.color}20, transparent)` }}>
                              <div>
                                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                      <Scale className="w-5 h-5" style={{ color: imcResult.color }} /> Índice de Masa Corporal
                                  </h3>
                                  <p className="text-slate-400 text-sm">Análisis detallado de tu IMC</p>
                              </div>
                              <button onClick={() => setShowIMCModal(false)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors">
                                  <X className="w-5 h-5" />
                              </button>
                          </div>
                          
                          <div className="p-6 space-y-6">
                              {/* IMC Value Display */}
                              <div className="text-center">
                                  <div className="text-6xl font-black mb-2" style={{ color: imcResult.color }}>
                                      {imcResult.value}
                                  </div>
                                  <div className="text-xl font-bold text-white mb-1">{imcResult.label}</div>
                                  <p className="text-sm text-slate-400">{imcResult.description}</p>
                              </div>
                              
                              {/* IMC Scale Visual */}
                              <div className="relative">
                                  <div className="flex h-4 rounded-full overflow-hidden">
                                      <div className="flex-1 bg-blue-500" title="Bajo peso: <18.5"></div>
                                      <div className="flex-1 bg-green-500" title="Normal: 18.5-24.9"></div>
                                      <div className="flex-1 bg-amber-500" title="Sobrepeso: 25-29.9"></div>
                                      <div className="flex-1 bg-orange-500" title="Obesidad I: 30-34.9"></div>
                                      <div className="flex-1 bg-red-500" title="Obesidad II+: 35+"></div>
                                  </div>
                                  {/* Marker */}
                                  <div 
                                      className="absolute top-6 transform -translate-x-1/2 flex flex-col items-center"
                                      style={{ left: `${Math.min(Math.max((imcResult.value - 15) / 25 * 100, 2), 98)}%` }}
                                  >
                                      <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent" style={{ borderBottomColor: imcResult.color }}></div>
                                      <div className="text-xs font-bold mt-1" style={{ color: imcResult.color }}>{imcResult.value}</div>
                                  </div>
                              </div>
                              
                              {/* Scale Legend */}
                              <div className="flex justify-between text-[10px] font-bold text-slate-500 px-1 mt-8">
                                  <span>15</span>
                                  <span>18.5</span>
                                  <span>25</span>
                                  <span>30</span>
                                  <span>35</span>
                                  <span>40</span>
                              </div>
                              
                              {/* User Data */}
                              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                                  <div className="text-center p-3 bg-slate-800/50 rounded-xl">
                                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Peso</p>
                                      <p className="text-xl font-bold text-white">{userProfile?.weight} kg</p>
                                  </div>
                                  <div className="text-center p-3 bg-slate-800/50 rounded-xl">
                                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Altura</p>
                                      <p className="text-xl font-bold text-white">{userProfile?.height} cm</p>
                                  </div>
                              </div>
                              
                              {/* Recommendations */}
                              <div>
                                  <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                                      <Target className="w-4 h-4 text-brand-400" /> Recomendaciones
                                  </h4>
                                  <ul className="space-y-2">
                                      {imcResult.recommendations.map((rec, i) => (
                                          <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                                              <Check className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                                              {rec}
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                              
                              {/* Disclaimer */}
                              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                                  <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                  <p className="text-xs text-amber-300/80">
                                      El IMC es una referencia general. No distingue entre masa muscular y grasa. Consulta a un profesional de salud para una evaluación completa.
                                  </p>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
              
              {/* IMC Summary Card */}
              <div 
                  onClick={() => setShowIMCModal(true)}
                  className="glass-card p-5 rounded-2xl border border-white/5 cursor-pointer hover:border-slate-600 transition-all group"
              >
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl" style={{ backgroundColor: `${imcResult.color}20` }}>
                              <Scale className="w-6 h-6" style={{ color: imcResult.color }} />
                          </div>
                          <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tu IMC</p>
                              <div className="flex items-baseline gap-2">
                                  <span className="text-2xl font-black text-white">{imcResult.value}</span>
                                  <span className="text-sm font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${imcResult.color}20`, color: imcResult.color }}>
                                      {imcResult.label}
                                  </span>
                              </div>
                          </div>
                      </div>
                      
                      {/* Mini Progress Bar */}
                      <div className="hidden sm:block w-32">
                          <div className="flex h-2 rounded-full overflow-hidden mb-1">
                              <div className="flex-1 bg-blue-500"></div>
                              <div className="flex-1 bg-green-500"></div>
                              <div className="flex-1 bg-amber-500"></div>
                              <div className="flex-1 bg-orange-500"></div>
                              <div className="flex-1 bg-red-500"></div>
                          </div>
                          <div className="flex justify-between text-[8px] text-slate-600">
                              <span>18.5</span>
                              <span>25</span>
                              <span>30</span>
                              <span>40</span>
                          </div>
                      </div>
                      
                      <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
              </div>
          </>
      )}

      {/* Expanded Monthly Analysis Charts */}
      {/* ... (Existing Charts) ... */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                  <PieChartIcon className="w-4 h-4 text-brand-400" />
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Distribución Muscular</h3>
              </div>
              <div className="flex-1 min-h-[200px] relative">
                  {stats.muscleChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats.muscleChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {stats.muscleChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <ReTooltip 
                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                            />
                            <Legend 
                                verticalAlign="bottom" 
                                height={36} 
                                iconType="circle"
                                formatter={(value) => <span className="text-xs text-slate-300 ml-1">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-xs italic">
                        Sin datos este mes
                    </div>
                  )}
              </div>
          </div>

          <div className="lg:col-span-2 bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 flex flex-col">
               <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progreso de Volumen (Kg)</h3>
                   </div>
                   <div className="text-xs font-bold text-white bg-slate-700 px-2 py-1 rounded">
                       Avg Series: {stats.avgSets}
                   </div>
               </div>
               
               <div className="flex-1 min-h-[200px]">
                   {stats.volumeChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.volumeChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis 
                                dataKey="day" 
                                stroke="#94a3b8" 
                                fontSize={10} 
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(day) => `${day}`}
                            />
                            <YAxis 
                                stroke="#94a3b8" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                            />
                            <ReTooltip 
                                cursor={{fill: '#334155', opacity: 0.2}}
                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                                labelFormatter={(label) => `Día ${label}`}
                                formatter={(value: number) => [`${value} kg`, 'Volumen']}
                            />
                            <Bar dataKey="volume" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                   ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-xs italic">
                        Registra entrenamientos para ver tu progreso
                    </div>
                   )}
               </div>
          </div>
      </div>

      {/* Calendar Header Controls */}
      <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
         <div className="flex items-center gap-3">
             <div className="bg-slate-700 p-2 rounded-lg">
                <CalendarIcon className="text-brand-500 w-5 h-5" />
             </div>
             <h2 className="text-xl font-bold text-white">
                 Calendario Histórico
             </h2>
         </div>
         
         <div className="flex items-center gap-2 bg-slate-900 rounded-xl p-1.5 border border-slate-700">
             <button onClick={prevMonth} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
             </button>
             <span className="font-bold w-36 text-center select-none text-white">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
             </span>
             <button onClick={nextMonth} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                <ChevronRight className="w-5 h-5" />
             </button>
             <div className="w-px h-6 bg-slate-700 mx-1"></div>
             <button 
                onClick={goToToday} 
                className="p-2 hover:bg-brand-500/20 rounded-lg text-slate-400 hover:text-brand-400 transition-colors"
                title="Ir a Hoy"
             >
                <RotateCcw className="w-4 h-4" />
             </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[700px]">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col shadow-lg">
           <div className="grid grid-cols-7 bg-slate-900 border-b border-slate-700">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                  <div key={day} className="py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {day}
                  </div>
              ))}
           </div>
           <div className="grid grid-cols-7 flex-1 overflow-y-auto scrollbar-hide bg-slate-800/50">
              {renderCalendarDays()}
           </div>
        </div>

        {/* Selected Day Details Panel */}
        <div className="lg:col-span-1 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col h-full overflow-hidden shadow-lg relative">
             <div className="p-6 border-b border-slate-700 bg-slate-900/30">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Detalles del Día</p>
                <h3 className="text-xl font-bold text-white mb-4">
                    {selectedDate 
                        ? new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) 
                        : 'Selecciona un día'}
                </h3>

                {/* Day Content Tabs */}
                <div className="flex rounded-lg bg-slate-900/50 p-1 border border-slate-700">
                    <button 
                        onClick={() => setActiveTab('workout')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'workout' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Entrenamiento
                    </button>
                    <button 
                        onClick={() => setActiveTab('diet')}
                        disabled={!plannedDietDay}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'diet' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300 disabled:opacity-30'}`}
                    >
                        Nutrición
                    </button>
                </div>
             </div>
             
             <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
                 {activeTab === 'workout' && (
                     // Botón para generar rutina si NO hay plan activo
                     !activeWorkout && (
                         <button
                             className="w-full py-3 mb-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                             onClick={async () => {
                                 if (!userProfile) return alert('Completa tu perfil antes de generar una rutina.');
                                 try {
                                     // Lógica mínima: tipo por defecto y sin preferencias
                                     const plan = await api.generateWorkout(userId, userProfile, 'Full Body');
                                     if (plan) {
                                         plan.startDate = new Date().toISOString();
                                         localStorage.setItem(`fitgenius_workout_${userId}`, JSON.stringify(plan));
                                         setActiveWorkout(plan);
                                         alert('¡Rutina generada con éxito!');
                                     }
                                 } catch (e) {
                                     alert('Error generando rutina. Intenta de nuevo.');
                                 }
                             }}
                         >
                             <Dumbbell className="w-4 h-4" /> Generar Rutina Inicial
                         </button>
                     )
                     // ---
                     selectedLogs.length > 0 ? (
                     <div className="space-y-6">
                        {/* ... (Existing Logs Display) ... */}
                        {selectedLogs.map((log) => (
                             <div key={log.id} className="bg-slate-750 rounded-xl border border-slate-600 overflow-hidden group">
                                 {/* Log Header */}
                                 <div className="bg-slate-900/80 p-4 border-b border-slate-600 relative">
                                     <div className="flex justify-between items-start mb-2 pr-6">
                                         <h4 className="font-bold text-white text-lg leading-tight">{log.workoutTitle}</h4>
                                     </div>
                                     <div className="flex justify-between items-center text-sm text-slate-400">
                                         <span>{new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                         {log.durationSeconds !== undefined && log.durationSeconds > 0 && (
                                             <span className="flex items-center gap-1 text-brand-400 font-bold bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 text-xs">
                                                 <Clock className="w-3 h-3" /> {formatDuration(log.durationSeconds)}
                                             </span>
                                         )}
                                     </div>

                                     {/* Delete Button */}
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); requestDeleteLog(log.id); }}
                                        className="absolute top-3 right-3 p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Eliminar Registro"
                                     >
                                         <Trash2 className="w-4 h-4" />
                                     </button>
                                 </div>
                                 
                                 {/* Exercises Detail List */}
                                 {log.exercises && log.exercises.length > 0 ? (
                                    <div className="p-4 bg-slate-800/30">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                                            <Dumbbell className="w-3 h-3" /> Resumen de Ejercicios
                                        </p>
                                        <div className="space-y-3">
                                            {log.exercises.map((ex, i) => (
                                                <div key={i} className="border-l-2 border-slate-600 pl-3 hover:border-brand-500 transition-colors">
                                                    <div className="flex justify-between items-baseline mb-1.5">
                                                        <span className="text-slate-200 font-bold text-sm">{ex.name}</span>
                                                    </div>
                                                    
                                                    {/* Show Detailed Sets if available (Pro Mode) */}
                                                    {ex.performedSets && ex.performedSets.length > 0 ? (
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {ex.performedSets.map((set, sIdx) => (
                                                                <div key={sIdx} className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[10px] text-center">
                                                                    <div className="text-brand-300 font-bold">{set.weight}<span className="text-[9px] font-normal text-slate-500">kg</span></div>
                                                                    <div className="text-slate-400">x{set.reps}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        /* Show Standard Summary */
                                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                                            <span className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">{ex.sets} Series</span>
                                                            <span>x</span>
                                                            <span className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">{ex.reps} Reps</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                 ) : (
                                     <div className="p-4 text-center text-xs text-slate-500 italic">
                                         Detalles no disponibles
                                     </div>
                                 )}
                             </div>
                        ))}
                     </div>
                 ) : plannedWorkoutDay ? (
                     // SHOW PLANNED WORKOUT FOR SELECTED DAY
                     <div className="space-y-6 animate-fadeIn">
                         <div className="bg-brand-500/10 border border-brand-500/20 p-4 rounded-xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-3 opacity-10">
                                 <CalendarIcon className="w-16 h-16" />
                             </div>
                             <p className="text-xs text-brand-300 font-bold uppercase tracking-widest mb-1">Planificado</p>
                             <h3 className="text-lg font-bold text-white mb-2">{plannedWorkoutDay.dayName}</h3>
                             <div className="inline-flex items-center gap-2 bg-brand-500/20 px-2 py-1 rounded-lg">
                                 <Activity className="w-4 h-4 text-brand-400" />
                                 <span className="text-xs font-medium text-brand-100">{plannedWorkoutDay.focus}</span>
                             </div>
                         </div>

                         {isSelectedDayRest ? (
                             <div className="flex flex-col items-center justify-center py-10 text-slate-500 border border-dashed border-slate-700 rounded-2xl bg-slate-800/30">
                                 <Coffee className="w-10 h-10 mb-3 opacity-50" />
                                 <p className="text-sm font-medium">Día de Descanso Activo</p>
                                 <p className="text-xs opacity-60 text-center max-w-[200px] mt-1">Recupera energías, estira o camina ligero.</p>
                             </div>
                         ) : (
                             <div className="space-y-4">
                                 <div className="flex justify-between items-center pl-1">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lista de Ejercicios</p>
                                    <button 
                                        onClick={() => setViewWorkoutModal(plannedWorkoutDay)}
                                        className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                                    >
                                        <Eye className="w-3 h-3" /> Ver Todo
                                    </button>
                                 </div>
                                 <div className="space-y-2">
                                    {plannedWorkoutDay.exercises.slice(0, 3).map((ex, idx) => (
                                        <div key={idx} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex justify-between items-center group">
                                            <div>
                                                <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{ex.name}</p>
                                                <p className="text-xs text-slate-500">{ex.muscleGroup}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-brand-400 font-mono font-bold text-xs">{ex.sets} x {ex.reps}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {plannedWorkoutDay.exercises.length > 3 && (
                                        <p className="text-center text-[10px] text-slate-500 italic">...y {plannedWorkoutDay.exercises.length - 3} más</p>
                                    )}
                                 </div>

                                 <button 
                                    onClick={() => onNavigate && onNavigate('workout')}
                                    className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                 >
                                     <Play className="w-4 h-4 fill-current" /> Comenzar Rutina
                                 </button>
                             </div>
                         )}
                     </div>
                 ) : (
                     <div className="flex flex-col items-center justify-center h-full text-slate-500 min-h-[200px]">
                         <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4">
                            <Trophy className="w-10 h-10 opacity-20" />
                         </div>
                         <p className="text-sm font-medium">Nada registrado ni planificado</p>
                         <p className="text-xs opacity-60 text-center mt-1">Genera una rutina para ver tu agenda.</p>
                     </div>
                 ))}

                 {activeTab === 'diet' && (
                     // Botón para generar dieta si NO hay plan activo
                     !activeDiet && (
                         <button
                             className="w-full py-3 mb-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                             onClick={async () => {
                                 if (!userProfile) return alert('Completa tu perfil antes de generar una dieta.');
                                 try {
                                     // Lógica mínima: tipo por defecto y sin preferencias
                                     const plan = await api.generateDiet(userId, userProfile, 'Déficit Calórico (Pérdida de Peso)');
                                     if (plan) {
                                         plan.startDate = new Date().toISOString();
                                         localStorage.setItem(`fitgenius_diet_${userId}`, JSON.stringify(plan));
                                         setActiveDiet(plan);
                                         alert('¡Dieta generada con éxito!');
                                     }
                                 } catch (e) {
                                     alert('Error generando dieta. Intenta de nuevo.');
                                 }
                             }}
                         >
                             <Utensils className="w-4 h-4" /> Generar Dieta Inicial
                         </button>
                     )
                     // ---
                     plannedDietDay ? (
                         <div className="space-y-4 animate-fadeIn">
                             <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-4 relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-3 opacity-10">
                                     <Utensils className="w-16 h-16" />
                                 </div>
                                 <h4 className="text-orange-300 font-bold text-sm flex items-center gap-2 uppercase tracking-wide mb-1">
                                     Menú del Día
                                 </h4>
                                 <p className="text-white font-bold text-lg">{plannedDietDay.day}</p>
                                 
                                 {/* Daily Nutrition Progress Summary */}
                                 <div className="mt-3 bg-slate-900/50 p-2 rounded-lg border border-white/5">
                                     <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold mb-1">
                                         <span>Progreso de Comidas</span>
                                         <span>{dietProgress}%</span>
                                     </div>
                                     <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                         <div 
                                            className="h-full bg-green-500 transition-all duration-500 ease-out" 
                                            style={{ width: `${dietProgress}%` }} 
                                         />
                                     </div>
                                 </div>
                             </div>

                             {(plannedDietDay.meals || []).map((meal: any, idx: number) => {
                                 const isChecked = completedMeals[`${selectedDayIndex}-${idx}`];
                                 return (
                                 <div 
                                    key={idx} 
                                    onClick={() => setViewMealModal(meal)}
                                    className={`bg-slate-750 border border-slate-700 rounded-xl p-4 transition-all duration-300 cursor-pointer hover:border-brand-500/50 hover:bg-slate-700 ${isChecked ? 'opacity-60 grayscale-[0.3]' : ''}`}
                                 >
                                     <div className="flex gap-4">
                                         {/* Check Button */}
                                         <button 
                                            onClick={(e) => toggleDietCheck(e, idx)}
                                            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                                                isChecked 
                                                    ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20' 
                                                    : 'bg-slate-800 border-slate-600 text-slate-500 hover:border-green-500 hover:text-green-400'
                                            }`}
                                         >
                                             {isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                         </button>

                                         <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h5 className={`font-bold transition-colors ${isChecked ? 'text-green-200 line-through' : 'text-white'}`}>{meal.name}</h5>
                                                <span className="text-xs font-bold text-orange-400 bg-orange-950/30 px-2 py-0.5 rounded">{meal.calories} kcal</span>
                                            </div>
                                            <p className="text-xs text-slate-400 mb-3 line-clamp-2">{meal.description}</p>
                                            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 font-medium">
                                                <div>P: <span className="text-slate-300">{meal.protein || 0}g</span></div>
                                                <div>C: <span className="text-slate-300">{meal.carbs || 0}g</span></div>
                                                <div>G: <span className="text-slate-300">{meal.fats || 0}g</span></div>
                                            </div>
                                         </div>
                                     </div>
                                 </div>
                             )})}

                             <button 
                                onClick={() => onNavigate && onNavigate('diet')}
                                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm border border-slate-600 flex items-center justify-center gap-2 mt-2"
                             >
                                 <Utensils className="w-4 h-4" /> Ver Dieta Completa
                             </button>
                         </div>
                     ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 min-h-[200px]">
                            <p className="text-sm font-medium">Sin plan nutricional para hoy</p>
                            <p className="text-xs opacity-60">La dieta solo se muestra durante su semana de vigencia.</p>
                        </div>
                     )
                 )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;