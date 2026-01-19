// NUEVA IMPLEMENTACIÓN BÁSICA DE WorkoutView
import React, { useState } from 'react';
import { Dumbbell } from 'lucide-react';

const WorkoutView: React.FC = () => {
  const [message, setMessage] = useState('');

  // Simulación de generación de rutina
  const handleGenerate = () => {
    setMessage('¡Rutina generada correctamente! (Demo)');
  };

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <Dumbbell className="w-12 h-12 text-brand-400 mb-4" />
      <h2 className="text-2xl font-bold text-slate-200 mb-2">Generador de Rutinas</h2>
      <p className="text-slate-400 mb-4">Haz clic en el botón para generar una rutina de ejemplo.</p>
      <button className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold" onClick={handleGenerate}>
        Generar Rutina
      </button>
      {message && <div className="mt-6 text-green-400 font-bold">{message}</div>}
    </div>
  );
};

export default WorkoutView;