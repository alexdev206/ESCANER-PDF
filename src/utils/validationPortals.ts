import * as XLSX from 'xlsx';
import { ExcelBaseRow } from '../types';

export interface BduaRecord {
  documento: string;
  tipoDocumento?: string;
  nombreCompleto?: string;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  eps?: string;
  regimen?: string;
  estado?: string;
  departamento?: string;
  municipio?: string;
  localidad?: string;
  barrio?: string;
  upz?: string;
  direccion?: string;
  direccionAdicional?: string;
  fechaNacimiento?: string;
  sexo?: string;
  genero?: string;
  telefono1?: string;
  telefono2?: string;
  tablaOrigen?: string;
  tipoAfiliado?: string;
  docMadre?: string;
  nombreMadre?: string;
  fuente?: 'ADRES' | 'COMPROBADOR' | 'PAI' | 'PAI_ADULTOS' | 'PAI_MENORES' | 'SISVAN' | 'OTRO';
}

export interface CrossValidationResult {
  totalAnalyzed: number;
  matchedCount: number;
  unmatchedCount: number;
  mismatchedEpsCount: number;
  matches: Array<{
    documento: string;
    patientNameFicha: string;
    patientNameBdua?: string;
    epsFicha: string;
    epsBdua?: string;
    regimenBdua?: string;
    estadoBdua?: string;
    isEpsMatch: boolean;
    isNameMatch: boolean;
    bduaRecord?: BduaRecord;
  }>;
}

export const OFFICIAL_PORTALS = {
  ADRES: {
    name: 'ADRES · BDUA',
    description: 'Consulta oficial de EPS, Régimen y estado de afiliación en la Base de Datos Única de Afiliados.',
    url: 'https://www.adres.gov.co/consulte-su-eps',
    urlDirect: 'https://aplicaciones.adres.gov.co/bdua_internet/buscar.aspx',
    badge: 'Minsalud / ADRES',
    color: 'emerald',
    iconText: '🏛️',
  },
  COMPROBADOR: {
    name: 'Comprobador de Derechos SDS',
    description: 'Verificación de derechos en salud, subred distrital y cobertura en Bogotá D.C. (Contributivo / BUDA).',
    url: 'https://appb.saludcapital.gov.co/comprobadordederechos/Consulta.aspx',
    urlDirect: 'https://appb.saludcapital.gov.co/comprobadordederechos/Consulta.aspx',
    badge: 'Salud Capital / Bogotá',
    color: 'blue',
    iconText: '🏥',
  },
  PAI_ADULTOS: {
    name: 'PAI Vacunación Adultos (pág. 3)',
    description: 'Consulta nominal de esquema de vacunación y datos básicos para mayores de edad en Salud Capital.',
    url: 'https://appb.saludcapital.gov.co/pai/vacunacion/datosBasicos.aspx?pag=3',
    urlDirect: 'https://appb.saludcapital.gov.co/pai/vacunacion/datosBasicos.aspx?pag=3',
    badge: 'SDS / PAI Adultos',
    color: 'violet',
    iconText: '💉',
  },
  PAI_MENORES: {
    name: 'PAI Vacunación Menores (pág. 2)',
    description: 'Consulta nominal de vacunación, datos de la madre y georreferenciación de menores en Salud Capital.',
    url: 'https://appb.saludcapital.gov.co/pai/vacunacion/datosBasicos.aspx?pag=2',
    urlDirect: 'https://appb.saludcapital.gov.co/pai/vacunacion/datosBasicos.aspx?pag=2',
    badge: 'SDS / PAI Menores',
    color: 'pink',
    iconText: '👶',
  },
  PAIWEB: {
    name: 'PAIWEB · Sispro',
    description: 'Consulta nominal nacional en el Programa Ampliado de Inmunizaciones del Ministerio de Salud.',
    url: 'https://paiweb.sispro.gov.co/',
    urlDirect: 'https://paiweb.minsalud.gov.co/',
    badge: 'Minsalud / PAI',
    color: 'indigo',
    iconText: '💉',
  },
  GEOCODIFICADOR: {
    name: 'Geocodificador SDS Bogotá',
    description: 'Georreferenciación oficial de direcciones, barrio, estrato y localidad (Salud Capital SIG).',
    url: 'https://sig.saludcapital.gov.co/geocodificardireccion/geocodificar/geocodificar.aspx',
    urlDirect: 'https://sig.saludcapital.gov.co/geocodificardireccion/geocodificar/geocodificar.aspx',
    badge: 'SDS / SIG Bogotá',
    color: 'amber',
    iconText: '🗺️',
  },
};

export const COMMON_COLOMBIAN_EPS = [
  'CAPITAL SALUD EPS-S',
  'NUEVA EPS',
  'SANITAS EPS',
  'COMPENSAR EPS',
  'FAMISANAR EPS',
  'SALUD TOTAL EPS',
  'EPS SURA',
  'ALIAN SALUD EPS',
  'COOSALUD EPS',
  'MUTUAL SER EPS',
  'ASMET SALUD EPS',
  'EMSSANAR EPS',
  'SAVIA SALUD EPS',
  'DIRECCION GENERAL DE SANIDAD MILITAR',
  'DIRECCION DE SANIDAD POLICIA NACIONAL',
  'FOMAG (FONDO DEL MAGISTERIO)',
  'ECOPETROL',
  'PARTICULAR / SIN AFILIACION',
];

/**
 * Copies clean text to the clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard API failed, using fallback execCommand', err);
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('All clipboard methods failed', err);
    return false;
  }
}

/**
 * Opens the official portal in a new tab safely
 */
export function openOfficialPortal(portalKey: keyof typeof OFFICIAL_PORTALS, docNumber?: string) {
  const portal = OFFICIAL_PORTALS[portalKey];
  if (!portal) return;

  // Most official Colombian portals prevent direct iframe embedding due to CORS/CSP & reCAPTCHA,
  // so opening in a new tab with the pre-copied document is the standard reliable workflow.
  window.open(portal.url, '_blank', 'noopener,noreferrer');
}

/**
 * Cleans extracted values from flat files, filtering out placeholder error strings
 */
function cleanVal(v: any): string {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  const up = s.toUpperCase();
  if (
    !s ||
    up === 'NO ENCONTRADO' ||
    up === 'ERROR' ||
    up === 'SELECCIONE...' ||
    up === 'SIN DATO' ||
    up === 'NO SABE' ||
    up === 'NO DISPONIBLE' ||
    up === 'NO AUTORIZADO'
  ) {
    return '';
  }
  return s;
}

/**
 * Parses an uploaded BDUA, Comprobador, PAI (Menores/Adultos) or SISVAN flat file
 * Supports .xlsx, .xls and .csv with either comma, semicolon or tab delimiters.
 */
export async function parseBduaCrossFile(file: File): Promise<Map<string, BduaRecord>> {
  const buffer = await file.arrayBuffer();
  let jsonData: any[][] = [];

  // 1. Attempt reading with XLSX
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (firstSheetName) {
      const sheet = workbook.Sheets[firstSheetName];
      jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    }
  } catch (e) {
    console.warn('XLSX parser fallback required', e);
  }

  // 2. If XLSX yielded a single column containing delimiters (typical for semicolon CSVs) or failed:
  const isSingleColWithDelim = jsonData.length > 0 && jsonData[0]?.length === 1 && String(jsonData[0][0] || '').includes(';');
  if (!jsonData || jsonData.length < 2 || isSingleColWithDelim) {
    const text = new TextDecoder('utf-8').decode(buffer);
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length >= 2) {
      const firstLine = lines[0];
      const delim = firstLine.includes(';') ? ';' : (firstLine.includes('\t') ? '\t' : ',');
      jsonData = lines.map(l => l.split(delim).map(cell => cell.replace(/^["']|["']$/g, '').trim()));
    }
  }

  if (!jsonData || jsonData.length < 2) {
    throw new Error('El archivo no contiene suficientes filas de datos.');
  }

  // 3. Find header row
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    const row = jsonData[i] || [];
    const rowStr = row.map((c: any) => String(c || '').toUpperCase()).join(' ');
    if (
      rowStr.includes('CODIGO') ||
      rowStr.includes('DOCUMENTO') || 
      rowStr.includes('IDENTIFICACION') || 
      rowStr.includes('CEDULA') || 
      rowStr.includes('EPS') ||
      rowStr.includes('EAPB') ||
      rowStr.includes('AFILIADO') ||
      rowStr.includes('NOMBRE1')
    ) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = (jsonData[headerRowIndex] || []).map((h: any) => String(h || '').trim().toUpperCase());

  // Detect file source archetype
  let sourceOrigin: BduaRecord['fuente'] = 'ADRES';
  if (headers.some(h => h === 'EAPB' || h === 'NOMBRE1' || h === 'DIRECCIONADICIONAL')) {
    sourceOrigin = headers.some(h => h.includes('MADRE')) ? 'PAI_MENORES' : 'PAI';
  } else if (headers.some(h => h === 'TABLA_ORIGEN' || h === 'GRDCONTRIBUTIVO' || h === 'GRDBUDA')) {
    sourceOrigin = 'COMPROBADOR';
  } else if (headers.some(h => h === 'CODIGO' && headers.some(h2 => h2.includes('NOMBRE') || h2.includes('DIRECCION')))) {
    sourceOrigin = 'SISVAN';
  }
  
  // Identify column indexes
  let docCol = -1;
  let tipoDocCol = -1;
  let nombreCol = -1;
  let pNomCol = -1;
  let sNomCol = -1;
  let pApeCol = -1;
  let sApeCol = -1;
  let epsCol = -1;
  let regimenCol = -1;
  let estadoCol = -1;
  let deptoCol = -1;
  let mpioCol = -1;
  let dirCol = -1;
  let barrioCol = -1;
  let localidadCol = -1;
  let upzCol = -1;
  let dirAdicCol = -1;
  let fechaNacCol = -1;
  let sexoCol = -1;
  let generoCol = -1;
  let tel1Col = -1;
  let tel2Col = -1;
  let tablaOrigenCol = -1;
  let tipoAfiliadoCol = -1;

  headers.forEach((h, idx) => {
    // Document column priority: CODIGO (from SISVAN script), ID, DOCUMENTO, NUMERO
    if (docCol === -1 && !h.includes('CONSECUTIVO') && (h === 'CODIGO' || h === 'ID' || h.includes('DOCUMENTO') || h.includes('IDENTIFICACION') || h.includes('CEDULA') || h === 'DOC')) {
      docCol = idx;
    } else if (tipoDocCol === -1 && (h === 'TD' || (h.includes('TIPO') && (h.includes('DOC') || h.includes('ID'))))) {
      tipoDocCol = idx;
    } else if (pNomCol === -1 && (h === 'NOMBRE1' || h.includes('PRIMER NOMBRE') || h === 'NOMBRE 1' || h === '1ER NOMBRE')) {
      pNomCol = idx;
    } else if (sNomCol === -1 && (h === 'NOMBRE2' || h.includes('SEGUNDO NOMBRE') || h === 'NOMBRE 2' || h === '2DO NOMBRE')) {
      sNomCol = idx;
    } else if (pApeCol === -1 && (h === 'APELLIDO1' || h.includes('PRIMER APELLIDO') || h === 'APELLIDO 1' || h === '1ER APELLIDO')) {
      pApeCol = idx;
    } else if (sApeCol === -1 && (h === 'APELLIDO2' || h.includes('SEGUNDO APELLIDO') || h === 'APELLIDO 2' || h === '2DO APELLIDO')) {
      sApeCol = idx;
    } else if (nombreCol === -1 && (h.includes('NOMBRE COMPLETO') || h.includes('AFILIADO') || h === 'NOMBRE' || h.includes('PACIENTE'))) {
      nombreCol = idx;
    } else if (epsCol === -1 && (h === 'EAPB' || h === 'ENTIDAD' || h.includes('EPS') || h.includes('ASEGURADORA') || h.includes('ADMINISTRADORA'))) {
      epsCol = idx;
    } else if (regimenCol === -1 && (h === 'REGIMEN' || h.includes('REGIMEN'))) {
      regimenCol = idx;
    } else if (estadoCol === -1 && (h === 'ESTADO' || h.includes('CONDICION'))) {
      estadoCol = idx;
    } else if (dirCol === -1 && (h === 'DIRECCION' || h.includes('DIREC'))) {
      dirCol = idx;
    } else if (barrioCol === -1 && (h === 'BARRIO' || h.includes('BARRIO'))) {
      barrioCol = idx;
    } else if (localidadCol === -1 && (h === 'LOCALIDAD' || h.includes('LOCALIDAD'))) {
      localidadCol = idx;
    } else if (upzCol === -1 && (h === 'UPZ' || h.includes('UPZ'))) {
      upzCol = idx;
    } else if (dirAdicCol === -1 && (h.includes('ADICIONAL') || h === 'DIRECCIONADICIONAL')) {
      dirAdicCol = idx;
    } else if (fechaNacCol === -1 && (h.includes('NACIMIENTO') || h === 'FECHA_DE_NACIMIENTO' || h === 'FECHANACIMIENTO')) {
      fechaNacCol = idx;
    } else if (sexoCol === -1 && (h === 'SEXO' || h.includes('SEXO'))) {
      sexoCol = idx;
    } else if (generoCol === -1 && (h === 'GENERO' || h.includes('LGBTI'))) {
      generoCol = idx;
    } else if (tel1Col === -1 && (h === 'TELEFONO1' || h.includes('TEL1') || h === 'TELEFONO 1' || h === 'TEL')) {
      tel1Col = idx;
    } else if (tel2Col === -1 && (h === 'TELEFONO2' || h.includes('TEL2') || h === 'TELEFONO 2')) {
      tel2Col = idx;
    } else if (tablaOrigenCol === -1 && (h.includes('ORIGEN') || h.includes('TABLA'))) {
      tablaOrigenCol = idx;
    } else if (tipoAfiliadoCol === -1 && (h.includes('TIPO_AFILIADO') || h.includes('TIPO AFILIADO'))) {
      tipoAfiliadoCol = idx;
    } else if (deptoCol === -1 && (h.includes('DEPTO') || h.includes('DEPARTAMENTO'))) {
      deptoCol = idx;
    } else if (mpioCol === -1 && (h.includes('MPIO') || h.includes('MUNICIPIO') || h.includes('CIUDAD'))) {
      mpioCol = idx;
    }
  });

  // Secondary fallback: inspect second column if docCol still -1
  if (docCol === -1 && headers.length >= 2) {
    docCol = 1; // In 'consecutivo,codigo' script output, index 1 is the document!
  }

  if (docCol === -1) {
    // If not detected by name, search for first numeric column with 5+ digits
    for (let colIdx = 0; colIdx < (headers.length || 5); colIdx++) {
      let numericSampleCount = 0;
      for (let r = headerRowIndex + 1; r < Math.min(headerRowIndex + 10, jsonData.length); r++) {
        const val = String(jsonData[r]?.[colIdx] || '').replace(/\D/g, '');
        if (val.length >= 5) numericSampleCount++;
      }
      if (numericSampleCount >= 2) {
        docCol = colIdx;
        break;
      }
    }
  }

  if (docCol === -1) {
    throw new Error('No se pudo identificar la columna de N° Documento / Código en el archivo.');
  }

  const recordsMap = new Map<string, BduaRecord>();

  for (let r = headerRowIndex + 1; r < jsonData.length; r++) {
    const row = jsonData[r] || [];
    const rawDoc = cleanVal(row[docCol]).replace(/[.,\s-]/g, '');
    if (!rawDoc || rawDoc.length < 4) continue;

    const pNom = pNomCol !== -1 ? cleanVal(row[pNomCol]).toUpperCase() : '';
    const sNom = sNomCol !== -1 ? cleanVal(row[sNomCol]).toUpperCase() : '';
    const pApe = pApeCol !== -1 ? cleanVal(row[pApeCol]).toUpperCase() : '';
    const sApe = sApeCol !== -1 ? cleanVal(row[sApeCol]).toUpperCase() : '';

    let fullName = nombreCol !== -1 ? cleanVal(row[nombreCol]).toUpperCase() : '';
    if (!fullName && (pNom || pApe)) {
      fullName = [pNom, sNom, pApe, sApe].filter(Boolean).join(' ');
    }

    const eps = epsCol !== -1 ? cleanVal(row[epsCol]).toUpperCase() : '';
    const regimen = regimenCol !== -1 ? cleanVal(row[regimenCol]).toUpperCase() : '';
    const estado = estadoCol !== -1 ? cleanVal(row[estadoCol]).toUpperCase() : 'ACTIVO';
    const tipoDoc = tipoDocCol !== -1 ? cleanVal(row[tipoDocCol]) : '';
    const direccion = dirCol !== -1 ? cleanVal(row[dirCol]) : '';
    const barrio = barrioCol !== -1 ? cleanVal(row[barrioCol]) : '';
    const localidad = localidadCol !== -1 ? cleanVal(row[localidadCol]) : '';
    const upz = upzCol !== -1 ? cleanVal(row[upzCol]) : '';
    const dirAdicional = dirAdicCol !== -1 ? cleanVal(row[dirAdicCol]) : '';
    const fechaNac = fechaNacCol !== -1 ? cleanVal(row[fechaNacCol]) : '';
    const sexo = sexoCol !== -1 ? cleanVal(row[sexoCol]) : '';
    const genero = generoCol !== -1 ? cleanVal(row[generoCol]) : '';
    const tel1 = tel1Col !== -1 ? cleanVal(row[tel1Col]) : '';
    const tel2 = tel2Col !== -1 ? cleanVal(row[tel2Col]) : '';
    const tablaOrigen = tablaOrigenCol !== -1 ? cleanVal(row[tablaOrigenCol]) : '';
    const tipoAfiliado = tipoAfiliadoCol !== -1 ? cleanVal(row[tipoAfiliadoCol]) : '';
    const depto = deptoCol !== -1 ? cleanVal(row[deptoCol]) : '';
    const mpio = mpioCol !== -1 ? cleanVal(row[mpioCol]) : '';

    // If already exists from another sheet/file, merge so no field is overwritten with blanks
    const existing = recordsMap.get(rawDoc);

    const mergedRecord: BduaRecord = {
      documento: rawDoc,
      tipoDocumento: tipoDoc || existing?.tipoDocumento,
      nombreCompleto: fullName || existing?.nombreCompleto,
      primerNombre: pNom || existing?.primerNombre,
      segundoNombre: sNom || existing?.segundoNombre,
      primerApellido: pApe || existing?.primerApellido,
      segundoApellido: sApe || existing?.segundoApellido,
      eps: eps || existing?.eps,
      regimen: regimen || existing?.regimen,
      estado: estado || existing?.estado || 'ACTIVO',
      direccion: direccion || existing?.direccion,
      barrio: barrio || existing?.barrio,
      localidad: localidad || existing?.localidad,
      upz: upz || existing?.upz,
      direccionAdicional: dirAdicional || existing?.direccionAdicional,
      fechaNacimiento: fechaNac || existing?.fechaNacimiento,
      sexo: sexo || existing?.sexo,
      genero: genero || existing?.genero,
      telefono1: tel1 || existing?.telefono1,
      telefono2: tel2 || existing?.telefono2,
      tablaOrigen: tablaOrigen || existing?.tablaOrigen,
      tipoAfiliado: tipoAfiliado || existing?.tipoAfiliado,
      departamento: depto || existing?.departamento,
      municipio: mpio || existing?.municipio,
      fuente: sourceOrigin,
    };

    recordsMap.set(rawDoc, mergedRecord);
  }

  return recordsMap;
}

/**
 * Generates the exact CSV text needed by the SISVAN PAI / Comprobador Robot ('codigos.csv')
 * Format:
 * consecutivo,codigo
 * 1,1120026916
 * 2,1067942484
 */
export function generateCodigosCsv(rows: ExcelBaseRow[]): string {
  const lines = ['consecutivo,codigo'];
  let count = 1;
  const seenDocs = new Set<string>();

  rows.forEach((r) => {
    const rawDoc = String(r.documento || '').trim().replace(/[.,\s-]/g, '');
    if (rawDoc && rawDoc.length >= 4 && !seenDocs.has(rawDoc)) {
      seenDocs.add(rawDoc);
      lines.push(`${count},${rawDoc}`);
      count++;
    }
  });

  return lines.join('\n');
}

/**
 * Direct browser download for the 'codigos.csv' file to feed the SISVAN Robot
 */
export function downloadCodigosCsv(rows: ExcelBaseRow[], filename = 'codigos.csv'): number {
  const csvContent = generateCodigosCsv(rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Return count of documents included
  return Math.max(0, csvContent.split('\n').length - 1);
}

export interface EnrichDatabaseResult {
  updatedRows: ExcelBaseRow[];
  stats: {
    totalRows: number;
    matchedCount: number;
    namesUpdatedCount: number;
    datesUpdatedCount: number;
    observationsUpdatedCount: number;
  };
}

/**
 * Mass enriches and validates the institutional Excel database using results from PAI / Comprobador
 */
export function enrichDatabaseWithRobotResults(
  rows: ExcelBaseRow[],
  recordsMap: Map<string, BduaRecord>
): EnrichDatabaseResult {
  let matchedCount = 0;
  let namesUpdatedCount = 0;
  let datesUpdatedCount = 0;
  let observationsUpdatedCount = 0;

  const updatedRows = rows.map((row) => {
    const doc = String(row.documento || '').trim().replace(/[.,\s-]/g, '');
    if (!doc || !recordsMap.has(doc)) return row;

    const record = recordsMap.get(doc)!;
    matchedCount++;
    const updated = { ...row };

    // 1. Synchronize patient official names if available
    let nameChanged = false;
    if (record.primerNombre && record.primerNombre !== row.primerNombre) {
      updated.primerNombre = record.primerNombre;
      nameChanged = true;
    }
    if (record.segundoNombre && record.segundoNombre !== row.segundoNombre) {
      updated.segundoNombre = record.segundoNombre;
      nameChanged = true;
    }
    if (record.primerApellido && record.primerApellido !== row.primerApellido) {
      updated.primerApellido = record.primerApellido;
      nameChanged = true;
    }
    if (record.segundoApellido && record.segundoApellido !== row.segundoApellido) {
      updated.segundoApellido = record.segundoApellido;
      nameChanged = true;
    }
    if (nameChanged) namesUpdatedCount++;

    // 2. Synchronize birthdate if missing
    if (record.fechaNacimiento && !row.fechaNacimiento) {
      updated.fechaNacimiento = record.fechaNacimiento;
      datesUpdatedCount++;
    }

    // 3. Stamp official verification note into Columna T (OBSERVACIONES)
    let stamp = '';
    if (record.fuente === 'PAI' || record.fuente === 'PAI_ADULTOS' || record.fuente === 'PAI_MENORES') {
      stamp = 'VALIDADO PAI: DATOS OFICIALES CONFIRMADOS';
    } else if (record.fuente === 'COMPROBADOR') {
      stamp = `VALIDADO COMPROBADOR: ${record.eps || 'EPS'} ${record.regimen || ''}`.trim();
    } else {
      stamp = `VALIDADO ADRES: ${record.eps || 'EPS'} ${record.regimen || ''}`.trim();
    }

    const currentObs = (updated.observaciones || '').trim();
    if (!currentObs || currentObs.includes('SIN OBSERVACIONES') || currentObs === 'CUMPLE') {
      updated.observaciones = stamp;
      observationsUpdatedCount++;
    } else if (!currentObs.includes(stamp)) {
      updated.observaciones = `${currentObs}, ${stamp}`;
      observationsUpdatedCount++;
    }

    return updated;
  });

  return {
    updatedRows,
    stats: {
      totalRows: rows.length,
      matchedCount,
      namesUpdatedCount,
      datesUpdatedCount,
      observationsUpdatedCount,
    },
  };
}

export const LOCALIDADES_BOGOTA = [
  '19 - CIUDAD BOLIVAR',
  '05 - USME',
  '06 - TUNJUELITO',
  '20 - SUMAPAZ',
  '07 - BOSA',
  '08 - KENNEDY',
  '04 - SAN CRISTOBAL',
  '03 - SANTA FE',
  '14 - LOS MARTIRES',
  '15 - ANTONIO NARIÑO',
  '16 - PUENTE ARANDA',
  '18 - RAFAEL URIBE URIBE',
  '01 - USAQUEN',
  '02 - CHAPINERO',
  '09 - FONTIBON',
  '10 - ENGATIVA',
  '11 - SUBA',
  '12 - BARRIOS UNIDOS',
  '13 - TEUSAQUILLO',
  '17 - LA CANDELARIA',
  'FUERA DE BOGOTA (SOACHA / OTRO)',
];

export interface PrecriticaCheckItem {
  category: 'identificacion' | 'georreferenciacion' | 'aseguramiento' | 'fechas' | 'tinta_roja';
  label: string;
  status: 'pass' | 'warn' | 'fail';
  description: string;
  fieldAffected?: string;
  suggestedCorrection?: string;
}

export interface PrecriticaReport {
  overallStatus: 'pass' | 'warn' | 'fail'; // 🟢 Conforme, 🟡 Con Observaciones, 🔴 Requiere Corrección
  scorePercent: number; // 0-100%
  totalChecks: number;
  passedCount: number;
  warnCount: number;
  failCount: number;
  items: PrecriticaCheckItem[];
  suggestedObservacionColT: string;
  summaryText: string;
}

/**
 * Normalizes an address string for the SDS Geocoder
 */
export function normalizeAddressForGeocoder(rawAddress: string): string {
  if (!rawAddress) return '';
  return rawAddress
    .toUpperCase()
    .replace(/\bCRA\b|\bCR\b|\bKRA\b|\bCARRERA\b/g, 'KR')
    .replace(/\bCALLE\b|\bCLL\b/g, 'CL')
    .replace(/\bDIAGONAL\b|\bDIAG\b/g, 'DG')
    .replace(/\bTRANSVERSAL\b|\bTRANSV\b|\bTR\b/g, 'TV')
    .replace(/\bAVENIDA\b|\bAV\b/g, 'AV')
    .replace(/\bAUTOPISTA\b|\bAUTOP\b/g, 'AUTOP')
    .replace(/[#º°]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intelligent Epidemiological Precrítica Engine for SIVIGILA / SISVESO Cara A
 */
export function evaluateEpidemiologicalPrecritica(data: any): PrecriticaReport {
  const items: PrecriticaCheckItem[] = [];
  const observacionesTags: string[] = [];

  const rawDoc = (data.numeroIdentificacion || '').trim();
  const tipoDoc = String(data.tipoIdCodigo || '').trim();
  const rawAge = parseInt(String(data.edad || '0').replace(/\D/g, ''), 10);
  const rawNombre = (data.nombreCompleto || '').trim();
  const primerNom = (data.primerNombre || '').trim();
  const primerApe = (data.primerApellido || '').trim();
  const rawDireccion = (data.direccionResidencia || '').trim();
  const rawBarrio = (data.barrioResidencia || '').trim();
  const rawLocalidad = (data.localidadResidencia || '').trim();
  const rawEstrato = (data.estrato || '').trim();
  const rawEps = (data.entidadAdministradora || '').trim();
  const rawOcupacion = (data.codigoOcupacion || '').trim();
  const redInks = data.correccionesEnRojo || [];
  const fechaConsulta = (data.fechaConsulta || '').trim();
  const fechaNacimiento = (data.fechaNacimiento || '').trim();

  // 1. Identificación
  if (!rawDoc || rawDoc.length < 5) {
    items.push({
      category: 'identificacion',
      label: 'Número de Identificación',
      status: 'fail',
      description: 'El número de documento está vacío o incompleto.',
      fieldAffected: 'numeroIdentificacion',
      suggestedCorrection: 'ERROR EN NUMERO DE IDENTIFICACION'
    });
    observacionesTags.push('ERROR EN NUMERO DE IDENTIFICACION');
  } else {
    // Age vs Document Type rules
    if (rawAge >= 18 && tipoDoc === '3') {
      items.push({
        category: 'identificacion',
        label: 'Tipo de Documento vs Edad',
        status: 'fail',
        description: `Paciente mayor de edad (${rawAge} años) reportado con Tarjeta de Identidad (TI). Debe ser Cédula (CC).`,
        fieldAffected: 'tipoIdCodigo',
        suggestedCorrection: 'Cambiar Tipo Doc a 4 (CC)'
      });
      observacionesTags.push('ERROR EN TIPO DE DOCUMENTO');
    } else if (rawAge < 7 && tipoDoc === '4') {
      items.push({
        category: 'identificacion',
        label: 'Tipo de Documento vs Edad',
        status: 'fail',
        description: `Menor de 7 años (${rawAge} años) reportado con CC. Debe ser Registro Civil (RC) o CNV.`,
        fieldAffected: 'tipoIdCodigo',
        suggestedCorrection: 'Cambiar Tipo Doc a 2 (RC)'
      });
      observacionesTags.push('ERROR EN TIPO DE DOCUMENTO');
    } else {
      items.push({
        category: 'identificacion',
        label: 'Coherencia Tipo Doc y Edad',
        status: 'pass',
        description: `Tipo de documento (${tipoDoc || 'CC'}) coherente con la edad (${rawAge} años).`
      });
    }
  }

  // 2. Nombres del Paciente
  if (!primerNom || !primerApe) {
    items.push({
      category: 'identificacion',
      label: 'Nombres y Apellidos Obligatorios',
      status: 'fail',
      description: 'Falta el Primer Nombre o Primer Apellido del paciente.',
      fieldAffected: 'nombreCompleto',
      suggestedCorrection: 'ERROR EN NOMBRE DEL PACIENTE'
    });
    observacionesTags.push('ERROR EN NOMBRE DEL PACIENTE');
  } else {
    items.push({
      category: 'identificacion',
      label: 'Estructura Nominal',
      status: 'pass',
      description: `Estructura completa: ${primerNom} ${primerApe}.`
    });
  }

  // 3. Georreferenciación & Residencia
  const normAddress = normalizeAddressForGeocoder(rawDireccion);
  const isSoacha = rawDireccion.toUpperCase().includes('SOACHA') || rawBarrio.toUpperCase().includes('SOACHA') || rawLocalidad.toUpperCase().includes('SOACHA');

  if (isSoacha) {
    items.push({
      category: 'georreferenciacion',
      label: 'Residencia Fuera de Bogotá (Soacha)',
      status: 'warn',
      description: 'El paciente reside en Soacha. Debe notificarse como evento fuera de jurisdicción distrital.',
      fieldAffected: 'mpioResidencia',
      suggestedCorrection: 'NOT INGRESO, RESIDE EN SOACHA'
    });
    observacionesTags.push('NOT INGRESO, RESIDE EN SOACHA');
  } else if (!rawDireccion || rawDireccion.length < 5) {
    items.push({
      category: 'georreferenciacion',
      label: 'Dirección de Residencia',
      status: 'fail',
      description: 'Dirección vacía o incompleta. No es posible geocodificar en SDS.',
      fieldAffected: 'direccionResidencia',
      suggestedCorrection: 'ERROR EN ESTRUCTURA DE DIRECCION'
    });
    observacionesTags.push('ERROR EN ESTRUCTURA DE DIRECCION');
  } else if (!/\b(KR|CL|DG|TV|AV|AUTOP|KM)\b/i.test(normAddress)) {
    items.push({
      category: 'georreferenciacion',
      label: 'Nomenclatura Catastral SDS',
      status: 'warn',
      description: 'La dirección no parece contener nomenclatura vial estándar (KR, CL, DG, TV). Requiere validar en Geocodificador SDS.',
      fieldAffected: 'direccionResidencia',
      suggestedCorrection: 'Validar en Geocodificador SDS'
    });
  } else {
    items.push({
      category: 'georreferenciacion',
      label: 'Nomenclatura Dirección',
      status: 'pass',
      description: `Dirección estandarizada: ${normAddress}`
    });
  }

  // Barrio
  if (!rawBarrio) {
    items.push({
      category: 'georreferenciacion',
      label: 'Barrio de Residencia',
      status: 'fail',
      description: 'Campo Barrio vacío. Es requerido para la estratificación epidemiológica por UPZ.',
      fieldAffected: 'barrioResidencia',
      suggestedCorrection: 'ERROR EN BARRIO'
    });
    observacionesTags.push('ERROR EN BARRIO');
  } else {
    items.push({
      category: 'georreferenciacion',
      label: 'Barrio Reportado',
      status: 'pass',
      description: `Barrio: ${rawBarrio}`
    });
  }

  // Estrato
  if (!rawEstrato || isNaN(parseInt(rawEstrato, 10))) {
    items.push({
      category: 'georreferenciacion',
      label: 'Estrato Socioeconómico',
      status: 'warn',
      description: 'Estrato no especificado o no numérico. Se sugiere verificar con el Geocodificador SDS.',
      fieldAffected: 'estrato',
      suggestedCorrection: 'CORRECCION EN ROJO: ESTRATO'
    });
  }

  // 4. Aseguramiento & Ocupación
  if (!rawEps) {
    items.push({
      category: 'aseguramiento',
      label: 'Entidad Administradora (EPS)',
      status: 'warn',
      description: 'EPS no registrada en la ficha. Sugerido consultar en ADRES / BDUA.',
      fieldAffected: 'entidadAdministradora',
      suggestedCorrection: 'Consultar en ADRES'
    });
  } else {
    items.push({
      category: 'aseguramiento',
      label: 'Aseguramiento en Salud',
      status: 'pass',
      description: `EPS reportada: ${rawEps}`
    });
  }

  if (!rawOcupacion) {
    items.push({
      category: 'aseguramiento',
      label: 'Código de Ocupación',
      status: 'warn',
      description: 'Código de ocupación no especificado (usar 9991 para estudiante, 9999 no informa, etc.).',
      fieldAffected: 'codigoOcupacion',
      suggestedCorrection: 'NO CODIGO OCUPACION'
    });
    observacionesTags.push('NO CODIGO OCUPACION');
  }

  // 5. Fechas y Semanas
  if (!fechaConsulta) {
    items.push({
      category: 'fechas',
      label: 'Fecha de Consulta',
      status: 'fail',
      description: 'Falta la fecha de atención/consulta.',
      fieldAffected: 'fechaConsulta'
    });
  } else {
    items.push({
      category: 'fechas',
      label: 'Fecha de Consulta Registrada',
      status: 'pass',
      description: `Fecha: ${fechaConsulta} (Calcula Semana Epi automáticamente).`
    });
  }

  // 6. Tintas Rojas (Aclaraciones vs Correcciones)
  if (redInks.length > 0) {
    items.push({
      category: 'tinta_roja',
      label: 'Anotaciones en Tinta Roja',
      status: 'warn',
      description: `Se detectaron ${redInks.length} anotaciones en rojo: ${redInks.join(', ')}. Clasificar si son Aclaraciones Médicas o Correcciones de Auditoría.`
    });
  }

  // Calculate Metrics
  const total = items.length;
  const passed = items.filter(i => i.status === 'pass').length;
  const warns = items.filter(i => i.status === 'warn').length;
  const fails = items.filter(i => i.status === 'fail').length;

  let overallStatus: 'pass' | 'warn' | 'fail' = 'pass';
  if (fails > 0) {
    overallStatus = 'fail';
  } else if (warns > 0) {
    overallStatus = 'warn';
  }

  const scorePercent = Math.round((passed / total) * 100);

  // Generate Suggested Observation
  let finalObs = 'SIN OBSERVACIONES / CUMPLE';
  if (observacionesTags.length > 0) {
    finalObs = Array.from(new Set(observacionesTags)).join(', ');
  } else if (redInks.length > 0) {
    finalObs = 'ACLARACION EN ROJO: LETRA MEDICO';
  }

  const summaryText = overallStatus === 'pass'
    ? 'Ficha lista y conforme para ingreso a la Base de Datos Oficial (100% conforme).'
    : overallStatus === 'warn'
    ? `Precrítica con ${warns} advertencia(s) menores. Requiere verificación de geocodificación o aseguramiento.`
    : `Precrítica con ${fails} hallazgo(s) críticos que requieren corrección antes de validar.`;

  return {
    overallStatus,
    scorePercent,
    totalChecks: total,
    passedCount: passed,
    warnCount: warns,
    failCount: fails,
    items,
    suggestedObservacionColT: finalObs,
    summaryText
  };
}

