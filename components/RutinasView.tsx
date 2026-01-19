import React, { useState } from 'react';
import { Dumbbell, Settings2, Info, CalendarDays, ChevronDown } from 'lucide-react';
import { api } from '../services/api';
import { UserProfile } from '../types';


interface RutinasViewProps {
  user: UserProfile;
  userId: string;
}

const RutinasView: React.FC<RutinasViewProps> = ({ user, userId }) => {

  const [nivel, setNivel] = useState('principiante');

  const [tipo, setTipo] = useState('fullbody');
  const [duracion, setDuracion] = useState(4); // semanas
   const [tiempoSesion, setTiempoSesion] = useState(60); // minutos por sesión
  const [dias, setDias] = useState<string[]>(['Lunes', 'Miércoles', 'Viernes']);

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Estado para mostrar rutina generada real
  const [rutina, setRutina] = useState<any>(null);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ajustes avanzados
  const equipoOpciones = [
    'Ninguno',
    'Mancuernas',
    'Barra',
    'Banco',
    'Bandas',
    'Máquinas',
    'Cuerpo libre',
    'Gimnasio completo',
  ];
  const [focus, setFocus] = useState('');
  const [equipo, setEquipo] = useState<string[]>(user.equipment || []);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Generación real de rutina personalizada
  const handleGenerarRutina = async () => {
    setGenerando(true);
    setError(null);
    setRutina(null);
    try {
      const result = await api.generateWorkout(
        userId,
        user,
        tipo,
        {
          frequency: dias.length,
          selectedDays: dias,
          duration: duracion,
          knowledgeLevel: nivel,
          focus: focus || undefined,
          equipment: equipo,
          sessionTime: tiempoSesion,
        }
      );
      setRutina(result);
    } catch (e: any) {
      setError(e?.message || 'Error al generar la rutina. Intenta de nuevo.');
    } finally {
      setGenerando(false);
    }
  };

  // Tipos de rutina con descripción y frecuencia recomendada
  const tiposRutina = [
    {
      id: 'fullbody',
      nombre: 'Full Body',
      descripcion: 'Entrena todo el cuerpo en cada sesión. Ideal para principiantes o quienes disponen de poco tiempo.',
      frecuencia: '2-4 días/semana',
    },
    {
      id: 'weider',
      nombre: 'Weider',
      descripcion: 'Divide el entrenamiento por grupos musculares. Recomendado para intermedios y avanzados.',
      frecuencia: '5-6 días/semana',
    },
    {
      id: 'torso-pierna',
      nombre: 'Torso/Pierna',
      descripcion: 'Alterna días de torso y pierna. Equilibrio entre volumen y recuperación.',
      frecuencia: '4 días/semana',
    },
    {
      id: 'push-pull-legs',
      nombre: 'Push/Pull/Legs',
      descripcion: 'Empuje, tirón y piernas. Permite alta frecuencia y variedad.',
      frecuencia: '3-6 días/semana',
    },
    {
      id: 'hiit',
      nombre: 'HIIT',
      descripcion: 'Entrenamiento interválico de alta intensidad. Corto y efectivo para mejorar resistencia y quemar grasa.',
      frecuencia: '2-4 días/semana',
    },
    {
      id: 'calistenia',
      nombre: 'Calistenia',
      descripcion: 'Rutina con peso corporal. Mejora fuerza funcional y control corporal.',
      frecuencia: '3-6 días/semana',
    },
    // Deportes
    {
      id: 'futbol',
      nombre: 'Fútbol',
      descripcion: 'Preparación física y técnica para futbolistas: resistencia, agilidad, fuerza y prevención de lesiones.',
      frecuencia: '2-5 días/semana',
    },
    {
      id: 'voley',
      nombre: 'Vóley',
      descripcion: 'Rutina para mejorar salto, velocidad de reacción, fuerza de tren inferior y superior, y prevención de lesiones.',
      frecuencia: '2-4 días/semana',
    },
    {
      id: 'basquet',
      nombre: 'Básquet',
      descripcion: 'Entrenamiento para potencia, salto, agilidad, resistencia y control corporal orientado a jugadores de básquet.',
      frecuencia: '2-5 días/semana',
    },
    {
      id: 'running',
      nombre: 'Running',
      descripcion: 'Plan de fuerza, movilidad y prevención de lesiones para corredores de fondo o velocidad.',
      frecuencia: '2-6 días/semana',
    },
    {
      id: 'natacion',
      nombre: 'Natación',
      descripcion: 'Rutina de fuerza, movilidad y acondicionamiento para nadadores.',
      frecuencia: '2-6 días/semana',
    },
  ];

  // Estado para tabs: 'plan' (rutina generada) o 'generator' (formulario)
  const [activeTab, setActiveTab] = React.useState<'plan' | 'generator'>('generator');

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 py-8 animate-fadeIn">
      <div className="glass-card p-8 md:p-10 rounded-3xl max-w-xl w-full border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="flex justify-center mb-6 tab-switcher no-print">
          <div className="bg-slate-800 p-1 rounded-xl flex gap-1 border border-slate-700">
            <button
              onClick={() => setActiveTab('plan')}
              disabled={!rutina}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'plan' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'}`}
            >
              <Dumbbell className="w-4 h-4" /> Mi Rutina
            </button>
            <button
              onClick={() => setActiveTab('generator')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'generator' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Settings2 className="w-4 h-4" /> Generador & Ajustes
            </button>
          </div>
        </div>

        {/* --- GENERADOR TAB --- */}
        {activeTab === 'generator' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-brand-500/20 p-3 rounded-xl text-brand-400">
                <Dumbbell className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Generador de Rutinas IA</h2>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Nivel de experiencia</label>
                  <select
                    className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-brand-500 appearance-none transition-all hover:bg-slate-800"
                    value={nivel}
                    onChange={e => setNivel(e.target.value)}
                  >
                    <option value="principiante">Principiante</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                  </select>
                  <div className="absolute right-4 top-[38px] pointer-events-none text-slate-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                  <div className="mt-2 text-xs text-brand-300 bg-brand-500/10 p-2 rounded-lg border border-brand-500/20 flex items-start gap-2">
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    Selecciona tu nivel para adaptar la dificultad y progresión de la rutina.
                  </div>
                </div>

                {/* Selector de tipo de rutina */}
                <div className="relative">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Tipo de rutina</label>
                  <select
                    className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-brand-500 appearance-none transition-all hover:bg-slate-800"
                    value={tipo}
                    onChange={e => setTipo(e.target.value)}
                  >
                    {tiposRutina.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-[38px] pointer-events-none text-slate-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                  <div className="mt-2 text-xs text-brand-300 bg-brand-500/10 p-2 rounded-lg border border-brand-500/20 flex items-start gap-2">
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {tiposRutina.find(t => t.id === tipo)?.descripcion}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Frecuencia recomendada: <span className="font-semibold text-slate-400">{tiposRutina.find(t => t.id === tipo)?.frecuencia}</span></div>
                  {/* Mensaje especial si es deporte */}
                  {['futbol','voley','basquet','running','natacion'].includes(tipo) && (
                    <div className="mt-2 p-2 rounded-lg bg-brand-900/60 border border-brand-500 text-brand-300 text-xs animate-fadeIn">
                      <b>¡Rutina deportiva!</b> Se generará un plan físico y técnico adaptado a <span className="capitalize">{tiposRutina.find(t => t.id === tipo)?.nombre}</span>.<br/>
                      Incluye ejercicios de prevención de lesiones, movilidad y desarrollo de habilidades clave para el deporte seleccionado.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Duración del plan</label>
                  <select
                    className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-brand-500 appearance-none transition-all hover:bg-slate-800"
                    value={duracion}
                    onChange={e => setDuracion(Number(e.target.value))}
                  >
                    <option value={4}>4 semanas</option>
                    <option value={8}>8 semanas</option>
                    <option value={12}>12 semanas</option>
                  </select>
                  <div className="mt-2 text-xs text-brand-300 bg-brand-500/10 p-2 rounded-lg border border-brand-500/20 flex items-start gap-2">
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    Elige cuántas semanas quieres seguir el plan.
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Tiempo por sesión</label>
                  <select
                    className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-brand-500 appearance-none transition-all hover:bg-slate-800"
                    value={tiempoSesion}
                    onChange={e => setTiempoSesion(Number(e.target.value))}
                  >
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos</option>
                    <option value={75}>75 minutos</option>
                    <option value={90}>90 minutos</option>
                  </select>
                  <div className="mt-2 text-xs text-brand-300 bg-brand-500/10 p-2 rounded-lg border border-brand-500/20 flex items-start gap-2">
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    ¿Cuánto tiempo quieres dedicar a cada sesión?
                  </div>
                </div>
              </div>

              <div className="mb-6 w-full max-w-xs">
                <label className="block text-left text-xs font-bold text-slate-400 uppercase mb-2">Días de entrenamiento</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {diasSemana.map(dia => {
                    const seleccionado = dias.includes(dia);
                    return (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => {
                          if (seleccionado) {
                            if (dias.length > 2) setDias(dias.filter(d => d !== dia));
                          } else {
                            setDias([...dias, dia]);
                          }
                        }}
                        className={`py-2 px-3 rounded-lg font-semibold text-sm border-2 transition-all ${seleccionado ? 'bg-brand-600 text-white border-brand-500 shadow-lg' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-brand-400'}`}
                        disabled={!seleccionado && dias.length >= 6}
                      >
                        {dia}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs text-brand-300 bg-brand-500/10 p-2 rounded-lg border border-brand-500/20 flex items-start gap-2">
                  <CalendarDays className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  Selecciona al menos 2 días y máximo 6.
                </div>
              </div>
              {/* Ajustes avanzados */}
              <div className="mb-6 w-full max-w-xs">
                <button
                  type="button"
                  className="text-xs text-brand-400 underline mb-2"
                  onClick={() => setShowAdvanced(a => !a)}
                >
                  {showAdvanced ? 'Ocultar ajustes avanzados' : 'Mostrar ajustes avanzados'}
                </button>
                {showAdvanced && (
                  <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 mb-2 animate-fadeIn">
                    <label className="block text-left text-xs font-bold text-slate-400 uppercase mb-1">Enfoque muscular (opcional)</label>
                    <input
                      type="text"
                      className="w-full p-2 rounded-lg bg-slate-900 text-white border border-slate-700 mb-3"
                      placeholder="Ej: Glúteos, Espalda, Hombros..."
                      value={focus}
                      onChange={e => setFocus(e.target.value)}
                    />
                    <label className="block text-left text-xs font-bold text-slate-400 uppercase mb-1">Equipamiento disponible</label>
                    <div className="flex flex-wrap gap-2">
                      {equipoOpciones.map(eq => (
                        <button
                          key={eq}
                          type="button"
                          className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-all ${equipo.includes(eq) ? 'bg-brand-600 text-white border-brand-500' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-brand-400'}`}
                          onClick={() => {
                            if (equipo.includes(eq)) setEquipo(equipo.filter(e => e !== eq));
                            else setEquipo([...equipo, eq]);
                          }}
                        >
                          {eq}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Botón para generar rutina */}
              <button
                className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-xl flex items-center justify-center gap-2 group mt-4 ${
                  generando
                    ? 'bg-slate-700 cursor-wait'
                    : 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 shadow-brand-500/20 hover:shadow-brand-500/40 hover:-translate-y-0.5'
                }`}
                onClick={handleGenerarRutina}
                disabled={generando || dias.length < 2}
              >
                {generando ? (
                  <><Settings2 className="w-5 h-5 animate-spin" /> Generando...</>
                ) : (
                  <><Dumbbell className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Generar Rutina Personalizada</>
                )}
              </button>
              {error && <p className="text-red-400 mt-4 bg-red-500/10 p-2 rounded-lg text-center text-sm">{error}</p>}
            </div>
          </div>
        )}
          {/* --- PLAN TAB --- */}
          {activeTab === 'plan' && rutina && (
            <div className="mt-2 max-w-2xl mx-auto glass-card bg-slate-900/80 border border-brand-500/30 rounded-2xl p-8 text-left animate-fadeIn shadow-xl">
              <h3 className="text-xl font-bold text-brand-400 mb-2 flex items-center gap-2"><Dumbbell className="w-6 h-6" /> ¡Rutina generada exitosamente!</h3>
              {rutina.title && <div className="text-lg font-bold text-slate-200 mb-1">{rutina.title}</div>}
              {rutina.description && <div className="text-slate-400 mb-2">{rutina.description}</div>}
              {rutina.schedule && Array.isArray(rutina.schedule) && (
                <div className="mt-4">
                  <div className="font-bold text-brand-300 mb-2">Plan Semanal:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rutina.schedule.map((day: any, idx: number) => (
                      <div key={idx} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
                        <div className="font-bold text-slate-200 mb-1">{day.dayName || `Día ${idx + 1}`}</div>
                        {day.focus && <div className="text-xs text-brand-400 mb-1">Enfoque: {day.focus}</div>}
                        {day.exercises && day.exercises.length > 0 ? (
                          <ul className="text-xs text-slate-300 list-disc ml-4">
                            {day.exercises.map((ex: any, i: number) => (
                              <li key={i} className="mb-2">
                                <div className="flex flex-col gap-1 bg-slate-900/60 rounded-lg p-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-100">{ex.name}</span>
                                    {ex.sets && ex.reps && (
                                      <span>— {ex.sets}x{ex.reps}</span>
                                    )}
                                    {ex.muscleGroup && (
                                      <span className="text-slate-500">({ex.muscleGroup})</span>
                                    )}
                                    <button
                                      className="ml-auto text-xs text-brand-400 underline hover:text-brand-300"
                                      onClick={() => {
                                        // Generar ejercicio alternativo simple (mock)
                                        const alt = {
                                          name: `Alternativa a ${ex.name}`,
                                          description: `Ejercicio alternativo para reemplazar ${ex.name}. Realiza un movimiento similar usando el equipo disponible o peso corporal. Consulta el tutorial para ver la ejecución correcta.`
                                        };
                                        if (!ex.alternatives) ex.alternatives = [];
                                        ex.alternatives.push(alt);
                                        setRutina({ ...rutina });
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
                        ) : (
                          <div className="text-xs text-slate-500">Día de descanso</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-green-400 font-bold mt-4">¡Puedes guardar o imprimir esta rutina para tu seguimiento!</div>
            </div>
          )}
      </div>
    </div>
  );
};

export default RutinasView;
