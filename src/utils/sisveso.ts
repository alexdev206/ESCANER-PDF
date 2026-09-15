import * as XLSX from 'xlsx';
import { ExcelBaseRow, SisvesoCaraAData } from '../types';

/**
 * Known UPGD Directory in Subred Integrada de Servicios de Salud Sur / Bogotá D.C.
 * Extracted from the official database
 */
export const UPGD_CATALOG: Record<string, { nombre: string; localidad: string }> = {
  '110013029414': { nombre: 'UNIDAD DE SERVICIOS DE SALUD MANUELA BELTRAN', localidad: 'CIUDAD BOLIVAR' },
  '110012123812': { nombre: 'BIENESTAR IPS SEDE EL ENSUEÑO', localidad: 'CIUDAD BOLIVAR' },
  '110013029415': { nombre: 'USS CANDELARIA I', localidad: 'CIUDAD BOLIVAR' },
  '110010952304': { nombre: 'VIRREY SOLIS IPS SA ENSUEÑO', localidad: 'CIUDAD BOLIVAR' },
  '110013029441': { nombre: 'UNIDAD DE SERVICIOS DE SALUD DANUBIO AZUL', localidad: 'USME' },
  '110013029402': { nombre: 'USS MEISSEN', localidad: 'CIUDAD BOLIVAR' },
  '110013029430': { nombre: 'USS USME', localidad: 'USME' },
  '110011115801': { nombre: 'ASISTIR SALUD SAS CANDELARIA', localidad: 'CIUDAD BOLIVAR' },
  '110013029436': { nombre: 'USS DESTINO', localidad: 'USME' },
  '110013029449': { nombre: 'USS NAZARETH', localidad: 'SUMAPAZ' },
  '110013029401': { nombre: 'USS EL TUNAL', localidad: 'TUNJUELITO' },
  '110010817108': { nombre: 'CENTRO MEDICO COLSUBSIDIO SANTA LIBRADA', localidad: 'USME' },
  '110013029428': { nombre: 'UNIDAD DE SERVICIOS DE SALUD VISTA HERMOSA', localidad: 'CIUDAD BOLIVAR' },
  '110010922107': { nombre: 'SERVIMED IPS-SA UNIDAD MEDICA SANTA LIBRADA', localidad: 'USME' },
  '110018509180': { nombre: 'DISPENSARIO MEDICO CANTON SUR', localidad: 'TUNJUELITO' },
  '110013029438': { nombre: 'UNIDAD DE SERVICIOS DE SALUD LA FLORA', localidad: 'USME' },
  '110013029434': { nombre: 'USS MARICHUELA', localidad: 'USME' },
  '110011434002': { nombre: 'UNIVERSIDAD DISTRITAL', localidad: 'CIUDAD BOLIVAR' },
  '110010733566': { nombre: 'UNIDAD DE SERVICIOS DE SALUD AUTOPISTA SUR', localidad: 'CIUDAD BOLIVAR' },
  '110010952330': { nombre: 'VIRREY SOLIS IPS SA PASEO VILLA DEL RIO', localidad: 'CIUDAD BOLIVAR' },
  '110010922109': { nombre: 'SERVIMED IPS UNIDAD MEDICA TUNAL', localidad: 'TUNJUELITO' }
};

/**
 * Standard SIVIGILA Document Types mapping
 */
export const TIPO_DOC_MAP: Record<string, { codigo: string; sigla: string; descripcion: string }> = {
  '1': { codigo: '1', sigla: 'CNV', descripcion: 'Certificado de Nacido Vivo' },
  '2': { codigo: '2', sigla: 'RC', descripcion: 'Registro Civil' },
  '3': { codigo: '3', sigla: 'TI', descripcion: 'Tarjeta de Identidad' },
  '4': { codigo: '4', sigla: 'CC', descripcion: 'Cédula de Ciudadanía' },
  '5': { codigo: '5', sigla: 'PEP', descripcion: 'Permiso Especial de Permanencia' },
  '6': { codigo: '6', sigla: 'CE', descripcion: 'Cédula de Extranjería' },
  '7': { codigo: '7', sigla: 'PA', descripcion: 'Pasaporte' },
  '8': { codigo: '8', sigla: 'MSI', descripcion: 'Menor Sin ID' },
  '9': { codigo: '9', sigla: 'ASI', descripcion: 'Adulto Sin ID' },
  '10': { codigo: '10', sigla: 'PPT', descripcion: 'Permiso por Protección Temporal' },
  '11': { codigo: '11', sigla: 'SC', descripcion: 'Salvoconducto' },
  '12': { codigo: '12', sigla: 'DE', descripcion: 'Documento Extranjero' },
  '13': { codigo: '13', sigla: 'CDO', descripcion: 'Carné Diplomático' }
};

/**
 * Predefined common observation tags used in audit and feedback
 */
export const OBSERVACIONES_FRECUENTES = [
  'ACLARACION EN ROJO: BARRIO (LETRA MEDICO)',
  'ACLARACION EN ROJO: DIRECCION',
  'ACLARACION EN ROJO: LETRA MEDICO',
  'ACLARACION EN ROJO: DOCUMENTO',
  'ACLARACION EN ROJO',
  'CORRECCION EN ROJO: BARRIO',
  'CORRECCION EN ROJO: DIRECCION',
  'CORRECCION EN ROJO: ESTRATO',
  'CORRECCION EN ROJO: DOCUMENTO',
  'CORRECCION EN ROJO: ASEGURAMIENTO',
  'CORRECCION EN ROJO',
  'ERROR EN BARRIO',
  'ERROR EN BARRIO DE RESIDENCIA',
  'ERROR EN ESTRUCTURA DE DIRECCION',
  'ERROR EN ESTRUCTURA DE DIRECCION, BARRIO',
  'NO CODIGO OCUPACION',
  'NO CODIGO OCUPACION, ERROR EN BARRIO',
  'ERROR EN ESTRATO Y BARRIO DE RESIDENCIA',
  'ERROR EN TIPO DE ASEGURAMIENTO',
  'ERROR EN NUMERO DE IDENTIFICACION',
  'ERROR EN NOMBRE DEL PACIENTE',
  'ERROR EN FECHA DE NACIMIENTO',
  'ERROR EN GRUPO POBLACIONAL',
  'ERROR EN LOCALIDAD DE RESIDENCIA',
  'NO AREA RURAL Y ERROR EN FECHA DE NACIMIENTO',
  'NOT INGRESO, RESIDE EN SOACHA',
  'PACIENTE RESIDE EN AREA RURAL VACIO',
  'SIN OBSERVACIONES / CUMPLE'
];

/**
 * Definition of the 27 official columns in the user's Excel database
 */
export const EXCEL_BASE_COLUMNS: { key: keyof ExcelBaseRow; label: string; headerColor?: 'blue' | 'yellow' }[] = [
  { key: 'c', label: 'C', headerColor: 'blue' },
  { key: 'codigoPc', label: 'CODIGO PC', headerColor: 'blue' },
  { key: 'codigoId', label: 'CODIGO ID', headerColor: 'blue' },
  { key: 'codigoUpgd', label: 'CODIGO UPGD', headerColor: 'blue' },
  { key: 'nombreUpgd', label: 'NOMBRE DE LA UPGD', headerColor: 'yellow' },
  { key: 'localidadNotificadora', label: 'LOCALIDAD DE NOTIFICADORA', headerColor: 'yellow' },
  { key: 'primerNombre', label: 'PRIMER NOMBRE', headerColor: 'blue' },
  { key: 'segundoNombre', label: 'SEGUNDONOMBRE', headerColor: 'blue' },
  { key: 'primerApellido', label: 'PRIMER APELLIDO', headerColor: 'blue' },
  { key: 'segundoApellido', label: 'SEGUNDO APELLIDO', headerColor: 'blue' },
  { key: 'documento', label: 'DOCUMENTO', headerColor: 'blue' },
  { key: 'validacion', label: 'VALIDACION', headerColor: 'yellow' },
  { key: 'tipoDocumento', label: 'TIPO DE DOCUMENTO', headerColor: 'blue' },
  { key: 'fechaNacimiento', label: 'FECHA DE NACIMIENTO', headerColor: 'blue' },
  { key: 'edad', label: 'EDAD', headerColor: 'yellow' },
  { key: 'fechaConsulta', label: 'FECHA DE CONSULTA', headerColor: 'blue' },
  { key: 'nombreOdontologo', label: 'NOMBRE DE ODONTOLOGO', headerColor: 'blue' },
  { key: 'fechaPrimeraConsulta', label: 'FECHA DE PRIMERA CONSULTA', headerColor: 'yellow' },
  { key: 'fechaRecepcion', label: 'FECHA DE RECEPCION', headerColor: 'blue' },
  { key: 'observaciones', label: 'OBSERVACIONES', headerColor: 'blue' },
  { key: 'cruceVcAñosPasados', label: 'cruce vc años pasados', headerColor: 'yellow' },
  { key: 'validarDocEnOtraBase', label: 'VALIDAR DOC EN OTRA BASE', headerColor: 'yellow' },
  { key: 'semanaEpi', label: 'Semana Epi', headerColor: 'yellow' },
  { key: 'fechaEnvioUpgd', label: 'FECHA ENVIO UPGD', headerColor: 'blue' },
  { key: 'semanaEpiEnvioUpgd', label: 'SEMANA EPIDEMIOLOGICA POR FECHA DE ENVIO DE LA UPGD', headerColor: 'blue' },
  { key: 'semanaEpiRecepcion', label: 'SEMANA EPIDEMIOLOGICA POR FECHA DE RESEPCION', headerColor: 'blue' },
  { key: 'semanaEpiConsulta', label: 'SEMANA EPIDEMIOLOGICA POR FECHA DE CONSULTA', headerColor: 'blue' },
];

/**
 * Calculates the Epidemiological Week (Semana Epidemiológica) according to SIVIGILA / INS Colombia
 * Week begins on Sunday.
 */
export function calculateSemanaEpidemiologica(dateInput?: string | Date): { weekNumber: number; label: string } | null {
  if (!dateInput) return null;
  let d: Date;

  if (typeof dateInput === 'string') {
    const clean = dateInput.trim();
    const parts = clean.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (parts) {
      const day = parseInt(parts[1], 10);
      const month = parseInt(parts[2], 10) - 1;
      let year = parseInt(parts[3], 10);
      if (year < 100) year += 2000;
      d = new Date(year, month, day);
    } else {
      d = new Date(clean);
    }
  } else {
    d = dateInput;
  }

  if (isNaN(d.getTime())) return null;

  // Epidemiological year begins around the first Sunday of January
  const year = d.getFullYear();
  // Find first day of the year
  const jan1 = new Date(year, 0, 1);
  const dayOfWeekJan1 = jan1.getDay(); // 0 = Sunday
  // SIVIGILA week 1 starts on the Sunday closest to Jan 1
  let firstSunday = new Date(jan1);
  if (dayOfWeekJan1 <= 3) {
    firstSunday.setDate(jan1.getDate() - dayOfWeekJan1);
  } else {
    firstSunday.setDate(jan1.getDate() + (7 - dayOfWeekJan1));
  }

  const diffMs = d.getTime() - firstSunday.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  let week = Math.floor(diffDays / 7) + 1;

  if (week <= 0) {
    week = 52;
  } else if (week > 53) {
    week = 1;
  }

  return {
    weekNumber: week,
    label: `SEMANA ${week}`
  };
}

/**
 * Automatic rule-based audit engine for SIVIGILA Cara A
 */
export function performCaraAAudit(caraA: SisvesoCaraAData): {
  hallazgos: string[];
  observacionSugerida: string;
} {
  const issues: string[] = [];

  // 1. Barrio check
  const barrio = (caraA.barrioResidencia || '').trim();
  if (!barrio) {
    issues.push('ERROR EN BARRIO DE RESIDENCIA');
  } else if (barrio.includes('/') || barrio.toLowerCase().includes('venecia') && barrio.toLowerCase().includes('paraiso')) {
    issues.push('ERROR EN BARRIO');
  }

  // 2. Dirección check
  const dir = (caraA.direccionResidencia || '').trim().toUpperCase();
  if (!dir) {
    issues.push('ERROR EN ESTRUCTURA DE DIRECCION');
  } else {
    const hasStdPrefix = /^(KR|CL|CR|CRA|CLL|DG|DIAG|TV|TRANS|CALLE|CARRERA|DIAGONAL|TRANSVERSAL|AV|AVENIDA)\b/.test(dir);
    if (!hasStdPrefix || dir.length < 5) {
      issues.push('ERROR EN ESTRUCTURA DE DIRECCION');
    }
  }

  // 3. Código Ocupación
  const codOcup = (caraA.codigoOcupacion || '').trim();
  const ocup = (caraA.ocupacion || '').trim();
  if (!codOcup && !ocup) {
    issues.push('NO CODIGO OCUPACION');
  } else if (!codOcup) {
    issues.push('NO CODIGO OCUPACION');
  }

  // 4. Estrato
  const estrato = (caraA.estrato || '').trim();
  if (!estrato || !/^[0-6]$/.test(estrato.replace(/^0/, ''))) {
    issues.push('ERROR EN ESTRATO');
  }

  // 5. Área rural
  const areaRural = (caraA.pacienteResideAreaRural || '').trim().toUpperCase();
  if (!areaRural) {
    issues.push('PACIENTE RESIDE EN AREA RURAL VACIO');
  }

  // 6. Grupo poblacional / Pertenencia étnica
  const grupo = (caraA.grupoPoblacional || '').trim();
  if (!grupo) {
    issues.push('ERROR EN GRUPO POBLACIONAL');
  }

  // 7. Tipo aseguramiento
  const tipoAseg = (caraA.tipoAseguramiento || '').trim();
  if (!tipoAseg) {
    issues.push('ERROR EN TIPO DE ASEGURAMIENTO');
  }

  // 8. Nombres
  if (!caraA.primerNombre || !caraA.primerApellido) {
    issues.push('ERROR EN NOMBRE DEL PACIENTE');
  }

  // 9. Documento
  const doc = (caraA.numeroIdentificacion || '').replace(/\D/g, '');
  if (!doc || doc.length < 5) {
    issues.push('ERROR EN NUMERO DE IDENTIFICACION');
  }

  // 10. Correcciones en tinta/texto rojo detectadas en la ficha
  if (caraA.correccionesEnRojo && caraA.correccionesEnRojo.length > 0) {
    caraA.correccionesEnRojo.forEach((corr) => {
      const formatted = corr.toUpperCase().includes('CORRECCION')
        ? corr
        : `CORRECCION EN ROJO: ${corr}`;
      issues.push(formatted);
    });
  }

  // Generate synthesized observation matching Excel standard
  let observacionSugerida = 'SIN OBSERVACIONES / CUMPLE';
  if (issues.length > 0) {
    // Unique list
    const unique = Array.from(new Set(issues));
    observacionSugerida = unique.join(', ');
  }

  return {
    hallazgos: issues,
    observacionSugerida
  };
}

/**
 * Converts a parsed Cara A Ficha directly into an ExcelBaseRow
 */
export function caraAToExcelRow(
  caraA: SisvesoCaraAData,
  options?: {
    customObservacion?: string;
    consecutivoId?: string;
    fechaRecepcion?: string;
  }
): ExcelBaseRow {
  // Normalize UPGD
  let codUpgd = caraA.codigoUpgd || '';
  let nombreUpgd = (caraA.nombreUpgd || '').toUpperCase();
  let localidadNotif = (caraA.localidadNotificadora || '').toUpperCase();

  // Try catalog lookup
  const cleanCodUpgd = codUpgd.replace(/\D/g, '');
  if (UPGD_CATALOG[cleanCodUpgd]) {
    nombreUpgd = UPGD_CATALOG[cleanCodUpgd].nombre;
    localidadNotif = UPGD_CATALOG[cleanCodUpgd].localidad;
    codUpgd = cleanCodUpgd;
  } else {
    // Check if any catalog entry matches by name
    for (const [code, info] of Object.entries(UPGD_CATALOG)) {
      if (nombreUpgd && (nombreUpgd.includes(info.nombre) || info.nombre.includes(nombreUpgd))) {
        codUpgd = code;
        nombreUpgd = info.nombre;
        localidadNotif = info.localidad;
        break;
      }
    }
  }

  // Epidemiological weeks
  const epiConsulta = calculateSemanaEpidemiologica(caraA.fechaConsulta);
  const fechaRec = options?.fechaRecepcion || caraA.fechaRecepcion || new Date().toLocaleDateString('es-CO');
  const epiRecepcion = calculateSemanaEpidemiologica(fechaRec);
  const epiEnvio = calculateSemanaEpidemiologica(caraA.fechaEnvioUpgd);

  // Document type code (1 to 13)
  let tipoDocCode = caraA.tipoIdCodigo || '';
  if (!tipoDocCode && caraA.tipoIdSigla) {
    for (const [code, item] of Object.entries(TIPO_DOC_MAP)) {
      if (item.sigla.toUpperCase() === caraA.tipoIdSigla.toUpperCase()) {
        tipoDocCode = code;
        break;
      }
    }
  }
  if (!tipoDocCode) {
    tipoDocCode = '4'; // default CC
  }

  const observacionFinal = options?.customObservacion || caraA.observacionesSugeridas || 'SIN OBSERVACIONES / CUMPLE';

  // Smart Name Extraction: if primerNombre or primerApellido are blank but nombreCompleto is provided, decompose it
  let primerNom = (caraA.primerNombre || '').trim().toUpperCase();
  let segundoNom = (caraA.segundoNombre || '').trim().toUpperCase();
  let primerApe = (caraA.primerApellido || '').trim().toUpperCase();
  let segundoApe = (caraA.segundoApellido || '').trim().toUpperCase();

  if (!primerNom && !primerApe && caraA.nombreCompleto) {
    const parts = caraA.nombreCompleto.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 4) {
      primerNom = parts[0].toUpperCase();
      segundoNom = parts.slice(1, parts.length - 2).join(' ').toUpperCase();
      primerApe = parts[parts.length - 2].toUpperCase();
      segundoApe = parts[parts.length - 1].toUpperCase();
    } else if (parts.length === 3) {
      primerNom = parts[0].toUpperCase();
      primerApe = parts[1].toUpperCase();
      segundoApe = parts[2].toUpperCase();
    } else if (parts.length === 2) {
      primerNom = parts[0].toUpperCase();
      primerApe = parts[1].toUpperCase();
    } else if (parts.length === 1) {
      primerNom = parts[0].toUpperCase();
    }
  }

  const fullPatientName = [primerNom, segundoNom, primerApe, segundoApe].filter(Boolean).join(' ') || (caraA.nombreCompleto || '').trim().toUpperCase();

  // Stable rowId preservation
  const rowId = caraA._rowId || `row-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  caraA._rowId = rowId;

  return {
    id: rowId,
    c: caraA.c || '',
    codigoPc: caraA.codigoPc || '',
    codigoId: options?.consecutivoId || caraA.codigoId || '',
    codigoUpgd: codUpgd,
    nombreUpgd: nombreUpgd,
    localidadNotificadora: localidadNotif,
    primerNombre: primerNom,
    segundoNombre: segundoNom,
    primerApellido: primerApe,
    segundoApellido: segundoApe,
    documento: (caraA.numeroIdentificacion || '').trim(),
    validacion: '1',
    tipoDocumento: tipoDocCode,
    fechaNacimiento: caraA.fechaNacimiento || '',
    edad: caraA.edad || '',
    fechaConsulta: caraA.fechaConsulta || '',
    nombreOdontologo: (caraA.nombreOdontologo || '').toUpperCase(),
    fechaPrimeraConsulta: caraA.fechaPrimeraConsulta || '',
    fechaRecepcion: fechaRec,
    observaciones: observacionFinal,
    cruceVcAñosPasados: '#N/A',
    validarDocEnOtraBase: '#N/A',
    semanaEpi: epiConsulta ? String(epiConsulta.weekNumber) : (caraA.semana || ''),
    fechaEnvioUpgd: caraA.fechaEnvioUpgd || '',
    semanaEpiEnvioUpgd: epiEnvio ? epiEnvio.label : '',
    semanaEpiRecepcion: epiRecepcion ? epiRecepcion.label : '',
    semanaEpiConsulta: epiConsulta ? epiConsulta.label : '',
    isNew: true,
    sourceFicha: fullPatientName || 'Ficha SISVESO'
  };
}

/**
 * Parses an existing user-uploaded Excel workbook (.xlsx / .xls) into ExcelBaseRow[]
 */
export async function parseUploadedExcel(file: File): Promise<ExcelBaseRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new Error('El archivo Excel no contiene hojas.');

  const sheet = workbook.Sheets[firstSheetName];
  const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (jsonData.length < 2) {
    throw new Error('La hoja de Excel está vacía o solo contiene encabezados.');
  }

  // Find header row (usually row 0 or 1)
  let headerIndex = 0;
  for (let r = 0; r < Math.min(5, jsonData.length); r++) {
    const rowStr = (jsonData[r] || []).join(' ').toUpperCase();
    if (rowStr.includes('UPGD') || rowStr.includes('NOMBRE') || rowStr.includes('DOCUMENTO')) {
      headerIndex = r;
      break;
    }
  }

  const rawHeaders = jsonData[headerIndex].map(h => String(h || '').trim().toUpperCase());
  const rows: ExcelBaseRow[] = [];

  for (let r = headerIndex + 1; r < jsonData.length; r++) {
    const rowArr = jsonData[r] || [];
    if (rowArr.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
      continue; // skip empty rows
    }

    const rowObj: any = { id: `excel-row-${r}` };

    // Map by column index matching the 27 standard columns
    EXCEL_BASE_COLUMNS.forEach((colDef, cIdx) => {
      // Direct column match by index or header name
      let val = rowArr[cIdx];
      if (val === undefined) {
        // Try header match
        const matchingHeaderIdx = rawHeaders.findIndex(h => h === colDef.label.toUpperCase() || h.includes(colDef.label.toUpperCase()));
        if (matchingHeaderIdx !== -1) {
          val = rowArr[matchingHeaderIdx];
        }
      }
      rowObj[colDef.key] = val !== undefined && val !== null ? String(val).trim() : '';
    });

    // Skip trailing rows that are purely 0s or empty
    if (rowObj.primerNombre || rowObj.documento || rowObj.nombreUpgd) {
      rows.push(rowObj as ExcelBaseRow);
    }
  }

  return rows;
}

/**
 * Generates and downloads an exact replica of the user's Excel database (.xlsx)
 */
export function exportOfficialExcelDatabase(
  rows: ExcelBaseRow[],
  filename: string = 'Base_Datos_SISVESO_Cara_A.xlsx'
): void {
  const headers = EXCEL_BASE_COLUMNS.map(c => c.label);
  const aoaData: any[][] = [headers];

  rows.forEach((row) => {
    const rowVals = EXCEL_BASE_COLUMNS.map(col => row[col.key] || '');
    aoaData.push(rowVals);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoaData);

  // Set column widths
  ws['!cols'] = EXCEL_BASE_COLUMNS.map(c => ({
    wch: Math.min(38, Math.max(12, c.label.length + 4))
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hoja 1');

  XLSX.writeFile(wb, filename);
}

/**
 * Generates a TSV string for 1-click clipboard copy to paste directly into Excel
 */
export function generateTsvForClipboard(rows: ExcelBaseRow[], includeHeaders: boolean = false): string {
  const lines: string[] = [];
  if (includeHeaders) {
    lines.push(EXCEL_BASE_COLUMNS.map(c => c.label).join('\t'));
  }

  for (const row of rows) {
    const vals = EXCEL_BASE_COLUMNS.map(col => {
      const v = row[col.key] || '';
      return String(v).replace(/\t/g, ' ').replace(/[\r\n]+/g, ' ');
    });
    lines.push(vals.join('\t'));
  }

  return lines.join('\r\n');
}
