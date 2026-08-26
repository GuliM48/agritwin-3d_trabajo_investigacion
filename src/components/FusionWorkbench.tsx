// ============================================================================
// AGRI-TWIN 3D - INGESTION & MULTI-MODAL FUSION WORKBENCH (MÓDULOS A & B)
// ADAPT Adapters, Spatial Transformer Attention, Soil Downscaler & UAV Upscaler
// ============================================================================
import React, { useState } from 'react';
import { ADAPTPlugin, ISOProvenanceRecord, FarmField } from '../types';
import { 
  Database, 
  Cpu, 
  Layers, 
  Workflow, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Sliders, 
  FileCode, 
  Globe, 
  Compass, 
  Sparkles, 
  Terminal,
  Activity,
  ArrowRight
} from 'lucide-react';
import { createProvenanceRecord } from '../services/adaptEngine';

interface FusionWorkbenchProps {
  field: FarmField;
  plugins: ADAPTPlugin[];
  provenanceLogs: ISOProvenanceRecord[];
  onTriggerFusion: () => void;
  isFusing: boolean;
}

export const FusionWorkbench: React.FC<FusionWorkbenchProps> = ({
  field,
  plugins,
  provenanceLogs,
  onTriggerFusion,
  isFusing,
}) => {
  const [selectedPlugin, setSelectedPlugin] = useState<ADAPTPlugin>(plugins[0]);
  const [activeTab, setActiveTab] = useState<'ADAPT_PLUGINS' | 'SPATIAL_TRANSFORMER' | 'PROVENANCE_ISO' | 'POSTGIS_TILES'>('ADAPT_PLUGINS');
  const [aggregationMethod, setAggregationMethod] = useState<'MEAN_STD_P90' | 'GAUSSIAN_KERNEL' | 'MEDIAN_IQR'>('MEAN_STD_P90');
  const [downscalingMethod, setDownscalingMethod] = useState<'SPATIAL_REGRESSION_KRIGING' | 'RANDOM_FOREST_COVARIATES' | 'PHYSICAL_TERRAIN_INDEX'>('SPATIAL_REGRESSION_KRIGING');

  // Attention matrix representation between modalities in the Spatial Transformer
  const transformerModalities = [
    { name: 'Sentinel-2 Multispectral (13B)', weight: 0.22, color: 'text-blue-400', bg: 'bg-blue-500' },
    { name: 'UAV OpenDroneMap (5cm RGB+NDVI)', weight: 0.39, color: 'text-emerald-400', bg: 'bg-emerald-500' },
    { name: 'SoilGrids 2.0 Downscaled (0-100cm)', weight: 0.26, color: 'text-amber-400', bg: 'bg-amber-500' },
    { name: 'OpenFarm Management (N, Seed, Irrigation)', weight: 0.13, color: 'text-purple-400', bg: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Fusion Trigger Bar */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Workflow className="w-4 h-4" /> Capa de Ingesta & Fusión de Datos Interoperable
          </div>
          <h2 className="text-xl font-black text-slate-100 mt-1">
            Pipeline de Armonización ADAPT + Transformer Espacial Multi-Modal
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Ingesta continua de fuentes heterogéneas, reproyección a EPSG:4326, alineación al día juliano común, downscaling edáfico 250m→10m y upscaling UAV 5cm→10m con trazabilidad ISO 19115.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onTriggerFusion}
            disabled={isFusing}
            className={`px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-2.5 shadow-lg transition-all ${
              isFusing
                ? 'bg-blue-900/60 text-blue-300 cursor-not-allowed border border-blue-700/50'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isFusing ? 'animate-spin' : ''}`} />
            <span>{isFusing ? 'Ejecutando Fusión Multi-Modal...' : 'Re-Ejecutar Pipeline de Fusión (10m)'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'ADAPT_PLUGINS', label: '1. Adaptadores AgGateway ADAPT', icon: Database },
          { id: 'SPATIAL_TRANSFORMER', label: '2. Transformer Espacial Multi-Modal', icon: Cpu },
          { id: 'POSTGIS_TILES', label: '3. Almacenamiento PostGIS / Raster Tiles', icon: Globe },
          { id: 'PROVENANCE_ISO', label: '4. Trazabilidad ISO 19115 (Provenance)', icon: FileCode },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ADAPT PLUGINS MANAGER */}
      {activeTab === 'ADAPT_PLUGINS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plugin List (1 col) */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Fuentes Heterogéneas Conectadas
            </div>
            {plugins.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPlugin(p)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedPlugin.id === p.id
                    ? 'bg-slate-800 border-blue-500 shadow-lg'
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {p.protocol}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> {p.status}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-100">{p.sourceName}</div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Nativo: {p.nativeResolution}</span>
                  <span className="font-mono text-slate-300">{p.latencyMs}ms</span>
                </div>
              </div>
            ))}
          </div>

          {/* Plugin Inspection & Config Panel (2 cols) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono">
                    Adaptador Plugin ID: {selectedPlugin.id}
                  </span>
                  <h3 className="text-lg font-bold text-slate-100 mt-0.5">{selectedPlugin.sourceName}</h3>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Peso en Fusión</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">
                    {(selectedPlugin.confidenceWeight * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Transformation Parameters */}
              <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Resolución Nativa</div>
                  <div className="font-mono font-bold text-slate-200 mt-0.5">{selectedPlugin.nativeResolution}</div>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Resolución Objetivo Estandarizada</div>
                  <div className="font-mono font-bold text-emerald-400 mt-0.5">{selectedPlugin.targetResolution}</div>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Método de Normalización Espacial</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{selectedPlugin.reprojection}</div>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Última Ingesta Validada</div>
                  <div className="font-mono text-slate-300 mt-0.5">{new Date(selectedPlugin.lastIngestedIso).toLocaleTimeString()} UTC</div>
                </div>
              </div>

              {/* Interactive Resampling Strategy Selector */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 mb-4">
                <div className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" /> Estrategia de Downscaling / Upscaling ADAPT:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Downscaling Suelo (250m → 10m):</label>
                    <select
                      value={downscalingMethod}
                      onChange={(e) => setDownscalingMethod(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      <option value="SPATIAL_REGRESSION_KRIGING">Spatial Regression Kriging + S2</option>
                      <option value="RANDOM_FOREST_COVARIATES">Random Forest con DEM Covariables</option>
                      <option value="PHYSICAL_TERRAIN_INDEX">Topographic Wetness Index (TWI)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Upscaling UAV (5cm → 10m):</label>
                    <select
                      value={aggregationMethod}
                      onChange={(e) => setAggregationMethod(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      <option value="MEAN_STD_P90">Agregación Multivariada (Media, Varianza, P90)</option>
                      <option value="GAUSSIAN_KERNEL">Filtrado Gaussian Kernel Weighted</option>
                      <option value="MEDIAN_IQR">Mediana Robusta + Rango Intercuartil</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* ADAPT Contract Badge */}
            <div className="bg-blue-950/40 border border-blue-800/40 p-3 rounded-xl flex items-center justify-between text-xs">
              <span className="text-blue-300">Cumplimiento Estricto: <strong>AgGateway ADAPT v3.2 + OGC STA</strong></span>
              <span className="text-emerald-400 font-mono font-bold">100% Interoperable</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SPATIAL TRANSFORMER MULTI-MODAL FUSION */}
      {activeTab === 'SPATIAL_TRANSFORMER' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">Módulo B: Capa de Fusión Neuronal</div>
              <h3 className="text-lg font-bold text-slate-100">Multi-Modal Spatial Transformer with Cross-Attention Mechanism</h3>
            </div>
            <span className="text-xs font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-lg">
              PyTorch Embedding 10m Voxel Mesh
            </span>
          </div>

          {/* Attention Weights Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {transformerModalities.map((m) => (
              <div key={m.name} className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-300 mb-2">{m.name}</div>
                  <div className="text-2xl font-black text-slate-100 font-mono">
                    {(m.weight * 100).toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Atención Espacial Cruzada</div>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-3">
                  <div className={`h-full ${m.bg}`} style={{ width: `${m.weight * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Architecture Diagram Box */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-3">
            <div className="text-blue-400 font-bold flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Pipeline Matemático de Fusión Multi-Modal:
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 text-[11px] leading-relaxed text-slate-300">
              <code>
                Z_fused(x,y,t) = CrossAttention(&#123; E_s2(x,y,t), E_uav(x,y,t), E_soil(x,y,z), E_mgmt(x,y) &#125;) + PositionalEncoding2D(x,y)<br/>
                &rarr; FeedForward(LayerNorm(Z_fused)) &rarr; 10m Unified Voxel Matrix Tensor [24, 24, 64]<br/>
                &rarr; Output: Dual Branch [Biomass Estimation | PostGIS Raster Cloud Optimized Geotiff (COG)]
              </code>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: POSTGIS & RASTER TILES */}
      {activeTab === 'POSTGIS_TILES' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">Base de Datos Geoespacial</div>
              <h3 className="text-lg font-bold text-slate-100">PostgreSQL 15 + PostGIS & TimescaleDB Optimization</h3>
            </div>
            <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-lg">
              Cloud-Optimized GeoTIFF (COG) Tiles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-slate-400 font-semibold mb-1">Tabla PostGIS Raster</div>
              <div className="font-mono text-slate-200 text-sm font-bold">agritwin.fused_raster_tiles</div>
              <div className="text-[11px] text-slate-400 mt-2">Tile Size: 256x256 | ST_Clip & ST_Intersects Indexing</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-slate-400 font-semibold mb-1">TimescaleDB Hypertable</div>
              <div className="font-mono text-slate-200 text-sm font-bold">agritwin.sensor_observations_ts</div>
              <div className="text-[11px] text-slate-400 mt-2">Chunk Interval: 7 days | Compression: 94.2%</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-slate-400 font-semibold mb-1">Latencia de Consulta Tile</div>
              <div className="font-mono text-emerald-400 text-sm font-bold">&lt; 18ms (Redis L2 Cache)</div>
              <div className="text-[11px] text-slate-400 mt-2">Throughput: 1,450 req/sec en 60 FPS 3D Stream</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ISO 19115 PROVENANCE AUDIT */}
      {activeTab === 'PROVENANCE_ISO' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">Registro de Linaje de Datos</div>
              <h3 className="text-lg font-bold text-slate-100">ISO 19115-1:2014 & ISO 19157 Provenance Ledger</h3>
            </div>
            <span className="text-xs font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-lg">
              Cryptographic Hash Traceability
            </span>
          </div>

          <div className="space-y-3">
            {provenanceLogs.map((log) => (
              <div key={log.id} className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-400">{log.action}</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                      {log.status}
                    </span>
                  </div>
                  <div className="text-slate-300 font-medium">{log.transformationType}</div>
                  <div className="text-[11px] text-slate-400">
                    Fuente: <span className="text-slate-200">{log.sourceDataset}</span> | Operador: <span className="text-slate-200">{log.user}</span>
                  </div>
                </div>

                <div className="text-right font-mono text-[10px] text-slate-400">
                  <div>{log.timestamp}</div>
                  <div className="text-slate-500 truncate max-w-xs">{log.lineageHash}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
