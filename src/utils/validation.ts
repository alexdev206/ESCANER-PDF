import { ColumnDefinition, ExtractedRow } from '../types';

export const TEMPLATES = {
  ADULTOS: {
    nombre: 'Adultos (Consolidado de Caracterización)',
    claves: ['adulto', 'adultos'],
    columns: [
      { key: 'UPGD', label: 'UPGD', type: 'text' as const },
      { key: 'SUBRED', label: 'SUBRED', type: 'text' as const },
      { key: 'FECHA_CONSULTA', label: 'FECHA CONSULTA', type: 'date' as const },
      { key: 'TIPO_ID', label: 'TIPO ID', type: 'list' as const },
      { key: 'ID', label: 'N° IDENTIFICACIÓN', type: 'id' as const },
      { key: 'PRIMER_NOMBRE', label: 'PRIMER NOMBRE', type: 'text' as const },
      { key: 'SEGUNDO_NOMBRE', label: 'SEGUNDO NOMBRE', type: 'text' as const },
      { key: 'PRIMER_APELLIDO', label: 'PRIMER APELLIDO', type: 'text' as const },
      { key: 'SEGUNDO_APELLIDO', label: 'SEGUNDO APELLIDO', type: 'text' as const },
      { key: 'DIRECCION_RESIDENCIA', label: 'DIRECCIÓN RESIDENCIA', type: 'text' as const },
      { key: 'LOCALIDAD_RESIDENCIA', label: 'LOCALIDAD', type: 'list' as const },
      { key: 'TELEFONO', label: 'TELÉFONO', type: 'phone' as const },
      { key: 'FECHA_VISITA', label: 'FECHA VISITA', type: 'date' as const },
    ]
  },
  GESTANTES: {
    nombre: 'Gestantes (Consolidado de Caracterización)',
    claves: ['gestante', 'gestantes'],
    columns: [
      { key: 'UPGD', label: 'UPGD', type: 'text' as const },
      { key: 'SUBRED', label: 'SUBRED', type: 'text' as const },
      { key: 'FECHA_CONSULTA', label: 'FECHA CONSULTA', type: 'date' as const },
      { key: 'TIPO_ID', label: 'TIPO ID', type: 'list' as const },
      { key: 'ID', label: 'N° IDENTIFICACIÓN', type: 'id' as const },
      { key: 'PRIMER_NOMBRE', label: 'PRIMER NOMBRE', type: 'text' as const },
      { key: 'SEGUNDO_NOMBRE', label: 'SEGUNDO NOMBRE', type: 'text' as const },
      { key: 'PRIMER_APELLIDO', label: 'PRIMER APELLIDO', type: 'text' as const },
      { key: 'SEGUNDO_APELLIDO', label: 'SEGUNDO APELLIDO', type: 'text' as const },
      { key: 'DIRECCION_RESIDENCIA', label: 'DIRECCIÓN RESIDENCIA', type: 'text' as const },
      { key: 'LOCALIDAD_RESIDENCIA', label: 'LOCALIDAD', type: 'list' as const },
      { key: 'TELEFONO', label: 'TELÉFONO', type: 'phone' as const },
      { key: 'FECHA_VISITA', label: 'FECHA VISITA', type: 'date' as const },
      { key: 'SEMANAS_GESTACION', label: 'SEM. GESTACIÓN', type: 'number' as const },
      { key: 'NUM_CONTROLES', label: 'N° CONTROLES', type: 'number' as const },
      { key: 'FUM', label: 'F.U.M.', type: 'date' as const },
    ]
  },
  MENORES_5: {
    nombre: 'Menores de 5 Años (Consolidado)',
    claves: ['menores', 'menor de 5', '5 años'],
    columns: [
      { key: 'UPGD', label: 'UPGD', type: 'text' as const },
      { key: 'SUBRED', label: 'SUBRED', type: 'text' as const },
      { key: 'FECHA_CONSULTA', label: 'FECHA CONSULTA', type: 'date' as const },
      { key: 'TIPO_ID', label: 'TIPO ID', type: 'list' as const },
      { key: 'ID', label: 'N° IDENTIFICACIÓN', type: 'id' as const },
      { key: 'PRIMER_NOMBRE', label: 'PRIMER NOMBRE', type: 'text' as const },
      { key: 'SEGUNDO_NOMBRE', label: 'SEGUNDO NOMBRE', type: 'text' as const },
      { key: 'PRIMER_APELLIDO', label: 'PRIMER APELLIDO', type: 'text' as const },
      { key: 'SEGUNDO_APELLIDO', label: 'SEGUNDO APELLIDO', type: 'text' as const },
      { key: 'DIRECCION_RESIDENCIA', label: 'DIRECCIÓN RESIDENCIA', type: 'text' as const },
      { key: 'LOCALIDAD_RESIDENCIA', label: 'LOCALIDAD', type: 'list' as const },
      { key: 'TELEFONO', label: 'TELÉFONO', type: 'phone' as const },
      { key: 'FECHA_VISITA', label: 'FECHA VISITA', type: 'date' as const },
      { key: 'NOMBRE_QUIEN_RECIBE', label: 'QUIEN RECIBE', type: 'text' as const },
      { key: 'TIPO_ID_RECEPTOR', label: 'TIPO ID RECEPTOR', type: 'list' as const },
      { key: 'ID_RECEPTOR', label: 'ID RECEPTOR', type: 'id' as const },
    ]
  },
  RECIEN_NACIDOS: {
    nombre: 'Recién Nacidos (Consolidado)',
    claves: ['recien nacido', 'recien nacidos', 'nacidos'],
    columns: [
      { key: 'UPGD', label: 'UPGD', type: 'text' as const },
      { key: 'SUBRED', label: 'SUBRED', type: 'text' as const },
      { key: 'FECHA_CONSULTA', label: 'FECHA CONSULTA', type: 'date' as const },
      { key: 'TIPO_ID', label: 'TIPO ID', type: 'list' as const },
      { key: 'ID', label: 'N° IDENTIFICACIÓN', type: 'id' as const },
      { key: 'PRIMER_NOMBRE', label: 'PRIMER NOMBRE', type: 'text' as const },
      { key: 'SEGUNDO_NOMBRE', label: 'SEGUNDO NOMBRE', type: 'text' as const },
      { key: 'PRIMER_APELLIDO', label: 'PRIMER APELLIDO', type: 'text' as const },
      { key: 'SEGUNDO_APELLIDO', label: 'SEGUNDO APELLIDO', type: 'text' as const },
      { key: 'DIRECCION_RESIDENCIA', label: 'DIRECCIÓN RESIDENCIA', type: 'text' as const },
      { key: 'LOCALIDAD_RESIDENCIA', label: 'LOCALIDAD', type: 'list' as const },
      { key: 'TELEFONO', label: 'TELÉFONO', type: 'phone' as const },
      { key: 'FECHA_VISITA', label: 'FECHA VISITA', type: 'date' as const },
      { key: 'PESO_NACER_G', label: 'PESO NACER (g)', type: 'number' as const },
      { key: 'TALLA_NACER_CM', label: 'TALLA NACER (cm)', type: 'number' as const },
      { key: 'EDAD_GESTACIONAL_SEM', label: 'EDAD GEST. (sem)', type: 'number' as const },
      { key: 'NOMBRE_QUIEN_RECIBE', label: 'QUIEN RECIBE', type: 'text' as const },
      { key: 'TIPO_ID_RECEPTOR', label: 'TIPO ID RECEPTOR', type: 'list' as const },
      { key: 'ID_RECEPTOR', label: 'ID RECEPTOR', type: 'id' as const },
    ]
  }
};

export const TIPOS_ID = ['CC', 'TI', 'RC', 'CE', 'PA', 'PPT', 'PEP', 'MS', 'AS', 'DE', 'NUIP'];
export const LOCALIDADES_BOGOTA = ['Ciudad Bolívar', 'Tunjuelito', 'Usme', 'Bosa', 'Sumapaz', 'Rafael Uribe Uribe', 'Kennedy', 'San Cristóbal'];

export function normalizeDate(val: string): string | null {
  if (!val) return null;
  const clean = val.trim();
  const m = clean.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (!m) return null;
  const d = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  let y = m[3];
  if (d < 1 || d > 31 || month < 1 || month > 12) return null;
  if (y.length === 2) {
    y = '20' + y;
  }
  return `${y}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function validateCell(
  column: ColumnDefinition,
  value: string,
  rowData: Record<string, string>
): { status: 'ok' | 'dudoso' | 'ilegible' | 'vacio'; message?: string; normalized?: string } {
  const val = (value || '').trim();

  if (!val) {
    return {
      status: column.required ? 'dudoso' : 'vacio',
      message: column.required ? 'Campo requerido vacío' : undefined
    };
  }

  if (val.toUpperCase().includes('ILEGIBLE') || val === '[ILEGIBLE]' || val === '???') {
    return { status: 'ilegible', message: 'Dato marcado como ilegible en escaneo' };
  }

  // ID validation
  if (column.type === 'id' || column.key.includes('ID') || column.key === 'DOCUMENTO') {
    const digits = val.replace(/\D/g, '');
    const docType = (rowData['TIPO_ID'] || rowData['TIPO_ID_RECEPTOR'] || '').toUpperCase();
    
    if (docType === 'RC' || docType === 'NUIP') {
      if (digits.length >= 10 && digits.length <= 11) {
        return { status: 'ok', normalized: digits };
      }
      return { status: 'dudoso', message: `Registro Civil debe tener 10 u 11 dígitos (detectados: ${digits.length})` };
    }

    if (docType === 'CC' || docType === 'TI') {
      if (digits.length >= 6 && digits.length <= 10) {
        return { status: 'ok', normalized: digits };
      }
      return { status: 'dudoso', message: `Cédula/Tarjeta debe tener entre 6 y 10 dígitos (detectados: ${digits.length})` };
    }

    if (digits.length >= 5) {
      return { status: 'ok', normalized: digits };
    }
    return { status: 'dudoso', message: 'Número de documento inusualmente corto' };
  }

  // Phone validation
  if (column.type === 'phone' || column.key.includes('TELEFONO')) {
    const digits = val.replace(/\D/g, '');
    if (digits.length === 10 || digits.length === 7) {
      return { status: 'ok', normalized: digits };
    }
    return { status: 'dudoso', message: `Teléfono debe tener 10 (celular) o 7 dígitos (fijo). Detectados: ${digits.length}` };
  }

  // Date validation
  if (column.type === 'date' || column.key.includes('FECHA')) {
    const normalized = normalizeDate(val);
    if (normalized) {
      return { status: 'ok', normalized };
    }
    // Check if it's already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      return { status: 'ok' };
    }
    return { status: 'dudoso', message: 'Formato de fecha inválido (use DD/MM/AAAA)' };
  }

  // ID Type list
  if (column.key === 'TIPO_ID' || column.key === 'TIPO_ID_RECEPTOR') {
    const upper = val.toUpperCase().replace(/\./g, '');
    const match = TIPOS_ID.find(t => t === upper);
    if (match) return { status: 'ok', normalized: match };
    return { status: 'dudoso', message: `Tipo ID desconocido. Válidos: ${TIPOS_ID.join(', ')}` };
  }

  return { status: 'ok' };
}

export function validateAllRows(columns: ColumnDefinition[], rawRows: Array<Record<string, string>>): ExtractedRow[] {
  return rawRows.map((data, index) => {
    const validation: Record<string, { status: 'ok' | 'dudoso' | 'ilegible' | 'vacio'; message?: string }> = {};
    const reviewFlags: string[] = [];
    const normalizedData: Record<string, string> = { ...data };

    for (const col of columns) {
      const val = data[col.key] || '';
      const res = validateCell(col, val, data);
      validation[col.key] = { status: res.status, message: res.message };
      if (res.normalized) {
        normalizedData[col.key] = res.normalized;
      }
      if (res.status === 'dudoso' || res.status === 'ilegible') {
        reviewFlags.push(col.label || col.key);
      }
    }

    return {
      id: `row-${index + 1}`,
      rowNumber: index + 1,
      pageNumber: data['__PAGE'] ? parseInt(data['__PAGE'], 10) : 1,
      data: normalizedData,
      validation,
      reviewFlags
    };
  });
}
