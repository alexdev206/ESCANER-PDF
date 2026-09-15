import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Split, 
  Table as TableIcon, 
  FileText, 
  Download, 
  Sparkles, 
  Info, 
  Database, 
  Layers, 
  ArrowRight, 
  ClipboardCopy, 
  ScanLine,
  History,
  RotateCcw,
  Zap,
  Check,
  FolderPlus,
  RefreshCw
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { UploadZone } from './components/UploadZone';
import { ScanningProgress } from './components/ScanningProgress';
import { DataTable } from './components/DataTable';
import { DocumentViewer } from './components/DocumentViewer';
import { ExportBar } from './components/ExportBar';
import { CaraAViewer } from './components/CaraAViewer';
import { ExcelDatabaseManager } from './components/ExcelDatabaseManager';
import { SessionQueue } from './components/SessionQueue';
import { 
  ScanResult, 
  ScanOptions, 
  ExtractedRow, 
  ExcelBaseRow, 
  SisvesoCaraAData, 
  SessionFichaRecord 
} from './types';
import { validateAllRows, TEMPLATES } from './utils/validation';
import { downloadCsv } from './utils/export';
import { SampleDocument, INITIAL_EXCEL_DATABASE_ROWS } from './data/samplePdfs';
import { optimizeFileForUpload } from './utils/imageOptimizer';
import { caraAToExcelRow, performCaraAAudit, exportOfficialExcelDatabase } from './utils/sisveso';

const DB_STORAGE_KEY = 'escaner_sisveso_excel_db_v2';
const DB_FILENAME_KEY = 'escaner_sisveso_excel_filename_v2';
const DB_CUSTOM_FLAG_KEY = 'escaner_sisveso_is_custom_v2';
const DB_AUTOFEED_KEY = 'escaner_sisveso_autofeed_v2';

export default function App() {
  const [hasApiKey, setHasApiKey] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active top-level tab
  const [activeTab, setActiveTab] = useState<'scanner' | 'database' | 'history'>('scanner');

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [isOptimizedUpload, setIsOptimizedUpload] = useState(false);

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [resultSubTab, setResultSubTab] = useState<'caraA' | 'split' | 'table' | 'document'>('caraA');
  const [selectedCaraAIndex, setSelectedCaraAIndex] = useState<number>(0);

  // Track session history of scanned fichas
  const [sessionQueue, setSessionQueue] = useState<SessionFichaRecord[]>([]);
  const [selectedQueueId, setSelectedQueueId] = useState<string | undefined>();

  // Auto-feed toggle (user request: auto-append each subsequent scanned PDF to active DB)
  const [autoFeedEnabled, setAutoFeedEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DB_AUTOFEED_KEY) === 'true';
    } catch {
      return true;
    }
  });

  // Batch multi-file scanning state
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentFileName: string } | null>(null);
  const [activeAiEngine, setActiveAiEngine] = useState<string | null>(null);
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false);

  // Track whether the user has initialized their own custom database
  const [isCustomNew, setIsCustomNew] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DB_CUSTOM_FLAG_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Database rows
  const [excelDatabaseRows, setExcelDatabaseRows] = useState<ExcelBaseRow[]>(() => {
    try {
      const saved = localStorage.getItem(DB_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not read saved database:', e);
    }
    return INITIAL_EXCEL_DATABASE_ROWS;
  });

  const [linkedFileName, setLinkedFileName] = useState<string>(() => {
    try {
      return localStorage.getItem(DB_FILENAME_KEY) || 'Base_Datos_SISVESO_2026.xlsx';
    } catch {
      return 'Base_Datos_SISVESO_2026.xlsx';
    }
  });

  const [options, setOptions] = useState<ScanOptions>({
    template: 'AUTO',
    delimiter: ';',
    autoExportCsv: false,
    normalizeDates: true,
    cleanDocumentNumbers: true,
    speedMode: 'fast',
  });

  // Persistence to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(excelDatabaseRows));
    } catch (e) {
      console.warn('Could not persist database:', e);
    }
  }, [excelDatabaseRows]);

  useEffect(() => {
    try {
      localStorage.setItem(DB_FILENAME_KEY, linkedFileName);
    } catch (e) {
      console.warn('Could not persist filename:', e);
    }
  }, [linkedFileName]);

  useEffect(() => {
    try {
      localStorage.setItem(DB_CUSTOM_FLAG_KEY, String(isCustomNew));
    } catch (e) {
      console.warn('Could not persist custom flag:', e);
    }
  }, [isCustomNew]);

  useEffect(() => {
    try {
      localStorage.setItem(DB_AUTOFEED_KEY, String(autoFeedEnabled));
    } catch (e) {
      console.warn('Could not persist autofeed flag:', e);
    }
  }, [autoFeedEnabled]);

  // Check backend server status
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.hasApiKey !== undefined) {
          setHasApiKey(data.hasApiKey);
        }
        if (data.hasOpenAIKey !== undefined) {
          setHasOpenAIKey(data.hasOpenAIKey);
        }
      })
      .catch(err => {
        console.warn('Health check warning:', err);
      });
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Add row to Excel Database (with support for initializing fresh new database or updating existing row)
  const handleAddToDatabase = (row: ExcelBaseRow, asNewDatabase: boolean = false) => {
    if (asNewDatabase) {
      setExcelDatabaseRows([row]);
      setIsCustomNew(true);
      triggerToast(`🌟 ¡Nueva base de datos iniciada! Fila #1 creada para ${row.primerNombre || ''} ${row.primerApellido || ''}`);
    } else {
      setExcelDatabaseRows(prev => {
        const cleanDoc = (row.documento || '').trim();
        const existsIndex = prev.findIndex(r => 
          r.id === row.id || 
          (cleanDoc && r.documento && r.documento.trim() === cleanDoc)
        );

        if (existsIndex >= 0) {
          const next = [...prev];
          next[existsIndex] = {
            ...prev[existsIndex],
            ...row,
            id: prev[existsIndex].id,
            updatedAt: new Date().toLocaleTimeString('es-CO')
          };
          return next;
        }
        return [row, ...prev];
      });
      setIsCustomNew(true);
      triggerToast(`➕ Ficha guardada/actualizada en la base oficial`);
    }
  };

  // Start fresh blank database
  const handleStartNewBlankDatabase = () => {
    if (window.confirm('¿Deseas vaciar la base de datos actual para comenzar una nueva desde cero con tus próximos PDFs?')) {
      setExcelDatabaseRows([]);
      setIsCustomNew(true);
      triggerToast('🧹 Base de datos reiniciada. Tu próximo PDF ingresará como la Fila #1.');
    }
  };

  // Handle uploaded file scanning
  const handleFileSelected = async (file: File) => {
    setError(null);
    setIsScanning(true);
    setUploadedFile(file);

    const url = URL.createObjectURL(file);
    setUploadedFileUrl(url);

    try {
      const optimized = await optimizeFileForUpload(file);
      setIsOptimizedUpload(optimized.isOptimized);

      if (optimized.isOptimized) {
        triggerToast(`⚡ Archivo optimizado (${(optimized.originalSize / 1024 / 1024).toFixed(1)}MB → ${(optimized.optimizedSize / 1024).toFixed(0)}KB)`);
      }

      let response: Response | null = null;
      let rawText = '';
      let resJson: any = null;

      // Primary attempt + 1 automatic retry on transient overload/503
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          response = await fetch('/api/scan-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileData: optimized.fileData,
              mimeType: optimized.mimeType,
              fileName: file.name,
              templateHint: options.template,
              speedMode: options.speedMode || 'fast',
            }),
          });

          rawText = await response.text();
          try {
            resJson = JSON.parse(rawText);
          } catch {
            resJson = null;
          }

          if (response.ok && resJson?.result) {
            break; // Succeeded!
          }

          // If it's a 503 or transient overload on attempt 1, wait 1.2s and retry
          if (attempt === 1 && (response.status === 503 || response.status === 504 || !response.ok)) {
            await new Promise(r => setTimeout(r, 1200));
            continue;
          }
        } catch (fetchErr) {
          if (attempt === 1) {
            await new Promise(r => setTimeout(r, 1200));
            continue;
          }
          throw fetchErr;
        }
      }

      if (!response || !response.ok) {
        let errorMsg = resJson?.error || resJson?.message;
        if (!errorMsg) {
          if (response?.status === 504 || response?.status === 502) {
            errorMsg = 'El servidor excedió el tiempo de espera al procesar el archivo. Por favor presiona "Reintentar escaneo".';
          } else if (response?.status === 503) {
            errorMsg = 'El servicio de IA experimentó alta demanda momentánea. Por favor presiona "Reintentar escaneo".';
          } else {
            errorMsg = `Error del servidor (${response?.status || '500'}). Por favor reintenta el escaneo.`;
          }
        }
        throw new Error(errorMsg);
      }

      if (!resJson || !resJson.result) {
        throw new Error(resJson?.error || 'No se pudieron extraer datos del documento. Por favor presiona "Reintentar escaneo".');
      }

      if (resJson.aiEngine) {
        setActiveAiEngine(resJson.aiEngine);
      }

      const rawResult = resJson.result;

      const columns = rawResult.columns || [];
      const rawRows = (rawResult.rows || [])
        .map((r: any) => {
          if (r.data && typeof r.data === 'object') return r.data;
          if (Array.isArray(r.cells)) {
            const map: Record<string, string> = {};
            r.cells.forEach((c: any) => {
              if (c && c.key) map[c.key] = c.value !== undefined && c.value !== null ? String(c.value).trim() : '';
            });
            return map;
          }
          return r;
        })
        .filter((rowObj: any) => {
          return Object.values(rowObj || {}).some(
            val => val !== undefined && val !== null && String(val).trim() !== ''
          );
        });

      // If neither tabular rows nor caraAData were returned, construct a safe fallback Cara A
      const hasCaraA = !!(rawResult.caraAData || (rawResult.caraAList && rawResult.caraAList.length > 0));
      if (rawRows.length === 0 && !hasCaraA) {
        const fallbackRecord: SisvesoCaraAData = {
          anio: new Date().getFullYear().toString(),
          codigoEvento: '2303',
          nombreEvento: 'Sisveso',
          codigoUpgd: '',
          nombreUpgd: '',
          localidadNotificadora: '',
          tipoIdCodigo: '4',
          tipoIdSigla: 'CC',
          numeroIdentificacion: '',
          nombreCompleto: '',
          primerNombre: '',
          primerApellido: '',
          observacionesSugeridas: 'DOCUMENTO CARGADO PARA REVISIÓN MANUAL',
          hallazgosAuditoria: ['Documento listo para transcripción y verificación manual'],
          correccionesEnRojo: [],
        };
        rawResult.caraAData = fallbackRecord;
        rawResult.caraAList = [fallbackRecord];
        triggerToast('⚠️ Documento cargado para digitación y verificación manual');
      }

      // Multi-Cara A support: extract array or fallback to single
      let caraAList: SisvesoCaraAData[] = rawResult.caraAList && rawResult.caraAList.length > 0
        ? rawResult.caraAList
        : (rawResult.caraAData ? [rawResult.caraAData] : []);

      // Run audit on each Cara A item
      caraAList = caraAList.map(item => {
        const audit = performCaraAAudit(item);
        return {
          ...item,
          observacionesSugeridas: item.observacionesSugeridas || audit.observacionSugerida,
          hallazgosAuditoria: item.hallazgosAuditoria && item.hallazgosAuditoria.length > 0 ? item.hallazgosAuditoria : audit.hallazgos,
        };
      });

      const caraA = caraAList.length > 0 ? caraAList[0] : undefined;

      const validatedRows = validateAllRows(columns, rawRows);

      let reviewCount = 0;
      let illegibleCount = 0;
      validatedRows.forEach(row => {
        if (row.reviewFlags && row.reviewFlags.length > 0) reviewCount++;
        for (const k of Object.keys(row.validation || {})) {
          if (row.validation[k]?.status === 'ilegible') illegibleCount++;
        }
      });

      const structuredResult: ScanResult = {
        documentTitle: rawResult.documentTitle || file.name.replace(/\.[^/.]+$/, ''),
        detectedTemplate: rawResult.detectedTemplate || (caraA ? 'SISVESO_CARA_A' : 'GENERAL'),
        templateName: rawResult.templateName || (caraA ? (caraAList.length > 1 ? `Lote SISVESO Cara A (${caraAList.length} Fichas)` : 'Ficha SISVESO / SIVIGILA Cara A') : rawResult.documentTitle || 'Formato Tabular'),
        columns,
        rows: validatedRows,
        totalPages: rawResult.totalPages || caraAList.length || 1,
        summary: {
          totalRows: Math.max(validatedRows.length, caraAList.length, 1),
          validRows: Math.max(0, (validatedRows.length || 1) - reviewCount),
          reviewNeededCount: reviewCount,
          illegibleCount,
        },
        caraAData: caraA,
        caraAList: caraAList.length > 0 ? caraAList : undefined,
      };

      setScanResult(structuredResult);
      setSelectedCaraAIndex(0);
      setActiveTab('scanner');
      setResultSubTab(caraA ? 'caraA' : 'table');

      // Add each Cara A to Session Queue
      if (caraAList.length > 0) {
        caraAList.forEach((item, idx) => {
          if (!item._rowId) {
            item._rowId = `row-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`;
          }
        });
        if (caraA && !caraA._rowId && caraAList[0]) {
          caraA._rowId = caraAList[0]._rowId;
        }

        const newQueueItems: SessionFichaRecord[] = caraAList.map((item, idx) => {
          const obs = (item.observacionesSugeridas || '').toUpperCase();
          const hasIssues = obs && !obs.includes('SIN OBSERVACIONES') && !obs.includes('CUMPLE');
          return {
            id: `queue-${Date.now()}-${idx}`,
            timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
            fileName: file.name,
            patientName: item.nombreCompleto || `${item.primerNombre || ''} ${item.primerApellido || ''}`.trim() || `Paciente #${idx + 1}`,
            documento: item.numeroIdentificacion || 'S/N',
            upgd: item.nombreUpgd || 'UPGD no especificada',
            hasIssues: !!hasIssues,
            observaciones: item.observacionesSugeridas || '',
            caraAData: item,
            fileUrl: url,
          };
        });

        setSessionQueue(prev => [...newQueueItems, ...prev]);
        setSelectedQueueId(newQueueItems[0].id);

        // USER GOAL: If this is their first real scan or autofeed is enabled:
        if (!isCustomNew) {
          const newExcelRows = caraAList.map(rec => caraAToExcelRow(rec));
          setExcelDatabaseRows(newExcelRows);
          setIsCustomNew(true);
          triggerToast(`🎯 ¡Nueva base inicializada con ${caraAList.length} ficha(s) detectadas en el PDF!`);
        } else if (autoFeedEnabled) {
          const newExcelRows = caraAList.map(rec => caraAToExcelRow(rec));
          setExcelDatabaseRows(prev => [...newExcelRows, ...prev]);
          triggerToast(`⚡ Auto-alimentación: ${caraAList.length} ficha(s) sumadas a la base (Total: ${excelDatabaseRows.length + caraAList.length})`);
        }
      }

      // Auto-export CSV if requested in settings
      if (options.autoExportCsv && validatedRows.length > 0) {
        const cleanName = structuredResult.documentTitle
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .slice(0, 30);
        downloadCsv(columns, validatedRows, `transcripcion_${cleanName}.csv`, options.delimiter);
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message || 'Ocurrió un error al procesar el archivo.');
    } finally {
      setIsScanning(false);
    }
  };

  // Process multiple files in sequence
  const handleFilesSelected = async (files: File[]) => {
    if (!files || files.length === 0) return;
    if (files.length === 1) {
      await handleFileSelected(files[0]);
      return;
    }

    setError(null);
    setIsScanning(true);
    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: files.length, currentFileName: '' });

    const accumulatedNewQueueItems: SessionFichaRecord[] = [];
    const accumulatedNewExcelRows: ExcelBaseRow[] = [];
    let firstResult: ScanResult | null = null;
    let firstFile: File | null = null;
    let firstFileUrl: string | null = null;
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setBatchProgress({ current: i + 1, total: files.length, currentFileName: file.name });
      setUploadedFile(file);

      const fileUrl = URL.createObjectURL(file);

      try {
        const optimized = await optimizeFileForUpload(file);
        let response: Response | null = null;
        let resJson: any = null;

        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            response = await fetch('/api/scan-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileData: optimized.fileData,
                mimeType: optimized.mimeType,
                fileName: file.name,
                templateHint: options.template,
                speedMode: options.speedMode || 'fast',
              }),
            });

            const rawText = await response.text();
            try {
              resJson = JSON.parse(rawText);
            } catch {
              resJson = null;
            }

            if (response.ok && resJson?.result) break;
            if (attempt === 1 && (response.status === 503 || response.status === 504 || !response.ok)) {
              await new Promise(r => setTimeout(r, 1200));
            }
          } catch {
            if (attempt === 1) {
              await new Promise(r => setTimeout(r, 1200));
            }
          }
        }

        if (resJson?.aiEngine) {
          setActiveAiEngine(resJson.aiEngine);
        }

        const rawResult = resJson?.result || {};
        let caraAList: SisvesoCaraAData[] = rawResult.caraAList && rawResult.caraAList.length > 0
          ? rawResult.caraAList
          : (rawResult.caraAData ? [rawResult.caraAData] : []);

        if (caraAList.length === 0) {
          const fallbackRecord: SisvesoCaraAData = {
            anio: new Date().getFullYear().toString(),
            codigoEvento: '2303',
            nombreEvento: 'Sisveso',
            codigoUpgd: '',
            nombreUpgd: '',
            localidadNotificadora: '',
            tipoIdCodigo: '4',
            tipoIdSigla: 'CC',
            numeroIdentificacion: '',
            nombreCompleto: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
            primerNombre: '',
            primerApellido: '',
            observacionesSugeridas: 'DOCUMENTO CARGADO PARA REVISIÓN MANUAL',
            hallazgosAuditoria: ['Ficha cargada para verificación'],
            correccionesEnRojo: [],
          };
          caraAList = [fallbackRecord];
        }

        // Run audit on each Cara A
        caraAList = caraAList.map(item => {
          const audit = performCaraAAudit(item);
          return {
            ...item,
            observacionesSugeridas: item.observacionesSugeridas || audit.observacionSugerida,
            hallazgosAuditoria: item.hallazgosAuditoria && item.hallazgosAuditoria.length > 0 ? item.hallazgosAuditoria : audit.hallazgos,
          };
        });

        // Convert to session queue items and excel rows
        caraAList.forEach((item, idx) => {
          const obs = (item.observacionesSugeridas || '').toUpperCase();
          const hasIssues = obs && !obs.includes('SIN OBSERVACIONES') && !obs.includes('CUMPLE');
          accumulatedNewQueueItems.push({
            id: `queue-${Date.now()}-${i}-${idx}`,
            timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
            fileName: file.name,
            patientName: item.nombreCompleto || `${item.primerNombre || ''} ${item.primerApellido || ''}`.trim() || `Paciente #${accumulatedNewQueueItems.length + 1}`,
            documento: item.numeroIdentificacion || 'S/N',
            upgd: item.nombreUpgd || 'UPGD no especificada',
            hasIssues: !!hasIssues,
            observaciones: item.observacionesSugeridas || '',
            caraAData: item,
            fileUrl,
          });
          accumulatedNewExcelRows.push(caraAToExcelRow(item));
        });

        if (!firstResult) {
          firstFile = file;
          firstFileUrl = fileUrl;
          firstResult = {
            documentTitle: rawResult.documentTitle || file.name.replace(/\.[^/.]+$/, ''),
            detectedTemplate: 'SISVESO_CARA_A',
            templateName: `Lote SISVESO (${files.length} archivos)`,
            columns: rawResult.columns || [],
            rows: [],
            totalPages: caraAList.length,
            summary: {
              totalRows: caraAList.length,
              validRows: caraAList.length,
              reviewNeededCount: 0,
              illegibleCount: 0,
            },
            caraAData: caraAList[0],
            caraAList,
          };
        }
        successCount++;
      } catch (err) {
        console.error(`Error procesando archivo ${file.name}:`, err);
      }
    }

    if (accumulatedNewQueueItems.length > 0) {
      setSessionQueue(prev => [...accumulatedNewQueueItems, ...prev]);
      setSelectedQueueId(accumulatedNewQueueItems[0].id);

      if (!isCustomNew) {
        setExcelDatabaseRows(accumulatedNewExcelRows);
        setIsCustomNew(true);
      } else {
        setExcelDatabaseRows(prev => [...accumulatedNewExcelRows, ...prev]);
      }

      if (firstResult && firstFile) {
        setScanResult(firstResult);
        setUploadedFile(firstFile);
        setUploadedFileUrl(firstFileUrl);
        setSelectedCaraAIndex(0);
        setActiveTab('scanner');
        setResultSubTab('caraA');
      }

      triggerToast(`🎉 ¡Lote finalizado! Se procesaron ${successCount} archivo(s) y se consolidaron ${accumulatedNewExcelRows.length} fichas en la base de datos.`);
    } else {
      setError('No se pudieron extraer datos de los archivos seleccionados. Por favor presiona "Reintentar escaneo".');
    }

    setIsScanning(false);
    setIsBatchProcessing(false);
    setBatchProgress(null);
  };

  // Handle sample selection
  const handleSampleSelected = (sample: SampleDocument) => {
    setError(null);
    setUploadedFile({ name: sample.fileName, size: 1024 * 180, type: 'application/pdf' } as any);
    setUploadedFileUrl(null);

    const validated = sample.sampleRows;
    let reviewCount = 0;
    let illegibleCount = 0;
    validated.forEach(row => {
      if (row.reviewFlags && row.reviewFlags.length > 0) reviewCount++;
      for (const k of Object.keys(row.validation || {})) {
        if (row.validation[k]?.status === 'ilegible') illegibleCount++;
      }
    });

    const caraAList = sample.caraAList && sample.caraAList.length > 0
      ? sample.caraAList
      : (sample.caraAData ? [sample.caraAData] : []);
    const initialCaraA = caraAList.length > 0 ? caraAList[0] : sample.caraAData;

    const structuredResult: ScanResult = {
      documentTitle: sample.title,
      detectedTemplate: sample.category,
      templateName: sample.title,
      columns: sample.columns,
      rows: validated,
      totalPages: caraAList.length || 1,
      summary: {
        totalRows: Math.max(validated.length, caraAList.length, 1),
        validRows: Math.max(0, validated.length - reviewCount),
        reviewNeededCount: reviewCount,
        illegibleCount,
      },
      caraAData: initialCaraA,
      caraAList: caraAList.length > 0 ? caraAList : undefined,
    };

    setScanResult(structuredResult);
    setSelectedCaraAIndex(0);
    setActiveTab('scanner');
    setResultSubTab(initialCaraA ? 'caraA' : 'table');

    if (caraAList.length > 0) {
      caraAList.forEach((item, idx) => {
        if (!item._rowId) {
          item._rowId = `sample-${Date.now()}-${idx}`;
        }
      });
      if (initialCaraA && !initialCaraA._rowId && caraAList[0]) {
        initialCaraA._rowId = caraAList[0]._rowId;
      }

      const newQueueItems: SessionFichaRecord[] = caraAList.map((item, idx) => {
        const obs = (item.observacionesSugeridas || '').toUpperCase();
        const hasIssues = obs && !obs.includes('SIN OBSERVACIONES') && !obs.includes('CUMPLE');
        return {
          id: `sample-${Date.now()}-${idx}`,
          timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          fileName: sample.fileName,
          patientName: item.nombreCompleto || `${item.primerNombre || ''} ${item.primerApellido || ''}`.trim() || `Paciente #${idx + 1}`,
          documento: item.numeroIdentificacion || 'S/N',
          upgd: item.nombreUpgd || 'UNIDAD DE SERVICIOS DE SALUD MANUELA BELTRAN',
          hasIssues: !!hasIssues,
          observaciones: item.observacionesSugeridas || '',
          caraAData: item,
        };
      });
      setSessionQueue(prev => [...newQueueItems, ...prev]);
      setSelectedQueueId(newQueueItems[0].id);
    }
  };

  const handleRowsChange = (updatedRows: ExtractedRow[]) => {
    if (!scanResult) return;
    let reviewCount = 0;
    let illegibleCount = 0;
    updatedRows.forEach(row => {
      if (row.reviewFlags && row.reviewFlags.length > 0) reviewCount++;
      for (const k of Object.keys(row.validation || {})) {
        if (row.validation[k]?.status === 'ilegible') illegibleCount++;
      }
    });

    setScanResult({
      ...scanResult,
      rows: updatedRows,
      summary: {
        totalRows: updatedRows.length,
        validRows: updatedRows.length - reviewCount,
        reviewNeededCount: reviewCount,
        illegibleCount,
      },
    });
  };

  const handleCaraADataChange = (updated: SisvesoCaraAData) => {
    if (!scanResult) return;
    const updatedList = scanResult.caraAList ? [...scanResult.caraAList] : [updated];
    if (scanResult.caraAList && selectedCaraAIndex < updatedList.length) {
      updatedList[selectedCaraAIndex] = updated;
    }
    setScanResult({
      ...scanResult,
      caraAData: updated,
      caraAList: updatedList,
    });

    // Actualizar nombre y datos en la cola de sesión (panel lateral)
    const patientDisplay = updated.nombreCompleto || 
      `${updated.primerNombre || ''} ${updated.primerApellido || ''}`.trim() || 'Paciente';

    setSessionQueue(prev => prev.map(item => {
      const isTarget = (updated._rowId && item.caraAData?._rowId === updated._rowId) ||
        (item.documento && updated.numeroIdentificacion && item.documento.trim() === updated.numeroIdentificacion.trim());
      if (isTarget) {
        return {
          ...item,
          patientName: patientDisplay,
          documento: updated.numeroIdentificacion || item.documento,
          upgd: updated.nombreUpgd || item.upgd,
          observaciones: updated.observacionesSugeridas || item.observaciones,
          caraAData: updated,
        };
      }
      return item;
    }));

    // CRITICAL REQUIREMENT: "si corrijo el nombre tome ese nombre corregido para la base y asi"
    // Sincronizar inmediatamente la Base de Datos oficial de Excel con TODOS los campos corregidos
    const convertedExcelRow = caraAToExcelRow(updated);
    const cleanDoc = (updated.numeroIdentificacion || '').trim();

    setExcelDatabaseRows(prev => {
      const matchIndex = prev.findIndex(r => 
        (updated._rowId && r.id === updated._rowId) ||
        (cleanDoc && r.documento && r.documento.trim() === cleanDoc)
      );

      if (matchIndex >= 0) {
        const next = [...prev];
        next[matchIndex] = {
          ...next[matchIndex],
          ...convertedExcelRow,
          id: next[matchIndex].id,
          updatedAt: new Date().toLocaleTimeString('es-CO')
        };
        return next;
      }
      return prev;
    });
  };

  const handleAddAllCaraAToDatabase = (records: SisvesoCaraAData[]) => {
    const newExcelRows = records.map(rec => caraAToExcelRow(rec));
    if (!isCustomNew) {
      setExcelDatabaseRows(newExcelRows);
      setIsCustomNew(true);
      triggerToast(`✨ ¡Base inicializada con las ${records.length} fichas del lote!`);
    } else {
      setExcelDatabaseRows(prev => {
        const next = [...prev];
        newExcelRows.forEach(newRow => {
          const cleanDoc = (newRow.documento || '').trim();
          const matchIdx = next.findIndex(r => 
            r.id === newRow.id || 
            (cleanDoc && r.documento && r.documento.trim() === cleanDoc)
          );
          if (matchIdx >= 0) {
            next[matchIdx] = {
              ...next[matchIdx],
              ...newRow,
              id: next[matchIdx].id,
              updatedAt: new Date().toLocaleTimeString('es-CO')
            };
          } else {
            next.unshift(newRow);
          }
        });
        return next;
      });
      triggerToast(`➕ ¡Se agregaron/actualizaron ${records.length} fichas en la base oficial de Excel!`);
    }
  };

  const handleSelectHistoryRecord = (record: SessionFichaRecord) => {
    setSelectedQueueId(record.id);
    setSelectedCaraAIndex(0);
    setScanResult({
      documentTitle: record.fileName,
      detectedTemplate: 'SISVESO_CARA_A',
      templateName: 'Ficha SIVIGILA Cara A',
      columns: TEMPLATES.SISVESO_CARA_A.columns,
      rows: [],
      totalPages: 1,
      summary: { totalRows: 1, validRows: 1, reviewNeededCount: 0, illegibleCount: 0 },
      caraAData: record.caraAData,
      caraAList: [record.caraAData],
    });
    setActiveTab('scanner');
    setResultSubTab('caraA');
  };

  const handleReset = () => {
    if (uploadedFileUrl) {
      URL.revokeObjectURL(uploadedFileUrl);
    }
    setScanResult(null);
    setUploadedFile(null);
    setUploadedFileUrl(null);
    setSelectedCaraAIndex(0);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar 
        hasApiKey={hasApiKey} 
        activeDbName={linkedFileName}
        rowCount={excelDatabaseRows.length}
        isCustomNew={isCustomNew}
        onNavigateToDb={() => setActiveTab('database')}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Modern Minimalist Control Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-14 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-2">
          {/* Main Segmented Tabs */}
          <nav className="flex items-center space-x-1 overflow-x-auto">
            <button
              type="button"
              id="tab-scanner"
              onClick={() => setActiveTab('scanner')}
              className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 cursor-pointer ${
                activeTab === 'scanner'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ScanLine className="w-4 h-4" />
              <span>Transcripción</span>
              {scanResult && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>

            <button
              type="button"
              id="tab-database"
              onClick={() => setActiveTab('database')}
              className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Base de Datos</span>
              <span className={`px-1.5 py-0.2 rounded text-[11px] font-mono ${
                activeTab === 'database' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
              }`}>
                {excelDatabaseRows.length}
              </span>
            </button>

            <button
              type="button"
              id="tab-history"
              onClick={() => setActiveTab('history')}
              className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Historial ({sessionQueue.length})</span>
            </button>
          </nav>

          {/* Right quick toggles: Auto-Feed Switch & Quick Download */}
          <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
            {/* Auto-feed toggle */}
            <label 
              className="inline-flex items-center space-x-2 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer select-none transition-colors"
              title="Al activar este modo, cada PDF escaneado se sumará automáticamente a la base de Excel"
            >
              <input
                type="checkbox"
                checked={autoFeedEnabled}
                onChange={(e) => {
                  setAutoFeedEnabled(e.target.checked);
                  triggerToast(e.target.checked ? 'Alimentación automática activada' : 'Alimentación manual activada');
                }}
                className="rounded border-slate-300 text-slate-800 focus:ring-slate-700"
              />
              <span className="text-xs">Auto-anexar a base</span>
            </label>

            <button
              type="button"
              disabled={excelDatabaseRows.length === 0}
              onClick={() => {
                exportOfficialExcelDatabase(excelDatabaseRows, linkedFileName);
                triggerToast(`Base descargada: ${linkedFileName}`);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
              title="Descargar archivo Excel con todas las filas acumuladas"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar .xlsx</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error banner */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  Aviso de Procesamiento
                </h4>
                <p className="text-xs text-rose-700">{error}</p>
              </div>
            </div>
            {uploadedFile && (
              <button
                type="button"
                id="btn-retry-failed-scan"
                onClick={() => handleFileSelected(uploadedFile)}
                className="shrink-0 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reintentar escaneo</span>
              </button>
            )}
          </div>
        )}

        {/* TAB 1: SCANNER & TRANSCRIBER */}
        {activeTab === 'scanner' && (
          <div className="space-y-6">
            {!scanResult && !isScanning && (
              <UploadZone
                onFileSelected={handleFileSelected}
                onFilesSelected={handleFilesSelected}
                onSampleSelected={handleSampleSelected}
                options={options}
                onOptionsChange={setOptions}
                isScanning={isScanning}
                activeDbName={linkedFileName}
                isCustomNew={isCustomNew}
              />
            )}

            {isScanning && (
              <ScanningProgress
                fileName={uploadedFile?.name || 'Documento'}
                isOptimizedUpload={isOptimizedUpload}
                batchInfo={batchProgress || undefined}
                activeEngine={activeAiEngine}
              />
            )}

            {scanResult && !isScanning && (
              <div className="space-y-4">
                {/* Result header bar */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                        {scanResult.documentTitle}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <p className="text-xs text-slate-500">
                          {scanResult.templateName} · {scanResult.totalPages} {scanResult.totalPages === 1 ? 'página' : 'páginas'}
                        </p>
                        {activeAiEngine && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] text-slate-600 bg-slate-100 border border-slate-200">
                            {activeAiEngine}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sub-view switcher and Reset button */}
                  <div className="flex items-center space-x-1.5 self-end md:self-auto">
                    {(scanResult.caraAData || scanResult.caraAList) && (
                      <button
                        type="button"
                        onClick={() => setResultSubTab('caraA')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          resultSubTab === 'caraA'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {scanResult.caraAList && scanResult.caraAList.length > 1
                          ? `Fichas (${scanResult.caraAList.length})`
                          : 'Ficha Cara A'}
                      </button>
                    )}

                    {uploadedFileUrl && (
                      <button
                        type="button"
                        onClick={() => setResultSubTab('split')}
                        className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          resultSubTab === 'split'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Split className="w-3.5 h-3.5" />
                        <span>Dividida</span>
                      </button>
                    )}

                    {scanResult.rows.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setResultSubTab('table')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          resultSubTab === 'table'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        Tabla
                      </button>
                    )}

                    <button
                      type="button"
                      id="btn-scan-another"
                      onClick={handleReset}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Procesar otro archivo PDF"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Nuevo</span>
                    </button>
                  </div>
                </div>

                {/* Sub-view rendering */}
                {resultSubTab === 'caraA' && (scanResult.caraAData || scanResult.caraAList) && (
                  <CaraAViewer
                    data={
                      (scanResult.caraAList && scanResult.caraAList[selectedCaraAIndex]) ||
                      scanResult.caraAData!
                    }
                    onDataChange={handleCaraADataChange}
                    onAddToDatabase={handleAddToDatabase}
                    onTriggerToast={triggerToast}
                    isFirstScan={!isCustomNew}
                    activeDbName={linkedFileName}
                    activeRowCount={excelDatabaseRows.length}
                    isCustomNew={isCustomNew}
                    alreadyAdded={excelDatabaseRows.some(
                      r => {
                        const currentItem = (scanResult.caraAList && scanResult.caraAList[selectedCaraAIndex]) || scanResult.caraAData;
                        return (currentItem?._rowId && r.id === currentItem._rowId) ||
                          (currentItem?.numeroIdentificacion && r.documento && r.documento.trim() === currentItem.numeroIdentificacion.trim());
                      }
                    )}
                    allCaraARecords={scanResult.caraAList}
                    currentIndex={selectedCaraAIndex}
                    onSelectIndex={(idx) => {
                      setSelectedCaraAIndex(idx);
                      if (scanResult.caraAList && scanResult.caraAList[idx]) {
                        setScanResult(prev => prev ? { ...prev, caraAData: scanResult.caraAList![idx] } : prev);
                      }
                    }}
                    onAddAllToDatabase={handleAddAllCaraAToDatabase}
                    fileUrl={uploadedFileUrl}
                    fileName={uploadedFile?.name || `${scanResult.documentTitle}.pdf`}
                    fileType={uploadedFile?.type || 'application/pdf'}
                    allRows={excelDatabaseRows}
                    onRowsUpdate={setExcelDatabaseRows}
                  />
                )}

                {resultSubTab === 'split' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <div className="h-[650px] bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                      {uploadedFileUrl ? (
                        <DocumentViewer fileUrl={uploadedFileUrl} fileName={uploadedFile?.name || ''} />
                      ) : (
                        <div className="h-full flex items-center justify-center p-8 text-center text-slate-400">
                          <p className="text-xs">Documento de muestra en memoria (no hay archivo PDF físico cargado)</p>
                        </div>
                      )}
                    </div>
                    <div>
                      {scanResult.caraAData || scanResult.caraAList ? (
                        <CaraAViewer
                          data={
                            (scanResult.caraAList && scanResult.caraAList[selectedCaraAIndex]) ||
                            scanResult.caraAData!
                          }
                          onDataChange={handleCaraADataChange}
                          onAddToDatabase={handleAddToDatabase}
                          onTriggerToast={triggerToast}
                          isFirstScan={!isCustomNew}
                          activeDbName={linkedFileName}
                          activeRowCount={excelDatabaseRows.length}
                          isCustomNew={isCustomNew}
                          alreadyAdded={excelDatabaseRows.some(
                            r => {
                              const currentItem = (scanResult.caraAList && scanResult.caraAList[selectedCaraAIndex]) || scanResult.caraAData;
                              return (currentItem?._rowId && r.id === currentItem._rowId) ||
                                (currentItem?.numeroIdentificacion && r.documento && r.documento.trim() === currentItem.numeroIdentificacion.trim());
                            }
                          )}
                          allCaraARecords={scanResult.caraAList}
                          currentIndex={selectedCaraAIndex}
                          onSelectIndex={(idx) => {
                            setSelectedCaraAIndex(idx);
                            if (scanResult.caraAList && scanResult.caraAList[idx]) {
                              setScanResult(prev => prev ? { ...prev, caraAData: scanResult.caraAList![idx] } : prev);
                            }
                          }}
                          onAddAllToDatabase={handleAddAllCaraAToDatabase}
                          fileUrl={uploadedFileUrl}
                          fileName={uploadedFile?.name || `${scanResult.documentTitle}.pdf`}
                          fileType={uploadedFile?.type || 'application/pdf'}
                          allRows={excelDatabaseRows}
                          onRowsUpdate={setExcelDatabaseRows}
                        />
                      ) : (
                        <DataTable
                          columns={scanResult.columns}
                          rows={scanResult.rows}
                          onRowsChange={handleRowsChange}
                        />
                      )}
                    </div>
                  </div>
                )}

                {resultSubTab === 'table' && (
                  <div className="space-y-4">
                    <ExportBar
                      columns={scanResult.columns}
                      rows={scanResult.rows}
                      documentTitle={scanResult.documentTitle}
                      options={options}
                      delimiter={options.delimiter}
                      onOptionsChange={setOptions}
                      onReset={handleReset}
                    />
                    <DataTable
                      columns={scanResult.columns}
                      rows={scanResult.rows}
                      onRowsChange={handleRowsChange}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EXCEL DATABASE MANAGER (27 COLUMNS) */}
        {activeTab === 'database' && (
          <ExcelDatabaseManager
            rows={excelDatabaseRows}
            onRowsChange={setExcelDatabaseRows}
            onTriggerToast={triggerToast}
            linkedFileName={linkedFileName}
            onLinkedFileNameChange={setLinkedFileName}
            onStartNewBlankDatabase={handleStartNewBlankDatabase}
            isCustomNew={isCustomNew}
          />
        )}

        {/* TAB 3: SESSION QUEUE & HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <SessionQueue
              records={sessionQueue}
              onSelectRecord={handleSelectHistoryRecord}
              onClearQueue={() => {
                if (window.confirm('¿Deseas vaciar el historial de la sesión?')) {
                  setSessionQueue([]);
                  triggerToast('Historial de sesión vaciado');
                }
              }}
              selectedId={selectedQueueId}
            />

            {/* Quick reminder box */}
            <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 space-y-2">
              <div className="flex items-center space-x-2 text-slate-900 font-bold">
                <Info className="w-4 h-4 text-blue-600" />
                <span>¿Cómo funciona el flujo de trabajo continuo?</span>
              </div>
              <p>
                1. <b>Primer PDF:</b> Al ingresar la primera ficha, el sistema inicializa una base limpia con esa ficha como Fila #1.
              </p>
              <p>
                2. <b>Fichas siguientes:</b> Si tienes activa la opción <i>"Alimentación Automática"</i> en la barra superior, cada nuevo PDF que cargues se sumará automáticamente a la base de datos sin pasos manuales.
              </p>
              <p>
                3. <b>Exportación a Excel:</b> En la pestaña <b>"Base de Datos Excel"</b> puedes pulsar <i>"Descargar Base (.xlsx)"</i> para obtener el archivo completo con sus 27 columnas ordenadas, o <i>"Copiar todo (Ctrl + V)"</i> para pegarlo directamente en tu hoja de cálculo.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
