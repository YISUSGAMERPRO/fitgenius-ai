// OptomiMetrics.ts
// Sistema de métricas de rendimiento para FitGenius-AI

import { WorkoutLog, WorkoutPlan } from '../types';

export interface OptomiMetrics {
  adherence: number; // % de días completados
  avgSessionDuration: number; // minutos
  totalSessions: number;
  totalExercises: number;
  avgIntensity: number; // estimado por sets completados
  streak: number; // días consecutivos
  improvementScore: number; // métrica compuesta
}

export function calculateOptomiMetrics(logs: WorkoutLog[], plan?: WorkoutPlan): OptomiMetrics {
  if (!logs.length) {
    return {
      adherence: 0,
      avgSessionDuration: 0,
      totalSessions: 0,
      totalExercises: 0,
      avgIntensity: 0,
      streak: 0,
      improvementScore: 0
    };
  }
  const totalSessions = logs.length;
  const totalExercises = logs.reduce((sum, l) => sum + (l.exercisesCompleted || 0), 0);
  const avgSessionDuration = Math.round(logs.reduce((sum, l) => sum + (l.durationSeconds || 0), 0) / totalSessions / 60);
  const avgIntensity = totalExercises / totalSessions;
  // Adherencia: % de días completados respecto a plan
  let adherence = 0;
  if (plan && plan.schedule) {
    const planDays = plan.schedule.length * (plan.durationWeeks || 4);
    adherence = Math.min(100, Math.round((totalSessions / planDays) * 100));
  }
  // Racha: días consecutivos
  let streak = 1;
  if (logs.length > 1) {
    logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    streak = 1;
    for (let i = logs.length - 1; i > 0; i--) {
      const prev = new Date(logs[i - 1].date);
      const curr = new Date(logs[i].date);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff <= 1.5) streak++;
      else break;
    }
  }
  // Mejora: compara primeras vs últimas sesiones
  let improvementScore = 0;
  if (logs.length > 3) {
    const first = logs[0].exercisesCompleted || 0;
    const last = logs[logs.length - 1].exercisesCompleted || 0;
    improvementScore = Math.round(((last - first) / (first || 1)) * 100);
  }
  return {
    adherence,
    avgSessionDuration,
    totalSessions,
    totalExercises,
    avgIntensity: Math.round(avgIntensity * 10) / 10,
    streak,
    improvementScore
  };
}
