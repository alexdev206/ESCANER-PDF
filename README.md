# Escáner y Transcriptor de PDF a CSV Estructurado

Aplicación web local y full-stack diseñada para escanear, leer con IA multimodal y transcribir con alta fidelidad documentos PDF o imágenes escaneadas (fichas de caracterización poblacional, historias clínicas, formatos de salud pública como Subred Sur / SISVAN), y exportar automáticamente los resultados a archivos CSV y Excel.

---

## 🚀 Cómo ejecutar en entorno local

### 1. Requisitos previos
* **Node.js**: Versión 18 o superior instalada ([nodejs.org](https://nodejs.org)).
* **Clave de API de Gemini**: Una API Key gratuita de Google AI Studio ([aistudio.google.com](https://aistudio.google.com)).

### 2. Instalación de dependencias
Abre una terminal en la carpeta del proyecto y ejecuta:
```bash
npm install
```

### 3. Configuración de variables de entorno
Copia el archivo `.env.example` a un nuevo archivo llamado `.env`:
```bash
cp .env.example .env
```
Abre el archivo `.env` y coloca tu API key:
```env
GEMINI_API_KEY=tu_api_key_aqui
```

### 4. Iniciar el servidor local
```bash
npm run dev
```
La aplicación estará disponible inmediatamente en tu navegador en:
```
http://localhost:3000
```

---

## 📁 Estructura del Proyecto

```
├── .env.example              # Declaración de variables requeridas (GEMINI_API_KEY)
├── .gitignore                # Archivos ignorados por Git y exportaciones
├── index.html                # Entrada principal HTML
├── metadata.json             # Metadatos de la aplicación
├── package.json              # Dependencias y scripts de ejecución
├── tsconfig.json             # Configuración de TypeScript
├── vite.config.ts            # Configuración de Vite y plugins
├── server.ts                 # Backend Express con integración Gemini y reintentos
├── README.md                 # Guía de instalación y documentación
└── src/
    ├── main.tsx              # Punto de montaje de React
    ├── App.tsx               # Controlador principal del flujo (Escaneo -> Revisión -> CSV)
    ├── index.css             # Estilos globales con Tailwind CSS
    ├── types.ts              # Interfaces y tipos de TypeScript
    ├── components/
    │   ├── Navbar.tsx        # Barra superior con estado del servidor e indicadores
    │   ├── UploadZone.tsx    # Zona drag & drop, selector de archivos y muestras rápidas
    │   ├── ScanningProgress.tsx # Indicador visual de progreso y fases de escaneo
    │   ├── DataTable.tsx     # Tabla interactiva con edición en celda y filtros
    │   ├── DocumentViewer.tsx# Visualizador del PDF/imagen original con zoom y rotación
    │   └── ExportBar.tsx     # Botones de descarga CSV, Excel (.xlsx) y copia TSV
    ├── data/
    │   └── samplePdfs.ts     # Muestras precargadas (Adultos, Gestantes, Menores de 5)
    └── utils/
        ├── imageOptimizer.ts # Compresión inteligente en el navegador para subida instantánea
        ├── validation.ts     # Validaciones de cédulas, teléfonos, fechas y plantillas
        └── export.ts         # Generador de CSV (con BOM UTF-8) y hojas de cálculo Excel
```

---

## 🛠️ Tecnologías utilizadas
* **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React, Motion.
* **Backend**: Node.js, Express, TSX, Vite Middleware.
* **Inteligencia Artificial**: `@google/genai` con `gemini-3.8-flash` y respaldo automático en `gemini-3.1-flash-lite` y `gemini-flash-latest`.
* **Exportación de Datos**: Blob API con soporte UTF-8 BOM para apertura perfecta en Excel, y biblioteca `xlsx` para descargas `.xlsx`.
