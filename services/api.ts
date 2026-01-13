
import { UserAccount, GymMember, GymEquipment, GymExpense, UserProfile } from '../types';

/**
 * SERVICIO DE API CON CACHÉ OPTIMIZADO
 * 
 * Este archivo apunta a tu servidor backend (Node.js) con caching local
 * para mejorar performance y reducir calls innecesarios.
 * 
 * CONFIGURACIÓN:
 * - Netlify (Frontend): Usa VITE_API_URL del .env.production
 * - Railway (Backend): Debe tener GEMINI_API_KEY configurada
 */

// En producción (Netlify), usa la URL de Railway. En dev, usa localhost.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Cache simple en memoria
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const getCachedOrFetch = async <T>(key: string, fetcher: () => Promise<T>): Promise<T> => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data as T;
    }
    
    const data = await fetcher();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
};

const clearCache = (pattern?: string) => {
    if (!pattern) {
        cache.clear();
        return;
    }
    for (const key of cache.keys()) {
        if (key.includes(pattern)) cache.delete(key);
    }
};

export const api = {
    // --- AUTENTICACIÓN ---
    login: async (username: string, password: string): Promise<UserAccount | null> => {
        try {
            const res = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (!res.ok) return null;
            const data = await res.json();
            clearCache(); // Limpiar caché al cambiar usuario
            return data;
        } catch (e) {
            console.error("Error conectando al servidor:", e);
            return null;
        }
    },

    register: async (account: UserAccount): Promise<boolean> => {
        try {
            const res = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(account)
            });
            return res.ok;
        } catch (e) {
            return false;
        }
    },

    // --- MIEMBROS DEL GIMNASIO ---
    getMembers: async (): Promise<GymMember[]> => {
        return getCachedOrFetch('members', async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/members`);
                if (!res.ok) return [];
                return await res.json();
            } catch (e) {
                console.error("Error al obtener miembros:", e);
                return [];
            }
        });
    },

    saveMember: async (member: GymMember): Promise<void> => {
        try {
            const res = await fetch(`${API_BASE_URL}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(member)
            });
            if (!res.ok) {
                const error = await res.json();
                console.error("Error del servidor:", error);
                throw new Error(error.error || 'Error al guardar');
            }
            console.log("✅ Miembro guardado correctamente");
            clearCache('members'); // Invalidar caché de miembros
        } catch (e) {
            console.error("Error al guardar miembro:", e);
            throw e;
        }
    },

    deleteMember: async (id: string): Promise<void> => {
        try {
            await fetch(`${API_BASE_URL}/members/${id}`, {
                method: 'DELETE'
            });
            clearCache('members'); // Invalidar caché de miembros
        } catch (e) {
            console.error("Error al eliminar miembro:", e);
        }
    },

    // --- PERFILES DE USUARIO ---
    getProfile: async (userId: string): Promise<UserProfile | null> => {
        try {
            // Parmetro anticapche para evitar respuestas cacheadas del navegador/CDN
            const res = await fetch(`${API_BASE_URL}/profile/${userId}?t=${Date.now()}`);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            console.error("Error al obtener perfil:", e);
            return null;
        }
    },

    saveProfile: async (profile: UserProfile): Promise<boolean> => {
        try {
            const res = await fetch(`${API_BASE_URL}/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile)
            });
            if (!res.ok) {
                const error = await res.json();
                console.error("Error del servidor:", error);
                throw new Error(error.error || 'Error al guardar perfil');
            }
            console.log("✅ Perfil guardado correctamente");
            clearCache(`profile_`); // Invalidar caché de perfiles
            return true;
        } catch (e) {
            console.error("Error al guardar perfil:", e);
            return false;
        }
    },

    // --- GENERADOR DE PDF ---
    generateRecipePDF: async (meal: any): Promise<void> => {
        try {
            const res = await fetch(`${API_BASE_URL}/generate-recipe-pdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meal })
            });
            
            if (!res.ok) {
                throw new Error('Error al generar PDF');
            }

            // Descargar el PDF
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${meal.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Error al descargar PDF:", e);
            throw e;
        }
    },

    // --- GENERACIÓN DE RUTINAS Y DIETAS CON IA ---
    generateWorkout: async (userId: string, profile: UserProfile, workoutType: string): Promise<any> => {
        try {
            console.log('📤 Enviando solicitud de generación de rutina al servidor...');
            const res = await fetch(`${API_BASE_URL}/generate-workout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, profile, workoutType })
            });
            
            if (!res.ok) {
                const error = await res.json();
                console.error('❌ Error del servidor:', error);
                throw new Error(error.error || 'Error al generar rutina');
            }
            
            const data = await res.json();
            console.log('✅ Rutina generada con éxito');
            clearCache(`workout_${userId}`);
            return data.plan;
        } catch (e) {
            console.error("❌ Error al generar rutina:", e);
            throw e;
        }
    },

    generateDiet: async (userId: string, profile: UserProfile, dietType: string, preferences: string[] = [], budget?: any): Promise<any> => {
        try {
            console.log('📤 Enviando solicitud de generación de dieta al servidor...');
            const res = await fetch(`${API_BASE_URL}/generate-diet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, profile, dietType, preferences, budget })
            });
            
            if (!res.ok) {
                const error = await res.json();
                console.error('❌ Error del servidor:', error);
                throw new Error(error.error || 'Error al generar dieta');
            }
            
            const data = await res.json();
            console.log('✅ Dieta generada con éxito');
            clearCache(`diet_${userId}`);
            return data.plan;
        } catch (e) {
            console.error("❌ Error al generar dieta:", e);
            throw e;
        }
    },

    getWorkout: async (userId: string): Promise<any> => {
        return getCachedOrFetch(`workout_${userId}`, async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/workout/${userId}`);
                if (!res.ok) {
                    if (res.status === 404) return null;
                    throw new Error('Error al obtener rutina');
                }
                const data = await res.json();
                return data.plan_data;
            } catch (e) {
                console.error("Error al obtener rutina:", e);
                return null;
            }
        });
    },

    getDiet: async (userId: string): Promise<any> => {
        return getCachedOrFetch(`diet_${userId}`, async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/diet/${userId}`);
                if (!res.ok) {
                    if (res.status === 404) return null;
                    throw new Error('Error al obtener dieta');
                }
                const data = await res.json();
                return data.plan_data;
            } catch (e) {
                console.error("Error al obtener dieta:", e);
                return null;
            }
        });
    }
};
