import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';

interface Props {
    userId: string;
    onNavigate?: (view: ViewState) => void;
}

const CalendarView: React.FC<Props> = ({ userId, onNavigate }) => {
    // Estado para tab activo: 'workout' o 'diet'
    const [activeTab, setActiveTab] = useState<'workout' | 'diet'>('workout');
    // Estado para planes cargados
    const [workoutPlan, setWorkoutPlan] = useState<any>(null);
    const [dietPlan, setDietPlan] = useState<any>(null);
        // Cargar planes desde localStorage al montar
        useEffect(() => {
            const workout = localStorage.getItem(`fitgenius_workout_${userId}`);
            if (workout) {
                try {
                    setWorkoutPlan(JSON.parse(workout));
                } catch {}
            }
            const diet = localStorage.getItem(`fitgenius_diet_${userId}`);
            if (diet) {
                try {
                    setDietPlan(JSON.parse(diet));
                } catch {}
            }
        }, [userId]);
    // Estado para el mes y año actual
    const [currentDate, setCurrentDate] = useState(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
    });
    // Día seleccionado (Date o null)
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    // Helpers para grid de calendario
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // Primer día del mes
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    // Último día del mes
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    // Día de la semana en que inicia el mes (0=Domingo)
    const startDay = firstDayOfMonth.getDay();
    // Total de días en el mes
    const daysInMonth = lastDayOfMonth.getDate();

    // Navegación de mes
    const prevMonth = () => {
        setCurrentDate(prev => {
            const d = new Date(prev);
            d.setMonth(d.getMonth() - 1);
            return d;
        });
        setSelectedDay(null);
    };
    const nextMonth = () => {
        setCurrentDate(prev => {
            const d = new Date(prev);
            d.setMonth(d.getMonth() + 1);
            return d;
        });
        setSelectedDay(null);
    };
    const goToToday = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setCurrentDate(today);
        setSelectedDay(today);
    };

    // Renderizar celdas del calendario
    const renderCalendarGrid = () => {
        const days: (Date | null)[] = [];
        // Días vacíos antes del 1
        for (let i = 0; i < startDay; i++) days.push(null);
        // Días del mes
        for (let d = 1; d <= daysInMonth; d++) {
            days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), d));
        }
        // Completar la última semana
        while (days.length % 7 !== 0) days.push(null);
        return (
            <div className="grid grid-cols-7 gap-1">
                {weekDays.map(day => (
                    <div key={day} className="py-2 text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest select-none">
                        {day}
                    </div>
                ))}
                {days.map((date, idx) => {
                    const isToday = date && new Date().toDateString() === date.toDateString();
                    const isSelected = date && selectedDay && date.toDateString() === selectedDay.toDateString();
                    return (
                        <button
                            key={idx}
                            className={`aspect-square w-full rounded-lg flex items-center justify-center text-sm font-bold transition-all
                                ${date ? 'hover:bg-brand-500/10 hover:text-brand-400' : ''}
                                ${isToday ? 'border-2 border-brand-500 text-brand-400' : ''}
                                ${isSelected ? 'bg-brand-500 text-white shadow-lg' : ''}
                                ${!date ? 'opacity-0 cursor-default' : ''}`}
                            disabled={!date}
                            onClick={() => date && setSelectedDay(date)}
                        >
                            {date ? date.getDate() : ''}
                        </button>
                    );
                })}
            </div>
        );
    };

    if (!userId) {
        return (
            <div className="p-8 text-center text-red-500 font-bold">
                Error: Falta userId para mostrar el calendario.
            </div>
        );
    }

    return (
                <div className="min-h-screen flex items-center justify-center bg-slate-950 py-8 animate-fadeIn">
                        <div className="glass-card p-8 md:p-10 rounded-3xl max-w-5xl w-full border border-white/5 shadow-2xl relative overflow-hidden">
                                {/* NUEVO: Recuadros para nuevos usuarios */}
                                {(!workoutPlan && !dietPlan) && (
                                    <div className="flex flex-col md:flex-row gap-8 justify-center items-center mb-10">
                                        <div className="bg-slate-800 border border-brand-500/40 rounded-2xl p-8 flex flex-col items-center w-full max-w-xs shadow-lg">
                                            <h3 className="text-xl font-bold text-brand-400 mb-2">¿Aún no tienes rutina?</h3>
                                            <p className="text-slate-400 mb-4 text-center">Genera tu primera rutina personalizada y comienza tu progreso.</p>
                                            <button
                                                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                                onClick={() => onNavigate && onNavigate('workout')}
                                            >
                                                Generar nueva rutina
                                            </button>
                                        </div>
                                        <div className="bg-slate-800 border border-orange-500/40 rounded-2xl p-8 flex flex-col items-center w-full max-w-xs shadow-lg">
                                            <h3 className="text-xl font-bold text-orange-400 mb-2">¿Aún no tienes dieta?</h3>
                                            <p className="text-slate-400 mb-4 text-center">Genera tu plan nutricional adaptado a tus objetivos y preferencias.</p>
                                            <button
                                                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                                onClick={() => onNavigate && onNavigate('diet')}
                                            >
                                                Generar dieta
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="flex flex-col md:flex-row gap-8">
                    {/* Calendario */}
                    <div className="flex-1">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Calendario de Rutinas y Dieta</h2>
                            <p className="text-slate-400 text-sm">Selecciona un día para ver tus detalles de entrenamiento y nutrición.</p>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <button onClick={prevMonth} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors" title="Mes anterior">
                                &#8592;
                            </button>
                            <span className="font-bold w-36 text-center select-none text-white">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </span>
                            <button onClick={nextMonth} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors" title="Mes siguiente">
                                &#8594;
                            </button>
                            <button onClick={goToToday} className="ml-2 p-2 hover:bg-brand-500/20 rounded-lg text-slate-400 hover:text-brand-400 transition-colors" title="Hoy">
                                Hoy
                            </button>
                        </div>
                        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 min-h-[350px] flex flex-col justify-center">
                            {renderCalendarGrid()}
                        </div>
                    </div>
                    {/* Panel de detalles del día */}
                    <div className="w-full md:w-[380px] flex-shrink-0">
                        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-lg overflow-hidden">
                            <div className="p-6 border-b border-slate-700 bg-slate-900/30">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Detalles del Día</p>
                                <h3 className="text-xl font-bold text-white mb-4">
                                    {selectedDay ? selectedDay.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Selecciona un día'}
                                </h3>
                                {/* Tabs Entrenamiento/Nutrición */}
                                <div className="flex rounded-lg bg-slate-900/50 p-1 border border-slate-700">
                                    <button
                                        onClick={() => setActiveTab('workout')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'workout' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Entrenamiento
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('diet')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'diet' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Nutrición
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 min-h-[180px] flex flex-col gap-2 text-slate-400">
                                {/* Detalles reales de rutina o dieta */}
                                {activeTab === 'workout' ? (
                                    workoutPlan && selectedDay ? (
                                        (() => {
                                            // Buscar el día de la semana en el plan
                                            const weekDays = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
                                            const dayName = weekDays[selectedDay.getDay()];
                                            const planDay = (workoutPlan.schedule || []).find((d:any) => (d.dayName || '').toLowerCase().includes(dayName));
                                            if (planDay) {
                                                return <div>
                                                    <div className="font-bold text-brand-400 text-lg mb-1">{planDay.dayName}</div>
                                                    {planDay.focus && <div className="text-xs text-brand-300 mb-2">Enfoque: {planDay.focus}</div>}
                                                    {planDay.exercises && planDay.exercises.length > 0 ? (
                                                                                                                <ul className="text-xs text-slate-200 list-disc ml-4">
                                                                                                                        {planDay.exercises.map((ex:any,i:number) => (
                                                                                                                                <li key={i} className="mb-2">
                                                                                                                                    <div className="flex flex-col gap-1 bg-slate-900/60 rounded-lg p-2">
                                                                                                                                        <div className="flex items-center gap-2">
                                                                                                                                            <span className="font-semibold">{ex.name}</span>
                                                                                                                                            {ex.sets && ex.reps && (<span>— {ex.sets}x{ex.reps}</span>)}
                                                                                                                                            {ex.muscleGroup && (<span className="text-slate-500">({ex.muscleGroup})</span>)}
                                                                                                                                            <button
                                                                                                                                                className="ml-auto text-xs text-brand-400 underline hover:text-brand-300"
                                                                                                                                                onClick={() => {
                                                                                                                                                    const alt = {
                                                                                                                                                        name: `Alternativa a ${ex.name}`,
                                                                                                                                                        description: `Ejercicio alternativo para reemplazar ${ex.name}. Realiza un movimiento similar usando el equipo disponible o peso corporal. Consulta el tutorial para ver la ejecución correcta.`
                                                                                                                                                    };
                                                                                                                                                    if (!ex.alternatives) ex.alternatives = [];
                                                                                                                                                    ex.alternatives.push(alt);
                                                                                                                                                    setWorkoutPlan({ ...workoutPlan });
                                                                                                                                                }}
                                                                                                                                            >
                                                                                                                                                Generar ejercicio alternativo
                                                                                                                                            </button>
                                                                                                                                        </div>
                                                                                                                                        {/* Descripción principal */}
                                                                                                                                        {ex.description && (
                                                                                                                                            <div className="text-xs text-slate-400 mb-1">{ex.description}</div>
                                                                                                                                        )}
                                                                                                                                        {/* Alternativas generadas */}
                                                                                                                                        {ex.alternatives && ex.alternatives.length > 0 && (
                                                                                                                                            <div className="mt-1 pl-2 border-l-2 border-brand-500">
                                                                                                                                                <div className="text-xs text-brand-400 font-bold mb-1">Alternativas:</div>
                                                                                                                                                {ex.alternatives.map((alt: any, j: number) => (
                                                                                                                                                    <div key={j} className="mb-1">
                                                                                                                                                        <div className="flex items-center gap-2">
                                                                                                                                                            <span className="font-semibold text-slate-200">{alt.name}</span>
                                                                                                                                                            <a
                                                                                                                                                                href={`https://www.youtube.com/results?search_query=Cómo+hacer+${encodeURIComponent(alt.name)}+ejercicio+gym+español`}
                                                                                                                                                                target="_blank"
                                                                                                                                                                rel="noopener noreferrer"
                                                                                                                                                                className="text-xs text-orange-400 underline hover:text-orange-300"
                                                                                                                                                            >
                                                                                                                                                                Ver tutorial
                                                                                                                                                            </a>
                                                                                                                                                        </div>
                                                                                                                                                        <div className="text-xs text-slate-400">{alt.description}</div>
                                                                                                                                                    </div>
                                                                                                                                                ))}
                                                                                                                                            </div>
                                                                                                                                        )}
                                                                                                                                    </div>
                                                                                                                                </li>
                                                                                                                        ))}
                                                                                                                </ul>
                                                    ) : <div className="text-xs text-slate-500">Día de descanso</div>}
                                                </div>;
                                            } else {
                                                return <span>No hay rutina planificada para este día.</span>;
                                            }
                                        })()
                                    ) : (
                                        <span>{workoutPlan ? 'Selecciona un día para ver tu rutina.' : 'No tienes una rutina generada.'}</span>
                                    )
                                ) : (
                                    dietPlan && selectedDay ? (
                                        (() => {
                                            // Buscar el día de la semana en el plan
                                            const weekDays = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
                                            const dayName = weekDays[selectedDay.getDay()];
                                            // Buscar el índice del día en el schedule
                                            const idx = (dietPlan.schedule || []).findIndex((d:any) => (d.day || '').toLowerCase().includes(dayName));
                                            const planDay = (dietPlan.schedule || [])[idx >= 0 ? idx : selectedDay.getDay()];
                                            if (planDay && planDay.meals && planDay.meals.length > 0) {
                                                return <div>
                                                    <div className="font-bold text-orange-400 text-lg mb-1">{planDay.day}</div>
                                                    <ul className="text-xs text-slate-200 list-disc ml-4">
                                                        {planDay.meals.map((meal:any,i:number) => (
                                                            <li key={i}><span className="font-semibold">{meal.name}</span> <span className="text-slate-500">({meal.calories} kcal)</span></li>
                                                        ))}
                                                    </ul>
                                                </div>;
                                            } else {
                                                return <span>No hay menú planificado para este día.</span>;
                                            }
                                        })()
                                    ) : (
                                        <span>{dietPlan ? 'Selecciona un día para ver tu menú.' : 'No tienes una dieta generada.'}</span>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;