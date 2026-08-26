// ============================================================================
// AGRI-TWIN 3D - INTEROPERABLE DIGITAL TWIN FOR PRECISION AGRICULTURE
// Main Application Shell & Master Orchestration Engine
// ============================================================================
import React, { useState, useMemo } from 'react';
import { 
  mockFields, 
  mockUsers, 
  mockAdaptPlugins, 
  mockArchitectureComparisons, 
  mockProvenanceLogs,
  mockJulianTimeline
} from './data/mockFieldData';
import { 
  FarmField, 
  UserProfile, 
  ResilienceScenarioState, 
  ISOProvenanceRecord,
  View3DLayer,
  SubsurfaceDepth,
  GridCell
} from './types';
import { 
  generateFusedGridCells, 
  calculateSobolSensitivity, 
  calculateStatisticalValidation 
} from './services/spatialEngine';
import { createProvenanceRecord } from './services/adaptEngine';

// Components
import { ThreeTwinViewer } from './components/ThreeTwinViewer';
import { DashboardAnalytics } from './components/DashboardAnalytics';
import { FusionWorkbench } from './components/FusionWorkbench';
import { HybridModelInspector } from './components/HybridModelInspector';
import { BenchmarkValidation } from './components/BenchmarkValidation';
import { ResilienceSimulator } from './components/ResilienceSimulator';
import { ReportsManager } from './components/ReportsManager';
import { UserManagementAudit } from './components/UserManagementAudit';
import { ArchitectureDocs } from './components/ArchitectureDocs';

// Icons
import { 
  Box, 
  Layers, 
  BarChart3, 
  Cpu, 
  Workflow, 
  Scale, 
  ShieldAlert, 
  FileText, 
  Users, 
  BookOpen, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  RefreshCw, 
  Sliders, 
  HelpCircle,
  Menu,
  X
} from 'lucide-react';

export function App() {
  // Primary State
  const [currentField, setCurrentField] = useState<FarmField>(mockFields[0]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(mockUsers[1]); // Default to Agronomist
  const [julianDay, setJulianDay] = useState<number>(210); // Reproductive / Grain Filling Stage
  const [activeLayer, setActiveLayer] = useState<View3DLayer>('PREDICTED_YIELD');
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(null);
  const [subsurfaceDepth, setSubsurfaceDepth] = useState<SubsurfaceDepth>('0_15');
  const [activeTab, setActiveTab] = useState<'3D_TWIN' | 'ANALYTICS' | 'FUSION' | 'HYBRID_MODEL' | 'BENCHMARKS' | 'RESILIENCE' | 'REPORTS' | 'RBAC' | 'DOCS'>('3D_TWIN');

  // Resilience & Failure State (Módulo H)
  const [resilienceState, setResilienceState] = useState<ResilienceScenarioState>({
    uavBlackout: false,
    soilDelay15Days: false,
    soilSensorHotSwap: false,
    hyperspectralPluginLoaded: false,
    systemConfidenceDegradation: 0,
    activeFallbackStrategy: 'Condición Nominal: Todas las Fuentes Sincronizadas a 10m',
  });

  // ISO Provenance Logs State
  const [provenanceLogs, setProvenanceLogs] = useState<ISOProvenanceRecord[]>(mockProvenanceLogs);
  const [isFusing, setIsFusing] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Dynamic Multi-Modal Fused Grid Cells (576 voxels per 10m resolution)
  const gridCells = useMemo(() => {
    return generateFusedGridCells(currentField, julianDay, resilienceState);
  }, [currentField, julianDay, resilienceState]);

  // Derived Analytics & Sensitivity
  const sobolIndices = useMemo(() => {
    return calculateSobolSensitivity(gridCells);
  }, [gridCells]);

  const statisticalValidation = useMemo(() => {
    return calculateStatisticalValidation(gridCells);
  }, [gridCells]);

  // Re-trigger spatial fusion pipeline
  const handleTriggerFusion = () => {
    setIsFusing(true);
    setTimeout(() => {
      const newLog = createProvenanceRecord(
        'RE-FUSION_SPATIAL_TRANSFORMER_10M',
        'Fusión multi-modal con atención cruzada recalculada',
        'Sentinel-2 + UAV + ISRIC SoilGrids 2.0',
        currentUser.name
      );
      setProvenanceLogs((prev) => [newLog, ...prev]);
      setIsFusing(false);
    }, 900);
  };

  const navItems = [
    { id: '3D_TWIN', label: 'Gemelo Digital 3D', icon: Box, badge: 'Interactivo' },
    { id: 'ANALYTICS', label: 'Analítica & Zonas', icon: BarChart3, badge: 'IoU 0.91' },
    { id: 'FUSION', label: 'Ingesta & Fusión ADAPT', icon: Workflow, badge: '10m' },
    { id: 'HYBRID_MODEL', label: 'Modelo APSIM+XGB', icon: Cpu, badge: 'R² 0.914' },
    { id: 'BENCHMARKS', label: 'Validación & ANOVA', icon: Scale, badge: 'Bootstrap' },
    { id: 'RESILIENCE', label: 'Resiliencia & Fallos', icon: ShieldAlert, badge: resilienceState.systemConfidenceDegradation > 0 ? `-${resilienceState.systemConfidenceDegradation}%` : 'OK' },
    { id: 'REPORTS', label: 'Reportes PDF/XLSX', icon: FileText, badge: '<1.2s' },
    { id: 'RBAC', label: 'Usuarios & Auditoría', icon: Users, badge: currentUser.role },
    { id: 'DOCS', label: 'Arquitectura & DDL', icon: BookOpen, badge: 'PostGIS' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Main Navigation Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-slate-100 tracking-tight">AGRI-TWIN 3D</span>
                <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded">
                  v2.4 OGC-ADAPT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-xs sm:max-w-md">
                Gemelo Digital 3D Interoperable para Agricultura de Precisión
              </p>
            </div>
          </div>

          {/* Center Quick Field Switcher */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Campo:</span>
            <select
              value={currentField.id}
              onChange={(e) => {
                const found = mockFields.find((f) => f.id === e.target.value);
                if (found) setCurrentField(found);
              }}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              {mockFields.map((f) => (
                <option key={f.id} value={f.id} className="bg-slate-900 text-slate-200">
                  {f.name} ({f.areaHa} ha, {f.cropType})
                </option>
              ))}
            </select>
          </div>

          {/* User Profile Badge */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-200">{currentUser.name}</div>
              <div className="text-[10px] text-emerald-400 font-semibold">{currentUser.role}</div>
            </div>
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full border border-blue-500/50 object-cover"
            />
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80">
          <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* TAB 1: 3D DIGITAL TWIN VIEWER */}
        {activeTab === '3D_TWIN' && (
          <div className="space-y-6">
            <ThreeTwinViewer
              field={currentField}
              cells={gridCells}
              activeLayer={activeLayer}
              setActiveLayer={setActiveLayer}
              selectedCell={selectedCell}
              setSelectedCell={setSelectedCell}
              subsurfaceDepth={subsurfaceDepth}
              setSubsurfaceDepth={setSubsurfaceDepth}
              julianDay={julianDay}
            />


            {/* Quick KPI Bar under 3D View */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Rendimiento Medio Estimado</div>
                <div className="text-xl font-black text-blue-400 font-mono mt-1">
                  {(gridCells.reduce((a, b) => a + (b.predictedYield_kg_ha || 0), 0) / (gridCells.length || 1)).toFixed(0)} <span className="text-xs text-slate-400 font-normal">kg/ha</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-medium mt-0.5">+19.6% vs Fusión Ad-Hoc</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Vigor Vegetativo NDVI UAV</div>
                <div className="text-xl font-black text-emerald-400 font-mono mt-1">
                  {(gridCells.reduce((a, b) => a + (b.uav_NDVI || 0), 0) / (gridCells.length || 1)).toFixed(3)}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">Resolución 10m agregada</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Humedad Volumétrica Suelo</div>
                <div className="text-xl font-black text-sky-400 font-mono mt-1">
                  {(gridCells.reduce((a, b) => a + (b.soilMoisture_vol_percent || 0), 0) / (gridCells.length || 1)).toFixed(1)} <span className="text-xs text-slate-400 font-normal">%</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">Sondas STA calibradas</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Zonificación Homogénea IoU</div>
                <div className="text-xl font-black text-purple-400 font-mono mt-1">
                  0.912 <span className="text-xs text-slate-400 font-normal">(4 Zonas)</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-medium mt-0.5">Ahorro 28 kg N/ha</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ANALYTICS & MANAGEMENT ZONES */}
        {activeTab === 'ANALYTICS' && (
          <DashboardAnalytics
            field={currentField}
            cells={gridCells}
            timeline={mockJulianTimeline}
            currentDay={julianDay}
            setCurrentDay={setJulianDay}
            sobolIndices={sobolIndices}
            activeLayer={activeLayer}
            setActiveLayer={setActiveLayer}
            selectedCell={selectedCell}
            setSelectedCell={setSelectedCell}
          />
        )}

        {/* TAB 3: INGESTION & MULTI-MODAL FUSION WORKBENCH */}
        {activeTab === 'FUSION' && (
          <FusionWorkbench
            field={currentField}
            plugins={mockAdaptPlugins}
            provenanceLogs={provenanceLogs}
            onTriggerFusion={handleTriggerFusion}
            isFusing={isFusing}
          />
        )}

        {/* TAB 4: HYBRID APSIM + XGBOOST MODEL INSPECTOR */}
        {activeTab === 'HYBRID_MODEL' && (
          <HybridModelInspector
            field={currentField}
            cells={gridCells}
          />
        )}

        {/* TAB 5: SCIENTIFIC BENCHMARKS & STATISTICAL VALIDATION */}
        {activeTab === 'BENCHMARKS' && (
          <BenchmarkValidation
            benchmarks={mockArchitectureComparisons}
            validation={statisticalValidation}
            field={currentField}
          />
        )}

        {/* TAB 6: RESILIENCE & FAILURE SIMULATION */}
        {activeTab === 'RESILIENCE' && (
          <ResilienceSimulator
            resilience={resilienceState}
            setResilience={setResilienceState}
          />
        )}

        {/* TAB 7: REPORTS & EXPORT MANAGER */}
        {activeTab === 'REPORTS' && (
          <ReportsManager
            field={currentField}
            cells={gridCells}
            benchmarks={mockArchitectureComparisons}
            sobolIndices={sobolIndices}
            validation={statisticalValidation}
            julianDay={julianDay}
          />
        )}

        {/* TAB 8: RBAC & ISO AUDIT LEDGER */}
        {activeTab === 'RBAC' && (
          <UserManagementAudit
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            users={mockUsers}
            fields={mockFields}
            currentField={currentField}
            setCurrentField={setCurrentField}
            provenanceLogs={provenanceLogs}
          />
        )}

        {/* TAB 9: ARCHITECTURE, DDL & MONOREPO DOCS */}
        {activeTab === 'DOCS' && (
          <ArchitectureDocs />
        )}
      </main>

      {/* Footer Bar */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">AGRI-TWIN 3D</span>
            <span>— Arquitectura Interoperable de Gemelo Digital para Agricultura de Precisión</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Estándares: <strong>OGC SensorThings</strong> & <strong>AgGateway ADAPT</strong></span>
            <span>Trazabilidad: <strong>ISO 19115-1</strong></span>
            <span className="text-emerald-400 font-mono font-bold">R² = 0.914</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
