import React from 'react';
import { FileSpreadsheet, Database } from 'lucide-react';

interface NavbarProps {
  hasApiKey: boolean;
  activeDbName: string;
  rowCount: number;
  isCustomNew: boolean;
  onNavigateToDb: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  hasApiKey, 
  activeDbName, 
  rowCount, 
  onNavigateToDb
}) => {
  return (
    <header className="border-b border-slate-200/80 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand & App info */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-slate-100">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="flex items-baseline space-x-2">
            <h1 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">
              SISVESO · Salud Oral
            </h1>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Fichas Cara A y Base de 27 Columnas
            </span>
          </div>
        </div>

        {/* Right side: Minimal database indicator */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onNavigateToDb}
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Ver base de datos actual"
          >
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline font-mono text-[11px] max-w-[140px] truncate">{activeDbName}</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold">
              {rowCount} {rowCount === 1 ? 'fila' : 'filas'}
            </span>
          </button>

          <span
            className={`inline-flex items-center space-x-1.5 px-2 py-1 rounded-lg text-[11px] font-medium border ${
              hasApiKey 
                ? 'text-slate-600 bg-slate-50 border-slate-200' 
                : 'text-amber-700 bg-amber-50 border-amber-200'
            }`}
            title={hasApiKey ? 'Servicio de IA conectado' : 'API Key pendiente'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="hidden sm:inline">{hasApiKey ? 'IA Activa' : 'Sin Clave'}</span>
          </span>
        </div>
      </div>
    </header>
  );
};

