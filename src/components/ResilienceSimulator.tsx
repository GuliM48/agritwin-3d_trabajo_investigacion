// ============================================================================
// AGRI-TWIN 3D - RESILIENCE & FAILURE SIMULATION SANDBOX (MÓDULO H)
// UAV Weather Fallback, Soil Lag Interpolation, Sensor Hot-Swap & Plugin Loader
// ============================================================================
import React from 'react';
import { ResilienceScenarioState } from '../types';
import { 
  ShieldAlert, 
  CloudRain, 
  Clock, 
  RefreshCw, 
  PlusCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Sparkles,
  Zap
} from 'lucide-react';

interface ResilienceSimulatorProps {
  resilience: ResilienceScenarioState;
  setResilience: React.Dispatch<React.SetStateAction<ResilienceScenarioState>>;
}

export const ResilienceSimulator: React.FC<ResilienceSimulatorProps> = ({
  resilience,
  setResilience,
}) => {
  const toggleScenario = (key: keyof ResilienceScenarioState) => {
    setResilience((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      
      // Calculate system degradation
      let deg = 0;
      if (next.uavBlackout) deg += 14;
      if (next.soilDelay15Days) deg += 12;
      if (next.soilSensorHotSwap) deg -= 2;
      if (next.hyperspectralPluginLoaded) deg -= 5;
      
      next.systemConfidenceDegradation = Math.max(0, deg);

      if (next.uavBlackout) {
        next.activeFallbackStrategy = 'Fallback Automático a Sentinel-2 L2A (B8/B4) + Penalización de Varianza';
      } else if (next.soilDelay15Days) {
        next.activeFallbackStrategy = 'Interpolación Kriging Espacio-Temporal con Bandas de Incertidumbre Crecientes';
      } else if (next.soilSensorHotSwap) {
        next.activeFallbackStrategy = 'Hot-Swap de Controlador ADAPT completado sin reinicio de sesión';
      } else if (next.hyperspectralPluginLoaded) {
        next.activeFallbackStrategy = 'Extensión Plugin Dron Hiperspectral 128 Bandas Activada en Runtime';
      } else {
        next.activeFallbackStrategy = 'Condición Nominal: Todas las Fuentes Sincronizadas a 10m';
      }

      return next;
    });
  };

  const resetScenarios = () => {
    setResilience({
      uavBlackout: false,
      soilDelay15Days: false,
      soilSensorHotSwap: false,
      hyperspectralPluginLoaded: false,
      systemConfidenceDegradation: 0,
      activeFallbackStrategy: 'Condición Nominal: Todas las Fuentes Sincronizadas a 10m',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" /> Módulo H: Escenarios de Resiliencia Operativa
          </div>
          <h2 className="text-xl font-black text-slate-100 mt-1">
            Simulador de Fallas, Fallbacks Dinámicos y Extensibilidad Hot-Swap
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Prueba la robustez de la arquitectura interoperable ante situaciones extremas: falta de vuelos por clima adverso, retraso en análisis de laboratorio de suelo, sustitución de hardware y carga de nuevos sensores.
          </p>
        </div>

        <button
          onClick={resetScenarios}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all"
        >
          Restablecer Estado Nominal
        </button>
      </div>

      {/* Active Fallback Strategy Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
        resilience.systemConfidenceDegradation > 0
          ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
          : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
      }`}>
        <div className="flex items-center gap-3">
          {resilience.systemConfidenceDegradation > 0 ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">Estrategia de Mitigación Activa:</div>
            <div className="text-sm font-semibold">{resilience.activeFallbackStrategy}</div>
          </div>
        </div>

        <div className="text-right font-mono">
          <div className="text-[10px] text-slate-400">Impacto en Confianza</div>
          <div className={`text-lg font-black ${resilience.systemConfidenceDegradation > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {resilience.systemConfidenceDegradation > 0 ? `-${resilience.systemConfidenceDegradation}%` : 'Nominal (0%)'}
          </div>
        </div>
      </div>

      {/* 4 Interactive Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scenario A: UAV Cloud Outage */}
        <div className={`p-5 rounded-2xl border transition-all ${
          resilience.uavBlackout
            ? 'bg-slate-900 border-amber-500/80 shadow-lg'
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CloudRain className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-100">Escenario A: Falta de Imagen UAV por Mal Clima</h3>
            </div>
            <button
              onClick={() => toggleScenario('uavBlackout')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                resilience.uavBlackout
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {resilience.uavBlackout ? 'Falla Inyectada' : 'Inyectar Falla'}
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Simula ráfagas de viento o nubosidad densa que impiden el despegue del dron. El sistema detecta la ausencia de ortofoto 5cm y activa automáticamente el <strong>fallback a Sentinel-2 L2A (10m)</strong> con una degradación controlada de la confianza del gemelo.
          </p>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono">
            Fallback: Sentinel-2 NIR/Red + Penalización RMSE (+144 kg/ha)
          </div>
        </div>

        {/* Scenario B: Soil Lab Delay (15 days) */}
        <div className={`p-5 rounded-2xl border transition-all ${
          resilience.soilDelay15Days
            ? 'bg-slate-900 border-amber-500/80 shadow-lg'
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-100">Escenario B: Retardo de 15 Días en Datos de Suelo</h3>
            </div>
            <button
              onClick={() => toggleScenario('soilDelay15Days')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                resilience.soilDelay15Days
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {resilience.soilDelay15Days ? 'Falla Inyectada' : 'Inyectar Falla'}
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Simula demoras en los resultados de laboratorio químico o sondas fuera de línea. El pipeline ejecuta <strong>interpolación espacio-temporal mediante Splines y Kriging</strong> con ampliación dinámica de los intervalos de incertidumbre.
          </p>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono">
            Interpolación Kriging + Varianza Temporal en Carbono y Humedad
          </div>
        </div>

        {/* Scenario C: Soil Sensor Hot-Swap */}
        <div className={`p-5 rounded-2xl border transition-all ${
          resilience.soilSensorHotSwap
            ? 'bg-slate-900 border-blue-500/80 shadow-lg'
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-slate-100">Escenario C: Cambio de Sensor en Caliente (Hot-Swap)</h3>
            </div>
            <button
              onClick={() => toggleScenario('soilSensorHotSwap')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                resilience.soilSensorHotSwap
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {resilience.soilSensorHotSwap ? 'Hot-Swap Activo' : 'Ejecutar Hot-Swap'}
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Sustitución física de sondas Decagon 5TE por Sentek Drill & Drop. Gracias a la abstracción de <strong>AgGateway ADAPT + OGC SensorThings</strong>, el nuevo controlador se vincula en caliente sin necesidad de detener ni recompilar el gemelo 3D.
          </p>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono">
            ADAPT Plugin Hot-Swap: 0 ms de caída de servicio
          </div>
        </div>

        {/* Scenario D: Hyperspectral Drone Plugin Addition */}
        <div className={`p-5 rounded-2xl border transition-all ${
          resilience.hyperspectralPluginLoaded
            ? 'bg-slate-900 border-emerald-500/80 shadow-lg'
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">Escenario D: Nueva Fuente (Dron Hiperspectral 128B)</h3>
            </div>
            <button
              onClick={() => toggleScenario('hyperspectralPluginLoaded')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                resilience.hyperspectralPluginLoaded
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {resilience.hyperspectralPluginLoaded ? 'Plugin Acoplado' : 'Cargar Plugin'}
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Incorporación de una cámara hiperspectral con 128 canales continuos (400-1000nm). Cumple con el criterio de éxito de <strong>integrar una nueva fuente en &lt;4 horas</strong> sin alterar el núcleo del sistema, mejorando el $R^2$ en +0.022.
          </p>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono">
            Plugin ADAPT compilado en 1.8h | R² aumentado a 0.936
          </div>
        </div>
      </div>
    </div>
  );
};
