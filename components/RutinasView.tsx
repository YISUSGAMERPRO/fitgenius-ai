import React, { useState } from 'react';
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

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <h2 className="text-2xl font-bold text-slate-200 mb-2">Generador de Rutinas Personalizadas</h2>
      <p className="text-slate-400 mb-4">Configura tu rutina según tu perfil y preferencias.</p>

      <div className="mb-6 w-full max-w-xs">
        <label className="block text-left text-xs font-bold text-slate-400 uppercase mb-2">Nivel de experiencia</label>
        <select
          className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700 focus:border-brand-500 outline-none"
          value={nivel}
          onChange={e => setNivel(e.target.value)}
        >
          <option value="principiante">Principiante</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
        </select>
        <p className="text-xs text-slate-500 mt-2 text-left">
          Selecciona tu nivel para adaptar la dificultad y progresión de la rutina.
        </p>
      </div>

      {/* Selector de tipo de rutina */}
      <div className="mb-6 w-full max-w-xs">
        <label className="block text-left text-xs font-bold text-slate-400 uppercase mb-2">Tipo de rutina</label>
        <select
          className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700 focus:border-brand-500 outline-none"
          value={tipo}
          onChange={e => setTipo(e.target.value)}
        >
          {tiposRutina.map(t => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
        <div className="mt-3 text-left bg-slate-800/60 rounded-xl p-3 border border-slate-700">
          <div className="font-bold text-brand-400 text-sm mb-1">{tiposRutina.find(t => t.id === tipo)?.nombre}</div>
          <div className="text-xs text-slate-300 mb-1">{tiposRutina.find(t => t.id === tipo)?.descripcion}</div>
          <div className="text-xs text-slate-500">Frecuencia recomendada: <span className="font-semibold text-slate-400">{tiposRutina.find(t => t.id === tipo)?.frecuencia}</span></div>
          {/* Mensaje especial si es deporte */}
          {['futbol','voley','basquet','running','natacion'].includes(tipo) && (
            <div className="mt-2 p-2 rounded-lg bg-brand-900/60 border border-brand-500 text-brand-300 text-xs animate-fadeIn">
              <b>¡Rutina deportiva!</b> Se generará un plan físico y técnico adaptado a <span className="capitalize">{tiposRutina.find(t => t.id === tipo)?.nombre}</span>.<br/>
              Incluye ejercicios de prevención de lesiones, movilidad y desarrollo de habilidades clave para el deporte seleccionado.
            </div>
          )}
        </div>
      </div>

      {/* Selector de duración */}
      <div className="mb-3 w-full max-w-xs">
        <label className="block text-left text-xs font-bold text-slate-400 uppercase mb-2">Duración del plan</label>
        <select
          className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700 focus:border-brand-500 outline-none"
          value={duracion}
          onChange={e => setDuracion(Number(e.target.value))}
        >
          <option value={4}>4 semanas</option>
          <option value={8}>8 semanas</option>
          <option value={12}>12 semanas</option>
        </select>
        <p className="text-xs text-slate-500 mt-2 text-left">Elige cuántas semanas quieres seguir el plan.</p>
      </div>

      {/* Selector de tiempo por sesión */}
      <div className="mb-6 w-full max-w-xs">
        <label className="block text-left text-xs font-bold text-slate-400 uppercase mb-2">Tiempo por sesión</label>
        <select
          className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700 focus:border-brand-500 outline-none"
          value={tiempoSesion}
          onChange={e => setTiempoSesion(Number(e.target.value))}
        >
          <option value={30}>30 minutos</option>
          <option value={45}>45 minutos</option>
          <option value={60}>60 minutos</option>
          <option value={75}>75 minutos</option>
          <option value={90}>90 minutos</option>
        </select>
        <p className="text-xs text-slate-500 mt-2 text-left">¿Cuánto tiempo quieres dedicar a cada sesión?</p>
      </div>

      {/* Selector de días preferidos */}
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
        <p className="text-xs text-slate-500 text-left">Selecciona al menos 2 días y máximo 6.</p>
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
        className="mt-2 px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-lg disabled:opacity-60 disabled:cursor-not-allowed"
        onClick={handleGenerarRutina}
        disabled={generando || dias.length < 2}
      >
        {generando ? 'Generando...' : 'Generar Rutina Personalizada'}
      </button>

      {/* Feedback de error */}
      {error && (
        <div className="mt-4 text-red-400 font-bold animate-fadeIn">{error}</div>
      )}

      {/* Mostrar resultado real */}
      {rutina && (
        <div className="mt-8 max-w-2xl mx-auto bg-slate-900/80 border border-brand-500/30 rounded-2xl p-6 text-left animate-fadeIn">
          <h3 className="text-xl font-bold text-brand-400 mb-2">¡Rutina generada exitosamente!</h3>
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
                          <li key={i}>
                            <span className="font-semibold text-slate-100">{ex.name}</span>
                            {ex.sets && ex.reps && (
                              <span> — {ex.sets}x{ex.reps}</span>
                            )}
                            {ex.muscleGroup && (
                              <span className="text-slate-500"> ({ex.muscleGroup})</span>
                            )}
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
  );
};

export default RutinasView;
