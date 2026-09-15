import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Database, 
  User, 
  Building2, 
  MapPin, 
  Calendar, 
  Stethoscope, 
  Sparkles, 
  FolderPlus,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  PenTool,
  FileText,
  RefreshCw,
  ShieldCheck,
  FileSpreadsheet,
  ExternalLink
} from 'lucide-react';
import { SisvesoCaraAData, ExcelBaseRow } from '../types';
import { 
  OBSERVACIONES_FRECUENTES, 
  UPGD_CATALOG, 
  TIPO_DOC_MAP, 
  calculateSemanaEpidemiologica, 
  caraAToExcelRow, 
  generateTsvForClipboard 
} from '../utils/sisveso';
import { DocumentViewer } from './DocumentViewer';
import { generateCaraAPreviewSvg } from '../utils/previewGenerator';
import { OfficialValidationPanel } from './OfficialValidationPanel';
import { PrecriticaModule } from './PrecriticaModule';
import { 
  LOCALIDADES_BOGOTA, 
  normalizeAddressForGeocoder, 
  openOfficialPortal, 
  copyToClipboard 
} from '../utils/validationPortals';

interface CaraAViewerProps {
  data: SisvesoCaraAData;
  onDataChange: (updated: SisvesoCaraAData) => void;
  onAddToDatabase: (row: ExcelBaseRow, asNewDatabase?: boolean) => void;
  onTriggerToast: (msg: string) => void;
  isFirstScan?: boolean;
  activeDbName?: string;
  activeRowCount: number;
  isCustomNew: boolean;
  alreadyAdded?: boolean;
  
  // Multi-Cara A support
  allCaraARecords?: SisvesoCaraAData[];
  currentIndex?: number;
  onSelectIndex?: (index: number) => void;
  onAddAllToDatabase?: (records: SisvesoCaraAData[]) => void;

  // Document preview support
  fileUrl?: string | null;
  fileName?: string;
  fileType?: string;

  // Database cross-reference support
  allRows?: ExcelBaseRow[];
  onRowsUpdate?: (updated: ExcelBaseRow[]) => void;
}

export const CaraAViewer: React.FC<CaraAViewerProps> = ({
  data,
  onDataChange,
  onAddToDatabase,
  onTriggerToast,
  isFirstScan = false,
  activeDbName = 'Base_Datos_SISVESO_2026.xlsx',
  activeRowCount = 0,
  isCustomNew = false,
  alreadyAdded = false,
  allCaraARecords,
  currentIndex = 0,
  onSelectIndex,
  onAddAllToDatabase,
  fileUrl,
  fileName = 'Ficha_SIVIGILA_Cara_A.pdf',
  fileType = 'application/pdf',
  allRows = [],
  onRowsUpdate,
}) => {
  const [formData, setFormData] = useState<SisvesoCaraAData>(data);
  const [copied, setCopied] = useState(false);
  const [hasAdded, setHasAdded] = useState(alreadyAdded);
  const [showPreview, setShowPreview] = useState(true);
  const [activeApartado, setActiveApartado] = useState<'base_datos' | 'precritica'>('base_datos');

  useEffect(() => {
    setFormData(data);
    setHasAdded(alreadyAdded);
  }, [data, alreadyAdded]);

  const handleChange = (field: keyof SisvesoCaraAData, value: any) => {
    const updated = { ...formData, [field]: value };

    // Sincronizar automáticamente nombreCompleto si se edita cualquiera de los 4 campos de nombre
    if (['primerNombre', 'segundoNombre', 'primerApellido', 'segundoApellido'].includes(field as string)) {
      const pNom = (field === 'primerNombre' ? value : (formData.primerNombre || '')).trim();
      const sNom = (field === 'segundoNombre' ? value : (formData.segundoNombre || '')).trim();
      const pApe = (field === 'primerApellido' ? value : (formData.primerApellido || '')).trim();
      const sApe = (field === 'segundoApellido' ? value : (formData.segundoApellido || '')).trim();
      updated.nombreCompleto = [pNom, sNom, pApe, sApe].filter(Boolean).join(' ');
    }

    // Auto lookup UPGD si se digita o modifica el código de UPGD
    if (field === 'codigoUpgd') {
      const clean = (value || '').replace(/\D/g, '');
      if (UPGD_CATALOG[clean]) {
        updated.nombreUpgd = UPGD_CATALOG[clean].nombre;
        updated.localidadNotificadora = UPGD_CATALOG[clean].localidad;
      }
    }

    // Auto calculate week if date changed
    if (field === 'fechaConsulta') {
      const epi = calculateSemanaEpidemiologica(value);
      if (epi) updated.semanaEpiConsulta = epi.label;
    }
    if (field === 'fechaRecepcion') {
      const epi = calculateSemanaEpidemiologica(value);
      if (epi) updated.semanaEpiRecepcion = epi.label;
    }

    setFormData(updated);
    onDataChange(updated);
  };

  const handleFullNameChange = (val: string) => {
    const parts = val.trim().split(/\s+/).filter(Boolean);
    let pNom = '';
    let sNom = '';
    let pApe = '';
    let sApe = '';

    if (parts.length >= 4) {
      pNom = parts[0];
      sNom = parts.slice(1, parts.length - 2).join(' ');
      pApe = parts[parts.length - 2];
      sApe = parts[parts.length - 1];
    } else if (parts.length === 3) {
      pNom = parts[0];
      pApe = parts[1];
      sApe = parts[2];
    } else if (parts.length === 2) {
      pNom = parts[0];
      pApe = parts[1];
    } else if (parts.length === 1) {
      pNom = parts[0];
    }

    const updated: SisvesoCaraAData = {
      ...formData,
      nombreCompleto: val,
      primerNombre: pNom,
      segundoNombre: sNom,
      primerApellido: pApe,
      segundoApellido: sApe
    };
    setFormData(updated);
    onDataChange(updated);
  };

  const handleForceSyncWithDatabase = () => {
    const excelRow = caraAToExcelRow(formData);
    onAddToDatabase(excelRow, false);
    setHasAdded(true);
    onTriggerToast(`💾 ¡Base de datos oficial actualizada con los datos corregidos de ${formData.primerNombre || formData.nombreCompleto || 'paciente'}!`);
  };

  const handleApplyObservationTag = (tag: string) => {
    let current = (formData.observacionesSugeridas || '').trim();
    if (tag.includes('SIN OBSERVACIONES') || tag.includes('CUMPLE')) {
      current = 'SIN OBSERVACIONES / CUMPLE';
    } else {
      if (!current || current.includes('SIN OBSERVACIONES') || current.includes('CUMPLE')) {
        current = tag;
      } else if (!current.includes(tag)) {
        current = `${current}, ${tag}`;
      }
    }
    handleChange('observacionesSugeridas', current);
  };

  const handleUpgdLookup = (code: string) => {
    const clean = code.replace(/\D/g, '');
    if (UPGD_CATALOG[clean]) {
      const info = UPGD_CATALOG[clean];
      setFormData(prev => ({
        ...prev,
        codigoUpgd: clean,
        nombreUpgd: info.nombre,
        localidadNotificadora: info.localidad
      }));
      onTriggerToast(`UPGD identificada: ${info.nombre}`);
    }
  };

  const handleCopyRowToClipboard = async () => {
    const excelRow = caraAToExcelRow(formData);
    const tsv = generateTsvForClipboard([excelRow], false);
    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      onTriggerToast('¡Fila copiada en formato oficial! Ve a Excel y presiona Ctrl + V');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const handleStartNewDatabaseWithThis = () => {
    const excelRow = caraAToExcelRow(formData);
    onAddToDatabase(excelRow, true);
    setHasAdded(true);
    onTriggerToast(`✨ ¡Nueva base inicializada con la ficha de ${formData.primerNombre || 'paciente'} como Fila #1!`);
  };

  const handleAppendToCurrent = () => {
    const excelRow = caraAToExcelRow(formData);
    onAddToDatabase(excelRow, false);
    setHasAdded(true);
    onTriggerToast(`➕ Ficha de ${formData.primerNombre || 'paciente'} agregada a la base`);
  };

  const handleAddAll = () => {
    if (allCaraARecords && onAddAllToDatabase) {
      onAddAllToDatabase(allCaraARecords);
      setHasAdded(true);
    }
  };

  // Generate fallback SVG preview if no binary PDF was uploaded
  const fallbackSvgUrl = useMemo(() => {
    const total = allCaraARecords?.length || 1;
    const pageNum = (currentIndex ?? 0) + 1;
    return generateCaraAPreviewSvg(formData, pageNum, total);
  }, [formData, currentIndex, allCaraARecords?.length]);

  const effectivePreviewUrl = fileUrl || fallbackSvgUrl;

  const obs = (formData.observacionesSugeridas || '').toUpperCase();
  const hasIssues = obs && !obs.includes('SIN OBSERVACIONES') && !obs.includes('CUMPLE');
  const hasRedCorrections = !!(
    (formData.correccionesEnRojo && formData.correccionesEnRojo.length > 0) ||
    obs.includes('ROJO') ||
    obs.includes('CORRECCION') ||
    obs.includes('ACLARACION')
  );

  const totalFichas = allCaraARecords?.length || 1;
  const isMultiFicha = totalFichas > 1;

  return (
    <div className="space-y-4">
      {/* Multi-Ficha Stepper */}
      {isMultiFicha && allCaraARecords && (
        <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
              <Layers className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Lote ({totalFichas} fichas)
            </span>
            <span className="text-xs text-slate-600">
              Ficha {(currentIndex ?? 0) + 1} de {totalFichas}: <strong>{formData.nombreCompleto || `${formData.primerNombre || ''} ${formData.primerApellido || ''}`.trim() || 'Ficha Cara A'}</strong>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              (ID: {formData.numeroIdentificacion || 'S/N'})
            </span>
          </div>

          <div className="flex items-center gap-1.5 self-end md:self-auto">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => onSelectIndex && onSelectIndex(Math.max(0, currentIndex - 1))}
                className="p-1 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed rounded text-slate-700 transition-colors"
                title="Ficha anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center space-x-0.5 px-1">
                {allCaraARecords.map((rec, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectIndex && onSelectIndex(idx)}
                    className={`w-5 h-5 rounded text-[11px] font-medium transition-all ${
                      currentIndex === idx
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title={`Ficha ${idx + 1}: ${rec.nombreCompleto || rec.primerNombre || 'Paciente'}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={currentIndex >= totalFichas - 1}
                onClick={() => onSelectIndex && onSelectIndex(Math.min(totalFichas - 1, currentIndex + 1))}
                className="p-1 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed rounded text-slate-700 transition-colors"
                title="Ficha siguiente"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {onAddAllToDatabase && (
              <button
                type="button"
                id="btn-add-all-cara-a"
                onClick={handleAddAll}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="Agrega todas las fichas a la base"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Agregar todas ({totalFichas})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Red Ink: Subtle Notification */}
      {hasRedCorrections && (
        <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/70 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
            <span>
              Anotaciones en tinta roja detectadas en el documento (se sincronizan a la Columna T de observaciones).
            </span>
          </div>
          {formData.correccionesEnRojo && formData.correccionesEnRojo.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {formData.correccionesEnRojo.map((corr, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 bg-white border border-rose-200 text-rose-800 rounded text-[10px] font-medium"
                >
                  {corr}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Database Quick Actions Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 text-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium font-mono">
              Base: <strong className="text-slate-800">{activeDbName}</strong> ({activeRowCount} registros)
            </span>
            {hasAdded && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                Sincronizada
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {hasAdded ? (
              <button
                type="button"
                id="btn-force-sync-db"
                onClick={handleForceSyncWithDatabase}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="Guarda los cambios en la base de Excel"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  id="btn-append-to-db"
                  onClick={handleAppendToCurrent}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  title="Agrega esta ficha a la base activa"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Anexar a Base</span>
                </button>
                <button
                  type="button"
                  id="btn-create-new-db-with-this"
                  onClick={handleStartNewDatabaseWithThis}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  title="Crea una base nueva con esta ficha como fila #1"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-slate-500" />
                  <span>Crear Nueva Base</span>
                </button>
              </>
            )}

            <button
              type="button"
              id="btn-copy-tsv-single"
              onClick={handleCopyRowToClipboard}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="Copia los 27 campos para presionar Ctrl+V en Excel"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copiado' : 'Copiar Fila'}</span>
            </button>

            <button
              type="button"
              id="btn-toggle-preview"
              onClick={() => setShowPreview(!showPreview)}
              className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
                showPreview 
                  ? 'bg-slate-100 text-slate-900 border-slate-300' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Muestra u oculta la previsualización del documento"
            >
              {showPreview ? <EyeOff className="w-3.5 h-3.5 text-slate-600" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
              <span>{showPreview ? 'Ocultar PDF' : 'Ver PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Split View Container: Document Preview (Left) + Form Editor (Right) */}
      <div className={`grid grid-cols-1 ${showPreview ? 'xl:grid-cols-12' : ''} gap-6 items-start`}>
        {showPreview && (
          <div className="xl:col-span-5 sticky top-24 space-y-3">
            <div className="flex items-center justify-between px-1 text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Previsualización de la Ficha
              </span>
              <span className="text-[11px] text-slate-500">
                {fileUrl ? 'Archivo original cargado' : 'Formato oficial digitalizado'}
              </span>
            </div>

            <DocumentViewer
              fileUrl={effectivePreviewUrl}
              fileName={fileName}
              fileType={fileType}
              className="h-[680px]"
            />
          </div>
        )}

        {/* Main Extracted Form */}
        <div className={`${showPreview ? 'xl:col-span-7' : 'w-full'} bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-4 p-4 sm:p-5`}>
          {/* Patient & Ficha Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.2 rounded">
                  SIVIGILA · Evento 2303
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 mt-1 tracking-tight">
                {formData.nombreCompleto || `${formData.primerNombre || ''} ${formData.primerApellido || ''}`.trim() || 'Ficha de Notificación'}
              </h2>
              <p className="text-xs text-slate-500">
                Doc: <span className="text-slate-800 font-mono font-medium">{formData.numeroIdentificacion || 'Sin ID'}</span> · UPGD: <span className="text-slate-800">{formData.nombreUpgd || 'No especificada'}</span>
              </p>
            </div>

            <div className="text-right text-xs">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Semana Epidemiológica</span>
              <span className="font-mono font-medium text-slate-800">{formData.semanaEpiConsulta || formData.semana || 'SEMANA 36'}</span>
            </div>
          </div>

          {/* Apartados Switcher */}
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center gap-1">
            <button
              type="button"
              id="btn-apartado-base"
              onClick={() => setActiveApartado('base_datos')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-md font-medium text-xs transition-all cursor-pointer ${
                activeApartado === 'base_datos'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Ficha Médica (27 Campos)</span>
            </button>

            <button
              type="button"
              id="btn-apartado-precritica"
              onClick={() => setActiveApartado('precritica')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-md font-medium text-xs transition-all cursor-pointer ${
                activeApartado === 'precritica'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Precrítica Epidemiológica</span>
            </button>
          </div>

          {activeApartado === 'precritica' ? (
            <PrecriticaModule
              formData={formData}
              onDataChange={(updated) => {
                setFormData(updated);
                onDataChange(updated);
              }}
              onTriggerToast={onTriggerToast}
              onSwitchToDatabaseView={() => setActiveApartado('base_datos')}
            />
          ) : (
            <>
              {/* Quality Audit & Feedback Box */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col gap-2 text-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {hasIssues ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <span className="font-semibold text-xs text-slate-800">
                      {hasIssues ? 'Auditoría: Con observaciones' : 'Auditoría: Conforme'}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                    hasIssues ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {hasIssues ? 'Requiere retroalimentación' : 'Cumple / Sin Observaciones'}
                  </span>
                </div>

                {/* Editable Observation Box */}
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    value={formData.observacionesSugeridas || ''}
                    onChange={(e) => handleChange('observacionesSugeridas', e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs font-mono bg-white border border-slate-200 rounded-md focus:outline-none"
                    placeholder="Observaciones para Columna T de Excel..."
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyObservationTag('SIN OBSERVACIONES / CUMPLE')}
                    className="px-2 py-1 text-[11px] font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md cursor-pointer shrink-0"
                  >
                    ✓ Cumple
                  </button>
                </div>

                <div className="flex flex-wrap gap-1">
                  {[
                    'ACLARACION EN ROJO: BARRIO (LETRA MEDICO)',
                    'ACLARACION EN ROJO: DIRECCION',
                    'CORRECCION EN ROJO: BARRIO',
                    'CORRECCION EN ROJO: DIRECCION',
                    'ERROR EN TIPO DE DOCUMENTO',
                    'ERROR EN ESTRUCTURA DE DIRECCION',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleApplyObservationTag(tag)}
                      className={`px-2 py-0.5 text-[10px] rounded border transition-colors cursor-pointer ${
                        formData.observacionesSugeridas?.includes(tag)
                          ? 'bg-slate-900 text-white border-slate-900 font-medium'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Official Validation Panel: ADRES · Comprobador de Derechos · PAIWEB */}
              <OfficialValidationPanel
                formData={formData}
                onDataChange={(updated) => {
                  setFormData(updated);
                  onDataChange(updated);
                }}
                onTriggerToast={onTriggerToast}
                allRows={allRows}
                onRowsUpdate={onRowsUpdate}
              />

              {/* Form Section 1: UPGD & General Info */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center space-x-1.5 text-slate-800 font-semibold text-xs uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>1. Información de la UPGD Notificadora</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Código UPGD (Col D)</label>
                    <input
                      type="text"
                      value={formData.codigoUpgd || ''}
                      onChange={(e) => {
                        handleChange('codigoUpgd', e.target.value);
                        handleUpgdLookup(e.target.value);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none"
                      placeholder="ej. 110013029414"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Nombre UPGD (Col E)</label>
                    <input
                      type="text"
                      value={formData.nombreUpgd || ''}
                      onChange={(e) => handleChange('nombreUpgd', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Localidad Notificadora (Col F)</label>
                    <input
                      type="text"
                      value={formData.localidadNotificadora || ''}
                      onChange={(e) => handleChange('localidadNotificadora', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Código Evento</label>
                    <input
                      type="text"
                      value={formData.codigoEvento || '2303'}
                      onChange={(e) => handleChange('codigoEvento', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Año</label>
                    <input
                      type="text"
                      value={formData.anio || '2026'}
                      onChange={(e) => handleChange('anio', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Form Section 2: Patient Identification */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center space-x-1.5 text-slate-800 font-semibold text-xs uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-slate-600" />
                  <span>2. Identificación del Paciente (Columnas G a O)</span>
                </div>

                {/* Master Patient Name input with auto-sync */}
                <div>
                  <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">
                    Nombre Completo (Sincronizado)
                  </label>
                  <input
                    type="text"
                    value={formData.nombreCompleto || `${formData.primerNombre || ''} ${formData.segundoNombre || ''} ${formData.primerApellido || ''} ${formData.segundoApellido || ''}`.replace(/\s+/g, ' ').trim()}
                    onChange={(e) => handleFullNameChange(e.target.value)}
                    placeholder="Escribe o corrige el nombre completo (ej: JUAN CARLOS PEREZ GOMEZ)"
                    className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Primer Nombre (Col G)</label>
                    <input
                      type="text"
                      value={formData.primerNombre || ''}
                      onChange={(e) => handleChange('primerNombre', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Segundo Nombre (Col H)</label>
                    <input
                      type="text"
                      value={formData.segundoNombre || ''}
                      onChange={(e) => handleChange('segundoNombre', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Primer Apellido (Col I)</label>
                    <input
                      type="text"
                      value={formData.primerApellido || ''}
                      onChange={(e) => handleChange('primerApellido', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Segundo Apellido (Col J)</label>
                    <input
                      type="text"
                      value={formData.segundoApellido || ''}
                      onChange={(e) => handleChange('segundoApellido', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Tipo Doc (Col M)</label>
                    <select
                      value={formData.tipoIdCodigo || '4'}
                      onChange={(e) => {
                        const code = e.target.value;
                        const match = TIPO_DOC_MAP[code];
                        handleChange('tipoIdCodigo', code);
                        if (match) handleChange('tipoIdSigla', match.sigla);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none"
                    >
                      {Object.values(TIPO_DOC_MAP).map(t => (
                        <option key={t.codigo} value={t.codigo}>
                          {t.codigo} - {t.sigla} ({t.descripcion})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">N° Documento (Col K)</label>
                    <input
                      type="text"
                      value={formData.numeroIdentificacion || ''}
                      onChange={(e) => handleChange('numeroIdentificacion', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-medium bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Fecha Nacimiento (Col N)</label>
                    <input
                      type="text"
                      value={formData.fechaNacimiento || ''}
                      onChange={(e) => handleChange('fechaNacimiento', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none"
                      placeholder="DD/MM/AAAA"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Edad (Col O)</label>
                    <input
                      type="text"
                      value={formData.edad || ''}
                      onChange={(e) => handleChange('edad', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Form Section 3: Residence & Socioeconomic */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center space-x-1.5 text-slate-800 font-semibold text-xs uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-slate-600" />
                  <span>3. Residencia, Dirección y Barrio</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] font-medium text-slate-500 uppercase">
                        Dirección de Residencia
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          const rawAddr = (formData.direccionResidencia || '').trim();
                          const norm = normalizeAddressForGeocoder(rawAddr) || rawAddr;
                          if (!norm) {
                            onTriggerToast('⚠️ Ingresa una dirección en la ficha para geocodificar.');
                            return;
                          }
                          await copyToClipboard(norm);
                          onTriggerToast(`📋 Dirección "${norm}" copiada. Abriendo Geocodificador SDS...`);
                          openOfficialPortal('GEOCODIFICADOR', norm);
                        }}
                        className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded text-[10px] transition-colors border border-slate-200 cursor-pointer"
                        title="Copia la dirección normalizada y abre el Geocodificador SDS Bogotá"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>Geocodificador SDS</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.direccionResidencia || ''}
                      onChange={(e) => handleChange('direccionResidencia', e.target.value)}
                      placeholder="ej. KR 10 20 30 SUR"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Estrato</label>
                    <input
                      type="text"
                      value={formData.estrato || ''}
                      onChange={(e) => handleChange('estrato', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">
                      Barrio de Residencia (Casilla 12)
                    </label>
                    <input
                      type="text"
                      value={formData.barrioResidencia || ''}
                      onChange={(e) => handleChange('barrioResidencia', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Localidad Residencia</label>
                    <input
                      type="text"
                      list="bogota-localidades-list"
                      value={formData.localidadResidencia || ''}
                      onChange={(e) => handleChange('localidadResidencia', e.target.value)}
                      placeholder="ej. BOSA, KENNEDY, SUBA..."
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                    <datalist id="bogota-localidades-list">
                      {LOCALIDADES_BOGOTA.map((loc) => (
                        <option key={loc} value={loc} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Ocupación</label>
                    <input
                      type="text"
                      value={formData.ocupacion || ''}
                      onChange={(e) => handleChange('ocupacion', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Cód. Ocupación</label>
                    <input
                      type="text"
                      value={formData.codigoOcupacion || ''}
                      onChange={(e) => handleChange('codigoOcupacion', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Teléfono</label>
                    <input
                      type="text"
                      value={formData.telefono || ''}
                      onChange={(e) => handleChange('telefono', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Form Section 4: Professional & Dates */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center space-x-1.5 text-slate-800 font-semibold text-xs uppercase tracking-wider">
                  <Stethoscope className="w-3.5 h-3.5 text-slate-600" />
                  <span>4. Odontólogo Tratante y Fechas (Columnas P a AA)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Fecha Consulta (Col P)</label>
                    <input
                      type="text"
                      value={formData.fechaConsulta || ''}
                      onChange={(e) => handleChange('fechaConsulta', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-medium bg-white border border-slate-200 rounded-lg focus:outline-none"
                      placeholder="DD/MM/AAAA"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Nombre Odontólogo (Col Q)</label>
                    <input
                      type="text"
                      value={formData.nombreOdontologo || ''}
                      onChange={(e) => handleChange('nombreOdontologo', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Fecha Recepción (Col S)</label>
                    <input
                      type="text"
                      value={formData.fechaRecepcion || ''}
                      onChange={(e) => handleChange('fechaRecepcion', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none"
                      placeholder="DD/MM/AAAA"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Fecha 1ª Consulta (Col R)</label>
                    <input
                      type="text"
                      value={formData.fechaPrimeraConsulta || ''}
                      onChange={(e) => handleChange('fechaPrimeraConsulta', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none"
                      placeholder="DD/MM/AAAA"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Fecha Envío UPGD (Col X)</label>
                    <input
                      type="text"
                      value={formData.fechaEnvioUpgd || ''}
                      onChange={(e) => handleChange('fechaEnvioUpgd', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none"
                      placeholder="DD/MM/AAAA"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Código ID / Consecutivo (Col C)</label>
                    <input
                      type="text"
                      value={formData.codigoId || ''}
                      onChange={(e) => handleChange('codigoId', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none"
                      placeholder="ej. 1, 2, 3..."
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Semana Epi Consulta (Col AA)</label>
                    <input
                      type="text"
                      value={formData.semanaEpiConsulta || ''}
                      readOnly
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 text-slate-700 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
