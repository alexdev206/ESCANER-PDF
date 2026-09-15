import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  MapPin, 
  UserCheck, 
  Building2, 
  Calendar, 
  ArrowRight, 
  RefreshCw,
  FileSpreadsheet,
  HelpCircle,
  Stethoscope
} from 'lucide-react';
import { SisvesoCaraAData, ExcelBaseRow } from '../types';
import { 
  evaluateEpidemiologicalPrecritica, 
  normalizeAddressForGeocoder, 
  copyToClipboard, 
  openOfficialPortal, 
  LOCALIDADES_BOGOTA,
  COMMON_COLOMBIAN_EPS
} from '../utils/validationPortals';

interface PrecriticaModuleProps {
  formData: SisvesoCaraAData;
  onDataChange: (updated: SisvesoCaraAData) => void;
  onTriggerToast: (msg: string) => void;
  onSwitchToDatabaseView?: () => void;
}

export const PrecriticaModule: React.FC<PrecriticaModuleProps> = ({
  formData,
  onDataChange,
  onTriggerToast,
  onSwitchToDatabaseView
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'fail' | 'warn' | 'pass'>('all');

  // Evaluate the precritica in real time
  const precriticaReport = useMemo(() => {
    return evaluateEpidemiologicalPrecritica(formData);
  }, [formData]);

  const docNumber = (formData.numeroIdentificacion || '').trim();
  const rawAddress = (formData.direccionResidencia || '').trim();
  const normalizedAddress = normalizeAddressForGeocoder(rawAddress);

  const handleCopyAndOpen = async (portalKey: 'GEOCODIFICADOR' | 'ADRES' | 'COMPROBADOR' | 'PAIWEB') => {
    let textToCopy = docNumber;
    let toastMsg = `Cédula ${docNumber} copiada al portapapeles.`;

    if (portalKey === 'GEOCODIFICADOR') {
      textToCopy = normalizedAddress || rawAddress;
      toastMsg = `Dirección "${textToCopy}" copiada al portapapeles para Geocodificar.`;
    }

    if (!textToCopy) {
      onTriggerToast(`⚠️ No hay ${portalKey === 'GEOCODIFICADOR' ? 'dirección' : 'documento'} para copiar.`);
      return;
    }

    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setCopiedKey(portalKey);
      setTimeout(() => setCopiedKey(null), 3000);
      onTriggerToast(`📋 ${toastMsg} Abriendo portal...`);
    }

    openOfficialPortal(portalKey, textToCopy);
  };

  // Quick apply the suggested observation to Columna T
  const handleApplySuggestedObs = (customText?: string) => {
    const textToApply = customText || precriticaReport.suggestedObservacionColT;
    const updated = {
      ...formData,
      observacionesSugeridas: textToApply,
    };
    onDataChange(updated);
    onTriggerToast(`✓ Observación de Precrítica aplicada a Columna T: "${textToApply}"`);
  };

  // Quick mark clean
  const handleMarkClean = () => {
    const updated = {
      ...formData,
      observacionesSugeridas: 'SIN OBSERVACIONES / CUMPLE',
    };
    onDataChange(updated);
    onTriggerToast(`✓ Ficha certificada como CUMPLE / SIN OBSERVACIONES.`);
  };

  // Quick stamp geocoder verified
  const handleStampGeocodedOk = (localidad?: string, estrato?: string) => {
    const updated = { ...formData };
    if (localidad) updated.localidadResidencia = localidad;
    if (estrato) updated.estrato = estrato;

    const stamp = 'GEOCODIFICADO SDS: DIRECCION Y BARRIO VALIDADOS';
    const current = (updated.observacionesSugeridas || '').trim();
    if (!current || current.includes('SIN OBSERVACIONES')) {
      updated.observacionesSugeridas = stamp;
    } else if (!current.includes(stamp)) {
      updated.observacionesSugeridas = `${current}, ${stamp}`;
    }

    onDataChange(updated);
    onTriggerToast(`✓ Geocodificación SDS registrada y validada.`);
  };

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return precriticaReport.items;
    return precriticaReport.items.filter(item => item.status === activeFilter);
  }, [precriticaReport, activeFilter]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Banner: Status & Quick Actions */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-slate-800">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-lg shrink-0 bg-slate-100 text-slate-700">
            {precriticaReport.overallStatus === 'pass' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {precriticaReport.overallStatus === 'warn' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
            {precriticaReport.overallStatus === 'fail' && <XCircle className="w-5 h-5 text-rose-600" />}
          </div>

          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-900">
                Dictamen de Precrítica Epidemiológica
              </span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                precriticaReport.overallStatus === 'pass'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : precriticaReport.overallStatus === 'warn'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {precriticaReport.overallStatus === 'pass' ? 'Conforme / Cumple' :
                 precriticaReport.overallStatus === 'warn' ? 'Advertencias menores' :
                 'Requiere revisión'}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {precriticaReport.summaryText}
            </p>
            <p className="text-[11px] text-slate-400">
              Calidad SIVIGILA: <strong className="text-slate-700 font-mono">{precriticaReport.scorePercent}%</strong> ({precriticaReport.passedCount} conformes, {precriticaReport.warnCount} alertas, {precriticaReport.failCount} fallos).
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto shrink-0">
          <button
            type="button"
            id="btn-apply-suggested-obs"
            onClick={() => handleApplySuggestedObs()}
            className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="Aplica la observación recomendada a Columna T"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Aplicar Dictamen</span>
          </button>

          <button
            type="button"
            onClick={handleMarkClean}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="Marcar como CUMPLE"
          >
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Marcar Cumple</span>
          </button>

          {onSwitchToDatabaseView && (
            <button
              type="button"
              onClick={onSwitchToDatabaseView}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="Ir a la base de Excel"
            >
              <span>Ver Base</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Geocoder Clean Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-800 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-slate-600" />
            <span className="font-semibold text-xs text-slate-900">
              Geocodificador SDS Bogotá (Salud Capital SIG)
            </span>
          </div>

          <button
            type="button"
            id="btn-open-geocoder"
            onClick={() => handleCopyAndOpen('GEOCODIFICADOR')}
            className="inline-flex items-center justify-center space-x-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
          >
            {copiedKey === 'GEOCODIFICADOR' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ExternalLink className="w-3.5 h-3.5 text-slate-500" />}
            <span>Abrir Geocodificador</span>
          </button>
        </div>

        {/* Address Data in Current Patient */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 block font-medium">Dirección en Ficha:</span>
            <span className="font-mono font-medium text-slate-800">{rawAddress || 'No reportada'}</span>
            {normalizedAddress && normalizedAddress !== rawAddress && (
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Estandarizada: {normalizedAddress}
              </span>
            )}
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 block font-medium">Barrio / Localidad:</span>
            <span className="font-medium text-slate-800">
              {formData.barrioResidencia || 'Sin Barrio'} · Estrato {formData.estrato || 'Sin definir'}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {formData.localidadResidencia || '19 - Ciudad Bolívar'}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => handleStampGeocodedOk()}
              className="flex-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[11px] font-medium transition-colors cursor-pointer text-center"
            >
              ✓ Georreferencia Válida
            </button>
            <button
              type="button"
              onClick={() => handleApplySuggestedObs('ERROR EN ESTRUCTURA DE DIRECCION')}
              className="px-2 py-1 bg-white hover:bg-slate-100 text-rose-700 border border-slate-200 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
              title="Marcar error en estructura de dirección"
            >
              Error Dir
            </button>
          </div>
        </div>
      </div>

      {/* Interactive 6-Point Epidemiological Checklist */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div>
            <h4 className="font-semibold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              Auditoría Detallada de Precrítica (Reglas SISVESO)
            </h4>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                activeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Todos ({precriticaReport.totalChecks})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('fail')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                activeFilter === 'fail' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-500 hover:text-rose-700'
              }`}
            >
              Fallos ({precriticaReport.failCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('warn')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                activeFilter === 'warn' ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-500 hover:text-amber-800'
              }`}
            >
              Alertas ({precriticaReport.warnCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('pass')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                activeFilter === 'pass' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              Conformes ({precriticaReport.passedCount})
            </button>
          </div>
        </div>

        {/* Checklist Items */}
        <div className="space-y-1.5">
          {filteredItems.length === 0 ? (
            <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
              <p className="text-xs font-medium text-slate-700">Sin observaciones en este filtro.</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-start space-x-2.5">
                  <div className="mt-0.5 shrink-0">
                    {item.status === 'pass' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    {item.status === 'warn' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                    {item.status === 'fail' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-800">{item.label}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                        item.status === 'pass' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        item.status === 'warn' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {item.status === 'pass' ? 'Conforme' : item.status === 'warn' ? 'Alerta' : 'Inconsistencia'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>

                {item.suggestedCorrection && (
                  <button
                    type="button"
                    onClick={() => handleApplySuggestedObs(item.suggestedCorrection)}
                    className="self-end sm:self-auto shrink-0 px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    <span>Fijar: "{item.suggestedCorrection}"</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Observation Columna T Preview & Live Editor */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-slate-800">
        <label className="text-xs font-semibold text-slate-700 block">
          Texto para Columna T de Excel (OBSERVACIONES):
        </label>

        <div className="flex items-center space-x-1.5">
          <input
            type="text"
            value={formData.observacionesSugeridas || 'SIN OBSERVACIONES / CUMPLE'}
            onChange={(e) => {
              onDataChange({
                ...formData,
                observacionesSugeridas: e.target.value.toUpperCase()
              });
            }}
            placeholder="Observación de auditoría..."
            className="flex-1 px-2.5 py-1.5 text-xs font-mono font-medium text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none uppercase"
          />
          <button
            type="button"
            onClick={async () => {
              const text = formData.observacionesSugeridas || 'SIN OBSERVACIONES / CUMPLE';
              await copyToClipboard(text);
              onTriggerToast(`Observación copiada.`);
            }}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer shrink-0"
            title="Copiar texto de observación"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Tag Pills for Auditor */}
        <div className="flex flex-wrap gap-1 pt-1">
          {[
            'SIN OBSERVACIONES / CUMPLE',
            'ERROR EN TIPO DE DOCUMENTO',
            'ERROR EN NUMERO DE IDENTIFICACION',
            'ERROR EN NOMBRE DEL PACIENTE',
            'ERROR EN ESTRUCTURA DE DIRECCION',
            'ERROR EN BARRIO',
            'NOT INGRESO, RESIDE EN SOACHA',
            'GEOCODIFICADO SDS: DIRECCION Y BARRIO VALIDADOS',
            'VALIDADO ADRES: CAPITAL SALUD EPS-S - CUMPLE',
            'VALIDADO COMPROBADOR DERECHOS SDS: ACTIVO',
          ].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleApplySuggestedObs(tag)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-colors cursor-pointer ${
                formData.observacionesSugeridas === tag
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
  );
};
