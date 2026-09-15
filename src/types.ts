/**
 * Types for the PDF Scanner, SISVESO Cara A Extractor and Excel Database Manager
 */

export interface ColumnDefinition {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'id' | 'phone' | 'number' | 'list';
  required?: boolean;
}

export interface CellStatus {
  value: string;
  originalValue?: string;
  status: 'ok' | 'dudoso' | 'ilegible' | 'vacio';
  message?: string;
}

export interface ExtractedRow {
  id: string;
  rowNumber: number;
  pageNumber?: number;
  data: Record<string, string>;
  validation: Record<string, { status: 'ok' | 'dudoso' | 'ilegible' | 'vacio'; message?: string }>;
  reviewFlags: string[];
}

/**
 * Extracted data specifically from SIVIGILA / SISVESO CARA A (Hoja 1)
 */
export interface SisvesoCaraAData {
  // Información General
  fechaNotificacion?: string;
  semana?: string;
  anio?: string;
  codigoEvento?: string; // 2303
  nombreEvento?: string; // Sisveso
  codigoUpgd?: string;   // ej. 110013029414
  nombreUpgd?: string;   // ej. UNIDAD DE SERVICIOS DE SALUD MANUELA BELTRAN
  localidadNotificadora?: string; // ej. CIUDAD BOLIVAR

  // Identificación del Paciente
  tipoIdCodigo?: string; // 1-13 (ej. 3 para TI, 4 para CC)
  tipoIdSigla?: string;  // TI, CC, RC, etc.
  numeroIdentificacion?: string; // ej. 1013147050
  fechaNacimiento?: string;     // ej. 13/11/2014
  edad?: string;                // ej. 11
  unidadMedida?: string;        // 1-AÑOS, 2-MESES
  nombreCompleto?: string;      // DAVID FERNANDO ROZO OLIVEROS
  primerNombre?: string;        // DAVID
  segundoNombre?: string;       // FERNANDO
  primerApellido?: string;      // ROZO
  segundoApellido?: string;     // OLIVEROS
  telefono?: string;            // 3133090361
  sexo?: string;                // HOMBRE, MUJER, INTERSEXUAL

  // Residencia y Ubicación
  deptoResidencia?: string;     // Bogota D.C.
  mpioResidencia?: string;      // Bogota D.C.
  pacienteResideAreaRural?: string; // SI / NO
  direccionResidencia?: string; // KR 27 I 71 K 37 SUR
  estrato?: string;             // 1
  localidadResidencia?: string; // Ciudad Bolivar
  barrioResidencia?: string;    // EL PARAISO / Venecia
  otroBarrio?: string;

  // Factores y Aseguramiento
  ocupacion?: string;           // Estudiante
  codigoOcupacion?: string;     // 9991
  pertenenciaEtnica?: string;   // 8 - OTROS
  grupoPoblacional?: string;    // OTROS
  tipoAseguramiento?: string;   // 2 - SUBSIDIADO (Código 2)
  entidadAdministradora?: string; // Capital Salud
  paisProcedencia?: string;     // Colombia
  deptoProcedencia?: string;    // Bogota D.C.
  mpioProcedencia?: string;     // Bogota D.C.

  // Consulta Odontológica
  fechaConsulta?: string;       // 4/9/2026
  nombreOdontologo?: string;    // Clemencia Medina
  telefonoProfesional?: string; // 3106190830
  fechaPrimeraConsulta?: string;
  fechaRecepcion?: string;

  // Auditoría y Retroalimentación
  observacionesSugeridas?: string; // Texto exacto para la columna OBSERVACIONES de Excel
  hallazgosAuditoria?: string[];    // Lista de inconsistencias o detalles detectados
  correccionesEnRojo?: string[];    // Correcciones o anotaciones en tinta/texto rojo detectadas
  semanaEpiConsulta?: string;      // ej. SEMANA 36
  semanaEpiRecepcion?: string;     // ej. SEMANA 35
  fechaEnvioUpgd?: string;        // ej. 05/09/2026
  codigoId?: string;              // Consecutivo ID (Col C)
  c?: string;                     // Control (Col A)
  codigoPc?: string;              // Código PC (Col B)
  _rowId?: string;                // Enlace bidireccional estable con la fila de la Base de Datos Excel
}

/**
 * Exact 27 columns from the user's Excel database
 */
export interface ExcelBaseRow {
  id: string;
  c?: string;                                           // Col A: C (control)
  codigoPc?: string;                                    // Col B: CODIGO PC
  codigoId?: string;                                    // Col C: CODIGO ID
  codigoUpgd?: string;                                  // Col D: CODIGO UPGD
  nombreUpgd?: string;                                  // Col E: NOMBRE DE LA UPGD
  localidadNotificadora?: string;                       // Col F: LOCALIDAD DE NOTIFICADORA
  primerNombre?: string;                                // Col G: PRIMER NOMBRE
  segundoNombre?: string;                               // Col H: SEGUNDONOMBRE
  primerApellido?: string;                              // Col I: PRIMER APELLIDO
  segundoApellido?: string;                             // Col J: SEGUNDO APELLIDO
  documento?: string;                                   // Col K: DOCUMENTO
  validacion?: string;                                  // Col L: VALIDACION (generalmente 1)
  tipoDocumento?: string;                               // Col M: TIPO DE DOCUMENTO (código 1 a 13)
  fechaNacimiento?: string;                             // Col N: FECHA DE NACIMIENTO
  edad?: string;                                        // Col O: EDAD
  fechaConsulta?: string;                               // Col P: FECHA DE CONSULTA
  nombreOdontologo?: string;                            // Col Q: NOMBRE DE ODONTOLOGO
  fechaPrimeraConsulta?: string;                        // Col R: FECHA DE PRIMERA CONSULTA
  fechaRecepcion?: string;                              // Col S: FECHA DE RECEPCION
  observaciones?: string;                               // Col T: OBSERVACIONES (Retroalimentación)
  cruceVcAñosPasados?: string;                          // Col U: cruce vc años pasados (#N/A)
  validarDocEnOtraBase?: string;                        // Col V: VALIDAR DOC EN OTRA BASE (#N/A)
  semanaEpi?: string;                                   // Col W: Semana Epi
  fechaEnvioUpgd?: string;                              // Col X: FECHA ENVIO UPGD
  semanaEpiEnvioUpgd?: string;                          // Col Y: SEMANA EPIDEMIOLOGICA POR FECHA DE ENVIO DE LA UPGD
  semanaEpiRecepcion?: string;                          // Col Z: SEMANA EPIDEMIOLOGICA POR FECHA DE RESEPCION
  semanaEpiConsulta?: string;                           // Col AA: SEMANA EPIDEMIOLOGICA POR FECHA DE CONSULTA
  
  // Metadata for UI
  isNew?: boolean;
  sourceFicha?: string;
  isDuplicate?: boolean;
  updatedAt?: string;
}

export interface SessionFichaRecord {
  id: string;
  timestamp: string;
  fileName: string;
  patientName: string;
  documento: string;
  upgd: string;
  hasIssues: boolean;
  observaciones: string;
  excelRowId?: string;
  caraAData: SisvesoCaraAData;
  fileUrl?: string;
}

export interface DatabaseStateConfig {
  dbName: string;
  isCustomNew: boolean;
  createdAt: string;
  lastUpdatedAt: string;
  autoFeedEnabled: boolean;
}

export interface ScanResult {
  documentTitle: string;
  detectedTemplate: 'SISVESO_CARA_A' | 'ADULTOS' | 'GESTANTES' | 'MENORES_5' | 'RECIEN_NACIDOS' | 'GENERAL';
  templateName: string;
  columns: ColumnDefinition[];
  rows: ExtractedRow[];
  totalPages: number;
  summary: {
    totalRows: number;
    validRows: number;
    reviewNeededCount: number;
    illegibleCount: number;
  };
  rawJson?: string;
  caraAData?: SisvesoCaraAData;
  caraAList?: SisvesoCaraAData[];
  excelRow?: ExcelBaseRow;
}

export interface ScanOptions {
  template: 'AUTO' | 'SISVESO_CARA_A' | 'ADULTOS' | 'GESTANTES' | 'MENORES_5' | 'RECIEN_NACIDOS' | 'GENERAL';
  delimiter: ';' | ',' | '\t';
  autoExportCsv: boolean;
  normalizeDates: boolean;
  cleanDocumentNumbers: boolean;
  speedMode: 'fast' | 'precision';
  defaultFechaRecepcion?: string;
}

