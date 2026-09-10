import React, { useState } from 'react';
import { 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Edit2, 
  Plus, 
  Trash2, 
  Eye, 
  Filter,
  Check,
  X
} from 'lucide-react';
import { ColumnDefinition, ExtractedRow } from '../types';

interface DataTableProps {
  columns: ColumnDefinition[];
  rows: ExtractedRow[];
  onRowsChange: (updatedRows: ExtractedRow[]) => void;
  documentTitle: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  onRowsChange,
  documentTitle,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyReview, setOnlyReview] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowId: string; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Filter rows
  const filteredRows = rows.filter((row) => {
    if (onlyReview && (!row.reviewFlags || row.reviewFlags.length === 0)) {
      return false;
    }
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    return Object.values(row.data).some((val) => 
      String(val || '').toLowerCase().includes(term)
    );
  });

  const handleStartEdit = (rowId: string, colKey: string, currentValue: string) => {
    setEditingCell({ rowId, colKey });
    setEditValue(currentValue || '');
  };

  const handleSaveEdit = (rowId: string, colKey: string) => {
    const updated = rows.map((r) => {
      if (r.id === rowId) {
        const newData = { ...r.data, [colKey]: editValue };
        const newValidation = { ...r.validation };
        
        // Remove from review flags if user corrected it
        const newFlags = (r.reviewFlags || []).filter(f => f !== colKey);

        if (editValue.toUpperCase() === '[ILEGIBLE]') {
          newValidation[colKey] = { status: 'ilegible', message: 'Marcada como ilegible' };
          newFlags.push(colKey);
        } else {
          newValidation[colKey] = { status: 'ok' };
        }

        return {
          ...r,
          data: newData,
          validation: newValidation,
          reviewFlags: newFlags,
        };
      }
      return r;
    });

    onRowsChange(updated);
    setEditingCell(null);
  };

  const handleDeleteRow = (rowId: string) => {
    if (window.confirm('¿Seguro que deseas eliminar esta fila?')) {
      const updated = rows.filter(r => r.id !== rowId).map((r, i) => ({ ...r, rowNumber: i + 1 }));
      onRowsChange(updated);
    }
  };

  const handleAddRow = () => {
    const newRowId = `row-${Date.now()}`;
    const emptyData: Record<string, string> = {};
    columns.forEach(c => { emptyData[c.key] = ''; });

    const newRow: ExtractedRow = {
      id: newRowId,
      rowNumber: rows.length + 1,
      pageNumber: 1,
      data: emptyData,
      validation: {},
      reviewFlags: []
    };

    onRowsChange([...rows, newRow]);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Table Action Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar en datos extraídos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setOnlyReview(!onlyReview)}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              onlyReview
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            <span>Ver solo con alertas</span>
          </button>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-600">
          <span className="font-medium">
            Mostrando <b>{filteredRows.length}</b> de <b>{rows.length}</b> filas
          </span>
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-medium text-slate-700 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Agregar fila</span>
          </button>
        </div>
      </div>

      {/* Interactive Table Container */}
      <div className="overflow-x-auto max-h-[520px] divide-y divide-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100/80 text-slate-700 font-bold sticky top-0 z-10 shadow-2xs">
            <tr>
              <th className="px-3 py-2.5 border-b border-slate-200 w-12 text-center">N°</th>
              {columns.map((col) => (
                <th key={col.key} className="px-3 py-2.5 border-b border-slate-200 whitespace-nowrap">
                  {col.label || col.key}
                </th>
              ))}
              <th className="px-3 py-2.5 border-b border-slate-200 whitespace-nowrap text-amber-800">
                AUDITORÍA
              </th>
              <th className="px-3 py-2.5 border-b border-slate-200 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 3} className="text-center py-10 text-slate-400">
                  No se encontraron filas que coincidan con la búsqueda o filtro.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const hasFlags = row.reviewFlags && row.reviewFlags.length > 0;
                return (
                  <tr 
                    key={row.id} 
                    className={`hover:bg-slate-50 transition-colors ${hasFlags ? 'bg-amber-50/20' : ''}`}
                  >
                    <td className="px-3 py-2 text-center font-mono text-slate-500 font-semibold">
                      {row.rowNumber}
                    </td>

                    {columns.map((col) => {
                      const val = row.data[col.key] || '';
                      const isEditing = editingCell?.rowId === row.id && editingCell?.colKey === col.key;
                      const cellValidation = row.validation?.[col.key];
                      const isDoubtful = cellValidation?.status === 'dudoso';
                      const isIllegible = cellValidation?.status === 'ilegible' || val === '[ILEGIBLE]';

                      let cellBg = '';
                      if (isIllegible) {
                        cellBg = 'bg-rose-50 text-rose-800 border-rose-200 font-medium';
                      } else if (isDoubtful) {
                        cellBg = 'bg-amber-50 text-amber-900 border-amber-200 font-medium';
                      }

                      return (
                        <td 
                          key={col.key} 
                          className={`px-3 py-2 whitespace-nowrap group relative ${cellBg}`}
                          title={cellValidation?.message || ''}
                        >
                          {isEditing ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit(row.id, col.key);
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                autoFocus
                                className="w-full px-1.5 py-0.5 text-xs border border-blue-500 rounded focus:outline-none bg-white text-slate-900 font-medium"
                              />
                              <button 
                                onClick={() => handleSaveEdit(row.id, col.key)} 
                                className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => setEditingCell(null)} 
                                className="p-0.5 text-slate-400 hover:bg-slate-100 rounded"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div 
                              className="flex items-center justify-between space-x-2 cursor-pointer"
                              onClick={() => handleStartEdit(row.id, col.key, val)}
                            >
                              <span className={val ? 'text-slate-900' : 'text-slate-300 italic'}>
                                {val || '—'}
                              </span>
                              <Edit2 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </td>
                      );
                    })}

                    <td className="px-3 py-2 whitespace-nowrap">
                      {hasFlags ? (
                        <span 
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200"
                          title={row.reviewFlags.join(', ')}
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Revisar ({row.reviewFlags.length})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>OK</span>
                        </span>
                      )}
                    </td>

                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(row.id)}
                        className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Eliminar fila"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Legend and Compliance Note */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Válido</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
            <span>Ámbar: Dato dudoso / fuera de rango</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span>Rojo: Ilegible en escaneo</span>
          </span>
        </div>
        <span className="italic text-[11px]">
          Haz clic sobre cualquier celda para corregir o ajustar manualmente.
        </span>
      </div>
    </div>
  );
};
