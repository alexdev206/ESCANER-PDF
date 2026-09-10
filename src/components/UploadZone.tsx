import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Settings2, 
  Sparkles, 
  Play, 
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  Layers,
  FileSpreadsheet,
  Zap
} from 'lucide-react';
import { ScanOptions } from '../types';
import { SAMPLE_DOCUMENTS, SampleDocument } from '../data/samplePdfs';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  onSampleSelected: (sample: SampleDocument) => void;
  options: ScanOptions;
  onOptionsChange: (newOptions: ScanOptions) => void;
  isScanning: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelected,
  onSampleSelected,
  options,
  onOptionsChange,
  isScanning,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor selecciona un archivo PDF o una imagen escaneada (PNG, JPG).');
      return;
    }
    setSelectedFile(file);
    onFileSelected(file);
  };

  return (
    <div className="w-full space-y-6">
      {/* Upload Box */}
      <div
        id="dropzone-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer bg-white ${
          isDragging 
            ? 'border-blue-500 bg-blue-50/50 ring-4 ring-blue-100' 
            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/70 shadow-xs'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isScanning}
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-xs">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Arrastra aquí tu documento PDF o imagen escaneada
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              o haz clic para explorar en tu equipo · Soporta PDF, JPG y PNG
            </p>
          </div>

          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 text-xs text-slate-600 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Escaneo óptico de tablas manuscritas e impresas</span>
          </div>

          {selectedFile && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-left">
              <div className="flex items-center space-x-3 overflow-hidden">
                <FileText className="w-6 h-6 text-blue-600 shrink-0" />
                <div className="truncate">
                  <p className="text-sm font-semibold text-slate-800 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <span className="shrink-0 text-xs font-semibold text-blue-700 bg-white px-2 py-1 rounded shadow-2xs border border-blue-200">
                Seleccionado
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Control Panel: Template Selector & Scan Options */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label htmlFor="template-select" className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                Plantilla / Formato
              </label>
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <select
                  id="template-select"
                  value={options.template}
                  onChange={(e) => onOptionsChange({ ...options, template: e.target.value as any })}
                  className="font-medium text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="AUTO">✨ Auto-detectar encabezado</option>
                  <option value="ADULTOS">Adultos · Caracterización</option>
                  <option value="GESTANTES">Gestantes · Caracterización</option>
                  <option value="MENORES_5">Menores de 5 Años</option>
                  <option value="RECIEN_NACIDOS">Recién Nacidos</option>
                  <option value="GENERAL">Formato Libre / General</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="speed-select" className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                Velocidad del Escaneo
              </label>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <select
                  id="speed-select"
                  value={options.speedMode || 'fast'}
                  onChange={(e) => onOptionsChange({ ...options, speedMode: e.target.value as any })}
                  className="font-semibold text-xs sm:text-sm text-amber-900 bg-amber-50/70 border border-amber-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="fast">⚡ Ultra-Rápido (~3 a 5 seg)</option>
                  <option value="precision">🎯 Alta Precisión</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-auto">
            <button
              type="button"
              id="btn-toggle-options"
              onClick={() => setShowOptions(!showOptions)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{showOptions ? 'Ocultar Opciones' : 'Opciones de CSV'}</span>
            </button>
          </div>
        </div>

        {/* Expandable Options Drawer */}
        {showOptions && (
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-700">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Delimitador CSV</label>
              <select
                value={options.delimiter}
                onChange={(e) => onOptionsChange({ ...options, delimiter: e.target.value as any })}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5"
              >
                <option value=";">Punto y coma ( ; ) · Ideal para Excel en español</option>
                <option value=",">Coma ( , ) · Estándar internacional RFC 4180</option>
                <option value="&#9;">Tabulación ( \t ) · Para copiar/pegar</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={options.autoExportCsv}
                  onChange={(e) => onOptionsChange({ ...options, autoExportCsv: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Descarga automática de CSV al finalizar</span>
              </label>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={options.cleanDocumentNumbers}
                  onChange={(e) => onOptionsChange({ ...options, cleanDocumentNumbers: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Normalizar y validar números de documento</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Quick Test Samples (Exact formats from prompt) */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              ¿No tienes un PDF a mano? Prueba con muestras reales de caracterización
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_DOCUMENTS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSampleSelected(sample)}
              disabled={isScanning}
              className="text-left p-3.5 bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-lg transition-all shadow-2xs group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    {sample.badge}
                  </span>
                  <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <h3 className="text-xs font-semibold text-slate-900 mt-2 line-clamp-1">{sample.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{sample.description}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>{sample.sampleRows.length} filas transcritas</span>
                <span className="text-blue-600 font-medium group-hover:underline">Cargar muestra</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
