import React from 'react';
import { SessionFichaRecord } from '../types';
import { 
  History, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  Database,
  Building2,
  Calendar
} from 'lucide-react';

interface SessionQueueProps {
  records: SessionFichaRecord[];
  onSelectRecord: (record: SessionFichaRecord) => void;
  onClearQueue: () => void;
  selectedId?: string;
}

export const SessionQueue: React.FC<SessionQueueProps> = ({
  records,
  onSelectRecord,
  onClearQueue,
  selectedId,
}) => {
  if (records.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h4 className="font-semibold text-sm text-slate-700">Historial de Fichas en Sesión</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          A medida que escanees fichas en PDF o imágenes, aparecerán aquí para que puedas consultar sus datos y verificar su integración en la base de Excel.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden space-y-3 p-4 sm:p-5">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-slate-600" />
          <h3 className="font-semibold text-sm text-slate-900">
            Fichas Procesadas en esta Sesión ({records.length})
          </h3>
        </div>
        <button
          type="button"
          onClick={onClearQueue}
          className="text-[11px] font-medium text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
        >
          Limpiar historial
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
        {records.map((rec, idx) => {
          const isSelected = selectedId === rec.id;
          return (
            <div
              key={rec.id}
              onClick={() => onSelectRecord(rec)}
              className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                isSelected
                  ? 'bg-slate-50 border-slate-400 ring-1 ring-slate-300'
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-medium font-mono">
                    {idx + 1}
                  </span>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-900 line-clamp-1">
                      {rec.patientName || 'Paciente sin nombre'}
                    </h5>
                    <span className="text-[10px] text-slate-500 font-mono">
                      CC/TI: {rec.documento || 'S/N'}
                    </span>
                  </div>
                </div>

                {rec.hasIssues ? (
                  <span className="p-0.5 rounded bg-slate-100 text-amber-700 shrink-0" title={rec.observaciones}>
                    <AlertTriangle className="w-3 h-3" />
                  </span>
                ) : (
                  <span className="p-0.5 rounded bg-slate-100 text-slate-600 shrink-0" title="Sin observaciones">
                    <CheckCircle2 className="w-3 h-3" />
                  </span>
                )}
              </div>

              <div className="space-y-0.5 text-[10px] text-slate-500 border-t border-slate-100 pt-1.5">
                <div className="flex items-center justify-between">
                  <span className="line-clamp-1">{rec.upgd || 'UPGD no especificada'}</span>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{rec.timestamp}</span>
                </div>
                {rec.observaciones && (
                  <p className="text-[10px] text-slate-600 line-clamp-1 italic">
                    Obs: {rec.observaciones}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
