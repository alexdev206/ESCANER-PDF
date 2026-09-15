import React, { useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  FileText, 
  ExternalLink, 
  Maximize2, 
  Minimize2,
  Eye
} from 'lucide-react';

interface DocumentViewerProps {
  fileUrl: string | null;
  fileType?: string;
  fileName?: string;
  className?: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  fileUrl,
  fileType = 'application/pdf',
  fileName = 'Ficha_Escaneada.pdf',
  className = 'h-[550px]',
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!fileUrl) {
    return (
      <div className={`bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-slate-400 ${className}`}>
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
          <FileText className="w-6 h-6 text-slate-400" />
        </div>
        <h4 className="font-semibold text-slate-600 text-xs">Previsualización no disponible</h4>
        <p className="text-[11px] text-slate-400 max-w-xs mt-1">
          Carga un archivo PDF o imagen para visualizar aquí el documento original y comparar los datos.
        </p>
      </div>
    );
  }

  const isPdf = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

  const renderContent = () => (
    <div className="flex-1 overflow-auto bg-slate-900/5 flex items-center justify-center p-3 relative">
      {isPdf ? (
        <iframe
          src={fileUrl}
          className="w-full h-full border-0 rounded-xl bg-white shadow-xs"
          title="Vista previa PDF"
        />
      ) : (
        <div className="overflow-auto max-w-full max-h-full flex items-center justify-center">
          <img
            src={fileUrl}
            alt="Documento original escaneado"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.15s ease',
            }}
            className="max-w-full object-contain rounded-lg shadow-sm"
          />
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col ${className}`}>
        {/* Controls Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700">
          <div className="flex items-center space-x-2 truncate pr-2">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Eye className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold truncate text-slate-800">{fileName}</span>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            {!isPdf && (
              <>
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.max(0.4, Number((prev - 0.2).toFixed(1))))}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                  title="Alejar"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => { setZoom(1); setRotation(0); }}
                  className="text-[11px] font-mono px-1.5 py-0.5 hover:bg-slate-200 rounded text-slate-700 font-semibold"
                  title="Restablecer escala al 100%"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.min(3.5, Number((prev + 0.2).toFixed(1))))}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                  title="Acercar"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                  title="Girar 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
              title="Expandir a pantalla completa"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
              title="Abrir en pestaña nueva del navegador"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Viewer Body */}
        {renderContent()}
      </div>

      {/* Fullscreen Overlay Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex flex-col p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col flex-1 max-w-6xl w-full mx-auto">
            <div className="p-3.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-800">
              <div className="flex items-center space-x-2 truncate">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-bold truncate text-sm">{fileName}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-medium">
                  Previsualización Completa
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {!isPdf && (
                  <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                    <button
                      type="button"
                      onClick={() => setZoom(prev => Math.max(0.4, Number((prev - 0.2).toFixed(1))))}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono font-bold w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setZoom(prev => Math.min(4, Number((prev + 0.2).toFixed(1))))}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotation(prev => (prev + 90) % 360)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 ml-1"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Cerrar</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-900/5 flex items-center justify-center p-4">
              {isPdf ? (
                <iframe
                  src={fileUrl}
                  className="w-full h-full border-0 rounded-xl bg-white shadow-md"
                  title="Vista previa PDF Pantalla Completa"
                />
              ) : (
                <div className="overflow-auto max-w-full max-h-full flex items-center justify-center">
                  <img
                    src={fileUrl}
                    alt="Documento original escaneado pantalla completa"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: 'transform 0.15s ease',
                    }}
                    className="max-w-full object-contain rounded-xl shadow-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
