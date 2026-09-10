import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, ScanLine, FileSearch, Sparkles, FileSpreadsheet, Zap, Clock } from 'lucide-react';

interface ScanningProgressProps {
  fileName?: string;
  isOptimizedUpload?: boolean;
}

const STEPS = [
  { id: 1, label: 'Enviando documento optimizado al servidor local', icon: ScanLine },
  { id: 2, label: 'Detectando orientación y columnas del formato', icon: FileSearch },
  { id: 3, label: 'Transcribiendo tabla con IA ultrarrápida (Gemini Flash)', icon: Sparkles },
  { id: 4, label: 'Validando documentos y estructurando registros CSV', icon: FileSpreadsheet },
];

export const ScanningProgress: React.FC<ScanningProgressProps> = ({ fileName, isOptimizedUpload }) => {
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
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-2xl mx-auto shadow-xs text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-blue-600 relative">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>

      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold mb-2">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Tiempo transcurrido: {elapsedSeconds}s</span>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900">
          Escaneando y transcribiendo documento
        </h3>
        {fileName && (
          <p className="text-xs text-slate-500 font-mono mt-1">
            {fileName} {isOptimizedUpload && '· (Subida comprimida al 90%)'}
          </p>
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
              className={`flex items-center space-x-3 p-2.5 rounded-lg border transition-all ${
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
        <span>Optimizado con Gemini 3.1 Flash-Lite y esquema compacto de valores.</span>
      </div>
    </div>
  );
};
