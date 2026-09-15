import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, ScanLine, FileSearch, Sparkles, FileSpreadsheet, Zap, Clock } from 'lucide-react';

interface ScanningProgressProps {
  fileName?: string;
  isOptimizedUpload?: boolean;
  batchInfo?: {
    current: number;
    total: number;
    currentFileName: string;
  };
  activeEngine?: string | null;
}

const STEPS = [
  { id: 1, label: 'Enviando documento optimizado al servidor', icon: ScanLine },
  { id: 2, label: 'Detectando orientación y casillas de SIVIGILA Cara A', icon: FileSearch },
  { id: 3, label: 'Transcribiendo datos con IA (Google Gemini / OpenAI ChatGPT)', icon: Sparkles },
  { id: 4, label: 'Auditando correcciones en rojo y estructurando base Excel', icon: FileSpreadsheet },
];

export const ScanningProgress: React.FC<ScanningProgressProps> = ({
  fileName,
  isOptimizedUpload,
  batchInfo,
  activeEngine,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedSeconds(Number(((Date.now() - startTime) / 1000).toFixed(1)));
    }, 100);

    const timer1 = setTimeout(() => setCurrentStep(2), 600);
    const timer2 = setTimeout(() => setCurrentStep(3), 1400);
    const timer3 = setTimeout(() => setCurrentStep(4), 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [batchInfo?.current]);

  const percent = batchInfo ? Math.round((batchInfo.current / batchInfo.total) * 100) : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-2xl mx-auto shadow-xs text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-blue-600 relative">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Tiempo: {elapsedSeconds}s</span>
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>{activeEngine || 'Motor Dual: Gemini + ChatGPT'}</span>
          </div>
        </div>

        {batchInfo ? (
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Procesando lote de archivos: {batchInfo.current} de {batchInfo.total} ({percent}%)
            </h3>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden max-w-md mx-auto">
              <div
                className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-xs text-slate-600 font-mono">
              Archivo actual: <strong className="text-slate-800">{batchInfo.currentFileName}</strong>
            </p>
          </div>
        ) : (
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Escaneando y transcribiendo ficha
            </h3>
            {fileName && (
              <p className="text-xs text-slate-500 font-mono mt-1">
                {fileName} {isOptimizedUpload && '· (Subida comprimida)'}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="text-left space-y-2.5 max-w-md mx-auto pt-1">
        {STEPS.map((step) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              className={`flex items-center space-x-3 p-2.5 rounded-xl border transition-all ${
                isCurrent 
                  ? 'bg-blue-50/70 border-blue-200 text-blue-900 font-medium shadow-2xs' 
                  : isDone 
                    ? 'bg-slate-50/50 border-slate-100 text-slate-700' 
                    : 'opacity-40 border-transparent text-slate-400'
              }`}
            >
              <div className="shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                ) : (
                  <StepIcon className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <span className="text-xs">{step.label}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 italic">
        <Zap className="w-3.5 h-3.5 text-amber-500" />
        <span>Extracción multimodelo con auditoría de calidad y correcciones en rojo.</span>
      </div>
    </div>
  );
};
