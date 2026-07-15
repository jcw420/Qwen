/**
 * ===== CAPACIDADES DE IA PARA ARQUITECTURA DESÉRTICA =====
 * 
 * APIs gratuitas utilizadas:
 * - Groq (para LLM): https://groq.com/ (API key gratuita)
 * - Hugging Face (para visión por computadora): https://huggingface.co/
 * - ElevenLabs (para TTS): https://elevenlabs.io/ (tier gratuito)
 * - Stability AI (para generación de imágenes): https://stability.ai/ (tier gratuito)
 * 
 * Instrucciones:
 * 1. Regístrate en cada plataforma para obtener tu API key
 * 2. Reemplaza los placeholders en la configuración
 * 3. Todas las APIs tienen tiers gratuitos generosos
 */

// ===== CONFIGURACIÓN DE APIS =====
const AI_CONFIG = {
    // Groq API - LLM rápido y económico
    groq: {
        apiKey: 'gsk_xai-u4pH5tAmt8O1EtcRRSnUqA7ve6PE6MecMMi57jbZLID73PXYIwSdPQOYoF362TxaQJO57IBpYKFkr162', // Reemplazar con tu key
        baseUrl: 'https://api.groq.com/v1',
        model: 'llama-3.1-70b-versatile', // Modelo recomendado para arquitectura
        // Alternativas: 'mixtral-8x7b-32768', 'gemma2-9b-it'
    },
    
    // Hugging Face - Visión por computadora
    huggingFace: {
        apiKey: 'hf_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // Reemplazar con tu key
        baseUrl: 'https://api-inference.huggingface.co/models',
        visionModel: 'google/siglip-so400m-patch14-384', // Para análisis de imágenes
        // Alternativa: 'nvidia/segformer-b0-finetuned-ade-512-512'
    },
    
    // ElevenLabs - Text-to-Speech
    elevenLabs: {
        apiKey: 'sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // Reemplazar con tu key
        baseUrl: 'https://api.elevenlabs.io/v1',
        voiceId: '21m00Tcm4TlvDq8ikWAM', // Voz masculina profesional (Rachel)
        // Alternativas: 'pNInz6obpgDQG8K877Y', 'AZnzlk1XvdvUeBnXmlP2', 'EXAVITQu4vr4xnSDxMaL'
    },
    
    // Stability AI - Generación de imágenes
    stability: {
        apiKey: 'sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // Reemplazar con tu key
        baseUrl: 'https://api.stability.ai/v1',
        engine: 'stable-diffusion-xl-1024-v1-0',
    },
    
    // Local AI - Opcional para desarrollo local
    local: {
        enabled: false,
        baseUrl: 'http://localhost:11434/v1', // Ollama
        model: 'llama3.1:70b',
    }
};

// ===== ESTADO GLOBAL =====
const AIState = {
    currentImage: null,
    currentImageBase64: null,
    conversationHistory: [],
    currentProject: null,
    isProcessing: false,
    audioContext: null,
    currentAudio: null,
};

// ===== FUNCIONES CORE DE IA =====

/**
 * Enviar solicitud a Groq LLM
 */
async function callGroq(prompt, systemMessage = '', temperature = 0.7, maxTokens = 2048) {
    const config = AI_CONFIG.groq;
    
    if (!config.apiKey || config.apiKey === 'gsk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
        showNotification('Configura tu API Key de Groq en ai-capabilities.js', 'error');
        return null;
    }
    
    AIState.isProcessing = true;
    
    try {
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    { role: 'system', content: systemMessage || getDefaultSystemPrompt() },
                    ...AIState.conversationHistory.map(msg => ({ 
                        role: msg.role, 
                        content: msg.content 
                    })),
                    { role: 'user', content: prompt }
                ],
                temperature: temperature,
                max_tokens: maxTokens,
                stream: false,
            }),
        });
        
        const data = await response.json();
        
        // Guardar en historial
        AIState.conversationHistory.push({ role: 'user', content: prompt });
        if (data.choices && data.choices[0] && data.choices[0].message) {
            AIState.conversationHistory.push({ 
                role: 'assistant', 
                content: data.choices[0].message.content 
            });
        }
        
        return data.choices?.[0]?.message?.content || null;
        
    } catch (error) {
        console.error('Error en Groq:', error);
        showNotification('Error al conectar con Groq. Verifica tu API Key.', 'error');
        return null;
    } finally {
        AIState.isProcessing = false;
    }
}

/**
 * Analizar imagen con Hugging Face
 */
async function analyzeImageWithHF(imageBase64, prompt = 'Analiza esta imagen de plano arquitectónico y describe los elementos clave, orientación, distribución y posibles mejoras para clima desértico.') {
    const config = AI_CONFIG.huggingFace;
    
    if (!config.apiKey || config.apiKey === 'hf_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
        showNotification('Configura tu API Key de Hugging Face', 'error');
        return null;
    }
    
    AIState.isProcessing = true;
    
    try {
        const response = await fetch(`${config.baseUrl}/${config.visionModel}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                inputs: {
                    prompt: prompt,
                    images: [imageBase64]
                }
            }),
        });
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('Error en Hugging Face:', error);
        showNotification('Error al analizar imagen. Usando análisis local.', 'warning');
        // Fallback a análisis con LLM
        return await callGroq(`Analiza esta descripción de imagen: ${prompt}. Imagina que es un plano arquitectónico para clima desértico.`);
    } finally {
        AIState.isProcessing = false;
    }
}

/**
 * Generar voz con ElevenLabs
 */
async function generateSpeech(text, voiceId = null) {
    const config = AI_CONFIG.elevenLabs;
    
    if (!config.apiKey || config.apiKey === 'sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
        showNotification('Configura tu API Key de ElevenLabs', 'error');
        return null;
    }
    
    try {
        const response = await fetch(`${config.baseUrl}/text-to-speech/${voiceId || config.voiceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': config.apiKey,
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5,
                    style: 0.0,
                    use_speaker_boost: true
                }
            }),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const audioBlob = await response.blob();
        return URL.createObjectURL(audioBlob);
        
    } catch (error) {
        console.error('Error en ElevenLabs:', error);
        showNotification('Error al generar voz. Usando TTS del navegador.', 'warning');
        // Fallback a Web Speech API
        return generateBrowserSpeech(text);
    }
}

/**
 * Generar imagen con Stability AI
 */
async function generateImage(prompt, width = 512, height = 512) {
    const config = AI_CONFIG.stability;
    
    if (!config.apiKey || config.apiKey === 'sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
        showNotification('Configura tu API Key de Stability AI', 'error');
        return null;
    }
    
    AIState.isProcessing = true;
    
    try {
        const response = await fetch(`${config.baseUrl}/generation/${config.engine}/text-to-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
                'Accept': 'image/png'
            },
            body: JSON.stringify({
                text_prompts: [{ text: prompt }],
                cfg_scale: 7,
                clip_guidance_preset: 'NONE',
                height: height,
                width: width,
                samples: 1,
                steps: 30,
            }),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const imageBlob = await response.blob();
        return URL.createObjectURL(imageBlob);
        
    } catch (error) {
        console.error('Error en Stability AI:', error);
        showNotification('Error al generar imagen', 'error');
        return null;
    } finally {
        AIState.isProcessing = false;
    }
}

/**
 * Generar imagen con DALL-E 3 (alternativa)
 */
async function generateImageWithDalle(prompt, size = '1024x1024') {
    // Requiere OpenAI API key
    const apiKey = 'sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // Reemplazar
    
    if (!apiKey || apiKey === 'sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
        showNotification('Configura tu API Key de OpenAI', 'error');
        return null;
    }
    
    try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: prompt,
                n: 1,
                size: size,
                quality: 'standard',
            }),
        });
        
        const data = await response.json();
        return data.data?.[0]?.url || null;
        
    } catch (error) {
        console.error('Error en DALL-E:', error);
        return null;
    }
}

// ===== FUNCIONES ESPECIALIZADAS PARA ARQUITECTURA =====

/**
 * Analizar plano arquitectónico
 */
async function analyzeFloorPlan(imageBase64, specificPrompt = null) {
    const prompt = specificPrompt || `
        Analiza este plano arquitectónico para una casa de 200m² en Mexicali (clima desértico).
        Proporciona:
        1. Distribución de espacios (habitaciones, baños, cocina, sala, etc.)
        2. Orientación recomendada (norte, sur, este, oeste)
        3. Puntos críticos de eficiencia térmica
        4. Sugerencias de mejora para clima cálido
        5. Estimación de costos de materiales
        
        Sé específico y técnico. Usa términos de arquitectura.
    `;
    
    return await analyzeImageWithHF(imageBase64, prompt);
}

/**
 * Generar sugerencias de materiales
 */
async function suggestMaterials(area = 200, climate = 'desert', budget = 'medium') {
    const prompt = `
        Recomienda materiales de construcción para una casa de ${area}m² en clima ${climate} (Mexicali).
        Considera:
        - Aislamiento térmico
        - Resistencia al calor
        - Durabilidad
        - Costo (presupuesto: ${budget})
        - Disponibilidad local
        
        Proporciona una tabla comparativa con:
        | Material | Tipo | R-Value | Costo/m² | Vida Útil | Ventajas | Desventajas |
        
        Incluye al menos 8 materiales diferentes.
    `;
    
    const system = `Eres un ingeniero civil experto en construcción para clima desértico. Proporciona información técnica precisa.`;
    
    return await callGroq(prompt, system, 0.3, 4096);
}

/**
 * Calcular eficiencia energética
 */
async function calculateEnergyEfficiency(designDetails) {
    const prompt = `
        Calcula la eficiencia energética para una casa en Mexicali con las siguientes características:
        ${JSON.stringify(designDetails, null, 2)}
        
        Proporciona:
        1. Carga térmica estimada (BTU/h)
        2. Consumo energético anual estimado (kWh)
        3. Ahorro potencial con aislamiento mejorado
        4. Recomendaciones específicas para reducir consumo
        5. ROI de mejoras de eficiencia
        
        Usa cálculos basados en estándares ASHRAE para clima desértico.
    `;
    
    const system = `Eres un ingeniero en eficiencia energética. Proporciona cálculos técnicos precisos.`;
    
    return await callGroq(prompt, system, 0.2, 4096);
}

/**
 * Generar diseño arquitectónico
 */
async function generateArchitecturalDesign(requirements) {
    const prompt = `
        Diseña una casa de 200m² en Mexicali con los siguientes requisitos:
        ${JSON.stringify(requirements, null, 2)}
        
        Proporciona:
        1. Descripción general del diseño
        2. Distribución de espacios (planta baja y alta si aplica)
        3. Orientación óptima
        4. Materiales recomendados
        5. Estimación de costos
        6. Renderizado textual de cómo se vería
        7. Lista de ventajas del diseño
        
        Sé creativo pero técnico. Incluye medidas aproximadas.
    `;
    
    const system = `Eres un arquitecto experto en diseño para clima desértico. Proporciona diseños funcionales y estéticos.`;
    
    return await callGroq(prompt, system, 0.7, 4096);
}

/**
 * Generar imagen de diseño arquitectónico
 */
async function generateArchitecturalImage(description) {
    const prompt = `
        Architectural design of a modern desert house in Mexicali, ${description}.
        Style: contemporary desert architecture, clean lines, earth tones, flat roofs, 
        large overhangs for shade, courtyard in the center, stucco walls, natural materials.
        Lighting: warm golden hour, soft shadows, clear blue sky.
        Perspective: isometric view, detailed, professional architectural rendering.
        Quality: ultra high definition, photorealistic, 8k.
    `;
    
    return await generateImage(prompt, 1024, 1024);
}

/**
 * Analizar terreno para construcción
 */
async function analyzeTerrain(imageBase64, location = 'Mexicali') {
    const prompt = `
        Analiza este terreno para construcción en ${location}.
        Considera:
        1. Topografía y nivelación
        2. Tipo de suelo y capacidad de carga
        3. Orientación solar
        4. Vientos predominantes
        5. Acceso a servicios (agua, electricidad, drenaje)
        6. Restricciones legales o ambientales
        7. Recomendaciones para cimentación
        8. Mejor ubicación para la casa
        
        Proporciona un análisis técnico detallado.
    `;
    
    return await analyzeImageWithHF(imageBase64, prompt);
}

/**
 * Generar lista de plantas nativas
 */
async function suggestNativePlants(area = 200, waterAvailability = 'low') {
    const prompt = `
        Recomienda plantas nativas para un jardín de ${area}m² en Mexicali.
        Considera:
        - Resistencia a sequía
        - Bajo consumo de agua (${waterAvailability})
        - Sombra que proporcionan
        - Atracción de polinizadores
        - Mantenimiento mínimo
        - Altura y extensión
        
        Proporciona una tabla con:
        | Nombre Científico | Nombre Común | Altura | Requerimientos de Agua | Beneficios | Uso Recomendado |
        
        Incluye al menos 15 plantas diferentes, organizadas por tipo (árboles, arbustos, suculentas, etc.).
    `;
    
    const system = `Eres un biólogo experto en flora del desierto de Sonora. Proporciona información botánica precisa.`;
    
    return await callGroq(prompt, system, 0.3, 4096);
}

/**
 * Calcular costos de construcción
 */
async function calculateConstructionCosts(designDetails) {
    const prompt = `
        Calcula los costos de construcción para una casa en Mexicali con las siguientes características:
        ${JSON.stringify(designDetails, null, 2)}
        
        Proporciona un desglose detallado:
        1. Cimentación
        2. Estructura (muros, columnas, losas)
        3. Techos
        4. Instalaciones (eléctrica, hidráulica, sanitaria)
        5. Acabados (pisos, azulejos, pintura)
        6. Carpintería (puertas, ventanas)
        7. Cocina y baños
        8. Impermeabilización y aislamiento
        9. Jardinería y exteriores
        10. Honorarios profesionales
        
        Incluye:
        - Costo por m²
        - Costo total estimado
        - Porcentajes de cada categoría
        - Recomendaciones para ahorrar costos
        
        Usa precios actuales del mercado en Mexicali (2024).
    `;
    
    const system = `Eres un constructor experto en costos de construcción en Mexicali. Proporciona estimaciones realistas y actualizadas.`;
    
    return await callGroq(prompt, system, 0.2, 4096);
}

/**
 * Generar cronograma de construcción
 */
async function generateConstructionSchedule(designComplexity = 'medium') {
    const prompt = `
        Genera un cronograma detallado para la construcción de una casa de 200m² en Mexicali.
        Complejidad: ${designComplexity}
        
        Proporciona un cronograma semanal con:
        | Semana | Fase | Actividades | Duración | Dependencias | Recursos Necesarios |
        
        Incluye todas las fases desde preparación del terreno hasta entrega final.
        Estima tiempos realistas considerando clima desértico.
        
        También proporciona:
        1. Ruta crítica
        2. Puntos de control de calidad
        3. Inspecciones requeridas
        4. Recomendaciones para optimizar tiempo
    `;
    
    const system = `Eres un gerente de proyectos de construcción. Proporciona cronogramas realistas y detallados.`;
    
    return await callGroq(prompt, system, 0.2, 4096);
}

/**
 * Analizar código de construcción local
 */
async function checkBuildingCodeCompliance(designDetails, location = 'Mexicali') {
    const prompt = `
        Verifica si el siguiente diseño cumple con el código de construcción de ${location}:
        ${JSON.stringify(designDetails, null, 2)}
        
        Considera:
        1. Normas de zonificación
        2. Altura máxima permitida
        3. Retiros (frente, laterales, fondo)
        4. Coeficiente de ocupación del suelo (COS)
        5. Coeficiente de utilización del suelo (CUS)
        6. Normas de accesibilidad
        7. Requisitos de estacionamiento
        8. Normas de seguridad estructural
        9. Requisitos de eficiencia energética
        10. Normas ambientales
        
        Proporciona:
        - Lista de cumplimientos
        - Lista de incumplimientos con soluciones
        - Recomendaciones para regularización
    `;
    
    const system = `Eres un arquitecto experto en normativa de construcción en Mexicali. Proporciona análisis legal preciso.`;
    
    return await callGroq(prompt, system, 0.2, 4096);
}

// ===== FUNCIONES DE SOPORTE =====

/**
 * Obtener prompt del sistema por defecto
 */
function getDefaultSystemPrompt() {
    return `
        Eres un arquitecto e ingeniero civil experto en diseño y construcción para clima desértico, 
        específicamente en Mexicali, Baja California. 
        
        Conocimientos:
        - Arquitectura bioclimática
        - Eficiencia energética en climas cálidos
        - Materiales de construcción para desiertos
        - Normativa de construcción mexicana
        - Costos de construcción en Mexicali
        - Flora nativa del desierto de Sonora
        - Sistemas de enfriamiento pasivo
        
        Características:
        - Respuestas técnicas y precisas
        - Usa términos de arquitectura e ingeniería
        - Proporciona cálculos cuando sea posible
        - Sé creativo pero realista
        - Considera el contexto local (clima, materiales, costos)
        
        Formato:
        - Usa markdown para formatear respuestas
        - Incluye tablas cuando sea útil
        - Sé conciso pero completo
        - Proporciona recomendaciones prácticas
    `;
}

/**
 * Mostrar notificación
 */
function showNotification(message, type = 'info', duration = 5000) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fa-solid fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Estilos inline para notificaciones dinámicas
    notification.style.cssText = `
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        padding: 1rem 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 200;
        animation: slideUp 0.3s ease-out;
        border-left: 4px solid ${type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#2563eb'};
    `;
    
    document.body.appendChild(notification);
    
    // Remover después de la duración
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

/**
 * Generar voz con Web Speech API (fallback)
 */
function generateBrowserSpeech(text) {
    return new Promise((resolve, reject) => {
        if (!('speechSynthesis' in window)) {
            reject(new Error('Web Speech API no disponible'));
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-MX';
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // Intentar usar una voz específica
        const voices = window.speechSynthesis.getVoices();
        const mexicanVoice = voices.find(v => v.lang.includes('es-MX')) || 
                            voices.find(v => v.lang.includes('es-ES'));
        if (mexicanVoice) {
            utterance.voice = mexicanVoice;
        }
        
        utterance.onend = () => resolve(null);
        utterance.onerror = (e) => reject(e);
        
        window.speechSynthesis.speak(utterance);
        resolve(null);
    });
}

/**
 * Detener reproducción de audio
 */
function stopAudio() {
    if (AIState.currentAudio) {
        AIState.currentAudio.pause();
        AIState.currentAudio = null;
    }
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
}

/**
 * Limpiar historial de conversación
 */
function clearConversationHistory() {
    AIState.conversationHistory = [];
}

/**
 * Guardar estado del proyecto
 */
function saveProjectState(projectData) {
    AIState.currentProject = projectData;
    localStorage.setItem('mexicaliBuilderProject', JSON.stringify(projectData));
}

/**
 * Cargar estado del proyecto
 */
function loadProjectState() {
    const saved = localStorage.getItem('mexicaliBuilderProject');
    if (saved) {
        AIState.currentProject = JSON.parse(saved);
    }
    return AIState.currentProject;
}

// ===== INICIALIZACIÓN =====

// Cargar voces cuando estén disponibles
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('Voces disponibles:', voices.length);
    };
}

// Exportar funciones para uso en otros módulos
window.AI = {
    callGroq,
    analyzeImageWithHF,
    generateSpeech,
    generateImage,
    generateImageWithDalle,
    analyzeFloorPlan,
    suggestMaterials,
    calculateEnergyEfficiency,
    generateArchitecturalDesign,
    generateArchitecturalImage,
    analyzeTerrain,
    suggestNativePlants,
    calculateConstructionCosts,
    generateConstructionSchedule,
    checkBuildingCodeCompliance,
    getDefaultSystemPrompt,
    showNotification,
    stopAudio,
    clearConversationHistory,
    saveProjectState,
    loadProjectState,
    state: AIState,
    config: AI_CONFIG
};

console.log('AI Capabilities loaded. Configure your API keys in ai-capabilities.js');
