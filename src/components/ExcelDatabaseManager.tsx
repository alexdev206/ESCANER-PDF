import React, { useState, useRef, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Copy, 
  Check, 
  Trash2, 
  Search, 
  Filter, 
  Plus, 
  Sparkles, 
  Table, 
  CheckCircle2, 
  AlertTriangle,
  Edit2,
  X,
  FileDown,
  Building2,
  Calendar,
  Save,
  RotateCcw,
  ShieldCheck,
  ExternalLink,
  Bot,
  Layers,
  FileCode,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { ExcelBaseRow } from '../types';
import { 
  EXCEL_BASE_COLUMNS, 
  parseUploadedExcel, 
  exportOfficialExcelDatabase, 
  generateTsvForClipboard 
} from '../utils/sisveso';
import { 
  OFFICIAL_PORTALS, 
  COMMON_COLOMBIAN_EPS, 
  copyToClipboard, 
  openOfficialPortal,
  downloadCodigosCsv,
  parseBduaCrossFile,
  enrichDatabaseWithRobotResults,
  BduaRecord
} from '../utils/validationPortals';

interface ExcelDatabaseManagerProps {
  rows: ExcelBaseRow[];
  onRowsChange: (updated: ExcelBaseRow[]) => void;
  onTriggerToast: (msg: string) => void;
  linkedFileName: string | null;
  onLinkedFileNameChange: (name: string | null) => void;
  onStartNewBlankDatabase: () => void;
  isCustomNew: boolean;
}

export const ExcelDatabaseManager: React.FC<ExcelDatabaseManagerProps> = ({
  rows,
  onRowsChange,
  onTriggerToast,
  linkedFileName,
  onLinkedFileNameChange,
  onStartNewBlankDatabase,
  isCustomNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIssuesOnly, setFilterIssuesOnly] = useState(false);
  const [selectedUpgd, setSelectedUpgd] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRenaming, setIsRenaming] = useState(false);
  const [newDbName, setNewDbName] = useState(linkedFileName || 'Base_Datos_SISVESO_2026.xlsx');
  
  // Inline editing cell state
  const [editingCell, setEditingCell] = useState<{ rowId: string; colKey: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // Row edit modal
  const [editingRowModal, setEditingRowModal] = useState<ExcelBaseRow | null>(null);

  // Row validation modal (ADRES / Comprobador / PAI)
  const [validatingRowModal, setValidatingRowModal] = useState<ExcelBaseRow | null>(null);

  // Robot Mass Cross State
  const [isMassCrossModalOpen, setIsMassCrossModalOpen] = useState(false);
  const [isProcessingMassCross, setIsProcessingMassCross] = useState(false);
  const [massCrossResults, setMassCrossResults] = useState<{
    recordsMap: Map<string, BduaRecord>;
    fileName: string;
    enrichment: ReturnType<typeof enrichDatabaseWithRobotResults>;
  } | null>(null);
  const massFileInputRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate unique UPGDs
  const uniqueUpgds = useMemo(() => {
    const map = new Set<string>();
    rows.forEach(r => {
      if (r.nombreUpgd) map.add(r.nombreUpgd.trim());
    });
    return Array.from(map).sort();
  }, [rows]);

  // Metrics
  const metrics = useMemo(() => {
    let withIssues = 0;
    let compliant = 0;
    rows.forEach(r => {
      const obs = (r.observaciones || '').toUpperCase();
      if (obs && !obs.includes('SIN OBSERVACIONES') && !obs.includes('CUMPLE')) {
        withIssues++;
      } else {
        compliant++;
      }
    });
    return {
      total: rows.length,
      withIssues,
      compliant,
      upgdCount: uniqueUpgds.length,
    };
  }, [rows, uniqueUpgds]);

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const parsedRows = await parseUploadedExcel(file);
        onRowsChange(parsedRows);
        onLinkedFileNameChange(file.name);
        onTriggerToast(`¡Base de datos cargada! ${parsedRows.length} registros sincronizados.`);
      } catch (err: any) {
        alert('Error al leer el archivo Excel: ' + (err.message || err.toString()));
      }
    }
  };

  const handleDownloadFullExcel = () => {
    const filename = linkedFileName || 'Base_Datos_SISVESO_2026.xlsx';
    exportOfficialExcelDatabase(rows, filename);
    onTriggerToast(`¡Archivo ${filename} generado y descargado!`);
  };

  const handleDownloadEmptyTemplate = () => {
    exportOfficialExcelDatabase([], 'Plantilla_Oficial_SISVESO_Cara_A_27_Columnas.xlsx');
    onTriggerToast('¡Plantilla oficial vacía (.xlsx) descargada!');
  };

  const handleCopyTsv = async (onlySelected: boolean = false) => {
    const targetRows = onlySelected && selectedIds.size > 0
      ? rows.filter(r => selectedIds.has(r.id))
      : rows;

    if (targetRows.length === 0) {
      onTriggerToast('No hay registros en la base para copiar.');
      return;
    }

    const tsv = generateTsvForClipboard(targetRows, false);
    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      onTriggerToast(`¡${targetRows.length} fila(s) listas! Ve a tu Excel y presiona Ctrl + V`);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const handleDeleteRow = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (window.confirm('¿Seguro que deseas eliminar este registro de la base de datos?')) {
      onRowsChange(rows.filter(r => r.id !== id));
      const next = new Set(selectedIds);
      next.delete(id);
      setSelectedIds(next);
      onTriggerToast('Registro eliminado de la base');
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`¿Deseas eliminar las ${selectedIds.size} filas seleccionadas?`)) {
      onRowsChange(rows.filter(r => !selectedIds.has(r.id)));
      setSelectedIds(new Set());
      onTriggerToast(`${selectedIds.size} registros eliminados`);
    }
  };

  const handleSaveRename = () => {
    if (!newDbName.trim()) return;
    let clean = newDbName.trim();
    if (!clean.endsWith('.xlsx')) clean += '.xlsx';
    onLinkedFileNameChange(clean);
    setIsRenaming(false);
    onTriggerToast(`Base renombrada a: ${clean}`);
  };

  // Inline cell edit handlers
  const handleCellClick = (rowId: string, colKey: string, initialValue: string) => {
    setEditingCell({ rowId, colKey });
    setEditingValue(initialValue || '');
  };

  const handleSaveCell = () => {
    if (!editingCell) return;
    const { rowId, colKey } = editingCell;
    const updated = rows.map(r => {
      if (r.id === rowId) {
        return { ...r, [colKey]: editingValue };
      }
      return r;
    });
    onRowsChange(updated);
    setEditingCell(null);
  };

  const handleKeyDownCell = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveCell();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Robot Codigos CSV Download
  const handleDownloadCodigosCsv = () => {
    if (rows.length === 0) {
      onTriggerToast('La base de datos está vacía.');
      return;
    }
    const count = downloadCodigosCsv(rows, 'codigos.csv');
    if (count > 0) {
      onTriggerToast(`✓ codigos.csv descargado con ${count} documentos únicos. Listo para el Robot SISVAN PAI / Comprobador.`);
    } else {
      onTriggerToast('No se encontraron números de documento válidos en la base.');
    }
  };

  // Robot Mass Cross File Processing
  const handleUploadMassCrossFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingMassCross(true);
      const records = await parseBduaCrossFile(file);
      const enrichment = enrichDatabaseWithRobotResults(rows, records);
      setMassCrossResults({
        recordsMap: records,
        fileName: file.name,
        enrichment,
      });
      onTriggerToast(`✓ Archivo "${file.name}" procesado: ${records.size} registros identificados.`);
    } catch (err: any) {
      onTriggerToast(`❌ Error al procesar archivo de cruce: ${err.message}`);
    } finally {
      setIsProcessingMassCross(false);
      if (massFileInputRef.current) massFileInputRef.current.value = '';
    }
  };

  // Apply Mass Enrichment to Rows
  const handleApplyMassEnrichment = () => {
    if (!massCrossResults?.enrichment) return;
    const { updatedRows, stats } = massCrossResults.enrichment;
    onRowsChange(updatedRows);
    setIsMassCrossModalOpen(false);
    onTriggerToast(
      `✓ Base de datos validada con el Robot: ${stats.matchedCount} coincidencias, ${stats.namesUpdatedCount} nombres corregidos, ${stats.observationsUpdatedCount} validaciones registradas en Columna T.`
    );
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRows.map(r => r.id)));
    }
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (filterIssuesOnly) {
        const obs = (row.observaciones || '').toUpperCase();
        if (!obs || obs.includes('SIN OBSERVACIONES') || obs.includes('CUMPLE')) {
          return false;
        }
      }

      if (selectedUpgd !== 'ALL' && (row.nombreUpgd || '').trim() !== selectedUpgd) {
        return false;
      }

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        (row.primerNombre || '').toLowerCase().includes(q) ||
        (row.primerApellido || '').toLowerCase().includes(q) ||
        (row.segundoApellido || '').toLowerCase().includes(q) ||
        (row.documento || '').includes(q) ||
        (row.nombreUpgd || '').toLowerCase().includes(q) ||
        (row.observaciones || '').toLowerCase().includes(q) ||
        (row.fechaConsulta || '').includes(q)
      );
    });
  }, [rows, filterIssuesOnly, selectedUpgd, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Management Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {isRenaming ? (
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="text"
                      value={newDbName}
                      onChange={(e) => setNewDbName(e.target.value)}
                      className="px-2 py-1 text-sm font-medium text-slate-900 border border-slate-300 rounded-lg focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveRename}
                      className="p-1 bg-slate-900 text-white rounded-md hover:bg-slate-800"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRenaming(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-semibold text-slate-900">
                      {linkedFileName || 'Base_Datos_SISVESO_2026.xlsx'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setNewDbName(linkedFileName || 'Base_Datos_SISVESO_2026.xlsx');
                        setIsRenaming(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                      title="Renombrar archivo de base de datos"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {isCustomNew ? (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    <Sparkles className="w-3 h-3 text-slate-600" />
                    <span>Base Activa</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    <CheckCircle2 className="w-3 h-3 text-slate-600" />
                    <span>Sincronizada</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Estructura de 27 columnas para Salud Oral · Fichas integradas automáticamente
              </p>
            </div>
          </div>

          {/* Primary Database Actions */}
          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={handleUploadExcel}
            />

            <button
              type="button"
              id="btn-clean-new-db"
              onClick={onStartNewBlankDatabase}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Vacía las filas de prueba y prepara una base limpia desde cero para tus documentos"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Nueva Base Limpia</span>
            </button>

            <button
              type="button"
              id="btn-upload-excel"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Subir un Excel preexistente para continuar acumulando fichas en él"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Vincular .xlsx</span>
            </button>

            <button
              type="button"
              id="btn-export-codigos-csv"
              disabled={rows.length === 0}
              onClick={handleDownloadCodigosCsv}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
              title="Descargar archivo codigos.csv con los documentos únicos para alimentar el Robot SISVAN PAI / Comprobador"
            >
              <Bot className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar codigos.csv</span>
            </button>

            <button
              type="button"
              id="btn-open-mass-cross"
              disabled={rows.length === 0}
              onClick={() => setIsMassCrossModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
              title="Cruzar y validar masivamente la base completa con los resultados exportados por el Robot de PAI o Comprobador"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Cruce Masivo</span>
            </button>

            <button
              type="button"
              id="btn-download-empty-template"
              onClick={handleDownloadEmptyTemplate}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Descargar una plantilla en blanco con los 27 encabezados oficiales"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-500" />
              <span>Plantilla Vacía</span>
            </button>

            <button
              type="button"
              id="btn-export-excel-file"
              disabled={rows.length === 0}
              onClick={handleDownloadFullExcel}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .xlsx</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Registros</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-semibold text-slate-900 font-mono">{metrics.total}</span>
              <span className="text-[11px] text-slate-500">filas</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Conformes</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-semibold text-slate-900 font-mono">{metrics.compliant}</span>
              <span className="text-[11px] text-slate-500">sin obs.</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Observaciones</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-semibold text-slate-900 font-mono">{metrics.withIssues}</span>
              <span className="text-[11px] text-slate-500">pendientes</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Sedes UPGD</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-semibold text-slate-900 font-mono">{metrics.upgdCount}</span>
              <span className="text-[11px] text-slate-500">activas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Clipboard bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
            <input
              type="text"
              placeholder="Buscar por paciente, cédula, UPGD, fecha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-white border border-slate-200 rounded-lg focus:outline-none focus:bg-white transition-all"
            />
          </div>

          {/* UPGD Dropdown Filter */}
          {uniqueUpgds.length > 1 && (
            <select
              value={selectedUpgd}
              onChange={(e) => setSelectedUpgd(e.target.value)}
              aria-label="Filtrar por UPGD"
              className="px-2.5 py-1.5 text-xs bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="ALL">Todas las UPGD ({uniqueUpgds.length})</option>
              {uniqueUpgds.map(u => (
                <option key={u} value={u}>{u.slice(0, 32)}</option>
              ))}
            </select>
          )}

          {/* Issues Toggle */}
          <button
            type="button"
            onClick={() => setFilterIssuesOnly(!filterIssuesOnly)}
            className={`inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors shrink-0 cursor-pointer ${
              filterIssuesOnly 
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3 h-3 text-slate-500" />
            <span>Con errores ({metrics.withIssues})</span>
          </button>
        </div>

        {/* Right side: Bulk actions */}
        <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
          {selectedIds.size > 0 && (
            <>
              <button
                type="button"
                onClick={() => handleCopyTsv(true)}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>Copiar {selectedIds.size}</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteSelected}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Eliminar {selectedIds.size}</span>
              </button>
            </>
          )}

          <button
            type="button"
            id="btn-copy-all-db"
            disabled={rows.length === 0}
            onClick={() => handleCopyTsv(false)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-40 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="Copia todas las filas con formato de columnas idéntico a Excel para pegar con Ctrl + V"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
            <span>{copied ? '¡Copiado!' : 'Copiar todo (Ctrl + V)'}</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet View Container */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {/* Table info & guide bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">Mostrando {filteredRows.length} de {rows.length} registros</span>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] text-slate-500">💡 Haz doble clic en cualquier celda para editar su contenido directamente</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-100 border border-blue-300"></span>
              <span>Datos Ficha (A-D, G-K, M-N, P-T, X-AA)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-100 border border-amber-300"></span>
              <span>Validaciones / Cruces (E-F, L, O, R, U-W)</span>
            </span>
          </div>
        </div>

        {/* Interactive 27-Column Table */}
        <div className="overflow-x-auto max-h-[580px] relative">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-20 shadow-2xs select-none">
              <tr>
                <th className="px-3 py-2.5 border-b border-slate-300 w-10 text-center bg-slate-100">
                  <input
                    type="checkbox"
                    checked={selectedIds.size > 0 && selectedIds.size === filteredRows.length}
                    onChange={toggleSelectAll}
                    aria-label="Seleccionar todas las filas"
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="px-2.5 py-2.5 border-b border-slate-300 text-center w-10 text-[11px] font-mono text-slate-500 bg-slate-100">
                  #
                </th>
                {EXCEL_BASE_COLUMNS.map((col) => (
                  <th 
                    key={col.key} 
                    className={`px-3 py-2.5 border-b border-slate-300 whitespace-nowrap text-[11px] font-bold tracking-tight ${
                      col.headerColor === 'yellow' 
                        ? 'bg-amber-100/80 text-amber-950 border-r border-amber-200' 
                        : 'bg-slate-100 text-slate-800 border-r border-slate-200'
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-3 py-2.5 border-b border-slate-300 w-16 text-center bg-slate-100 sticky right-0 z-30">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white font-sans">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={EXCEL_BASE_COLUMNS.length + 3} className="text-center py-16 text-slate-400">
                    <Table className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
                    <p className="font-semibold text-sm text-slate-600">No hay registros en esta vista</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {searchTerm 
                        ? 'No se encontraron registros que coincidan con la búsqueda.' 
                        : 'Tu base de datos está lista. Escanea tu primer PDF para inicializarla o haz clic en "Vincular mi Excel".'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const isSelected = selectedIds.has(row.id);
                  const obs = (row.observaciones || '').toUpperCase();
                  const hasIssue = obs && !obs.includes('SIN OBSERVACIONES') && !obs.includes('CUMPLE');

                  return (
                    <tr 
                      key={row.id} 
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        row.isNew ? 'bg-emerald-50/40' : ''
                      } ${isSelected ? 'bg-blue-50/50' : ''}`}
                    >
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(row.id)}
                          aria-label={`Seleccionar fila de ${row.primerNombre || ''} ${row.primerApellido || ''}`}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-2.5 py-2 text-center font-mono text-[11px] text-slate-400 font-semibold">
                        {idx + 1}
                      </td>

                      {EXCEL_BASE_COLUMNS.map((col) => {
                        const cellVal = (row as any)[col.key] || '';
                        const isEditingThis = editingCell?.rowId === row.id && editingCell?.colKey === col.key;
                        const isObs = col.key === 'observaciones';

                        return (
                          <td
                            key={col.key}
                            onDoubleClick={() => handleCellClick(row.id, col.key, cellVal)}
                            className={`px-3 py-2 whitespace-nowrap text-xs border-r border-slate-100 transition-colors cursor-pointer ${
                              col.headerColor === 'yellow' ? 'bg-amber-50/20' : ''
                            } ${isEditingThis ? 'p-0 ring-2 ring-blue-500 bg-white z-10' : 'hover:bg-blue-50/60'}`}
                            title="Haz doble clic para editar"
                          >
                            {isEditingThis ? (
                              <input
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={handleSaveCell}
                                onKeyDown={handleKeyDownCell}
                                aria-label={`Editar ${col.label}`}
                                className="w-full px-2 py-1 text-xs text-slate-900 bg-white focus:outline-none"
                                autoFocus
                              />
                            ) : isObs ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                hasIssue
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {cellVal || 'SIN OBSERVACIONES / CUMPLE'}
                              </span>
                            ) : (
                              <span className={`font-mono text-[11px] ${
                                ['primerNombre', 'primerApellido', 'documento'].includes(col.key)
                                  ? 'font-bold text-slate-900'
                                  : 'text-slate-700'
                              }`}>
                                {cellVal || <span className="text-slate-300 italic">-</span>}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Row actions */}
                      <td className="px-2 py-2 text-center whitespace-nowrap bg-white/90 group-hover:bg-slate-50 sticky right-0 z-10 border-l border-slate-200">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setValidatingRowModal(row)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Validar paciente en ADRES, Comprobador y PAIWEB"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingRowModal(row)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar fila completa en ventana"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteRow(row.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Eliminar fila de la base"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row Edit Modal */}
      {editingRowModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Editar Registro: {editingRowModal.primerNombre} {editingRowModal.primerApellido}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingRowModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {EXCEL_BASE_COLUMNS.map(col => (
                <div key={col.key} className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">
                    {col.label}
                  </label>
                  <input
                    type="text"
                    value={(editingRowModal as any)[col.key] || ''}
                    onChange={(e) => {
                      setEditingRowModal({
                        ...editingRowModal,
                        [col.key]: e.target.value
                      });
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingRowModal(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = rows.map(r => r.id === editingRowModal.id ? editingRowModal : r);
                  onRowsChange(updated);
                  setEditingRowModal(null);
                  onTriggerToast('Registro actualizado');
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Row Quick Validation Modal (ADRES, Comprobador, PAIWEB) */}
      {validatingRowModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl text-white space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Validación Oficial en Línea
                  </h3>
                  <p className="text-xs text-slate-400">
                    ADRES (BDUA) · Comprobador de Derechos SDS · PAIWEB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setValidatingRowModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Header Box */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Paciente:</span>
                <span className="text-xs font-bold text-white uppercase">
                  {validatingRowModal.primerNombre} {validatingRowModal.segundoNombre} {validatingRowModal.primerApellido} {validatingRowModal.segundoApellido}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Documento:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-indigo-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {validatingRowModal.documento || 'Sin Documento'}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (validatingRowModal.documento) {
                        await copyToClipboard(validatingRowModal.documento);
                        onTriggerToast(`📋 Cédula ${validatingRowModal.documento} copiada al portapapeles.`);
                      }
                    }}
                    className="p-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors cursor-pointer"
                    title="Copiar documento"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Observación Actual (Columna T):</span>
                <span className="text-xs font-medium text-emerald-400">
                  {validatingRowModal.observaciones || 'SIN OBSERVACIONES / CUMPLE'}
                </span>
              </div>
            </div>

            {/* Portal Action Buttons */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                1. Abrir Aplicativo con Cédula Copiada:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (validatingRowModal.documento) {
                      await copyToClipboard(validatingRowModal.documento);
                      onTriggerToast(`📋 Cédula ${validatingRowModal.documento} copiada. Abriendo ADRES...`);
                    }
                    openOfficialPortal('ADRES');
                  }}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>ADRES (BDUA)</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (validatingRowModal.documento) {
                      await copyToClipboard(validatingRowModal.documento);
                      onTriggerToast(`📋 Cédula ${validatingRowModal.documento} copiada. Abriendo Comprobador SDS...`);
                    }
                    openOfficialPortal('COMPROBADOR');
                  }}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Comprobador SDS</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (validatingRowModal.documento) {
                      await copyToClipboard(validatingRowModal.documento);
                      onTriggerToast(`📋 Cédula ${validatingRowModal.documento} copiada. Abriendo PAIWEB...`);
                    }
                    openOfficialPortal('PAIWEB');
                  }}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>PAIWEB Vacunas</span>
                </button>
              </div>
            </div>

            {/* Quick Result Stamps in Database Row */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                2. Registrar Resultado en Fila de Excel (Columna T):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const stamp = 'VALIDADO ADRES: CAPITAL SALUD EPS-S - CUMPLE';
                    const current = validatingRowModal.observaciones || '';
                    const newObs = (!current || current.includes('SIN OBSERVACIONES')) ? stamp : `${current}, ${stamp}`;
                    const updatedRow = { ...validatingRowModal, observaciones: newObs };
                    onRowsChange(rows.map(r => r.id === updatedRow.id ? updatedRow : r));
                    setValidatingRowModal(updatedRow);
                    onTriggerToast(`✓ Validación ADRES registrada en la fila.`);
                  }}
                  className="px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer"
                >
                  ✓ Validado ADRES (Capital Salud)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const stamp = 'VALIDADO COMPROBADOR DERECHOS SDS: ACTIVO';
                    const current = validatingRowModal.observaciones || '';
                    const newObs = (!current || current.includes('SIN OBSERVACIONES')) ? stamp : `${current}, ${stamp}`;
                    const updatedRow = { ...validatingRowModal, observaciones: newObs };
                    onRowsChange(rows.map(r => r.id === updatedRow.id ? updatedRow : r));
                    setValidatingRowModal(updatedRow);
                    onTriggerToast(`✓ Validación Comprobador SDS registrada.`);
                  }}
                  className="px-3 py-2 bg-blue-950/60 hover:bg-blue-900/80 border border-blue-500/40 text-blue-300 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer"
                >
                  ✓ Validado Comprobador SDS (Activo)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const stamp = 'VALIDADO PAIWEB: ESQUEMA AL DIA';
                    const current = validatingRowModal.observaciones || '';
                    const newObs = (!current || current.includes('SIN OBSERVACIONES')) ? stamp : `${current}, ${stamp}`;
                    const updatedRow = { ...validatingRowModal, observaciones: newObs };
                    onRowsChange(rows.map(r => r.id === updatedRow.id ? updatedRow : r));
                    setValidatingRowModal(updatedRow);
                    onTriggerToast(`✓ Validación PAIWEB registrada.`);
                  }}
                  className="px-3 py-2 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer"
                >
                  ✓ Validado PAIWEB (Esquema al Día)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const stamp = 'INCONSISTENCIA ADRES: EPS NO COINCIDE CON FICHA';
                    const current = validatingRowModal.observaciones || '';
                    const newObs = (!current || current.includes('SIN OBSERVACIONES')) ? stamp : `${current}, ${stamp}`;
                    const updatedRow = { ...validatingRowModal, observaciones: newObs };
                    onRowsChange(rows.map(r => r.id === updatedRow.id ? updatedRow : r));
                    setValidatingRowModal(updatedRow);
                    onTriggerToast(`⚠️ Inconsistencia registrada.`);
                  }}
                  className="px-3 py-2 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer"
                >
                  ⚠️ Inconsistencia EPS en ADRES
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setValidatingRowModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Robot Mass Cross Modal */}
      {isMassCrossModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-purple-600/30 border border-purple-400/40 text-purple-300">
                  <Bot className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Cruce Masivo con Resultados del Robot (SISVAN PAI / Comprobador)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sincroniza y valida todas las filas de la base de 27 columnas a partir de los archivos de salida del robot.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMassCrossModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Workflow steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 space-y-2">
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
                  Paso 1: Alimentar el Robot
                </span>
                <p className="text-xs text-slate-300">
                  Genera el archivo <strong className="text-white">codigos.csv</strong> con las cédulas únicas de la base actual para procesarlo con los scrapers.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadCodigosCsv}
                  className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Descargar codigos.csv</span>
                </button>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 space-y-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Paso 2: Cargar Resultados
                </span>
                <p className="text-xs text-slate-300">
                  Carga el archivo generado por el robot (<code className="text-emerald-300">resultado_adultos_PAI.csv</code>, <code className="text-emerald-300">resultados_COMPROBADOR.csv</code>, BDUA, etc.).
                </p>
                <input
                  ref={massFileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                  onChange={handleUploadMassCrossFile}
                />
                <button
                  type="button"
                  onClick={() => massFileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {isProcessingMassCross ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{isProcessingMassCross ? 'Procesando...' : 'Subir Resultados del Robot'}</span>
                </button>
              </div>
            </div>

            {/* Mass Cross Results Card */}
            {massCrossResults && massCrossResults.enrichment && (
              <div className="bg-slate-800/90 border border-emerald-500/50 rounded-xl p-4 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-2.5">
                  <div>
                    <span className="text-xs font-bold text-emerald-400 block">
                      ✓ Archivo vinculado: {massCrossResults.fileName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {massCrossResults.recordsMap.size} registros extraídos por el Robot
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800">
                    {massCrossResults.enrichment.stats.matchedCount} de {massCrossResults.enrichment.stats.totalRows} filas coinciden
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Nombres Corregibles</span>
                    <span className="text-base font-bold text-white">
                      {massCrossResults.enrichment.stats.namesUpdatedCount}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Fechas Nac. Completadas</span>
                    <span className="text-base font-bold text-indigo-300">
                      {massCrossResults.enrichment.stats.datesUpdatedCount}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Sellos en Columna T</span>
                    <span className="text-base font-bold text-emerald-400">
                      {massCrossResults.enrichment.stats.observationsUpdatedCount}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  Al confirmar, el sistema sincronizará los nombres oficiales de los pacientes coincidentes, completará fechas de nacimiento faltantes y estampará la nota oficial en la <strong className="text-emerald-400">Columna T (OBSERVACIONES)</strong> de cada fila.
                </p>

                <button
                  type="button"
                  id="btn-apply-mass-enrichment"
                  onClick={handleApplyMassEnrichment}
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Aplicar Sincronización y Validar Base Completa</span>
                </button>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsMassCrossModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
