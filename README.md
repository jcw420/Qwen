# Mexicali Builder - Diseño Inteligente para Clima Desértico

**Herramienta de diseño arquitectónico con IA especializada en construcción para clima desértico (Mexicali, Baja California).**

## 🏗️ Características Principales

### 🎨 Editor 3D
- Diseño interactivo de viviendas en 200m²
- Herramientas de dibujo: paredes, puertas, ventanas, muebles
- Vista en planta, frontal, lateral y 3D
- Snap to grid para precisión
- Historia (undo/redo) ilimitada
- Exportación en múltiples formatos

### 🤖 Laboratorio de IA
- **Análisis de planos**: Sube imágenes de planos para análisis automático
- **Comparador de materiales**: Compara eficiencia térmica y costos
- **Asistente de diseño**: Responde preguntas técnicas sobre construcción
- **Sugerencias de flora**: Recomienda plantas nativas resistentes a la sequía
- **Análisis de terreno**: Evaluación geotécnica para construcción
- **Generación de cronogramas**: Planificación de proyectos

### 📊 Análisis Térmico
- Cálculo de carga térmica
- Estimación de consumo energético
- Recomendaciones de aislamiento
- ROI de mejoras de eficiencia

### 📁 Exportación
- **JSON**: Formato estructurado para intercambio
- **SVG**: Vista en planta escalable
- **PNG**: Captura de pantalla
- **OBJ**: Formato 3D estándar
- **GLTF**: Formato 3D moderno para web

## 🚀 Configuración Rápida

### 1. Clonar el repositorio
```bash
cd /workspace/jcw420__Qwen
git clone https://github.com/jcw420/Qwen.git .
```

### 2. Abrir en navegador
Simplemente abre `index.html` en tu navegador favorito.

### 3. Configurar APIs de IA (Opcional)

Para habilitar todas las capacidades de IA, configura tus API keys en `js/ai-capabilities.js`:

```javascript
const AI_CONFIG = {
    groq: {
        apiKey: 'TU_API_KEY_DE_GROQ',  // https://groq.com/
        baseUrl: 'https://api.groq.com/v1',
        model: 'llama-3.1-70b-versatile',
    },
    huggingFace: {
        apiKey: 'TU_API_KEY_DE_HUGGING_FACE',  // https://huggingface.co/
        baseUrl: 'https://api-inference.huggingface.co/models',
        visionModel: 'google/siglip-so400m-patch14-384',
    },
    elevenLabs: {
        apiKey: 'TU_API_KEY_DE_ELEVENLABS',  // https://elevenlabs.io/
        baseUrl: 'https://api.elevenlabs.io/v1',
        voiceId: '21m00Tcm4TlvDq8ikWAM',
    },
    stability: {
        apiKey: 'TU_API_KEY_DE_STABILITY_AI',  // https://stability.ai/
        baseUrl: 'https://api.stability.ai/v1',
        engine: 'stable-diffusion-xl-1024-v1-0',
    }
};
```

**Nota**: Todas las APIs tienen tiers gratuitos generosos. Consulta la documentación de cada proveedor para obtener tu API key.

## 📁 Estructura del Proyecto

```
MexicaliBuilder/
├── index.html              # Página principal
├── pages/
│   └── 3d-editor-full.html # Editor 3D en pantalla completa
├── css/
│   └── styles.css          # Estilos personalizados
├── js/
│   ├── main.js             # Funciones principales
│   ├── ai-capabilities.js  # Capacidades de IA
│   └── 3d-editor-core.js   # Núcleo del editor 3D
└── README.md               # Documentación
```

## 🎯 Uso del Editor 3D

### Controles Básicos

| Tecla / Acción | Descripción |
|---------------|-------------|
| **Mouse Izquierdo** | Seleccionar objeto o empezar dibujo |
| **Arrastre** | Mover objeto seleccionado |
| **Delete / Backspace** | Eliminar objeto seleccionado |
| **Escape** | Cancelar dibujo o deseleccionar |
| **Ctrl+Z** | Deshacer última acción |
| **Ctrl+Y** | Rehacer última acción |
| **G** | Activar/desactivar snap to grid |
| **1-4** | Cambiar vistas (3D, Planta, Frente, Lateral) |

### Herramientas de Dibujo

1. **Seleccionar modo**: Haz clic en el botón de la herramienta
2. **Primer clic**: Define el punto de inicio
3. **Segundo clic**: Define el punto final (para paredes) o posición (para otros elementos)
4. **Doble clic**: Cancelar dibujo

### Biblioteca de Elementos

- **Paredes**: Estándar, gruesa, delgada, de carga
- **Puertas**: Sencilla, doble, corrediza, francesa
- **Ventanas**: Estándar, grande, pequeña, en bahía
- **Muebles**: Sofá, silla, mesa, cama, gabinete, refrigerador, estufa, etc.

## 🔌 Integración con IA

### Análisis de Imágenes

1. Haz clic en "Analizar Plano ✨" en el Laboratorio IA
2. Selecciona una imagen de tu plano o terreno
3. La IA analizará y proporcionará recomendaciones específicas

### Consultas de Texto

Simplemente escribe tu pregunta en el chat del Laboratorio IA. Ejemplos:

- "¿Qué materiales recomiendas para una casa de 200m² en Mexicali?"
- "Analiza la eficiencia térmica de este diseño"
- "¿Cuál es el mejor tipo de techo para clima desértico?"
- "Sugiere una distribución para 3 recámaras, 2 baños y sala-comedor"

### Generación de Contenido

- **Relatos auditivos**: Genera descripciones sensoriales con voz
- **Comparativas**: Analiza materiales y calcula ROI
- **Flora nativa**: Recomienda plantas para jardines
- **Cronogramas**: Genera planes de construcción

## 📊 APIs Gratuitas Recomendadas

### 1. Groq (LLM - Lenguaje Natural)
- **URL**: https://groq.com/
- **Modelos recomendados**: `llama-3.1-70b-versatile`, `mixtral-8x7b-32768`
- **Ventajas**: Rápido, económico, buen rendimiento en español
- **Límite gratuito**: 5,000 tokens/minuto

### 2. Hugging Face (Visión por Computadora)
- **URL**: https://huggingface.co/
- **Modelos recomendados**: `google/siglip-so400m-patch14-384`, `nvidia/segformer-b0-finetuned-ade-512-512`
- **Ventajas**: Análisis de imágenes, segmentación
- **Límite gratuito**: 1,000 solicitudes/día

### 3. ElevenLabs (Text-to-Speech)
- **URL**: https://elevenlabs.io/
- **Voces recomendadas**: `21m00Tcm4TlvDq8ikWAM` (Rachel), `pNInz6obpgDQG8K877Y`
- **Ventajas**: Voz natural en español
- **Límite gratuito**: 10,000 caracteres/mes

### 4. Stability AI (Generación de Imágenes)
- **URL**: https://stability.ai/
- **Modelos**: `stable-diffusion-xl-1024-v1-0`
- **Ventajas**: Generación de imágenes arquitectónicas
- **Límite gratuito**: 25 imágenes/día

## 🎨 Personalización

### Colores
Edita los colores en `js/3d-editor-core.js`:
```javascript
const EditorConfig = {
    colors: {
        terrain: 0xf5f5dc,
        wall: 0xa0522d,
        roof: 0x8b4513,
        floor: 0xd2b48c,
        window: 0x87ceeb,
        door: 0x654321,
        // ...
    }
};
```

### Materiales
Agrega nuevos materiales a la biblioteca en `js/3d-editor-core.js`:
```javascript
const ElementLibrary = {
    walls: {
        // ...
        myWall: { width: 0.25, height: 3.2, depth: 1.0, name: 'Mi Pared' }
    },
    // ...
};
```

### Tamaño del Terreno
Modifica las dimensiones en `js/3d-editor-core.js`:
```javascript
const EditorConfig = {
    terrainWidth: 20,  // metros
    terrainDepth: 10,  // metros
    // ...
};
```

## 📦 Exportación e Importación

### Exportar Diseño

```javascript
// JSON
const json = Editor3D.exportToJSON();

// SVG (vista en planta)
const svg = Editor3D.exportToSVG();

// PNG (captura de pantalla)
const pngBlob = await Editor3D.exportToPNG();

// OBJ (formato 3D)
const obj = await Editor3D.exportToOBJ();

// GLTF (formato 3D moderno)
const gltf = await Editor3D.exportToGLTF();
```

### Importar Diseño

```javascript
Editor3D.importFromJSON(jsonString);
```

### Copiar al Portapapeles

```javascript
// Copiar JSON
Editor3D.copyToClipboard('json');

// Copiar SVG
Editor3D.copyToClipboard('svg');
```

## 🔧 Solución de Problemas

### El editor 3D no carga
- **Causa**: Three.js no está cargado
- **Solución**: Verifica que las URLs de Three.js en el HTML sean accesibles

### La IA no responde
- **Causa**: API key no configurada
- **Solución**: Configura tu API key en `js/ai-capabilities.js`

### Error al exportar
- **Causa**: Diseño muy complejo
- **Solución**: Simplifica el diseño o usa formato JSON

### Problemas de rendimiento
- **Causa**: Demasiados objetos en la escena
- **Solución**: Usa el botón "Limpiar" para eliminar objetos no necesarios

## 📚 Recursos Adicionales

### Documentación de Three.js
- [Three.js Official Docs](https://threejs.org/docs/)
- [Three.js Examples](https://threejs.org/examples/)

### Documentación de APIs
- [Groq API Docs](https://console.groq.com/docs)
- [Hugging Face API Docs](https://huggingface.co/docs/api-inference/index)
- [ElevenLabs API Docs](https://elevenlabs.io/docs/api-reference/)
- [Stability AI API Docs](https://platform.stability.ai/docs/api-reference/)

### Arquitectura Bioclimática
- [Guía de diseño para clima desértico](https://www.archdaily.mx/)
- [Eficiencia energética en edificios](https://www.gob.mx/conuee)

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor sigue estos pasos:

1. Haz un fork del proyecto
2. Crea una rama con tu característica (`git checkout -b feature/nueva-caracteristica`)
3. Haz commit de tus cambios (`git commit -m 'Añade nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📜 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo LICENSE para más detalles.

## 🙏 Agradecimientos

- [Three.js](https://threejs.org/) - Librería 3D para la web
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Font Awesome](https://fontawesome.com/) - Iconos
- [Chart.js](https://www.chartjs.org/) - Gráficos
- [Groq](https://groq.com/) - APIs de IA rápidas
- [Hugging Face](https://huggingface.co/) - Modelos de IA
- [ElevenLabs](https://elevenlabs.io/) - Síntesis de voz
- [Stability AI](https://stability.ai/) - Generación de imágenes

---

**Desarrollado con ❤️ para los constructores de Mexicali**

*¿Preguntas o comentarios? Abre un issue en el repositorio.*
