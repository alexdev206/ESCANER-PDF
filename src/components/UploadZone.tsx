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
  Zap,
  Clock,
  Check
} from 'lucide-react';
import { ScanOptions } from '../types';
import { SAMPLE_DOCUMENTS, SampleDocument } from '../data/samplePdfs';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  onFilesSelected?: (files: File[]) => void;
  onSampleSelected: (sample: SampleDocument) => void;
  options: ScanOptions;
  onOptionsChange: (newOptions: ScanOptions) => void;
  isScanning: boolean;
  activeDbName?: string;
  isCustomNew?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelected,
  onFilesSelected,
  onSampleSelected,
  options,
  onOptionsChange,
  isScanning,
  activeDbName = 'Base_Datos_SISVESO_2026.xlsx',
  isCustomNew = false,
}) => {
  const safeOptions: ScanOptions = options || {
    delimiter: ';',
    speedMode: 'fast',
    normalizeDates: true,
    cleanDocumentNumbers: true,
    autoAppendDb: true,
  };
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileCount, setSelectedFileCount] = useState<number>(0);
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidFile = (file: File) => {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    return validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.pdf');
  };

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
      const allFiles = Array.from(e.dataTransfer.files).filter(isValidFile);
      if (allFiles.length === 0) {
        alert('Por favor selecciona archivos PDF o imágenes escaneadas (PNG, JPG, WEBP).');
        return;
      }
      setSelectedFileCount(allFiles.length);
      if (allFiles.length > 1 && onFilesSelected) {
        onFilesSelected(allFiles);
      } else {
        onFileSelected(allFiles[0]);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const allFiles = Array.from(e.target.files).filter(isValidFile);
      if (allFiles.length === 0) {
        alert('Por favor selecciona archivos PDF o imágenes escaneadas (PNG, JPG, WEBP).');
        return;
      }
      setSelectedFileCount(allFiles.length);
      if (allFiles.length > 1 && onFilesSelected) {
        onFilesSelected(allFiles);
      } else {
        onFileSelected(allFiles[0]);
      }
      // Reset input value so same files can be re-selected if desired
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Box */}
      <div
        id="dropzone-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
          isDragging 
            ? 'border-slate-800 bg-slate-100/70' 
            : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isScanning}
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 mx-auto rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-900">
              Cargar Fichas SISVESO Cara A
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Arrastra o selecciona uno o varios archivos PDF o imágenes
            </p>
          </div>

          <p className="text-[11px] text-slate-400">
            Formato oficial Evento 2303 · Lote o documento individual
          </p>
        </div>
      </div>

      {/* Options and Sample Selector Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-1">
        {/* Sample dataset launcher */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            id="btn-sample-sisveso-quick"
            onClick={() => onSampleSelected(SAMPLE_DOCUMENTS[0])}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Play className="w-3 h-3 text-slate-500" />
            <span>Probar con ficha de ejemplo (David Rozo)</span>
          </button>
        </div>

        {/* Quick config options */}
        <div className="flex items-center space-x-3 text-xs text-slate-600">
          <label className="flex items-center space-x-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.autoExportCsv}
              onChange={(e) => onOptionsChange({ ...options, autoExportCsv: e.target.checked })}
              className="rounded border-slate-300 text-slate-800 focus:ring-slate-700"
            />
            <span className="text-xs">Descargar CSV automático</span>
          </label>

          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{showOptions ? 'Cerrar opciones' : 'Opciones'}</span>
          </button>
        </div>
      </div>

      {/* Advanced Settings Drawer */}
      {showOptions && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Ajustes de Procesamiento
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-600 block mb-1">Delimitador CSV</label>
              <select
                value={safeOptions.delimiter}
                onChange={(e) => onOptionsChange && onOptionsChange({ ...safeOptions, delimiter: e.target.value as any })}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
              >
                <option value=";">Punto y coma (;) - Estándar Excel</option>
                <option value=",">Coma (,)</option>
                <option value="&#9;">Tabulador (\t)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-600 block mb-1">Motor de Extracción</label>
              <select
                value={safeOptions.speedMode}
                onChange={(e) => onOptionsChange && onOptionsChange({ ...safeOptions, speedMode: e.target.value as any })}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
              >
                <option value="fast">Rápido - Gemini Flash Lite</option>
                <option value="precision">Alta Precisión - Gemini Flash</option>
              </select>
            </div>

            <div className="space-y-1.5 pt-1 sm:pt-4">
              <label className="flex items-center space-x-2 text-slate-600">
                <input
                  type="checkbox"
                  checked={safeOptions.normalizeDates}
                  onChange={(e) => onOptionsChange && onOptionsChange({ ...safeOptions, normalizeDates: e.target.checked })}
                  className="rounded border-slate-300 text-slate-800"
                />
                <span>Normalizar fechas (DD/MM/AAAA)</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-600">
                <input
                  type="checkbox"
                  checked={safeOptions.cleanDocumentNumbers}
                  onChange={(e) => onOptionsChange && onOptionsChange({ ...safeOptions, cleanDocumentNumbers: e.target.checked })}
                  className="rounded border-slate-300 text-slate-800"
                />
                <span>Limpiar caracteres en documento</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
