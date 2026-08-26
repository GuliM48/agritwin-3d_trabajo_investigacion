// ============================================================================
// AGRI-TWIN 3D - USER MANAGEMENT, ROLES & AUDIT LOGS (MÓDULO E)
// Role-Based Access Control (RBAC), Multi-Farm Profiles & ISO Audit Ledger
// ============================================================================
import React, { useState } from 'react';
import { UserProfile, UserRole, FarmField, ISOProvenanceRecord } from '../types';
import { 
  Users, 
  ShieldCheck, 
  Key, 
  MapPin, 
  FileCode, 
  CheckCircle2, 
  UserCheck, 
  Lock, 
  Sparkles,
  Search,
  Filter
} from 'lucide-react';

interface UserManagementAuditProps {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  users: UserProfile[];
  fields: FarmField[];
  currentField: FarmField;
  setCurrentField: (field: FarmField) => void;
  provenanceLogs: ISOProvenanceRecord[];
}

export const UserManagementAudit: React.FC<UserManagementAuditProps> = ({
  currentUser,
  setCurrentUser,
  users,
  fields,
  currentField,
  setCurrentField,
  provenanceLogs,
}) => {
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const roleDescriptions: Record<UserRole, { title: string; desc: string; badgeColor: string }> = {
    ADMINISTRATOR: {
      title: 'Administrador del Sistema',
      desc: 'Gestión integral de usuarios, parámetros globales de IA, gobernanza de datos y claves criptográficas.',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    },
    AGRONOMIST: {
      title: 'Agrónomo Especialista',
      desc: 'Carga de datos de campo, ejecución del pipeline de fusión, prescripciones de tasa variable y generación de informes.',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    FARMER: {
      title: 'Agricultor / Productor',
      desc: 'Exploración del gemelo 3D de sus parcelas, consulta de pronósticos de cosecha y descarga de informes de campo.',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    DEVELOPER: {
      title: 'Desarrollador / Integrador OGC',
      desc: 'Acceso a APIs REST/WebSockets, depuración de adaptadores AgGateway ADAPT y registro de nuevos plugins.',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
  };

  const filteredLogs = provenanceLogs.filter((log) => {
    if (filterAction === 'ALL') return true;
    return log.action.includes(filterAction);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Módulo E: Gestión de Usuarios, Roles y Gobernanza
            </div>
            <h2 className="text-xl font-black text-slate-100 mt-1">
              Control de Acceso Basado en Roles (RBAC) & Registro de Auditoría Inmutable
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Autenticación JWT con refresh tokens, asignación granular de parcelas agrícolas por usuario y registro de todas las transacciones de datos bajo estándar ISO 19115.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-full border border-blue-500/40 object-cover" />
            <div>
              <div className="text-xs font-bold text-slate-100">{currentUser.name}</div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleDescriptions[currentUser.role].badgeColor}`}>
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* User Switcher Cards */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Conmutador de Perfiles de Demostración (Simular Roles)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => setCurrentUser(user)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                currentUser.id === user.id
                  ? 'bg-slate-800/90 border-blue-500 ring-1 ring-blue-500/50 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 hover:bg-slate-850 text-slate-400'
              }`}
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-slate-700" />
                  <div>
                    <div className="text-xs font-bold text-slate-100">{user.name}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{user.organization}</div>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block mb-2 ${roleDescriptions[user.role].badgeColor}`}>
                  {user.role}
                </span>

                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  {roleDescriptions[user.role].desc}
                </p>
              </div>

              <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between">
                <span>{user.assignedFields.length} campos asignados</span>
                {currentUser.id === user.id && (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Activo
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Field Profiles Assignment */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">Perfiles de Campos / Fincas Agrícolas</div>
            <h3 className="text-base font-bold text-slate-100 mt-0.5">Campos Asociados con Permisos Granulares</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Total: {fields.length} Fincas Registradas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fields.map((f) => (
            <div
              key={f.id}
              onClick={() => setCurrentField(f)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                currentField.id === f.id
                  ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500/40 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-100">{f.name}</span>
                {currentField.id === f.id && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                    Seleccionado
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-400 space-y-1 mb-3">
                <div>Ubicación: <strong className="text-slate-300">{f.location}</strong></div>
                <div>Cultivo: <strong className="text-emerald-400">{f.cropType}</strong></div>
                <div>Superficie: <strong className="text-slate-300">{f.areaHa} hectáreas</strong></div>
                <div>Asociación Suelo: <strong className="text-slate-300">{f.soilType}</strong></div>
              </div>

              <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between font-mono">
                <span>Voxel: {f.gridRows}x{f.gridCols} (10m)</span>
                <span>Elev: {f.elevationMeanM}m</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ISO 19115 Immutable Audit Ledger */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="w-4 h-4" /> Registro de Auditoría y Linaje Criptográfico
            </div>
            <h3 className="text-base font-bold text-slate-100 mt-0.5">
              Trazabilidad Completa: Quién, Qué, Cuándo y Sobre Qué Dataset
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200"
            >
              <option value="ALL">Todas las Acciones</option>
              <option value="ADAPT">Acciones ADAPT</option>
              <option value="SOILGRIDS">Acciones SoilGrids</option>
              <option value="APSIM">Inferencia APSIM/XGB</option>
            </select>
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-400">{log.action}</span>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {log.status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">({log.isoStandard})</span>
                </div>
                <div className="text-slate-300 font-medium">{log.transformationType}</div>
                <div className="text-[11px] text-slate-400">
                  Operador: <strong className="text-slate-200">{log.user}</strong> | Fuente: <span className="text-slate-300">{log.sourceDataset}</span>
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
    </div>
  );
};
