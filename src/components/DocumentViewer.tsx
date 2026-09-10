import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, FileText, ExternalLink } from 'lucide-react';

interface DocumentViewerProps {
  fileUrl: string | null;
  fileType: string;
  fileName: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  fileUrl,
  fileType,
  fileName,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!fileUrl) {
    return (
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-8 text-center text-slate-400">
        <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-xs">No hay vista previa disponible para este documento.</p>
      </div>
    );
  }

  const isPdf = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-[520px]">
      {/* Controls Bar */}
      <div className="p-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center space-x-2 truncate pr-2">
          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-semibold truncate">{fileName}</span>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          {!isPdf && (
            <>
              <button
                type="button"
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                className="p-1 hover:bg-slate-200 rounded text-slate-600"
                title="Alejar"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                className="p-1 hover:bg-slate-200 rounded text-slate-600"
                title="Acercar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="p-1 hover:bg-slate-200 rounded text-slate-600 ml-1"
                title="Girar 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1 hover:bg-slate-200 rounded text-slate-600 ml-1"
            title="Abrir en pestaña nueva"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Viewer Body */}
      <div className="flex-1 overflow-auto bg-slate-900/5 flex items-center justify-center p-4">
        {isPdf ? (
          <iframe
            src={fileUrl}
            className="w-full h-full border-0 rounded bg-white shadow-2xs"
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
              className="max-w-full object-contain rounded shadow-xs"
            />
          </div>
        )}
      </div>
    </div>
  );
};
