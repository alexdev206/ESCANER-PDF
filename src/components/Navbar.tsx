import React from 'react';
import { FileSpreadsheet, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface NavbarProps {
  hasApiKey: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ hasApiKey }) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Escáner y Transcriptor de PDF a CSV
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                IA Multimodal
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Digitalización, lectura manuscrita y exportación estructurada automática
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Entorno Seguro</span>
          </div>
          <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
            hasApiKey ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{hasApiKey ? 'Gemini Conectado' : 'Sin Clave API'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
