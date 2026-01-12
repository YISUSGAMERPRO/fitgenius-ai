
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, WorkoutPlan, DietPlan, Meal, Exercise, Goal } from "../types";

// Initialize the Google GenAI client with the API key from environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("⚠️ VITE_GEMINI_API_KEY no está configurada en .env");
  console.log("Las funciones de IA no estarán disponibles.");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// --- Schemas ---
// Defining schemas for response generation

const exerciseSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Nombre técnico del ejercicio o paso de baile/movimiento" },
    sets: { type: Type.INTEGER, description: "Número de series. REGLA ESTRICTA: Ejercicios compuestos (Sentadilla, Press, Peso Muerto) DEBEN tener 4 o 5 series. Aislamiento 3 o 4. NO pongas todo en 3." },
    reps: { type: Type.STRING, description: "Rango de repeticiones OBLIGATORIO (ej: '8-12', '5', '15-20', 'Al fallo'). NUNCA dejar vacío." },
    rest: { type: Type.STRING, description: "Tiempo de descanso (ej: '0s' para flujo continuo, '180s' para fuerza, '60s' hipertrofia)" },
    muscleGroup: { type: Type.STRING, description: "Músculo principal o Enfoque (ej: 'Cardio', 'Core', 'Técnica')" },
    category: { type: Type.STRING, enum: ["warmup", "main", "cooldown"], description: "Categoría: 'warmup' (calentamiento/movilidad), 'main' (bloque principal), 'cooldown' (estiramiento/vuelta a calma)." },
    tempo: { type: Type.STRING, description: "Cadencia o Ritmo (ej: 'Explosivo', '3-0-1', 'Controlado')" },
    description: { type: Type.STRING, description: "Instrucciones detalladas de ejecución o coreografía." },
    tips: { type: Type.STRING, description: "Cue visual o mental para mejorar la ejecución." },
    videoQuery: { type: Type.STRING, description: "Búsqueda MUY específica para YouTube (ej: 'Zumba reggaeton choreography', 'Pilates hundred exercise', 'Soccer dribbling drills')" }
  },
  required: ["name", "sets", "reps", "rest", "muscleGroup", "description", "tips", "videoQuery", "category"],
};

const workoutDaySchema = {
  type: Type.OBJECT,
  properties: {
    dayName: { type: Type.STRING, description: "Nombre del día (ej: 'Lunes', 'Martes')." },
    focus: { type: Type.STRING, description: "Enfoque principal (Ej: Fuerza, Descanso, Cardio). Si es descanso, poner 'Descanso'." },
    exercises: {
      type: Type.ARRAY,
      items: exerciseSchema,
      description: "Lista de ejercicios. Si es día de descanso, dejar vacío o poner 1 ejercicio de estiramiento ligero."
    }
  },
  required: ["dayName", "focus", "exercises"]
};

const medicalAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    severity: { 
      type: Type.STRING, 
      enum: ["High", "Medium", "Low", "None"],
      description: "Clasificación de riesgo de las lesiones/impedimentos." 
    },
    warningTitle: { type: Type.STRING, description: "Título corto de la alerta médica (si aplica)." },
    warningMessage: { type: Type.STRING, description: "Mensaje detallado sugiriendo consulta médica si es High Priority." },
    modifications: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Lista de adaptaciones biomecánicas aplicadas."
    }
  },
  required: ["severity", "modifications"]
};

const workoutPlanSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    frequency: { type: Type.STRING },
    estimatedDuration: { type: Type.STRING },
    difficulty: { type: Type.STRING, enum: ["Principiante", "Intermedio", "Avanzado"] },
    durationWeeks: { type: Type.INTEGER, description: "Duración recomendada del ciclo en semanas." },
    cycleDurationAdvice: { type: Type.STRING, description: "Explicación científica de por qué se eligió esa duración (periodización)." },
    periodizationModel: { type: Type.STRING, description: "Nombre del modelo de periodización." },
    progressionGuide: { type: Type.STRING, description: "Instrucciones sobre cómo progresar." },
    medicalAnalysis: medicalAnalysisSchema,
    cyclePhase: { type: Type.STRING, description: "Fase del ciclo menstrual detectada (si aplica)." },
    recommendations: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Recomendaciones clave."
    },
    schedule: {
      type: Type.ARRAY,
      items: workoutDaySchema,
      description: "Lista de 7 días de entrenamiento (Lunes a Domingo)."
    }
  },
  required: ["title", "description", "frequency", "schedule", "estimatedDuration", "difficulty", "recommendations", "durationWeeks", "periodizationModel", "progressionGuide", "medicalAnalysis", "cycleDurationAdvice"]
};

const mealSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Nombre del platillo (ej: 'Hot Cakes de Avena', 'Pollo a la Plancha')" },
    description: { type: Type.STRING, description: "Breve descripción apetitosa." },
    ingredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista EXACTA de ingredientes con cantidades en gramos/tazas/piezas (ej: '2 huevos enteros', '50g de avena')." },
    instructions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Pasos de preparación numerados." },
    calories: { type: Type.INTEGER },
    protein: { type: Type.INTEGER },
    carbs: { type: Type.INTEGER },
    fats: { type: Type.INTEGER }
  },
  required: ["name", "description", "ingredients", "instructions", "calories", "protein", "carbs", "fats"]
};

const dietDaySchema = {
    type: Type.OBJECT,
    properties: {
        day: { type: Type.STRING, description: "Día de la semana" },
        meals: {
            type: Type.ARRAY,
            items: mealSchema,
            description: "Debe contener 5 comidas: Desayuno, Colación 1, Comida, Colación 2, Cena."
        }
    },
    required: ["day", "meals"]
};

const dietPlanSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    dailyTargets: {
      type: Type.OBJECT,
      properties: {
        protein: { type: Type.INTEGER },
        carbs: { type: Type.INTEGER },
        fats: { type: Type.INTEGER },
        calories: { type: Type.INTEGER }
      },
      required: ["protein", "carbs", "fats", "calories"]
    },
    schedule: {
      type: Type.ARRAY,
      items: dietDaySchema,
      description: "Plan detallado para 7 días."
    },
    scientificBasis: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Referencias científicas."
    },
    hydrationRecommendation: { type: Type.STRING }
  },
  required: ["title", "summary", "dailyTargets", "schedule", "scientificBasis", "hydrationRecommendation"]
};

// --- API Calls ---

export const generateWorkout = async (profile: UserProfile, type: string, muscleFocus?: string, restDays: string[] = [], sport?: string, durationPreference: string = 'expert'): Promise<WorkoutPlan> => {
  
  if (!ai || !apiKey) {
    throw new Error("API key de Gemini no configurada. Por favor, agrega VITE_GEMINI_API_KEY en el archivo .env");
  }

  const restDaysText = restDays.length > 0 
    ? `DÍAS DE DESCANSO PREFERIDOS POR EL USUARIO (Trata de respetarlos si el tipo de rutina lo permite): ${restDays.join(", ")}.` 
    : "";

  // Robust fallback for equipment if empty array passed
  const equipmentList = (profile.equipment && profile.equipment.length > 0)
        ? profile.equipment.join(", ")
        : "Peso Corporal (Calistenia Básica)";

  // --- DURATION LOGIC ---
  const durationInstruction = durationPreference === 'expert' 
    ? `DETERMINA LA DURACIÓN ÓPTIMA (Semanas) CIENTÍFICAMENTE.
       - Si es Fuerza: Normalmente 4-6 semanas (adaptación neural).
       - Si es Hipertrofia: Normalmente 8-12 semanas (adaptación estructural).
       - Si es Resistencia/Cardio: 4-8 semanas.
       Define 'durationWeeks' y explica el "POR QUÉ" científico en 'cycleDurationAdvice'.`
    : `DURACIÓN FORZADA POR USUARIO: ${durationPreference} SEMANAS. Ajusta la periodización a este marco temporal. Explica en 'cycleDurationAdvice' cómo aprovechar este tiempo.`;

  // --- CALCULATE CYCLE PHASE (For Cycle Syncing) ---
  let cycleInfoText = "";
  let calculatedPhase = "";

  if (profile.gender === "Femenino" && profile.isCycleTracking && profile.lastPeriodStart) {
      const today = new Date();
      const lastPeriod = new Date(profile.lastPeriodStart);
      const diffTime = Math.abs(today.getTime() - lastPeriod.getTime());
      const dayOfCycle = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const cycleLen = profile.cycleLength || 28;
      
      // Basic Estimation
      if (dayOfCycle <= 5) {
          calculatedPhase = "Menstruación";
          cycleInfoText = `
          CONTEXTO BIOLÓGICO: Mujer en Fase MENSTRUACIÓN (Día ${dayOfCycle}).
          Nivel de Energía: BAJO. Inflamación presente.
          ADAPTACIÓN OBLIGATORIA:
          - Reducir intensidad y carga (40-60% RM).
          - Evitar HIIT extremo o cargas espinales pesadas si hay dolor lumbar.
          - Priorizar: Movilidad, Yoga, Caminata, Pesas ligeras altas reps.
          - Descanso entre series: Más largo si es necesario.
          `;
      } else if (dayOfCycle <= 14) {
          calculatedPhase = "Folicular";
          cycleInfoText = `
          CONTEXTO BIOLÓGICO: Mujer en Fase FOLICULAR (Día ${dayOfCycle}).
          Nivel de Energía: EN AUMENTO (Pico de estrógeno).
          ADAPTACIÓN OBLIGATORIA:
          - Fase ideal para ALTA INTENSIDAD y PROGRESIÓN DE CARGAS.
          - Mejor tolerancia al dolor y recuperación rápida.
          - Priorizar: Fuerza máxima, HIIT, Sprints, Entrenamiento complejo.
          `;
      } else if (dayOfCycle <= 17) {
          calculatedPhase = "Ovulación";
          cycleInfoText = `
          CONTEXTO BIOLÓGICO: Mujer en Fase OVULACIÓN (Día ${dayOfCycle}).
          Nivel de Energía: MÁXIMO (Pico de fuerza).
          ADAPTACIÓN OBLIGATORIA:
          - Fuerza máxima posible, PERO con cuidado extremo en ligamentos (mayor riesgo de lesión ACL por laxitud).
          - Buen calentamiento articular obligatorio.
          `;
      } else if (dayOfCycle <= cycleLen) {
          calculatedPhase = "Lútea";
          cycleInfoText = `
          CONTEXTO BIOLÓGICO: Mujer en Fase LÚTEA (Día ${dayOfCycle}).
          Nivel de Energía: DECRECIENTE (Progesterona alta, temp corporal alta).
          ADAPTACIÓN OBLIGATORIA:
          - El cuerpo retiene líquidos y la recuperación es más lenta.
          - Reducir cargas progresivamente hacia el final de la fase.
          - Priorizar: Cardio estado estable (LISS), Pesas moderadas, Técnica.
          - Evitar: PRs extremos en días pre-menstruales.
          `;
      } else {
          // Cycle reset assumption or irregurality
          calculatedPhase = "Fase Irregular / Inicio";
          cycleInfoText = "Usuario fuera de rango estándar de ciclo. Asumir fase estándar pero priorizar escucha corporal.";
      }
  }

  // --- LÓGICA AVANZADA DE VOLUMEN Y ESTRUCTURA ---
  let volumeStrategy = "";
  
  const isHighVolumeRoutine = type.includes("Weider") || type.includes("Arnold") || type.includes("Body Part");
  
  if (type.includes("Zumba") || type.includes("Baile") || type.includes("Kickboxing")) {
      volumeStrategy = `
      ESTRATEGIA ESPECÍFICA: CLASES DE RITMO/BAILE/KICKBOXING
      - Estructura: Calentamiento -> Bloque Alta Intensidad (Tracks Rápidos) -> Bloque Recuperación -> Final.
      - SERIES: Poner '1' (es un flujo continuo por canción/track).
      - REPS: Usar duración (ej: '1 Canción', '3:30 min', '1 Track').
      - DESCANSO: '0s', '15s' o 'Marcha activa'.
      - En 'exercises', describe la coreografía, los pasos o el combo de golpes específico.
      - En 'videoQuery': Busca coreografías específicas en tendencia.
      `;
  } else if (type.includes("Pilates") || type.includes("Yoga")) {
      volumeStrategy = `
      ESTRATEGIA ESPECÍFICA: MIND-BODY (PILATES/YOGA)
      - Enfoque: Flujo, control, respiración y conexión mente-cuerpo.
      - SERIES: 1 a 2 (Flujo continuo).
      - REPS: Altas (12-20) o por Tiempo ('45s'). Enfócate en "Time Under Tension".
      - DESCANSO: Mínimo ('0s' a '15s'). Transiciones fluidas.
      - Incluir ejercicios modernos: 'Wall Pilates Variations', 'Reformer-style on Mat', 'Power Yoga'.
      `;
  } else if (type.includes("Cardio") || type === "Cardio Estricto") {
      volumeStrategy = `
      ESTRATEGIA ESPECÍFICA: CARDIOVASCULAR ESTRATÉGICO
      - NO pongas solo "Correr 30 min". Diseña SESIONES VARIADAS.
      - Día 1: Zona 2 (LISS) - Duración larga, intensidad baja.
      - Día 2: Intervalos / Fartlek - Cambios de ritmo.
      - Día 3: HIIT o Sprints en cuesta.
      - SERIES: Número de rondas o intervalos.
      - REPS: Tiempo de esfuerzo (ej: '4 min zona 4', '30s sprint').
      `;
  } else if (profile.goal === Goal.Strength || type.includes("Powerlifting")) {
      volumeStrategy = `
      ESTRATEGIA DE VOLUMEN: FUERZA PURA (Powerlifting)
      - Ejercicios PRINCIPALES (Sentadilla, Banca, Peso Muerto, Militar): **5 SERIES** OBLIGATORIAS. (Rango 3-5 reps).
      - Ejercicios SECUNDARIOS: **3 a 4 SERIES**. (Rango 6-10 reps).
      - NO generes todo en 3 series. Los básicos requieren 5 series.
      `;
  } else if (profile.goal === Goal.GainMuscle || isHighVolumeRoutine) {
      volumeStrategy = `
      ESTRATEGIA DE VOLUMEN: HIPERTROFIA / CULTURISMO (${type})
      - Ejercicios COMPUESTOS (Press, Remos, Sentadillas): **4 SERIES** (Obligatorio).
      - Ejercicios AISLADOS (Curls, Elevaciones, Extensiones): **3 a 4 SERIES** (Varía para no fatigar en exceso).
      - REGLA: NO pongas 3 series a todo. Usa 4 series en los ejercicios del principio de la sesión.
      `;
  } else if (type === "Calistenia") {
      volumeStrategy = `
      ESTRATEGIA DE VOLUMEN: CALISTENIA / PESO CORPORAL
      - Dado que no hay peso externo, el volumen debe ser ALTO para estimular.
      - Ejercicios básicos (Dominadas, Fondos, Flexiones): **4 a 5 SERIES**.
      - Ejercicios de Core/Skill: **3 SERIES**.
      `;
  } else if (profile.goal === Goal.Endurance || profile.goal === Goal.LoseWeight || type === "HIIT") {
      volumeStrategy = `
      ESTRATEGIA DE VOLUMEN: RESISTENCIA METABÓLICA
      - Circuitos: 3 a 4 Rondas (Series) por ejercicio.
      - Repeticiones: ALTAS (15-20 reps) o por TIEMPO.
      - Descanso: Corto.
      `;
  } else {
      // Default / Maintenance
      volumeStrategy = `
      ESTRATEGIA DE VOLUMEN: MANTENIMIENTO
      - Ejercicios Principales: 3 a 4 Series.
      - Ejercicios Accesorios: 2 a 3 Series.
      `;
  }

  const prompt = `
  ROL: Entrenador Personal de Clase Mundial y Experto en Fisiología.

  Crea un PLAN DE ENTRENAMIENTO JSON para:
  - Perfil: ${profile.age} años, ${profile.gender}, Objetivo: ${profile.goal}.
  - Nivel: ${profile.activityLevel}
  
  *** REGLA DE ORO DE EQUIPAMIENTO ***
  INVENTARIO ESTRICTO DISPONIBLE: [ ${equipmentList} ].
  VALIDACIÓN OBLIGATORIA:
  1. Si el usuario SOLO tiene "Mancuernas", NO generes ejercicios con Barras, Poleas o Máquinas.
  2. Si el usuario tiene "Peso Corporal", TODOS los ejercicios deben ser de calistenia/suelo.
  3. Si falta equipo para un músculo (ej: espalda sin barra de dominadas), usa creatividad (ej: "Remo con mochila/objeto" o "Superman pulls").
  4. Generar un ejercicio imposible de realizar con el inventario listado se considera un ERROR CRÍTICO.
  
  - TIPO DE RUTINA SOLICITADA: "${type}"
  ${muscleFocus ? `- ÉNFASIS MUSCULAR: ${muscleFocus}` : ''}
  ${restDaysText}

  ${cycleInfoText ? `
  --- IMPORTANTE: ADAPTACIÓN HORMONAL FEMENINA ---
  ${cycleInfoText}
  --- FIN ADAPTACIÓN ---
  ` : ''}

  INSTRUCCIONES ESTRUCTURALES Y DE VOLUMEN (CRUCIAL):
  1. Diseña la agenda semanal (7 días, Lunes a Domingo) basándote en la metodología "${type}".
  2. **APLICA ESTA ESTRATEGIA DE ESTRUCTURA Y VOLUMEN ESTRICTAMENTE:**
     ${volumeStrategy}
     
  3. ${durationInstruction}
  4. El array 'schedule' DEBE tener exactamente 7 elementos.
  5. Para los días de descanso, el objeto 'exercises' debe estar vacío o contener solo estiramientos muy ligeros, y 'focus' debe decir "Descanso".

  SEGURIDAD MÉDICA:
  - Lesiones: "${profile.injuries || 'Ninguna'}"
  - Si hay lesiones, MODIFICA ejercicios agresivos y explica la adaptación en 'description'.

  IMPORTANTE JSON: 
  - Asegúrate de llenar el campo 'reps' (Repeticiones) en TODOS los ejercicios.
  - Genera solo JSON válido.
  - El campo 'cyclePhase' en la respuesta debe ser: "${calculatedPhase}" (si aplica).
  `;

  // Updated to gemini-3-pro-preview for complex reasoning task
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: workoutPlanSchema,
      temperature: 0.7
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as WorkoutPlan;
  }
  throw new Error("No se pudo generar la rutina.");
};

export const getExerciseAlternative = async (originalExercise: Exercise, profile: UserProfile, avoidNames: string[] = []): Promise<Exercise> => {
    // Fallback equipment if empty
    const equipmentList = (profile.equipment && profile.equipment.length > 0) 
        ? profile.equipment.join(", ") 
        : "Peso Corporal";

    const randomSeed = Math.random();

    const prompt = `Actúa como un entrenador experto.
    CONTEXTO: Reemplazar ejercicio "${originalExercise.name}" (${originalExercise.muscleGroup}).
    
    INVENTARIO ESTRICTO: [ ${equipmentList} ]
    REGLA: Solo genera ejercicios posibles con este inventario.
    
    EXCLUIR: [ ${avoidNames.join(", ")}, ${originalExercise.name} ]
    
    SOLICITUD: Alternativa biomecánicamente equivalente pero DISTINTA.
    MANTÉN la misma 'category' que el original (${originalExercise.category || 'main'}).
    
    VOLUMEN:
    - Si el original tenía 4 o 5 series, MANTÉN ese volumen alto.
    - Objetivo usuario: ${profile.goal}.
    
    SEMILLA: ${randomSeed}
    
    Perfil: ${profile.gender}, Objetivo: ${profile.goal}.
    Lesiones: "${profile.injuries || 'Ninguna'}".

    Devuelve JSON.`;

    // Updated to gemini-3-pro-preview for complex reasoning task
    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: exerciseSchema,
            temperature: 1.0
        }
    });

    if (response.text) {
        return JSON.parse(response.text) as Exercise;
    }
    throw new Error("No se pudo generar una alternativa.");
};

export const generateDiet = async (
    profile: UserProfile, 
    dietType: string, 
    preferences: string[] = [],
    budget?: { amount: number, frequency: string }
): Promise<DietPlan> => {
  const preferencesText = preferences.length > 0 
    ? `RESTRICCIONES Y GUSTOS: ${preferences.join(", ")}` 
    : "";

  let budgetText = "";
  if (budget && budget.amount > 0) {
      budgetText = `PRESUPUESTO: ${budget.amount} PESOS MEXICANOS (MXN) (${budget.frequency}). Ajusta los ingredientes a opciones locales económicas de México si el presupuesto es bajo.`;
  }

  // Logic for Deficit/Surplus based on dietType selection
  let caloricInstruction = "";
  if (dietType.includes("Déficit") || dietType.includes("Pérdida")) {
      caloricInstruction = "OBJETIVO: PÉRDIDA DE GRASA. Genera un DÉFICIT CALÓRICO moderado (aprox -300 a -500 kcal sobre el mantenimiento). Prioriza volumen de comida con vegetales y fibra para la saciedad.";
  } else if (dietType.includes("Volumen") || dietType.includes("Ganancia")) {
      caloricInstruction = "OBJETIVO: GANANCIA MUSCULAR (VOLUMEN). Genera un SUPERÁVIT CALÓRICO ligero (aprox +300 a +500 kcal). Prioriza carbohidratos complejos y proteína.";
  } else {
      caloricInstruction = `OBJETIVO: ${profile.goal}. Calcula calorías de mantenimiento o ajuste leve según el perfil.`;
  }

  let cycleDietContext = "";
  if (profile.gender === "Femenino" && profile.isCycleTracking && profile.lastPeriodStart) {
      // Re-calculate cycle phase for diet (simple)
      const today = new Date();
      const lastPeriod = new Date(profile.lastPeriodStart);
      const diffTime = Math.abs(today.getTime() - lastPeriod.getTime());
      const dayOfCycle = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (dayOfCycle >= 18 && dayOfCycle <= 28) {
          cycleDietContext = `
          FASE LÚTEA/PRE-MENSTRUAL DETECTADA:
          - Aumenta ligeramente grasas saludables y magnesio (chocolate negro, nueces) para combatir antojos.
          - Reduce sal para evitar retención de líquidos.
          - Aumenta fibra.
          `;
      } else if (dayOfCycle <= 5) {
          cycleDietContext = `
          FASE MENSTRUAL DETECTADA:
          - Aumenta alimentos ricos en HIERRO (carnes rojas magras, espinacas, legumbres) + Vitamina C.
          - Comidas reconfortantes y calientes.
          `;
      }
  }

  const prompt = `
  Actúa como un **Nutricionista Deportivo Experto**.
  
  Crea un PLAN SEMANAL (7 DÍAS) de tipo "${dietType}" para:
  - Perfil: ${profile.age} años, ${profile.gender}, ${profile.weight}kg, ${profile.height}cm.
  - Nivel de Actividad: ${profile.activityLevel}
  
  INSTRUCCIONES CLAVE DE ESTRUCTURA:
  1. **GENERA 5 COMIDAS DIARIAS OBLIGATORIAS**:
     - Desayuno
     - Colación Matutina (Snack 1)
     - Comida (Almuerzo fuerte)
     - Colación Vespertina (Snack 2)
     - Cena
  2. ${caloricInstruction}
  3. ${preferencesText}
  4. ${budgetText}
  5. **CONTEXTO MEXICANO & DETALLE**: 
     - Usa ingredientes disponibles en México (ej: tortillas de maíz, nopales, frijoles, arroz, pollo, atún, verduras locales).
     - **MUY IMPORTANTE**: En la lista de 'ingredients', especifica las CANTIDADES EXACTAS (gramos, piezas, tazas). No pongas solo "arroz", pon "1 taza de arroz cocido (150g)".
  6. Variedad: Que no sea lo mismo todos los días.
  
  ${cycleDietContext}

  Calcula calorías y macros exactos. Genera JSON detallado.`;

  // Updated to gemini-3-pro-preview for complex reasoning task
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: dietPlanSchema,
      temperature: 0.6
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as DietPlan;
  }
  throw new Error("No se pudo generar la dieta.");
};

export const regenerateMeal = async (
    profile: UserProfile, 
    originalMeal: Meal, 
    dietType: string, 
    preferences: string[] = [],
    budget?: { amount: number, frequency: string }
): Promise<Meal> => {
    const preferencesText = preferences.length > 0 ? `RESTRICCIONES: ${preferences.join(", ")}` : "";
    let budgetText = budget && budget.amount > 0 ? `PRESUPUESTO: ${budget.amount} MXN` : "";

    const prompt = `Nutricionista experto. Reemplaza la comida "${originalMeal.name}" (${originalMeal.calories} kcal) de dieta "${dietType}".
    Perfil: ${profile.goal}.
    ${preferencesText} ${budgetText}
    CONTEXTO: Usa ingredientes comunes en México.
    IMPORTANTE: Especifica CANTIDADES EXACTAS (gramos/tazas) en los ingredientes.
    Genera NUEVA opción con ingredientes diferentes pero macros similares. Devuelve JSON.`;
  
    // Updated to gemini-3-pro-preview for complex reasoning task
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: mealSchema,
        temperature: 0.8
      }
    });
  
    if (response.text) {
      return JSON.parse(response.text) as Meal;
    }
    throw new Error("No se pudo generar el plato alternativo.");
  };

export const getMedicalAdvice = async (
    chatHistory: { role: 'user' | 'model', text: string }[],
    profile: UserProfile,
    workoutPlan?: WorkoutPlan,
    dietPlan?: DietPlan
): Promise<string> => {
    
    let contextData = workoutPlan ? `Plan: ${workoutPlan.title}. ` : "";
    contextData += dietPlan ? `Dieta: ${dietPlan.title}.` : "";

    let cycleContext = "";
    if (profile.gender === "Femenino" && profile.isCycleTracking && profile.lastPeriodStart) {
        cycleContext = "Usuario activa seguimiento de ciclo menstrual. Considera fases hormonales en tus respuestas sobre dolor o energía.";
    }

    const contextPrompt = `
    ERES: 'Dr. FitGenius', experto en medicina deportiva.
    PACIENTE: ${profile.age} años, ${profile.gender}, Lesiones: ${profile.injuries || 'Ninguna'}.
    CONTEXTO: ${contextData}
    ${cycleContext}

    MISIÓN: Diagnóstico preliminar, recuperación, suplementación.
    SEGURIDAD: Si hay síntomas graves (pecho, desmayo), indica IR A URGENCIAS [ALERTA MÉDICA].
    
    Historial:
    `;

    const historyText = chatHistory.map(msg => `${msg.role === 'user' ? 'USUARIO' : 'DR. FITGENIUS'}: ${msg.text}`).join('\n');
    const fullPrompt = contextPrompt + "\n" + historyText + "\n\nDR. FITGENIUS (Responde ahora):";

    // Updated to gemini-3-pro-preview for complex reasoning task
    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: fullPrompt,
        config: { temperature: 0.5 }
    });

    return response.text || "Error en consulta médica.";
}
