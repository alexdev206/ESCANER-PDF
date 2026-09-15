import { SisvesoCaraAData } from '../types';

/**
 * Generates an SVG Data URI that visually mimics the official INS / SIVIGILA Cara A
 * notification form with all printed fields, patient data, and red ink handwriting annotations.
 * This ensures the user always has an authentic preview of the ficha even on sample/prototype mode.
 */
export function generateCaraAPreviewSvg(data: SisvesoCaraAData, page: number = 1, totalPages: number = 1): string {
  const patientName = data.nombreCompleto || `${data.primerNombre || ''} ${data.segundoNombre || ''} ${data.primerApellido || ''} ${data.segundoApellido || ''}`.trim() || 'DAVID FERNANDO ROZO OLIVEROS';
  const docType = data.tipoIdSigla || 'TI';
  const docNum = data.numeroIdentificacion || '1013147050';
  const upgdName = data.nombreUpgd || 'USS MANUELA BELTRAN';
  const upgdCode = data.codigoUpgd || '110013029414';
  const locality = data.localidadNotificadora || 'CIUDAD BOLIVAR';
  const fechaConsulta = data.fechaConsulta || '04/09/2026';
  const direccion = data.direccionResidencia || 'KR 27 I 71 K 37 SUR';
  const barrio = data.barrioResidencia || 'EL PARAISO';
  const estrato = data.estrato || '1';
  const ocupacion = data.ocupacion || 'Estudiante';
  const codOcupacion = data.codigoOcupacion || '9991';
  const doctor = data.nombreOdontologo || 'CLEMENCIA MEDINA';
  const telDoctor = data.telefonoProfesional || '3106190830';

  const redCorrections = data.correccionesEnRojo || ['Aclaración en rojo: Barrio EL PARAISO'];

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1120" width="100%" height="100%" style="background:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <filter id="paper-shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.1" />
    </filter>
  </defs>

  <!-- Paper Container -->
  <rect x="20" y="20" width="760" height="1080" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="4" filter="url(#paper-shadow)" />

  <!-- Watermark Stamp -->
  <g opacity="0.07" transform="rotate(-30 400 560)">
    <text x="250" y="520" font-size="64" font-weight="900" fill="#0f172a" text-anchor="middle">SIVIGILA D.C.</text>
    <text x="250" y="590" font-size="36" font-weight="700" fill="#0f172a" text-anchor="middle">SISVESO EVENTO 2303</text>
  </g>

  <!-- Official Header -->
  <g transform="translate(40, 40)">
    <!-- Header top logos text -->
    <rect x="0" y="0" width="720" height="74" fill="#f8fafc" stroke="#94a3b8" stroke-width="1" />
    <text x="15" y="22" font-size="11" font-weight="800" fill="#1e293b">REPÚBLICA DE COLOMBIA</text>
    <text x="15" y="37" font-size="10" font-weight="700" fill="#334155">MINISTERIO DE SALUD Y PROTECCIÓN SOCIAL</text>
    <text x="15" y="52" font-size="9" fill="#475569">INSTITUTO NACIONAL DE SALUD · SUBRED INTEGRADA SUR E.S.E.</text>

    <!-- Title Badge -->
    <rect x="420" y="8" width="288" height="58" fill="#1e40af" rx="4" />
    <text x="564" y="30" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">SISTEMA DE VIGILANCIA EN SALUD PÚBLICA</text>
    <text x="564" y="46" font-size="10" font-weight="700" fill="#93c5fd" text-anchor="middle">FICHA DE NOTIFICACIÓN INDIVIDUAL (CARA A)</text>
    <text x="564" y="58" font-size="9" fill="#bfdbfe" text-anchor="middle">EVENTO 2303 - SISVESO SALUD ORAL</text>
  </g>

  <!-- Page counter / Multi-fiche tag -->
  <g transform="translate(40, 122)">
    <rect x="0" y="0" width="720" height="24" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1" />
    <text x="12" y="16" font-size="10" font-weight="700" fill="#475569">HOJA 1 - DATOS BÁSICOS DEL EVENTO Y PACIENTE</text>
    <text x="680" y="16" font-size="10" font-weight="800" fill="#2563eb" text-anchor="end">PÁGINA ${page} DE ${totalPages}</text>
  </g>

  <!-- Section 1: Identificación de la UPGD -->
  <g transform="translate(40, 155)">
    <rect x="0" y="0" width="720" height="22" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" />
    <text x="10" y="15" font-size="10" font-weight="800" fill="#0f172a">1. INFORMACIÓN GENERAL Y DE LA UNIDAD PRIMARIA GENERADORA DEL DATO (UPGD)</text>

    <!-- Box fields -->
    <rect x="0" y="22" width="460" height="38" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="8" y="34" font-size="8" font-weight="700" fill="#64748b">1.1 NOMBRE DE LA UPGD</text>
    <text x="8" y="52" font-size="11" font-weight="700" fill="#0f172a">${upgdName}</text>

    <rect x="460" y="22" width="260" height="38" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="468" y="34" font-size="8" font-weight="700" fill="#64748b">1.2 CÓDIGO UPGD (DPTO-MPIO-SUBRED)</text>
    <text x="468" y="52" font-size="12" font-weight="800" font-family="monospace" fill="#1e293b">${upgdCode}</text>

    <rect x="0" y="60" width="240" height="34" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="8" y="72" font-size="8" font-weight="700" fill="#64748b">1.3 LOCALIDAD NOTIFICADORA</text>
    <text x="8" y="87" font-size="10" font-weight="700" fill="#0f172a">${locality}</text>

    <rect x="240" y="60" width="240" height="34" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="248" y="72" font-size="8" font-weight="700" fill="#64748b">1.4 EVENTO / CÓDIGO</text>
    <text x="248" y="87" font-size="10" font-weight="700" fill="#0f172a">SISVESO (CÓD. 2303)</text>

    <rect x="480" y="60" width="240" height="34" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="488" y="72" font-size="8" font-weight="700" fill="#64748b">1.5 FECHA DE CONSULTA</text>
    <text x="488" y="87" font-size="11" font-weight="800" font-family="monospace" fill="#0f172a">${fechaConsulta}</text>
  </g>

  <!-- Section 2: Identificación del Paciente -->
  <g transform="translate(40, 260)">
    <rect x="0" y="0" width="720" height="22" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" />
    <text x="10" y="15" font-size="10" font-weight="800" fill="#0f172a">2. IDENTIFICACIÓN DEL PACIENTE</text>

    <!-- Row 1: Tipo doc, número, nombres -->
    <rect x="0" y="22" width="120" height="42" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="8" y="34" font-size="8" font-weight="700" fill="#64748b">2.1 TIPO DOC</text>
    <rect x="8" y="38" width="48" height="20" fill="#f8fafc" stroke="#94a3b8" rx="2" />
    <text x="32" y="53" font-size="11" font-weight="800" text-anchor="middle" fill="#0f172a">${docType}</text>

    <rect x="120" y="22" width="200" height="42" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="128" y="34" font-size="8" font-weight="700" fill="#64748b">2.2 NÚMERO DE IDENTIFICACIÓN</text>
    <text x="128" y="54" font-size="13" font-weight="800" font-family="monospace" fill="#0f172a">${docNum}</text>

    <rect x="320" y="22" width="400" height="42" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="328" y="34" font-size="8" font-weight="700" fill="#64748b">2.3 APELLIDOS Y NOMBRES COMPLETOS</text>
    <text x="328" y="54" font-size="12" font-weight="800" fill="#0f172a">${patientName}</text>

    <!-- Row 2: Desglose de nombres -->
    <rect x="0" y="64" width="180" height="38" fill="#fafafa" stroke="#cbd5e1" stroke-width="1" />
    <text x="8" y="76" font-size="7.5" font-weight="700" fill="#64748b">PRIMER NOMBRE</text>
    <text x="8" y="93" font-size="10" font-weight="700" fill="#1e293b">${data.primerNombre || 'DAVID'}</text>

    <rect x="180" y="64" width="180" height="38" fill="#fafafa" stroke="#cbd5e1" stroke-width="1" />
    <text x="188" y="76" font-size="7.5" font-weight="700" fill="#64748b">SEGUNDO NOMBRE</text>
    <text x="188" y="93" font-size="10" font-weight="700" fill="#1e293b">${data.segundoNombre || 'FERNANDO'}</text>

    <rect x="360" y="64" width="180" height="38" fill="#fafafa" stroke="#cbd5e1" stroke-width="1" />
    <text x="368" y="76" font-size="7.5" font-weight="700" fill="#64748b">PRIMER APELLIDO</text>
    <text x="368" y="93" font-size="10" font-weight="700" fill="#1e293b">${data.primerApellido || 'ROZO'}</text>

    <rect x="540" y="64" width="180" height="38" fill="#fafafa" stroke="#cbd5e1" stroke-width="1" />
    <text x="548" y="76" font-size="7.5" font-weight="700" fill="#64748b">SEGUNDO APELLIDO</text>
    <text x="548" y="93" font-size="10" font-weight="700" fill="#1e293b">${data.segundoApellido || 'OLIVEROS'}</text>

    <!-- Row 3: Nacimiento, edad, sexo, teléfono -->
    <rect x="0" y="102" width="180" height="36" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="8" y="114" font-size="7.5" font-weight="700" fill="#64748b">FECHA DE NACIMIENTO</text>
    <text x="8" y="130" font-size="10" font-weight="700" font-family="monospace" fill="#0f172a">${data.fechaNacimiento || '13/11/2014'}</text>

    <rect x="180" y="102" width="140" height="36" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="188" y="114" font-size="7.5" font-weight="700" fill="#64748b">EDAD / UNIDAD</text>
    <text x="188" y="130" font-size="10" font-weight="700" fill="#0f172a">${data.edad || '11'} AÑOS</text>

    <rect x="320" y="102" width="180" height="36" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="328" y="114" font-size="7.5" font-weight="700" fill="#64748b">SEXO</text>
    <text x="328" y="130" font-size="10" font-weight="700" fill="#0f172a">${data.sexo || 'MASCULINO'}</text>

    <rect x="500" y="102" width="220" height="36" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="508" y="114" font-size="7.5" font-weight="700" fill="#64748b">TELÉFONO DE CONTACTO</text>
    <text x="508" y="130" font-size="10" font-weight="700" font-family="monospace" fill="#0f172a">${data.telefono || '3133090361'}</text>
  </g>

  <!-- Section 3: Ubicación y Residencia (Highlights Red Ink Corrections/Clarifications) -->
  <g transform="translate(40, 410)">
    <rect x="0" y="0" width="720" height="22" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" />
    <text x="10" y="15" font-size="10" font-weight="800" fill="#0f172a">3. LUGAR DE RESIDENCIA DEL PACIENTE</text>

    <!-- Dirección -->
    <rect x="0" y="22" width="460" height="46" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="8" y="34" font-size="8" font-weight="700" fill="#64748b">3.1 DIRECCIÓN DE RESIDENCIA</text>
    <text x="8" y="54" font-size="11" font-weight="700" fill="#0f172a">${direccion}</text>

    <!-- Estrato -->
    <rect x="460" y="22" width="120" height="46" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="468" y="34" font-size="8" font-weight="700" fill="#64748b">3.2 ESTRATO</text>
    <rect x="468" y="38" width="34" height="22" fill="#f8fafc" stroke="#94a3b8" rx="2" />
    <text x="485" y="54" font-size="12" font-weight="900" text-anchor="middle" fill="#0f172a">${estrato}</text>

    <!-- Área Rural -->
    <rect x="580" y="22" width="140" height="46" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="588" y="34" font-size="8" font-weight="700" fill="#64748b">3.3 RESIDE ÁREA RURAL</text>
    <text x="588" y="54" font-size="10" font-weight="700" fill="#0f172a">NO (Cabecera)</text>

    <!-- Barrio (HERE WE DRAW THE DOCTOR'S TEXT AND RED HANDWRITTEN ANNOTATION) -->
    <rect x="0" y="68" width="460" height="54" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="8" y="80" font-size="8" font-weight="700" fill="#64748b">3.4 BARRIO DE RESIDENCIA (CASILLA 12)</text>
    
    <!-- Original doctor cursive with strike-through or ambiguous writing -->
    <text x="12" y="104" font-size="13" font-family="'Caveat', 'Brush Script MT', cursive, sans-serif" fill="#64748b" text-decoration="line-through">Venecia</text>

    <!-- Red Pen Correction / Doctor Clarification Badge and Text -->
    <g transform="translate(90, 84)">
      <rect x="0" y="0" width="350" height="32" fill="#fff1f2" stroke="#f43f5e" stroke-width="1.2" stroke-dasharray="3,2" rx="4" />
      <!-- Red ballpoint pen handwriting -->
      <path d="M12 22 L20 10 L28 22" stroke="#e11d48" stroke-width="1.5" fill="none" stroke-linecap="round" />
      <text x="10" y="21" font-size="15" font-family="'Caveat', 'Comic Sans MS', cursive, sans-serif" font-weight="bold" fill="#e11d48">
        ✍️ ${barrio} (aclarado en rojo)
      </text>
      <text x="210" y="20" font-size="8.5" font-weight="800" fill="#be123c">TINTA ROJA AUDITORÍA</text>
    </g>

    <!-- Localidad Residencia -->
    <rect x="460" y="68" width="260" height="54" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="468" y="80" font-size="8" font-weight="700" fill="#64748b">3.5 LOCALIDAD RESIDENCIA</text>
    <text x="468" y="103" font-size="11" font-weight="700" fill="#0f172a">CIUDAD BOLIVAR (19)</text>
  </g>

  <!-- Section 4: Datos Socioeconómicos y Ocupación -->
  <g transform="translate(40, 545)">
    <rect x="0" y="0" width="720" height="22" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" />
    <text x="10" y="15" font-size="10" font-weight="800" fill="#0f172a">4. INFORMACIÓN SOCIODEMOGRÁFICA Y DE ASEGURAMIENTO</text>

    <rect x="0" y="22" width="360" height="38" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="8" y="34" font-size="8" font-weight="700" fill="#64748b">4.1 OCUPACIÓN</text>
    <text x="8" y="52" font-size="10" font-weight="700" fill="#0f172a">${ocupacion}</text>

    <rect x="360" y="22" width="160" height="38" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="368" y="34" font-size="8" font-weight="700" fill="#64748b">4.2 CÓDIGO OCUPACIÓN</text>
    <text x="368" y="52" font-size="11" font-weight="800" font-family="monospace" fill="#0f172a">${codOcupacion}</text>

    <rect x="520" y="22" width="200" height="38" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="528" y="34" font-size="8" font-weight="700" fill="#64748b">4.3 TIPO DE ASEGURAMIENTO</text>
    <text x="528" y="52" font-size="10" font-weight="700" fill="#0f172a">2 - SUBSIDIADO</text>
  </g>

  <!-- Section 5: Profesional Notificador y Odontología -->
  <g transform="translate(40, 615)">
    <rect x="0" y="0" width="720" height="22" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" />
    <text x="10" y="15" font-size="10" font-weight="800" fill="#0f172a">5. DATOS DEL PROFESIONAL TRATANTE / ODONTÓLOGO</text>

    <rect x="0" y="22" width="460" height="42" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="8" y="34" font-size="8" font-weight="700" fill="#64748b">NOMBRE DEL ODONTÓLOGO(A)</text>
    <text x="8" y="54" font-size="11" font-weight="800" fill="#0f172a">${doctor}</text>

    <rect x="460" y="22" width="260" height="42" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="468" y="34" font-size="8" font-weight="700" fill="#64748b">TELÉFONO DEL PROFESIONAL</text>
    <text x="468" y="54" font-size="11" font-weight="800" font-family="monospace" fill="#0f172a">${telDoctor}</text>
  </g>

  <!-- Section 6: Audit Box / Red Ink Feedback Highlight -->
  <g transform="translate(40, 690)">
    <rect x="0" y="0" width="720" height="130" fill="#fff1f2" stroke="#fda4af" stroke-width="1.5" rx="8" />
    <rect x="0" y="0" width="720" height="28" fill="#fecdd3" rx="8" />
    <text x="12" y="19" font-size="11" font-weight="900" fill="#9f1239">
      🔴 REGISTRO DE AUDITORÍA Y RETROALIMENTACIÓN (CORRECCIONES Y ACLARACIONES EN TINTA ROJA)
    </text>

    <text x="16" y="50" font-size="10.5" font-weight="800" fill="#be123c">
      ANOTACIÓN ENCONTRADA EN ESTA HOJA:
    </text>
    <text x="16" y="68" font-size="11" font-weight="700" fill="#881337">
      ${redCorrections.join(' · ')}
    </text>

    <text x="16" y="94" font-size="9.5" fill="#4c0519">
      • Las anotaciones en tinta roja se priorizan automáticamente y alimentan la Columna T (OBSERVACIONES) en Excel.
    </text>
    <text x="16" y="110" font-size="9.5" fill="#4c0519">
      • Permite distinguir entre errores de auditoría y aclaraciones de caligrafía difícil del médico o profesional.
    </text>
  </g>

  <!-- Footer Signatures -->
  <g transform="translate(40, 840)">
    <line x1="40" y1="50" x2="300" y2="50" stroke="#94a3b8" stroke-width="1" />
    <text x="170" y="66" font-size="9" font-weight="700" fill="#64748b" text-anchor="middle">FIRMA DEL PROFESIONAL NOTIFICADOR</text>
    <text x="170" y="80" font-size="8.5" fill="#94a3b8" text-anchor="middle">${doctor} · R.P. 101428572</text>

    <line x1="420" y1="50" x2="680" y2="50" stroke="#94a3b8" stroke-width="1" />
    <text x="550" y="66" font-size="9" font-weight="700" fill="#64748b" text-anchor="middle">FIRMA AUDITOR / EPIDEMIOLOGÍA SIVIGILA</text>
    <text x="550" y="80" font-size="8.5" fill="#94a3b8" text-anchor="middle">VIGILANCIA EN SALUD PÚBLICA D.C.</text>
  </g>

  <!-- Page Footer -->
  <g transform="translate(40, 1055)">
    <line x1="0" y1="0" x2="720" y2="0" stroke="#e2e8f0" stroke-width="1" />
    <text x="0" y="16" font-size="8.5" fill="#94a3b8">Sistema SISVESO 2026 · Subred Sur E.S.E. · Formato INS Oficial SIVIGILA Cara A</text>
    <text x="720" y="16" font-size="8.5" font-weight="700" fill="#64748b" text-anchor="end">Ficha #${page} · Documento Digitalizado</text>
  </g>
</svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
