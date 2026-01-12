
import React from 'react';
import { Activity, ArrowRight, Dumbbell, Utensils, Stethoscope, Zap, Star, ShieldCheck } from 'lucide-react';

interface Props {
  onStart: () => void;
}

const LandingPage: React.FC<Props> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-brand-500/30 overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="absolute top-0 left-0 w-full z-50 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Activity className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">FitGenius<span className="text-brand-400">AI</span></span>
          </div>
          <button 
            onClick={onStart}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-sm font-bold transition-all backdrop-blur-md"
          >
            Iniciar Sesión
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop" 
            alt="Gym Background" 
            className="w-full h-full object-cover opacity-40 scale-105 animate-pulse-slow"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/50 to-slate-950"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-8 animate-slideUp">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-sm">
            <Zap className="w-3 h-3 text-brand-400" /> Potenciado por Inteligencia Artificial
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Transforma tu Cuerpo <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-200 to-white">
              Con Ciencia y Datos
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-light">
            Tu entrenador personal y nutricionista 24/7. Genera rutinas adaptativas, planes de alimentación deliciosos y recibe asesoramiento médico deportivo al instante.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button 
              onClick={onStart}
              className="px-10 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-full font-bold text-lg shadow-lg shadow-brand-500/30 hover:scale-105 transition-all flex items-center justify-center gap-3 group"
            >
              Comenzar Ahora <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Todo lo que necesitas para ganar</h2>
            <p className="text-slate-400">Una suite completa de herramientas integradas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Dumbbell className="w-8 h-8 text-brand-400" />}
              title="Entrenamiento IA"
              desc="Algoritmos que ajustan el volumen y la intensidad según tu fatiga y progreso diario."
              img="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop"
            />
            <FeatureCard 
              icon={<Utensils className="w-8 h-8 text-green-400" />}
              title="Nutrición Flexible"
              desc="Menús generados al instante ajustados a tus macros, gustos y presupuesto."
              img="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1000&auto=format&fit=crop"
            />
            <FeatureCard 
              icon={<Stethoscope className="w-8 h-8 text-blue-400" />}
              title="Soporte Médico"
              desc="Asistente de triaje para lesiones y protocolos de recuperación basados en evidencia."
              img="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1000&auto=format&fit=crop"
            />
          </div>
        </div>
      </section>

      {/* Motivation Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-900/10"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-12">
          
          <div className="flex-1 space-y-8">
            <h2 className="text-4xl font-bold leading-tight">
              "La disciplina es el puente entre tus metas y tus logros."
            </h2>
            <p className="text-slate-400 text-lg">
              No estás solo en este camino. FitGenius aprende de ti, te motiva y se adapta cuando la vida se complica. Es más que una app, es tu compañero de evolución.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-400"><Star className="w-6 h-6" /></div>
                <div>
                  <h4 className="font-bold text-white">Constancia Premiada</h4>
                  <p className="text-sm text-slate-400">Visualiza tus rachas y celebra cada victoria.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400"><ShieldCheck className="w-6 h-6" /></div>
                <div>
                  <h4 className="font-bold text-white">Salud Primero</h4>
                  <p className="text-sm text-slate-400">Detección de fatiga y prevención de lesiones.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-brand-500 to-purple-500 rounded-2xl blur-2xl opacity-30 animate-pulse-slow"></div>
            <img 
              src="https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=1000&auto=format&fit=crop" 
              alt="Motivation" 
              className="relative rounded-2xl border border-white/10 shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-500"
            />
          </div>

        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">¿Listo para tu mejor versión?</h2>
          <button 
            onClick={onStart}
            className="px-12 py-5 bg-white text-slate-950 hover:bg-slate-200 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-all"
          >
            Crear mi Cuenta Gratis
          </button>
        </div>
      </section>

      <footer className="py-8 text-center text-slate-600 text-sm border-t border-slate-900 bg-slate-950">
        <p>© {new Date().getFullYear()} FitGenius AI. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, img }: any) => (
  <div className="group relative overflow-hidden rounded-3xl bg-slate-800 border border-slate-700 h-96 flex flex-col justify-end p-6 hover:border-brand-500/50 transition-all">
    <div className="absolute inset-0">
      <img src={img} alt={title} className="w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
    </div>
    
    <div className="relative z-10 space-y-3 translate-y-2 group-hover:translate-y-0 transition-transform">
      <div className="bg-slate-950/50 backdrop-blur-md p-3 rounded-xl w-fit border border-white/5">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        {desc}
      </p>
    </div>
  </div>
)

export default LandingPage;
