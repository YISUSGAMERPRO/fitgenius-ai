// Declaración global para Vite env
interface ImportMetaEnv {
  VITE_API_URL: string;
}
interface ImportMeta {
  env: ImportMetaEnv;
}

export enum Gender {
  Male = 'Masculino',
  Female = 'Femenino',
  Other = 'Otro'
}

// ==================== IMC (Índice de Masa Corporal) ====================
export interface IMCResult {
  value: number;
  category: 'bajo_peso' | 'normal' | 'sobrepeso' | 'obesidad_1' | 'obesidad_2' | 'obesidad_3';
  label: string;
  color: string;
  description: string;
  recommendations: string[];
}

export function calculateIMC(weight: number, heightCm: number): number {
  if (!weight || !heightCm || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return parseFloat((weight / (heightM * heightM)).toFixed(1));
}

export function getIMCCategory(imc: number): IMCResult {
  if (imc < 18.5) {
    return {
      value: imc,
      category: 'bajo_peso',
      label: 'Bajo Peso',
      color: '#3B82F6', // blue
      description: 'Tu peso está por debajo del rango saludable.',
      recommendations: [
        'Aumentar ingesta calórica gradualmente',
        'Priorizar proteínas de alta calidad',
        'Entrenamiento de fuerza para ganar masa muscular',
        'Consultar con nutricionista si el bajo peso persiste'
      ]
    };
  } else if (imc < 25) {
    return {
      value: imc,
      category: 'normal',
      label: 'Peso Normal',
      color: '#22C55E', // green
      description: 'Tu peso está en el rango saludable. ¡Excelente!',
      recommendations: [
        'Mantener hábitos alimenticios actuales',
        'Continuar con actividad física regular',
        'Monitorear peso mensualmente',
        'Enfocarse en mejorar composición corporal'
      ]
    };
  } else if (imc < 30) {
    return {
      value: imc,
      category: 'sobrepeso',
      label: 'Sobrepeso',
      color: '#F59E0B', // amber
      description: 'Tu peso está ligeramente por encima del rango saludable.',
      recommendations: [
        'Reducir ingesta calórica gradualmente (déficit 15-20%)',
        'Aumentar actividad cardiovascular',
        'Priorizar alimentos integrales y proteínas',
        'Reducir azúcares y alimentos procesados'
      ]
    };
  } else if (imc < 35) {
    return {
      value: imc,
      category: 'obesidad_1',
      label: 'Obesidad Grado I',
      color: '#F97316', // orange
      description: 'Obesidad moderada. Se recomienda supervisión médica.',
      recommendations: [
        'Consultar con profesional de salud',
        'Plan de alimentación estructurado',
        'Ejercicio de bajo impacto inicialmente',
        'Monitorear presión arterial y glucosa'
      ]
    };
  } else if (imc < 40) {
    return {
      value: imc,
      category: 'obesidad_2',
      label: 'Obesidad Grado II',
      color: '#EF4444', // red
      description: 'Obesidad severa. Supervisión médica necesaria.',
      recommendations: [
        'Supervisión médica obligatoria',
        'Plan nutricional con profesional',
        'Comenzar con caminatas suaves',
        'Evaluar factores de riesgo cardiovascular'
      ]
    };
  } else {
    return {
      value: imc,
      category: 'obesidad_3',
      label: 'Obesidad Grado III',
      color: '#DC2626', // dark red
      description: 'Obesidad mórbida. Atención médica prioritaria.',
      recommendations: [
        'Atención médica inmediata',
        'Posible evaluación para tratamiento especializado',
        'Ejercicio solo bajo supervisión',
        'Apoyo psicológico recomendado'
      ]
    };
  }
}

export enum Goal {
  LoseWeight = 'Perder grasa',
  GainMuscle = 'Ganar músculo',
  Maintenance = 'Mantenimiento',
  Strength = 'Fuerza máxima',
  Endurance = 'Resistencia muscular',
  Cardio = 'Mejorar resistencia cardiovascular'
}

export enum ActivityLevel {
  Sedentary = 'Sedentario',
  Light = 'Ligero (1-2 días/semana)',
  Moderate = 'Moderado (3-5 días/semana)',
  Active = 'Activo (6-7 días/semana)',
  Athlete = 'Atleta profesional'
}

export enum BodyType {
  Ectomorph = 'Ectomorfo',
  Mesomorph = 'Mesomorfo',
  Endomorph = 'Endomorfo'
}

export interface UserProfile {
  id?: string;
  name: string;
  age: number;
  height: number; // cm
  weight: number; // kg
  gender: Gender;
  bodyType?: BodyType;
  goal: Goal;
  activityLevel: ActivityLevel;
  equipment: string[]; // e.g., "Gym", "Dumbbells", "None"
  injuries?: string; // Now includes mechanical impediments description
  // Cycle Syncing Fields
  isCycleTracking?: boolean;
  lastPeriodStart?: string; // ISO Date String
  cycleLength?: number; // Default 28
}

export interface UserAccount {
    id: string;
    email: string;
    password: string; // Stored in localstorage (simulated)
    profile?: UserProfile;
}

export interface ExerciseSet {
  weight: number;
  reps: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  isWarmup?: boolean;
}

export interface ExerciseAlternative {
  name: string;
  reason: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string; // e.g. "60s"
  muscleGroup: string;
  description: string;
  tips: string;
  tempo?: string; // e.g. "3-1-1-0"
  videoQuery: string; // For generating a YouTube search link
  category?: 'warmup' | 'main' | 'cooldown'; // New field for sectioning
  performedSets?: ExerciseSet[]; // For manual/pro logging
  userNotes?: string; // Personal notes for the exercise
  alternatives?: ExerciseAlternative[]; // Alternative exercises if equipment is not available
}

export interface WorkoutDay {
  dayName: string; // e.g., "Día 1: Tren Superior" or "Lunes"
  focus: string; // e.g., "Pecho y Espalda"
  exercises: Exercise[];
}

export interface MedicalAnalysis {
  severity: 'High' | 'Medium' | 'Low' | 'None'; // Priority classification
  warningTitle?: string; // Short title for the alert
  warningMessage?: string; // Detailed advice regarding the impediment
  modifications: string[]; // List of specific biomechanical adaptations applied (e.g. "Avoid axial loading due to scoliosis")
}

export interface WorkoutPlan {
  id?: string;
  title: string;
  description: string;
  frequency: string;
  schedule: WorkoutDay[]; // Changed from single exercises array to weekly schedule
  estimatedDuration: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  recommendations?: string[];
  // Periodization & Scheduling Fields
  durationWeeks: number; // Recommended cycle duration (e.g., 8 weeks)
  cycleDurationAdvice?: string; // Scientific rationale for the duration
  periodizationModel: string; // e.g. "Linear Periodization", "Undulating", "Block"
  progressionGuide: string; // Specific advice on how to overload (e.g. "Increase weight by 2.5% every week")
  // Medical & Mechanical Analysis
  medicalAnalysis: MedicalAnalysis;
  // Cycle Syncing Info (Generated by AI)
  cyclePhase?: string; 
  startDate?: string; // ISO String date when the workout was created/started
}

export interface WorkoutTemplate {
    id: string;
    name: string;
    exercises: Exercise[];
    createdAt: string;
}

export interface Macronutrients {
  protein: number; // grams
  carbs: number;
  fats: number;
  calories: number;
}

export interface MealAlternative {
  name: string;
  swapFor: string;
  reason: string;
}

export interface Meal {
  name: string;
  type?: string; // Desayuno, Almuerzo, Cena, etc.
  description: string;
  ingredients: string[];
  instructions?: string[]; // Step-by-step preparation
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  prepTime?: string;
  alternatives?: MealAlternative[]; // Alternative ingredients
}

export interface DietDay {
  day: string; // "Lunes", "Martes", etc.
  meals: Meal[];
}

export interface DietPlan {
  title: string;
  summary: string;
  dailyTargets: Macronutrients;
  schedule: DietDay[]; // Weekly schedule
  scientificBasis: string[]; // References/Books/Studies
  hydrationRecommendation: string;
  startDate?: string; // ISO String date when the diet was created/started
}

export interface WorkoutLog {
  id: string;
  date: string; // ISO string
  workoutTitle: string;
  exercisesCompleted: number;
  totalExercises: number;
  durationSeconds: number;
  exercises?: Exercise[]; // Snapshot of exercises performed
}

// --- Gym Admin Types ---
export interface GymMember {
  id: string;
  name: string;
  contactInfo?: string; // Email or Phone number
  contactType?: 'Email' | 'Teléfono';
  joinDate: string;
  plan: 'Mensual' | 'Trimestral' | 'Anual' | 'VIP' | 'Visita';
  status: 'Activo' | 'Inactivo' | 'Pendiente' | 'Vencido';
  lastPaymentDate: string; 
  lastPaymentAmount?: number; // Actual amount paid
  subscriptionEndDate: string; 
  notes?: string;
}

export interface GymEquipment {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  status: 'Operativo' | 'Mantenimiento' | 'Fuera de Servicio';
  lastMaintenance: string;
}

export interface GymSubscriptionPlan {
  id: string;
  name: string; // e.g. "Gold Plan"
  price: number;
  durationMonths: number;
  benefits: string[];
}

export interface GymExpense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: 'Alquiler' | 'Servicios' | 'Mantenimiento' | 'Salarios' | 'Equipo' | 'Marketing' | 'Otros';
}

export type ViewState = 'profile' | 'workout' | 'diet' | 'calendar' | 'medical'; // 'medical' added