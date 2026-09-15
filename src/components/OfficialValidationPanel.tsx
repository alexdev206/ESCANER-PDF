import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  ExternalLink, 
  Copy, 
  Check, 
  Building2, 
  Syringe, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  FileSpreadsheet, 
  RefreshCw, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Info,
  BadgeCheck,
  UserCheck,
  MapPin
} from 'lucide-react';
import { SisvesoCaraAData, ExcelBaseRow } from '../types';
import { 
  OFFICIAL_PORTALS, 
  COMMON_COLOMBIAN_EPS, 
  copyToClipboard, 
  openOfficialPortal, 
  parseBduaCrossFile, 
  BduaRecord,
  normalizeAddressForGeocoder
} from '../utils/validationPortals';

interface OfficialValidationPanelProps {
  formData: SisvesoCaraAData;
  onDataChange: (updated: SisvesoCaraAData) => void;
  onTriggerToast: (msg: string) => void;
  allRows?: ExcelBaseRow[];
  onRowsUpdate?: (updatedRows: ExcelBaseRow[]) => void;
}

export const OfficialValidationPanel: React.FC<OfficialValidationPanelProps> = ({
  formData,
  onDataChange,
  onTriggerToast,
  allRows = [],
  onRowsUpdate,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedEps, setSelectedEps] = useState<string>(formData.entidadAdministradora || 'CAPITAL SALUD EPS-S');
  const [isCrossModalOpen, setIsCrossModalOpen] = useState(false);
  const [isProcessingCross, setIsProcessingCross] = useState(false);
  const [crossResults, setCrossResults] = useState<{
    recordsMap: Map<string, BduaRecord>;
    currentMatch?: BduaRecord;
    matchedCount: number;
    fileName: string;
  } | null>(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const docNumber = (formData.numeroIdentificacion || '').trim();
  const patientFullName = formData.nombreCompleto || `${formData.primerNombre || ''} ${formData.primerApellido || ''}`.trim() || 'Sin Nombre';

  // Handle 1-click copy and portal opening
  const handleOpenAndCopy = async (portalKey: keyof typeof OFFICIAL_PORTALS) => {
    let toCopy = docNumber;
    let toastLabel = `Cédula ${docNumber}`;

    if (portalKey === 'GEOCODIFICADOR') {
      const rawAddr = (formData.direccionResidencia || '').trim();
      toCopy = normalizeAddressForGeocoder(rawAddr) || rawAddr;
      toastLabel = `Dirección "${toCopy}"`;
      if (!toCopy) {
        onTriggerToast('⚠️ La ficha no tiene una dirección registrada para geocodificar.');
        return;
      }
    } else if (!docNumber) {
      onTriggerToast('⚠️ La ficha no tiene un número de documento asignado para validar.');
      return;
    }

    const success = await copyToClipboard(toCopy);
    if (success) {
      setCopiedField(portalKey);
      setTimeout(() => setCopiedField(null), 3000);
      onTriggerToast(`📋 ${toastLabel} copiada al portapapeles. Abriendo ${OFFICIAL_PORTALS[portalKey].name}...`);
    }

    openOfficialPortal(portalKey, toCopy);
  };

  // Fast stamp actions
  const handleStampValidation = (type: 'ADRES_OK' | 'COMPROBADOR_OK' | 'PAI_OK' | 'GEOCODIFICADOR_OK', extraDetails?: string) => {
    let note = '';
    const updated = { ...formData };

    if (type === 'ADRES_OK') {
      const epsToSet = extraDetails || selectedEps || 'CAPITAL SALUD EPS-S';
      updated.entidadAdministradora = epsToSet;
      note = `VALIDADO ADRES: ${epsToSet} - CUMPLE`;
    } else if (type === 'COMPROBADOR_OK') {
      note = 'VALIDADO COMPROBADOR DERECHOS SDS: ACTIVO';
    } else if (type === 'PAI_OK') {
      note = 'VALIDADO PAIWEB: ESQUEMA AL DIA';
    } else if (type === 'GEOCODIFICADOR_OK') {
      note = 'GEOCODIFICADO SDS: DIRECCION Y BARRIO VALIDADOS';
    }

    // Append to current observations cleanly
    const currentObs = (updated.observacionesSugeridas || '').trim();
    if (!currentObs || currentObs.includes('SIN OBSERVACIONES') || currentObs === 'CUMPLE') {
      updated.observacionesSugeridas = note;
    } else if (!currentObs.includes(note)) {
      updated.observacionesSugeridas = `${currentObs}, ${note}`;
    }

    onDataChange(updated);
    onTriggerToast(`✓ Validación registrada: ${note}`);
  };

  // Stamp inconsistency
  const handleStampInconsistency = (inconsistencyText: string) => {
    const updated = { ...formData };
    const currentObs = (updated.observacionesSugeridas || '').trim();

    if (!currentObs || currentObs.includes('SIN OBSERVACIONES') || currentObs === 'CUMPLE') {
      updated.observacionesSugeridas = inconsistencyText;
    } else if (!currentObs.includes(inconsistencyText)) {
      updated.observacionesSugeridas = `${currentObs}, ${inconsistencyText}`;
    }

    onDataChange(updated);
    onTriggerToast(`⚠️ Inconsistencia registrada en Columna T: ${inconsistencyText}`);
  };

  // Handle BDUA Cross File Upload
  const handleCrossFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsProcessingCross(true);

    try {
      const recordsMap = await parseBduaCrossFile(file);
      const currentMatch = docNumber ? recordsMap.get(docNumber) : undefined;
      
      let matchedCount = 0;
      if (allRows.length > 0) {
        allRows.forEach(r => {
          const doc = (r.documento || '').trim().replace(/[.,\s-]/g, '');
          if (doc && recordsMap.has(doc)) matchedCount++;
        });
      } else if (currentMatch) {
        matchedCount = 1;
      }

      setCrossResults({
        recordsMap,
        currentMatch,
        matchedCount,
        fileName: file.name,
      });

      onTriggerToast(`✓ Archivo ${file.name} procesado: ${recordsMap.size.toLocaleString()} registros BDUA cargados.`);
    } catch (err: any) {
      console.error('Error parsing BDUA file', err);
      onTriggerToast(`❌ Error al procesar archivo BDUA: ${err?.message || 'Formato no reconocido'}`);
    } finally {
      setIsProcessingCross(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Apply BDUA / Robot verified data to current Cara A
  const handleApplyBduaToCurrentFicha = () => {
    if (!crossResults?.currentMatch) return;
    const bdua = crossResults.currentMatch;
    const updated = { ...formData };

    if (bdua.nombreCompleto) {
      updated.nombreCompleto = bdua.nombreCompleto;
    }
    if (bdua.primerNombre) updated.primerNombre = bdua.primerNombre;
    if (bdua.segundoNombre) updated.segundoNombre = bdua.segundoNombre;
    if (bdua.primerApellido) updated.primerApellido = bdua.primerApellido;
    if (bdua.segundoApellido) updated.segundoApellido = bdua.segundoApellido;
    if (bdua.eps) updated.entidadAdministradora = bdua.eps;
    if (bdua.regimen) updated.tipoAseguramiento = bdua.regimen;

    const bduaNote = bdua.fuente?.includes('PAI')
      ? 'VALIDADO PAI: NOMBRES Y DATOS OFICIALES'
      : `VALIDADO ${bdua.fuente || 'BDUA'}: ${bdua.eps || 'EPS VERIFICADA'} - ${bdua.regimen || 'REGIMEN'}`;
    const currentObs = (updated.observacionesSugeridas || '').trim();
    if (!currentObs || currentObs.includes('SIN OBSERVACIONES')) {
      updated.observacionesSugeridas = bduaNote;
    } else if (!currentObs.includes(bduaNote)) {
      updated.observacionesSugeridas = `${currentObs}, ${bduaNote}`;
    }

    onDataChange(updated);
    onTriggerToast(`✓ Nombres y EPS oficiales sincronizados con la ficha.`);
  };

  // Apply Address & Georeferencing from Robot/PAI
  const handleApplyAddressToCurrentFicha = () => {
    if (!crossResults?.currentMatch) return;
    const bdua = crossResults.currentMatch;
    const updated = { ...formData };

    if (bdua.direccion) updated.direccionResidencia = bdua.direccion;
    if (bdua.barrio) updated.barrioResidencia = bdua.barrio;
    if (bdua.localidad) {
      // Clean locality format if e.g. "19 - CIUDAD BOLIVAR"
      const locClean = bdua.localidad.replace(/^\d+\s*-\s*/, '').trim();
      updated.localidadResidencia = locClean;
    }

    const addrNote = 'GEOCODIFICADO PAI/SDS: DIRECCION Y BARRIO OFICIALES';
    const currentObs = (updated.observacionesSugeridas || '').trim();
    if (!currentObs || currentObs.includes('SIN OBSERVACIONES')) {
      updated.observacionesSugeridas = addrNote;
    } else if (!currentObs.includes(addrNote)) {
      updated.observacionesSugeridas = `${currentObs}, ${addrNote}`;
    }

    onDataChange(updated);
    onTriggerToast(`✓ Dirección, barrio y localidad oficiales de PAI aplicados.`);
  };

  // Apply All available fields from Robot to current Cara A
  const handleApplyAllToCurrentFicha = () => {
    if (!crossResults?.currentMatch) return;
    const bdua = crossResults.currentMatch;
    const updated = { ...formData };

    if (bdua.nombreCompleto) updated.nombreCompleto = bdua.nombreCompleto;
    if (bdua.primerNombre) updated.primerNombre = bdua.primerNombre;
    if (bdua.segundoNombre) updated.segundoNombre = bdua.segundoNombre;
    if (bdua.primerApellido) updated.primerApellido = bdua.primerApellido;
    if (bdua.segundoApellido) updated.segundoApellido = bdua.segundoApellido;
    if (bdua.eps) updated.entidadAdministradora = bdua.eps;
    if (bdua.regimen) updated.tipoAseguramiento = bdua.regimen;
    if (bdua.direccion) updated.direccionResidencia = bdua.direccion;
    if (bdua.barrio) updated.barrioResidencia = bdua.barrio;
    if (bdua.localidad) {
      updated.localidadResidencia = bdua.localidad.replace(/^\d+\s*-\s*/, '').trim();
    }
    if (bdua.fechaNacimiento) updated.fechaNacimiento = bdua.fechaNacimiento;
    if (bdua.sexo) {
      const sx = bdua.sexo.toUpperCase();
      updated.sexo = sx.includes('MUJER') || sx.includes('FEM') ? 'MUJER' : (sx.includes('HOMBRE') || sx.includes('MAS') ? 'HOMBRE' : updated.sexo);
    }
    if (bdua.telefono1 && !updated.telefono) updated.telefono = bdua.telefono1;

    const fullNote = bdua.fuente?.includes('PAI')
      ? 'VALIDADO PAI: DATOS OFICIALES Y DIRECCION CONFIRMADOS'
      : `VALIDADO COMPROBADOR: ${bdua.eps || 'EPS'} ${bdua.regimen || ''}`.trim();

    const currentObs = (updated.observacionesSugeridas || '').trim();
    if (!currentObs || currentObs.includes('SIN OBSERVACIONES')) {
      updated.observacionesSugeridas = fullNote;
    } else if (!currentObs.includes(fullNote)) {
      updated.observacionesSugeridas = `${currentObs}, ${fullNote}`;
    }

    onDataChange(updated);
    onTriggerToast(`✓ TODOS los datos oficiales del robot aplicados a la ficha.`);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 text-slate-800">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-xs sm:text-sm text-slate-900">
              Validaciones Oficiales (ADRES · Comprobador · PAI · Geocodificador)
            </h3>
            <p className="text-[11px] text-slate-400">
              Cotejo con portales distritales y nacionales en un clic
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            id="btn-open-cross-modal"
            onClick={() => setIsCrossModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="Cargar archivo plano o Excel de BDUA/Comprobador para cruce masivo automático"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Cruce Masivo BDUA</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPanelExpanded(!isPanelExpanded)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            title={isPanelExpanded ? 'Contraer panel' : 'Expandir panel'}
          >
            {isPanelExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Patient Active Validation Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-1.5 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-slate-500">Paciente:</span>
          <span className="font-semibold text-slate-800 uppercase">{patientFullName}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">Doc:</span>
          <span className="font-mono font-semibold text-slate-800">
            {docNumber || 'Sin Documento'}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">EPS:</span>
          <span className="font-medium text-slate-700">
            {formData.entidadAdministradora || 'No registrada'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            copyToClipboard(docNumber);
            setCopiedField('quick-doc');
            setTimeout(() => setCopiedField(null), 2500);
            onTriggerToast(`Cédula ${docNumber} copiada.`);
          }}
          className="inline-flex items-center space-x-1 px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] transition-colors cursor-pointer"
          title="Copiar únicamente el número de documento"
        >
          {copiedField === 'quick-doc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
          <span>{copiedField === 'quick-doc' ? 'Copiado' : 'Copiar Cédula'}</span>
        </button>
      </div>

      {isPanelExpanded && (
        <div className="space-y-3 pt-1">
          {/* 4 Clean Official Portal Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* 1. ADRES BDUA */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-slate-800">
                    1. ADRES · BDUA
                  </h4>
                  <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200 font-medium">
                    FOSYGA
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Afiliación a EPS, régimen y nombres de Registraduría.
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  id="btn-open-adres"
                  onClick={() => handleOpenAndCopy('ADRES')}
                  className="w-full inline-flex items-center justify-center space-x-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Abrir ADRES</span>
                </button>

                <div className="flex items-center space-x-1">
                  <select
                    value={selectedEps}
                    onChange={(e) => setSelectedEps(e.target.value)}
                    className="flex-1 px-1.5 py-1 text-[11px] bg-white border border-slate-200 text-slate-700 rounded-md focus:outline-none truncate"
                  >
                    {COMMON_COLOMBIAN_EPS.map(eps => (
                      <option key={eps} value={eps}>{eps}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleStampValidation('ADRES_OK', selectedEps)}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[11px] font-medium transition-colors shrink-0 cursor-pointer"
                    title="Registrar EPS verificada en la ficha"
                  >
                    ✓ EPS
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Comprobador de Derechos SDS */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-slate-800">
                    2. Comprobador SDS
                  </h4>
                  <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200 font-medium">
                    Bogotá
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Cobertura distrital, red pública hospitalaria y SISBEN.
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  id="btn-open-comprobador"
                  onClick={() => handleOpenAndCopy('COMPROBADOR')}
                  className="w-full inline-flex items-center justify-center space-x-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Abrir Comprobador</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStampValidation('COMPROBADOR_OK')}
                  className="w-full px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                >
                  ✓ Derechos Activos
                </button>
              </div>
            </div>

            {/* 3. PAI Salud Capital */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-slate-800">
                    3. PAI Salud Capital
                  </h4>
                  <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200 font-medium">
                    PAIWEB
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Esquema nominal y datos de georreferenciación.
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    id="btn-open-pai-adultos"
                    onClick={() => handleOpenAndCopy('PAI_ADULTOS')}
                    className="inline-flex items-center justify-center space-x-1 px-1.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                    title="Copiar cédula y abrir PAI Adultos"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Adultos</span>
                  </button>

                  <button
                    type="button"
                    id="btn-open-pai-menores"
                    onClick={() => handleOpenAndCopy('PAI_MENORES')}
                    className="inline-flex items-center justify-center space-x-1 px-1.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                    title="Copiar documento y abrir PAI Menores"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Menores</span>
                  </button>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleOpenAndCopy('PAIWEB')}
                    className="flex-1 py-1 px-1.5 text-[10px] text-slate-600 hover:text-slate-900 hover:bg-white rounded border border-slate-200 transition-colors text-center cursor-pointer"
                  >
                    PAIWEB ↗
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStampValidation('PAI_OK')}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-medium transition-colors cursor-pointer whitespace-nowrap"
                  >
                    ✓ Esquema OK
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Geocodificador SDS Bogotá */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-slate-800">
                    4. Geocodificador SDS
                  </h4>
                  <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200 font-medium">
                    SIG
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Dirección, barrio, UPZ, estrato y localidad oficial.
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  id="btn-open-geocodificador"
                  onClick={() => handleOpenAndCopy('GEOCODIFICADOR')}
                  className="w-full inline-flex items-center justify-center space-x-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  title="Copiar dirección normalizada y abrir el Geocodificador SDS"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Abrir SIG</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStampValidation('GEOCODIFICADOR_OK')}
                  className="w-full px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                >
                  ✓ Geocodificación Válida
                </button>
              </div>
            </div>
          </div>

          {/* Quick Inconsistency Chips */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
            <span className="text-[11px] font-medium text-slate-500 block">
              Registrar inconsistencia de validación en Columna T:
            </span>

            <div className="flex flex-wrap gap-1">
              {[
                'ERROR EN ESTRUCTURA DE DIRECCION',
                'ERROR EN BARRIO',
                'NOT INGRESO, RESIDE EN SOACHA',
                'INCONSISTENCIA ADRES: EPS NO COINCIDE CON FICHA',
                'INCONSISTENCIA ADRES: DOCUMENTO INACTIVO O NO ENCONTRADO EN BDUA',
                'INCONSISTENCIA COMPROBADOR: SIN DERECHOS ACTIVOS EN SUBRED',
                'INCONSISTENCIA REGISTRADURIA: NOMBRE EN BDUA DIFIERE DE FICHA',
                'INCONSISTENCIA PAIWEB: ESQUEMA VACUNACION INCOMPLETO',
                'GEOCODIFICADO SDS: DIRECCION Y BARRIO VALIDADOS',
                'VALIDADO ADRES: REGIMEN SUBSIDIADO CAPITAL SALUD',
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleStampInconsistency(tag)}
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
        </div>
      )}

      {/* Modal: Cruce Masivo con Archivos Planos BDUA */}
      {isCrossModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 shadow-xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Cruce con Archivo Oficial BDUA / Comprobador
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCrossModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Upload Box */}
            <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center space-y-2 bg-slate-50">
              <Upload className="w-6 h-6 text-slate-400 mx-auto" />
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Selecciona archivo Excel (.xlsx / .csv) de ADRES o Comprobador
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Columnas requeridas: Documento, EPS, Régimen y Nombre
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleCrossFileUpload}
                className="hidden"
                id="cross-file-input"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingCross}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                {isProcessingCross ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>{isProcessingCross ? 'Procesando...' : 'Seleccionar Archivo'}</span>
              </button>
            </div>

            {/* Results Display */}
            {crossResults && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs">
                  <span className="font-semibold text-slate-800">
                    Archivo: {crossResults.fileName}
                  </span>
                  <span className="text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                    {crossResults.recordsMap.size.toLocaleString()} registros
                  </span>
                </div>

                {crossResults.currentMatch ? (
                  <div className="space-y-2.5 bg-white border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                      <span className="font-medium text-slate-800">
                        Paciente encontrado (Doc: {docNumber})
                      </span>
                      <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                        {crossResults.currentMatch.fuente || 'BDUA'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Nombre Oficial:</span>
                        <span className="font-semibold text-slate-900 uppercase">
                          {crossResults.currentMatch.nombreCompleto || 'No registrado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">EPS / Régimen:</span>
                        <span className="font-medium text-slate-800">
                          {crossResults.currentMatch.eps || 'No registrada'} · {crossResults.currentMatch.regimen || 'Sin régimen'}
                        </span>
                      </div>
                      {crossResults.currentMatch.direccion && (
                        <div className="sm:col-span-2">
                          <span className="text-[10px] text-slate-400 block">Dirección Oficial:</span>
                          <span className="font-mono text-slate-800">{crossResults.currentMatch.direccion}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleApplyBduaToCurrentFicha}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-medium cursor-pointer"
                      >
                        Aplicar Nombre y EPS
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyAllToCurrentFicha}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium cursor-pointer"
                      >
                        Sincronizar Todo a la Ficha
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    El paciente actual ({docNumber}) no está presente en este archivo BDUA.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsCrossModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
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
