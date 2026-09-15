import express from 'express';
import path from 'path';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for scanned PDF and high-res image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy-initialized Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables.');
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

interface ModelQueueItem {
  model: string;
  isGemini3?: boolean;
  thinkingLevel?: ThinkingLevel;
  timeoutMs?: number;
}

// Fast models list: prioritizes stable, high-throughput models with verified low latency and reliable document OCR
const getModelQueue = (speedMode?: string): ModelQueueItem[] => {
  return [
    { model: 'gemini-3.1-flash-lite', timeoutMs: 90000 },
    { model: 'gemini-flash-lite-latest', timeoutMs: 90000 },
    { model: 'gemini-3.5-flash-lite', timeoutMs: 90000 },
    { model: 'gemini-3.8-flash', timeoutMs: 90000 },
    { model: 'gemini-flash-latest', timeoutMs: 90000 },
    { model: 'gemini-3.1-flash-lite-preview', timeoutMs: 90000 },
  ];
};

const waitMs = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callGeminiWithRetry(client: GoogleGenAI, payload: any, speedMode?: string): Promise<{ response: any; modelUsed: string }> {
  let lastError: any = null;
  const models = getModelQueue(speedMode);

  for (const { model, timeoutMs } of models) {
    const modelPayload = {
      ...payload,
      model,
      config: payload.config,
    };

    try {
      console.log(`[Gemini] Scanning document with model: ${model}`);
      const startTime = Date.now();

      const generatePromise = client.models.generateContent(modelPayload);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout waiting for model ${model} response (${(timeoutMs || 90000) / 1000}s)`)), timeoutMs || 90000)
      );

      const response: any = await Promise.race([generatePromise, timeoutPromise]);
      console.log(`[Gemini] Response received in ${Date.now() - startTime}ms using ${model}`);
      return { response, modelUsed: model };
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || err?.toString() || '';
      // If 503 or overload, switch immediately to next candidate without delay
      if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE')) {
        console.warn(`[Gemini Notice] Model ${model} is experiencing temporary high demand (503). Switching to next candidate...`);
      } else {
        console.warn(`[Gemini Notice] Model ${model} could not process request (${errMsg.slice(0, 120)}). Trying next candidate...`);
      }
    }

    await waitMs(50);
  }

  // If all models encountered a momentary spike during the first pass, do a quick retry on fast lite models
  console.warn('[Gemini Notice] Initial pass exhausted. Performing short backoff retry with fast lite models...');
  await waitMs(1200);

  const fallbackModels = ['gemini-3.1-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash-lite'];
  for (const fallbackModel of fallbackModels) {
    try {
      console.log(`[Gemini Fallback] Retrying scan with: ${fallbackModel}`);
      const startTime = Date.now();
      const response: any = await client.models.generateContent({
        ...payload,
        model: fallbackModel,
        config: payload.config,
      });
      console.log(`[Gemini Fallback] Succeeded in ${Date.now() - startTime}ms using ${fallbackModel}`);
      return { response, modelUsed: fallbackModel };
    } catch (fallbackErr: any) {
      lastError = fallbackErr;
      console.warn(`[Gemini Fallback] Model ${fallbackModel} failed:`, fallbackErr?.message?.slice(0, 100));
    }
    await waitMs(300);
  }

  console.error('[Gemini Error] All candidate models exhausted:', lastError?.message || lastError);
  throw lastError;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const hasValidOpenAIKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-');
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    hasOpenAIKey: hasValidOpenAIKey,
    timestamp: new Date().toISOString(),
  });
});

// AI Providers status endpoint
app.get('/api/ai-providers', (req, res) => {
  const hasValidOpenAIKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-');
  res.json({
    gemini: {
      available: !!process.env.GEMINI_API_KEY,
      models: ['gemini-3.1-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'],
      active: true,
    },
    openai: {
      available: hasValidOpenAIKey,
      model: 'gpt-4o',
      active: hasValidOpenAIKey,
    },
  });
});

// OpenAI ChatGPT Failover Transcriber
async function callOpenAIFallback(
  cleanFileData: string,
  effectiveMime: string,
  fileName: string,
  systemInstruction: string,
  promptText: string
): Promise<{ text: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !apiKey.startsWith('sk-')) {
    throw new Error('La clave OPENAI_API_KEY configurada no es válida (debe comenzar con "sk-" o "sk-proj-").');
  }

  console.log('[OpenAI] Initiating failover scan with ChatGPT gpt-4o...');
  const startTime = Date.now();

  const userContent: any[] = [];
  if (effectiveMime === 'application/pdf') {
    userContent.push({
      type: 'file',
      file: {
        filename: fileName || 'documento.pdf',
        file_data: `data:application/pdf;base64,${cleanFileData}`,
      },
    });
  } else {
    userContent.push({
      type: 'image_url',
      image_url: {
        url: `data:${effectiveMime};base64,${cleanFileData}`,
      },
    });
  }

  userContent.push({
    type: 'text',
    text: `${promptText}\n\nResponde ÚNICAMENTE en JSON válido con el esquema especificado (documentTitle, detectedTemplate, caraAData, caraAList, columns, rows).`,
  });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemInstruction,
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[OpenAI Error]', response.status, errText);
    throw new Error(`OpenAI error (${response.status}): ${errText}`);
  }

  const json: any = await response.json();
  const choice = json.choices?.[0]?.message?.content || '{}';
  console.log(`[OpenAI] Succeeded in ${Date.now() - startTime}ms`);
  return { text: choice };
}

// Main PDF / Document Scanner and Transcriber Endpoint
app.post('/api/scan-pdf', async (req, res) => {
  try {
    const { fileData, mimeType, fileName, templateHint, speedMode } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: 'fileData (base64) is required.' });
    }

    // Clean base64 string: remove data URL prefix, linebreaks and whitespace
    let cleanFileData = String(fileData).trim();
    if (cleanFileData.includes(';base64,')) {
      cleanFileData = cleanFileData.split(';base64,')[1];
    }
    cleanFileData = cleanFileData.replace(/[\r\n\s]+/g, '');

    if (!cleanFileData || cleanFileData.length < 20) {
      return res.status(400).json({ error: 'El archivo enviado no contiene datos válidos en base64.' });
    }

    // Auto-detect MIME type from magic bytes to guarantee Gemini compatibility
    let effectiveMime = mimeType || 'application/pdf';
    if (cleanFileData.startsWith('JVBERi')) {
      effectiveMime = 'application/pdf';
    } else if (cleanFileData.startsWith('iVBORw0KGgo')) {
      effectiveMime = 'image/png';
    } else if (cleanFileData.startsWith('/9j/')) {
      effectiveMime = 'image/jpeg';
    } else if (cleanFileData.startsWith('UklGR')) {
      effectiveMime = 'image/webp';
    } else if (fileName) {
      const lowerName = fileName.toLowerCase();
      if (lowerName.endsWith('.pdf')) effectiveMime = 'application/pdf';
      else if (lowerName.endsWith('.png')) effectiveMime = 'image/png';
      else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) effectiveMime = 'image/jpeg';
      else if (lowerName.endsWith('.webp')) effectiveMime = 'image/webp';
    }

    const client = getGeminiClient();

    const systemInstruction = `
Eres un analista y digitador experto de vigilancia en salud pública (SIVIGILA D.C. / SISVESO - Sistema de Vigilancia Epidemiológica de la Salud Oral - Evento 2303, Subred Sur E.S.E., Secretaría Distrital de Salud de Bogotá).

REGLA DE ORO 1 - TEXTOS O ANOTACIONES EN COLOR/TINTA ROJA (CORRECCIONES Y ACLARACIONES):
En las fichas y documentos es muy habitual que el auditor, profesional o digitador escriba textos, números o anotaciones en COLOR ROJO (tinta roja, lapicero rojo, marcador rojo).
ESTAS ANOTACIONES TIENEN DOS PROPÓSITOS FUNDAMENTALES Y MÁXIMA PRIORIDAD:
1. CORRECCIÓN DE ERRORES: Si corrigen un dato erróneo o desactualizado (ej: tachan "Venecia" y escriben "EL PARAISO", o corrigen la dirección, estrato o cédula).
2. ACLARACIÓN DE CALIGRAFÍA MÉDICA ILEGIBLE: Cuando la letra del doctor o profesional no se entiende con claridad y se escribe en rojo encima o al lado para aclarar qué dice con exactitud.
EN AMBOS CASOS:
- VALOR FINAL DEL CAMPO: Extrae SIEMPRE el texto legible en rojo como el dato oficial del campo (ej: si aclararon el nombre, barrio o dirección en rojo, toma exactamente lo que dice en rojo).
- REGISTRO OBLIGATORIO EN OBSERVACIONES: Es OBLIGATORIO registrar en 'observacionesSugeridas', en 'hallazgosAuditoria' y en 'correccionesEnRojo':
  * "CORRECCION EN ROJO: [CAMPO]" (o si es aclaración: "ACLARACION EN ROJO: [CAMPO]")
  * Ejemplos: "ACLARACION EN ROJO: BARRIO", "CORRECCION EN ROJO: DIRECCION", "ACLARACION EN ROJO: LETRA MEDICO NOMBRE", "CORRECCION EN ROJO: ESTRATO", etc.

REGLA DE ORO 2 - MULTI-PÁGINA Y TODAS LAS CARA A DEL DOCUMENTO:
Un solo archivo PDF o documento escaneado puede contener VARIAS FICHAS CARA A (por ejemplo, un paquete con 2, 4, 10 o más fichas de diferentes pacientes en distintas páginas).
¡DEBES EXTRAER TODAS Y CADA UNA DE ELLAS!
- En el arreglo 'caraAList', añade un objeto completo para CADA Ficha Cara A encontrada en el documento, paciente por paciente y hoja por hoja.
- En 'caraAData', coloca la primera de las fichas encontradas (para compatibilidad de vista principal).
- No omitas ninguna ficha o paciente del documento.

TU MISIÓN DE EXTRACCIÓN:
1. Para CADA FICHA INDIVIDUAL DE NOTIFICACIÓN (SIVIGILA CARA A / HOJA 1):
   - Extrae con máxima fidelidad cada casilla de la CARA A.
   - Divide los nombres del paciente en: PRIMER_NOMBRE, SEGUNDO_NOMBRE, PRIMER_APELLIDO, SEGUNDO_APELLIDO.
   - Si el nombre está completo en un solo renglón (ej: "DAVID FERNANDO ROZO OLIVEROS"):
     * primerNombre: "DAVID"
     * segundoNombre: "FERNANDO"
     * primerApellido: "ROZO"
     * segundoApellido: "OLIVEROS"
   - CÓDIGO UPGD: Combina departamento (001), municipio (3029) y código de 3-4 dígitos (ej: 414 -> "110013029414").
   - TIPO DE DOCUMENTO: Extrae el código numérico (1=CNV, 2=RC, 3=TI, 4=CC, 5=PEP, 6=CE, 7=PA, 8=MSI, 9=ASI, 10=PPT, 11=SC, 12=DE, 13=CDO) y la sigla (ej: 3 y TI).
   - NÚMERO DE IDENTIFICACIÓN: Transcribe únicamente los dígitos que se ven sin alterar (o el corregido en rojo si aplica).
   - AUDITORÍA / RETROALIMENTACIÓN: Identifica fallas comunes, aclaraciones y correcciones para alimentar la columna OBSERVACIONES de la base:
     * Si hay texto/aclaración en rojo -> "ACLARACION EN ROJO: [campo]" o "CORRECCION EN ROJO: [campo]"
     * Si el barrio está tachado, dudoso o tiene dos nombres (ej: "EL PARAISO" y "Venecia") -> "ERROR EN BARRIO" o "ERROR EN BARRIO DE RESIDENCIA".
     * Si la dirección no tiene nomenclatura estándar -> "ERROR EN ESTRUCTURA DE DIRECCION".
     * Si no tiene código de ocupación -> "NO CODIGO OCUPACION".
     * Si el estrato no está marcado o no coincide -> "ERROR EN ESTRATO".
     * Si el tipo de aseguramiento no está marcado -> "ERROR EN TIPO DE ASEGURAMIENTO".
     * Si el área rural está vacía -> "PACIENTE RESIDE EN AREA RURAL VACIO".
     * Si no hay errores ni correcciones -> "SIN OBSERVACIONES / CUMPLE".

2. Si el documento es una TABLA O CONSOLIDADO DE CARACTERIZACIÓN (múltiples filas como Adultos, Gestantes, etc.):
   - Extrae todas las filas de la tabla con sus respectivas columnas.
   - Si hay notas o textos en rojo, déjalos explícitos en su respectiva columna de observaciones.
`;

    const promptText = `
Analiza y extrae este documento (${fileName || 'documento'}).
REVISA CON ATENCIÓN ESPECIAL:
1. Si el documento contiene MÚLTIPLES FICHAS CARA A (varios pacientes u hojas), EXTRAE TODAS en el arreglo 'caraAList'.
2. Si hay TEXTO O ANOTACIONES EN COLOR/TINTA ROJA (aclaraciones de caligrafía médica de doctores o correcciones de datos), úsalas como el valor legible y regístralas en 'observacionesSugeridas', 'hallazgosAuditoria' y 'correccionesEnRojo'.
3. Extrae también 'caraAData' para la primera ficha y genera las filas de la tabla para todas las fichas encontradas.
`;

    const caraASchemaProperties = {
      anio: { type: Type.STRING },
      codigoEvento: { type: Type.STRING },
      nombreEvento: { type: Type.STRING },
      codigoUpgd: { type: Type.STRING },
      nombreUpgd: { type: Type.STRING },
      localidadNotificadora: { type: Type.STRING },
      tipoIdCodigo: { type: Type.STRING },
      tipoIdSigla: { type: Type.STRING },
      numeroIdentificacion: { type: Type.STRING },
      fechaNacimiento: { type: Type.STRING },
      edad: { type: Type.STRING },
      unidadMedida: { type: Type.STRING },
      nombreCompleto: { type: Type.STRING },
      primerNombre: { type: Type.STRING },
      segundoNombre: { type: Type.STRING },
      primerApellido: { type: Type.STRING },
      segundoApellido: { type: Type.STRING },
      telefono: { type: Type.STRING },
      sexo: { type: Type.STRING },
      deptoResidencia: { type: Type.STRING },
      mpioResidencia: { type: Type.STRING },
      pacienteResideAreaRural: { type: Type.STRING },
      direccionResidencia: { type: Type.STRING },
      estrato: { type: Type.STRING },
      localidadResidencia: { type: Type.STRING },
      barrioResidencia: { type: Type.STRING },
      ocupacion: { type: Type.STRING },
      codigoOcupacion: { type: Type.STRING },
      pertenenciaEtnica: { type: Type.STRING },
      grupoPoblacional: { type: Type.STRING },
      tipoAseguramiento: { type: Type.STRING },
      entidadAdministradora: { type: Type.STRING },
      fechaConsulta: { type: Type.STRING },
      nombreOdontologo: { type: Type.STRING },
      telefonoProfesional: { type: Type.STRING },
      observacionesSugeridas: { type: Type.STRING },
      hallazgosAuditoria: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      correccionesEnRojo: {
        type: Type.ARRAY,
        description: 'Lista de correcciones, aclaraciones de caligrafía o textos en tinta roja detectados',
        items: { type: Type.STRING },
      },
    };

    let response: any = null;
    let engineUsed = 'Google Gemini (Flash-Lite)';

    try {
      const geminiResult = await callGeminiWithRetry(client, {
      contents: [
        {
          inlineData: {
            mimeType: effectiveMime,
            data: cleanFileData,
          },
        },
        {
          text: promptText,
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documentTitle: {
              type: Type.STRING,
              description: 'El título del formato detectado.',
            },
            detectedTemplate: {
              type: Type.STRING,
              description: 'SISVESO_CARA_A | ADULTOS | GESTANTES | MENORES_5 | RECIEN_NACIDOS | GENERAL',
            },
            templateName: {
              type: Type.STRING,
              description: 'Nombre descriptivo de la plantilla detectada.',
            },
            totalPages: {
              type: Type.INTEGER,
              description: 'Número de páginas procesadas.',
            },
            caraAData: {
              type: Type.OBJECT,
              description: 'Datos de la primera Ficha SIVIGILA Cara A / SISVESO',
              properties: caraASchemaProperties,
            },
            caraAList: {
              type: Type.ARRAY,
              description: 'Lista con TODAS las Fichas Cara A encontradas en el documento (una por cada hoja o paciente). Si el PDF tiene múltiples fichas Cara A, añade cada una aquí.',
              items: {
                type: Type.OBJECT,
                properties: caraASchemaProperties,
              },
            },
            columns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  key: { type: Type.STRING, description: 'Clave identificadora' },
                  label: { type: Type.STRING, description: 'Etiqueta legible del encabezado' },
                },
                required: ['key', 'label'],
              },
            },
            rows: {
              type: Type.ARRAY,
              description: 'Filas extraídas de la tabla',
              items: {
                type: Type.OBJECT,
                properties: {
                  rowNumber: { type: Type.INTEGER, description: 'Número de fila' },
                  values: {
                    type: Type.ARRAY,
                    description: 'Valores en el mismo orden de columns',
                    items: { type: Type.STRING },
                  },
                },
                required: ['rowNumber'],
              },
            },
          },
          required: ['documentTitle', 'detectedTemplate', 'columns', 'rows'],
        },
      },
    }, speedMode);
      response = geminiResult.response;
      engineUsed = `Google Gemini (${geminiResult.modelUsed})`;
    } catch (geminiError: any) {
      console.warn('[Gemini Notice] Gemini issue encountered:', geminiError?.message);
      const hasValidOpenAIKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-');
      if (hasValidOpenAIKey) {
        console.log('[OpenAI Failover] Using ChatGPT (gpt-4o)...');
        try {
          response = await callOpenAIFallback(
            cleanFileData,
            effectiveMime,
            fileName || 'documento.pdf',
            systemInstruction,
            promptText
          );
          engineUsed = 'OpenAI ChatGPT (gpt-4o)';
        } catch (openAiError: any) {
          console.error('[OpenAI Fallback Error]:', openAiError);
          throw new Error(`Error en servicio de IA: ${geminiError?.message || geminiError}. Respaldo OpenAI: ${openAiError?.message || openAiError}`);
        }
      } else {
        throw geminiError;
      }
    }

    let textOutput = (typeof response.text === 'string' ? response.text : '').trim();
    if (!textOutput && response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          textOutput += part.text;
        }
      }
      textOutput = textOutput.trim();
    }

    // Strip markdown code fences if present
    if (textOutput.includes('```')) {
      textOutput = textOutput.replace(/```(?:json)?\s*/gi, '').replace(/\s*```/g, '').trim();
    }

    let parsedData: any = {};
    try {
      parsedData = JSON.parse(textOutput);
    } catch (parseErr) {
      const firstBrace = textOutput.indexOf('{');
      const lastBrace = textOutput.lastIndexOf('}');
      const firstBracket = textOutput.indexOf('[');
      const lastBracket = textOutput.lastIndexOf(']');

      let parsed = false;
      if (firstBracket !== -1 && lastBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
        try {
          parsedData = JSON.parse(textOutput.slice(firstBracket, lastBracket + 1));
          parsed = true;
        } catch {}
      }
      if (!parsed && firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          parsedData = JSON.parse(textOutput.slice(firstBrace, lastBrace + 1));
          parsed = true;
        } catch (innerErr) {
          console.warn('[AI Parse Notice] Could not parse sliced JSON:', innerErr);
          parsedData = {};
        }
      }
    }

    // If AI returned an Array directly (e.g. [ { caraAData: ... } ] or [ { primerNombre: ... } ])
    if (Array.isArray(parsedData)) {
      const items = parsedData;
      const caraAItems = items
        .filter(it => it && typeof it === 'object' && (it.caraAData || it.numeroIdentificacion || it.nombreCompleto || it.primerNombre || it.codigoUpgd || it.nombreEvento))
        .map(it => it.caraAData || it);

      if (caraAItems.length > 0) {
        parsedData = {
          documentTitle: fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ').toUpperCase() : 'FICHA SIVIGILA / SISVESO',
          caraAList: caraAItems,
          caraAData: caraAItems[0],
        };
      } else if (items.length > 0 && typeof items[0] === 'object') {
        parsedData = {
          documentTitle: fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ').toUpperCase() : 'DOCUMENTO SIVIGILA',
          caraAList: items,
          caraAData: items[0],
        };
      } else {
        parsedData = {};
      }
    }

    // If Gemini/OpenAI placed items inside alternative list keys (fichas, carasA, pacientes, documentos, data)
    const possibleLists = [
      parsedData.caraAList,
      parsedData.fichas,
      parsedData.carasA,
      parsedData.pacientes,
      parsedData.registros,
      parsedData.documentos,
      parsedData.data?.caraAList,
      parsedData.data?.fichas,
      parsedData.data?.carasA,
    ].find(l => Array.isArray(l) && l.length > 0);

    if (possibleLists) {
      parsedData.caraAList = possibleLists.map((it: any) => it.caraAData || it);
      if (!parsedData.caraAData) {
        parsedData.caraAData = parsedData.caraAList[0];
      }
    }

    // Normalizer helper for Cara A red annotations and observations
    const normalizeCaraAItem = (c: any) => {
      if (!c || typeof c !== 'object') return;
      if (Array.isArray(c.correccionesEnRojo) && c.correccionesEnRojo.length > 0) {
        const redSummary = c.correccionesEnRojo.map((cr: string) => {
          if (cr.toUpperCase().includes('CORRECCION') || cr.toUpperCase().includes('ACLARACION')) {
            return cr;
          }
          return `CORRECCION/ACLARACION EN ROJO: ${cr}`;
        }).join(', ');

        if (!c.observacionesSugeridas || c.observacionesSugeridas.includes('SIN OBSERVACIONES') || c.observacionesSugeridas.includes('CUMPLE')) {
          c.observacionesSugeridas = redSummary;
        } else if (!c.observacionesSugeridas.toLowerCase().includes('rojo')) {
          c.observacionesSugeridas = `${c.observacionesSugeridas}, ${redSummary}`;
        }

        if (!Array.isArray(c.hallazgosAuditoria)) {
          c.hallazgosAuditoria = [];
        }
        c.correccionesEnRojo.forEach((cr: string) => {
          const item = (cr.toUpperCase().includes('CORRECCION') || cr.toUpperCase().includes('ACLARACION'))
            ? cr
            : `Anotación/Aclaración en tinta roja: ${cr}`;
          if (!c.hallazgosAuditoria.includes(item)) {
            c.hallazgosAuditoria.unshift(item);
          }
        });
      }
    };

    // If Gemini placed Cara A fields at the root of parsedData instead of inside caraAData
    if (!parsedData.caraAData && !parsedData.caraAList && (
      parsedData.numeroIdentificacion ||
      parsedData.primerNombre ||
      parsedData.nombreCompleto ||
      parsedData.codigoUpgd ||
      parsedData.nombreEvento ||
      parsedData.direccionResidencia
    )) {
      parsedData.caraAData = { ...parsedData };
      parsedData.caraAList = [parsedData.caraAData];
    }

    // Consolidate caraAList and caraAData
    if (Array.isArray(parsedData.caraAList) && parsedData.caraAList.length > 0) {
      parsedData.caraAList.forEach(normalizeCaraAItem);
      if (!parsedData.caraAData) {
        parsedData.caraAData = parsedData.caraAList[0];
      } else {
        normalizeCaraAItem(parsedData.caraAData);
      }
    } else if (parsedData.caraAData) {
      normalizeCaraAItem(parsedData.caraAData);
      parsedData.caraAList = [parsedData.caraAData];
    }

    // Ensure document metadata defaults
    if (!parsedData.documentTitle) {
      parsedData.documentTitle = fileName
        ? fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ').toUpperCase()
        : 'FICHA SIVIGILA / SISVESO';
    }
    if (!parsedData.detectedTemplate) {
      parsedData.detectedTemplate = 'SISVESO_CARA_A';
    }
    if (!parsedData.templateName) {
      parsedData.templateName = 'Ficha de Notificación SIVIGILA / SISVESO Cara A';
    }
    if (!parsedData.totalPages) {
      parsedData.totalPages = Array.isArray(parsedData.caraAList) ? Math.max(parsedData.caraAList.length, 1) : 1;
    }

    // If no caraAData and no rows were extracted (e.g. empty or faint scan), synthesize a starter Cara A structure
    if (!parsedData.caraAData && (!parsedData.caraAList || parsedData.caraAList.length === 0) && (!parsedData.rows || parsedData.rows.length === 0)) {
      const fallbackRecord = {
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
        observacionesSugeridas: 'DOCUMENTO EN REVISIÓN MANUAL',
        hallazgosAuditoria: ['Documento cargado para digitación / verificación manual'],
        correccionesEnRojo: [],
      };
      parsedData.caraAData = fallbackRecord;
      parsedData.caraAList = [fallbackRecord];
    }

    let cols = parsedData.columns || [];

    // If we have Cara A records (either single or multi), construct tabular rows
    if (parsedData.caraAList && parsedData.caraAList.length > 0 && (cols.length === 0 || !parsedData.rows || parsedData.rows.length === 0)) {
      cols = [
        { key: 'NOMBRE_UPGD', label: 'NOMBRE UPGD' },
        { key: 'CODIGO_UPGD', label: 'CÓDIGO UPGD' },
        { key: 'DOCUMENTO', label: 'N° DOCUMENTO' },
        { key: 'TIPO_ID', label: 'TIPO ID' },
        { key: 'PRIMER_NOMBRE', label: 'PRIMER NOMBRE' },
        { key: 'SEGUNDO_NOMBRE', label: 'SEGUNDO NOMBRE' },
        { key: 'PRIMER_APELLIDO', label: 'PRIMER APELLIDO' },
        { key: 'SEGUNDO_APELLIDO', label: 'SEGUNDO APELLIDO' },
        { key: 'FECHA_CONSULTA', label: 'FECHA CONSULTA' },
        { key: 'NOMBRE_ODONTOLOGO', label: 'ODONTÓLOGO' },
        { key: 'DIRECCION', label: 'DIRECCIÓN' },
        { key: 'BARRIO', label: 'BARRIO' },
        { key: 'OBSERVACIONES', label: 'OBSERVACIONES' },
      ];
      parsedData.columns = cols;
      parsedData.rows = parsedData.caraAList.map((c: any, idx: number) => ({
        rowNumber: idx + 1,
        data: {
          NOMBRE_UPGD: c.nombreUpgd || '',
          CODIGO_UPGD: c.codigoUpgd || '',
          DOCUMENTO: c.numeroIdentificacion || '',
          TIPO_ID: c.tipoIdSigla || c.tipoIdCodigo || '',
          PRIMER_NOMBRE: c.primerNombre || '',
          SEGUNDO_NOMBRE: c.segundoNombre || '',
          PRIMER_APELLIDO: c.primerApellido || '',
          SEGUNDO_APELLIDO: c.segundoApellido || '',
          FECHA_CONSULTA: c.fechaConsulta || '',
          NOMBRE_ODONTOLOGO: c.nombreOdontologo || '',
          DIRECCION: c.direccionResidencia || '',
          BARRIO: c.barrioResidencia || '',
          OBSERVACIONES: c.observacionesSugeridas || 'SIN OBSERVACIONES / CUMPLE',
        },
      }));
    }

    // Normalize rows into key-value data maps so the frontend gets complete records
    const normalizedRows = (parsedData.rows || []).map((r: any, idx: number) => {
      const rowData: Record<string, string> = {};
      if (Array.isArray(r.values)) {
        r.values.forEach((val: any, colIdx: number) => {
          const col = cols[colIdx];
          if (col && col.key) {
            rowData[col.key] = val !== undefined && val !== null ? String(val).trim() : '';
          }
        });
      } else if (Array.isArray(r.cells)) {
        for (const cell of r.cells) {
          if (cell && cell.key) {
            rowData[cell.key] = cell.value !== undefined && cell.value !== null ? String(cell.value).trim() : '';
          }
        }
      } else if (r.data && typeof r.data === 'object') {
        for (const [k, v] of Object.entries(r.data)) {
          rowData[k] = v !== undefined && v !== null ? String(v).trim() : '';
        }
      }

      return {
        rowNumber: r.rowNumber || idx + 1,
        pageNumber: r.pageNumber || 1,
        data: rowData,
      };
    });

    res.json({
      success: true,
      aiEngine: engineUsed,
      result: {
        ...parsedData,
        columns: cols,
        rows: normalizedRows,
      },
    });
  } catch (error: any) {
    console.error('Error scanning PDF:', error);
    let userFriendlyMessage = error?.message || 'Error al procesar el archivo con el servicio de IA.';
    const isOverloaded =
      userFriendlyMessage.includes('503') ||
      userFriendlyMessage.includes('UNAVAILABLE') ||
      userFriendlyMessage.includes('high demand') ||
      userFriendlyMessage.includes('429') ||
      userFriendlyMessage.includes('quota') ||
      userFriendlyMessage.includes('Timeout') ||
      userFriendlyMessage.includes('exhausted');

    if (isOverloaded) {
      userFriendlyMessage = 'El servicio de IA experimentó una demora momentánea o alta demanda. Por favor presiona "Reintentar escaneo".';
    }

    res.status(503).json({
      error: userFriendlyMessage,
      details: error.toString(),
      isRetryable: isOverloaded,
    });
  }
});

// Vite & Static file serving setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
