/**
 * ===== FUNCIONES PRINCIPALES DE MEXICALI BUILDER =====
 * 
 * Este archivo contiene las funciones principales para:
 * - Interacción con el editor 3D
 * - Funciones de IA (con fallback local)
 * - Gestión de estado
 * - Notificaciones
 */

// ===== VARIABLES GLOBALES =====
let currentImageBase64 = null;
let currentAudio = null;
let layoutChart = null;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar editor 3D
    if (typeof Editor3D !== 'undefined') {
        Editor3D.init('editor-container');
    }
    
    // Cargar estado guardado
    loadSavedState();
    
    // Guardar estado al salir
    window.addEventListener('beforeunload', function() {
        saveCurrentState();
    });
});

// ===== FUNCIONES DE NAVEGACIÓN =====
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('hidden');
}

// ===== FUNCIONES DE IA =====

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        currentImageBase64 = e.target.result.split(',')[1];
        const preview = document.getElementById('image-preview');
        if (preview) {
            preview.src = e.target.result;
            document.getElementById('image-preview-container').classList.remove('hidden');
        }
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    currentImageBase64 = null;
    const input = document.getElementById('image-input');
    if (input) input.value = "";
    document.getElementById('image-preview-container').classList.add('hidden');
}

async function askAI() {
    const input = document.getElementById('ai-input');
    const chat = document.getElementById('chat-messages');
    const q = input.value.trim();
    if (!q && !currentImageBase64) return;
    
    // Mostrar mensaje del usuario
    if (chat) {
        chat.innerHTML += `<div class="bg-desert-800 text-white p-3 rounded-2xl rounded-tr-none shadow-sm ml-auto max-w-[85%] mb-4"><strong>Tú:</strong> ${q || "Analiza esta imagen."}</div>`;
        input.value = "";
        chat.scrollTop = chat.scrollHeight;
    }
    
    // Mostrar loading
    const loadingId = 'loading-' + Date.now();
    if (chat) {
        chat.innerHTML += `<div id="${loadingId}" class="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-desert-100 max-w-[85%] mb-4"><div class="loading-spinner"></div></div>`;
        chat.scrollTop = chat.scrollHeight;
    }
    
    try {
        // Usar Groq si está configurado
        if (typeof AI !== 'undefined' && AI.config.groq.apiKey && AI.config.groq.apiKey !== 'gsk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
            const system = `Eres un arquitecto e ingeniero civil experto en diseño y construcción para clima desértico en Mexicali. 
                            Analiza eficiencia térmica, materiales, orientación y normativas locales. 
                            Sé técnico pero claro. Máximo 5 frases.`;
            const response = await AI.callGroq(q || "Analiza detalladamente esta imagen de plano arquitectónico para clima desértico.", system, 0.7, 2048);
            
            // Remover loading
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();
            
            if (response && chat) {
                chat.innerHTML += `<div class="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-desert-100 max-w-[85%] mb-4"><strong>Ingeniero AI ✨:</strong> ${response}</div>`;
            } else if (chat) {
                chat.innerHTML += `<div class="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-desert-100 max-w-[85%] mb-4"><strong>Ingeniero AI ✨:</strong> No se pudo obtener respuesta. Configura tu API Key de Groq en ai-capabilities.js</div>`;
            }
        } else {
            // Respuesta local si no hay API configurada
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();
            
            const localResponse = q.toLowerCase().includes('plano') || q.toLowerCase().includes('diseño') || q.toLowerCase().includes('casa')
                ? `Para clima desértico en Mexicali, recomiendo:
                   1. Orientación norte-sur para maximizar ventilación natural
                   2. Paredes de bloque térmico o Hebel para mejor aislamiento
                   3. Techos con aislamiento XPS de 2 pulgadas
                   4. Ventanas con vidrio bajo emisivo y protección solar
                   5. Jardín interior con plantas nativas para enfriamiento pasivo`
                : q.toLowerCase().includes('material') || q.toLowerCase().includes('costo')
                ? `Materiales recomendados para Mexicali:
                   - Paredes: Hebel (R-2.5, $1,200/m²) o Block de concreto (R-0.8, $800/m²)
                   - Techos: Losa con aislamiento XPS ($450/m², R-10)
                   - Ventanas: Doble vidrio con marco de aluminio ($3,500/m²)
                   - Pisos: Cerámico o concreto pulido ($200-400/m²)`
                : `Soy un asistente de arquitectura para clima desértico. Puedo ayudarte con:
                   - Análisis de planos y diseños
                   - Recomendaciones de materiales
                   - Cálculos de eficiencia térmica
                   - Sugerencias de paisajismo
                   ¿En qué necesitas ayuda?`;
            
            if (chat) {
                chat.innerHTML += `<div class="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-desert-100 max-w-[85%] mb-4"><strong>Ingeniero AI ✨:</strong> ${localResponse}</div>`;
            }
        }
    } catch (error) {
        console.error('Error en askAI:', error);
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();
        if (chat) {
            chat.innerHTML += `<div class="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-desert-100 max-w-[85%] mb-4"><strong>Ingeniero AI ✨:</strong> Error al conectar con la IA. Verifica tu conexión a internet y la configuración de la API.</div>`;
        }
    }
    
    if (chat) chat.scrollTop = chat.scrollHeight;
    clearImage();
}

async function compareMaterials() {
    const mat = document.getElementById('material-select').value;
    const resBox = document.getElementById('material-res');
    if (!resBox) return;
    
    resBox.classList.remove('hidden');
    resBox.innerHTML = '<div class="flex justify-center p-4"><div class="loading-spinner"></div></div>';
    
    try {
        if (typeof AI !== 'undefined' && AI.config.groq.apiKey && AI.config.groq.apiKey !== 'gsk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
            const system = `Eres un ingeniero civil experto en materiales de construcción para clima desértico. 
                            Genera una tabla comparativa en formato HTML (usando clases Tailwind) que compare 
                            ahorro energético, costo inicial y retorno de inversión para estos materiales en Mexicali. 
                            Sé conciso y técnico.`;
            const response = await AI.callGroq(`Compara: ${mat} para una casa de 200m2 en Mexicali.`, system, 0.3, 2048);
            resBox.innerHTML = `<div class="text-[11px] bg-white p-3 rounded-xl border border-desert-100 shadow-inner">${response}</div>`;
        } else {
            // Respuesta local
            const comparisons = {
                'Hebel vs Block': `
                    <table class="w-full text-xs">
                        <thead class="bg-desert-100">
                            <tr><th class="p-2 text-left">Material</th><th class="p-2 text-left">R-Value</th><th class="p-2 text-left">Costo/m²</th><th class="p-2 text-left">Ahorro Energético</th></tr>
                        </thead>
                        <tbody>
                            <tr class="border-b border-desert-100"><td class="p-2">Hebel</td><td class="p-2">2.5</td><td class="p-2">$1,200</td><td class="p-2">30-40%</td></tr>
                            <tr><td class="p-2">Block Común</td><td class="p-2">0.8</td><td class="p-2">$800</td><td class="p-2">10-15%</td></tr>
                        </tbody>
                    </table>
                    <p class="mt-2 text-xs">Hebel ofrece mejor aislamiento pero con mayor costo inicial. ROI: 3-5 años.</p>
                `,
                'XPS vs Techo': `
                    <table class="w-full text-xs">
                        <thead class="bg-desert-100">
                            <tr><th class="p-2 text-left">Material</th><th class="p-2 text-left">R-Value</th><th class="p-2 text-left">Costo/m²</th><th class="p-2 text-left">Ahorro Energético</th></tr>
                        </thead>
                        <tbody>
                            <tr class="border-b border-desert-100"><td class="p-2">XPS 2"</td><td class="p-2">10.0</td><td class="p-2">$450</td><td class="p-2">40-50%</td></tr>
                            <tr><td class="p-2">Techo Limpio</td><td class="p-2">0.5</td><td class="p-2">$200</td><td class="p-2">0-5%</td></tr>
                        </tbody>
                    </table>
                    <p class="mt-2 text-xs">XPS reduce significativamente la transferencia de calor. ROI: 2-3 años.</p>
                `,
                'Vidrio Doble': `
                    <table class="w-full text-xs">
                        <thead class="bg-desert-100">
                            <tr><th class="p-2 text-left">Tipo</th><th class="p-2 text-left">U-Value</th><th class="p-2 text-left">Costo/m²</th><th class="p-2 text-left">Ahorro Energético</th></tr>
                        </thead>
                        <tbody>
                            <tr class="border-b border-desert-100"><td class="p-2">Doble Vidrio</td><td class="p-2">1.2</td><td class="p-2">$3,500</td><td class="p-2">25-35%</td></tr>
                            <tr><td class="p-2">Sencillo</td><td class="p-2">5.8</td><td class="p-2">$1,800</td><td class="p-2">0%</td></tr>
                        </tbody>
                    </table>
                    <p class="mt-2 text-xs">Vidrio doble reduce ganancia de calor. ROI: 5-7 años.</p>
                `
            };
            resBox.innerHTML = `<div class="text-[11px] bg-white p-3 rounded-xl border border-desert-100 shadow-inner">${comparisons[mat] || 'Selecciona una opción válida'}</div>`;
        }
    } catch (error) {
        console.error('Error en compareMaterials:', error);
        resBox.innerHTML = '<div class="text-red-500 text-xs p-2">Error al calcular. Intenta nuevamente.</div>';
    }
}

async function generateStoryWithAudio() {
    const modal = document.getElementById('story-modal');
    const content = document.getElementById('story-content');
    if (!modal || !content) return;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    content.innerHTML = "<p class='text-center py-10 animate-pulse'>Componiendo relato y voz...</p>";
    
    try {
        if (typeof AI !== 'undefined' && AI.config.groq.apiKey && AI.config.groq.apiKey !== 'gsk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
            const system = `Eres un arquitecto poético. Escribe un relato de 80-100 palabras que describa la sensación de entrar a una casa fresca (Oasis) mientras afuera hay 45 grados en Mexicali. Usa lenguaje evocador y sensorial.`;
            const text = await AI.callGroq("Crea una memoria sensorial de casa fresca en el desierto.", system, 0.7, 512);
            content.innerText = text;
            
            // Generar voz
            if (AI.config.elevenLabs.apiKey && AI.config.elevenLabs.apiKey !== 'sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
                const audioUrl = await AI.generateSpeech(text);
                if (audioUrl) playAudio(audioUrl);
            } else {
                // Fallback a Web Speech API
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = 'es-MX';
                    utterance.rate = 1;
                    window.speechSynthesis.speak(utterance);
                    showAudioIndicator(true);
                    utterance.onend = () => showAudioIndicator(false);
                }
            }
        } else {
            // Respuesta local
            const story = "El sol de Mexicali quema con furia a 45 grados, pero al cruzar el umbral de tu Oasis, una brisa fresca te envuelve. Las paredes de Hebel guardan el calor afuera, mientras el jardín interior susurra con el sonido del agua. La luz filtrada por celosías dibuja patrones danzantes en el piso de piedra fría. Aquí, el desierto espera respetuoso, mientras tú disfrutas de un refugio perfectamente equilibrado.";
            content.innerText = story;
            
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(story);
                utterance.lang = 'es-MX';
                utterance.rate = 1;
                window.speechSynthesis.speak(utterance);
                showAudioIndicator(true);
                utterance.onend = () => showAudioIndicator(false);
            }
        }
    } catch (error) {
        console.error('Error en generateStoryWithAudio:', error);
        content.innerHTML = "<p class='text-red-500 text-center'>Error al generar el relato. Intenta nuevamente.</p>";
    }
}

function playAudio(audioUrl) {
    stopAudio();
    currentAudio = new Audio(audioUrl);
    showAudioIndicator(true);
    currentAudio.play();
    currentAudio.onended = () => stopAudio();
}

function stopAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    showAudioIndicator(false);
}

function showAudioIndicator(show) {
    const indicator = document.getElementById('audio-indicator');
    const stopBtn = document.getElementById('stop-audio');
    if (indicator) {
        if (show) {
            indicator.classList.remove('hidden');
            indicator.classList.add('animate-pulse');
        } else {
            indicator.classList.add('hidden');
            indicator.classList.remove('animate-pulse');
        }
    }
    if (stopBtn) {
        stopBtn.classList.toggle('hidden', !show);
    }
}

function closeModal() {
    stopAudio();
    const modal = document.getElementById('story-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

async function suggestPlants() {
    const resBox = document.getElementById('plant-res');
    if (!resBox) return;
    
    resBox.innerHTML = "<div class='text-center py-2'><i class='fa-solid fa-circle-notch fa-spin text-green-500'></i></div>";
    
    try {
        if (typeof AI !== 'undefined' && AI.config.groq.apiKey && AI.config.groq.apiKey !== 'gsk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
            const system = `Eres un biólogo experto en flora del desierto de Sonora. Responde con JSON: {"plants":[{"n":"Nombre Común","s":"Nombre Científico","b":"Beneficio principal","w":"Requerimiento de agua","h":"Altura (m)","i":"icono fa-"}]}`;
            const response = await AI.callGroq("Sugiere 5 plantas nativas para jardín en Mexicali con bajo consumo de agua.", system, 0.3, 1024);
            
            try {
                const data = JSON.parse(response.replace(/```json|```/g, ""));
                resBox.innerHTML = "";
                data.plants.forEach(p => {
                    resBox.innerHTML += `
                    <div class="bg-green-50 p-2 rounded-lg border border-green-100 flex items-center gap-3">
                        <i class="fa-solid ${p.i || 'fa-seedling'} text-green-600"></i>
                        <div class="text-[11px] leading-tight">
                            <strong>${p.n} (${p.s})</strong><br>
                            <span class="text-green-700">${p.b}</span><br>
                            <span class="text-xs text-green-500">Agua: ${p.w} | Altura: ${p.h}m</span>
                        </div>
                    </div>`;
                });
            } catch (e) {
                console.error('Error parsing plants:', e);
                resBox.innerHTML = "<div class='text-red-500 text-xs p-2'>Error al procesar la respuesta</div>";
            }
        } else {
            // Datos locales
            const plants = [
                { n: "Palo Verde", s: "Parkinsonia spp.", b: "Sombra ligera, fijación de nitrógeno", w: "bajo", h: "6-10", i: "fa-tree" },
                { n: "Desert Willow", s: "Chilopsis linearis", b: "Sombra, flores fragantes", w: "bajo", h: "4-8", i: "fa-tree" },
                { n: "Ocotillo", s: "Fouquieria splendens", b: "Cercas vivas, flores rojas", w: "muy bajo", h: "2-4", i: "fa-tree" },
                { n: "Cholla", s: "Cylindropuntia spp.", b: "Barrera natural, refugio fauna", w: "muy bajo", h: "1-3", i: "fa-tree" },
                { n: "Agave", s: "Agave spp.", b: "Paisajismo, fibra", w: "muy bajo", h: "0.5-2", i: "fa-seedling" }
            ];
            resBox.innerHTML = "";
            plants.forEach(p => {
                resBox.innerHTML += `
                <div class="bg-green-50 p-2 rounded-lg border border-green-100 flex items-center gap-3">
                    <i class="fa-solid ${p.i} text-green-600"></i>
                    <div class="text-[11px] leading-tight">
                        <strong>${p.n} (${p.s})</strong><br>
                        <span class="text-green-700">${p.b}</span><br>
                        <span class="text-xs text-green-500">Agua: ${p.w} | Altura: ${p.h}m</span>
                    </div>
                </div>`;
            });
        }
    } catch (error) {
        console.error('Error en suggestPlants:', error);
        resBox.innerHTML = "<div class='text-red-500 text-xs p-2'>Error al cargar plantas</div>";
    }
}

async function analyzeTerrain() {
    const resBox = document.getElementById('terrain-res');
    if (!resBox) return;
    
    resBox.classList.remove('hidden');
    resBox.innerHTML = "<div class='text-center py-2'><i class='fa-solid fa-circle-notch fa-spin text-amber-500'></i></div>";
    
    try {
        if (typeof AI !== 'undefined' && AI.config.groq.apiKey && AI.config.groq.apiKey !== 'gsk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
            const system = `Eres un ingeniero geotécnico experto en suelos de Mexicali. Proporciona un análisis técnico en formato HTML (Tailwind) sobre consideraciones para construcción en terreno desértico.`;
            const response = await AI.callGroq("Analiza las consideraciones geotécnicas para construir una casa de 200m2 en Mexicali. Incluye tipo de suelo, capacidad de carga, drenaje y recomendaciones.", system, 0.3, 2048);
            resBox.innerHTML = `<div class="text-[11px] bg-white p-3 rounded-xl border border-desert-100 shadow-inner">${response}</div>`;
        } else {
            resBox.innerHTML = `
            <div class="bg-white p-3 rounded-xl border border-desert-100 shadow-inner text-xs">
                <h4 class="font-bold text-desert-800 mb-2">Análisis de Terreno para Mexicali</h4>
                <ul class="list-disc list-inside space-y-1 text-slate-600">
                    <li><strong>Tipo de suelo:</strong> Arcilloso con capas de arena. Capacidad de carga: 1-2 kg/cm²</li>
                    <li><strong>Profundidad de cimentación:</strong> Mínimo 80cm para evitar grietas por expansión</li>
                    <li><strong>Drenaje:</strong> Sistema de drenaje perimetral recomendado para temporada de lluvias</li>
                    <li><strong>Nivel freático:</strong> Profundo (10-15m), no afecta cimentación</li>
                    <li><strong>Recomendaciones:</strong> Uso de zapatas corridas o losa de cimentación</li>
                </ul>
            </div>`;
        }
    } catch (error) {
        console.error('Error en analyzeTerrain:', error);
        resBox.innerHTML = "<div class='text-red-500 text-xs p-2'>Error al analizar terreno</div>";
    }
}

function toggleAILab() {
    const content = document.getElementById('ai-lab-content');
    const button = content && content.previousElementSibling && content.previousElementSibling.querySelector('button');
    
    if (content) {
        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            if (button) button.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';
        } else {
            content.classList.add('hidden');
            if (button) button.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
        }
    }
}

// ===== FUNCIONES DE DIRECTORIO =====

function loadTemplate(name) {
    if (typeof Editor3D !== 'undefined') {
        const templates = {
            'oasis-200': {
                version: '1.0',
                timestamp: new Date().toISOString(),
                config: { terrainWidth: 20, terrainDepth: 10, units: 'm' },
                elements: {
                    walls: [
                        { type: 'wall', elementId: 'standard', name: 'Pared Exterior N', position: { x: 0, y: 1.5, z: 5 }, rotation: { x: 0, y: 0, z: 0 }, dimensions: { width: 0.2, height: 3.0, length: 10.0 }, start: { x: 0, y: 0, z: 0 }, end: { x: 0, y: 0, z: 10 }, material: 'concrete' },
                        { type: 'wall', elementId: 'standard', name: 'Pared Exterior E', position: { x: 5, y: 1.5, z: 10 }, rotation: { x: 0, y: Math.PI/2, z: 0 }, dimensions: { width: 0.2, height: 3.0, length: 10.0 }, start: { x: 0, y: 0, z: 10 }, end: { x: 10, y: 0, z: 10 }, material: 'concrete' },
                        { type: 'wall', elementId: 'standard', name: 'Pared Exterior S', position: { x: 10, y: 1.5, z: 5 }, rotation: { x: 0, y: Math.PI, z: 0 }, dimensions: { width: 0.2, height: 3.0, length: 10.0 }, start: { x: 10, y: 0, z: 10 }, end: { x: 10, y: 0, z: 0 }, material: 'concrete' },
                        { type: 'wall', elementId: 'standard', name: 'Pared Exterior O', position: { x: 5, y: 1.5, z: 0 }, rotation: { x: 0, y: -Math.PI/2, z: 0 }, dimensions: { width: 0.2, height: 3.0, length: 10.0 }, start: { x: 10, y: 0, z: 0 }, end: { x: 0, y: 0, z: 0 }, material: 'concrete' }
                    ],
                    doors: [
                        { type: 'door', elementId: 'single', name: 'Puerta Principal', position: { x: 5, y: 1.05, z: 10 }, rotation: Math.PI/2, dimensions: { width: 0.9, height: 2.1, depth: 0.1 } }
                    ],
                    windows: [
                        { type: 'window', elementId: 'standard', name: 'Ventana Sala', position: { x: 2.5, y: 1.2, z: 10 }, rotation: Math.PI/2, dimensions: { width: 1.2, height: 1.2, depth: 0.1 } },
                        { type: 'window', elementId: 'standard', name: 'Ventana Cocina', position: { x: 7.5, y: 1.2, z: 10 }, rotation: Math.PI/2, dimensions: { width: 1.2, height: 1.2, depth: 0.1 } }
                    ]
                }
            }
        };
        
        if (templates[name]) {
            Editor3D.importFromJSON(JSON.stringify(templates[name]));
            showNotification('Plantilla "Oasis 200" cargada correctamente', 'success');
        }
    }
}

function showMaterialsGuide() {
    showNotification('Guía de materiales: Consulta la documentación completa en el directorio.', 'info');
}

function showRegulations() {
    showNotification('Normativas: Revisa los requisitos legales en la sección de recursos.', 'info');
}

function showSuppliers() {
    showNotification('Proveedores: Directorio de proveedores locales disponible pronto.', 'info');
}

function showCalculators() {
    showNotification('Calculadoras: Herramientas de cálculo integradas en el Laboratorio IA.', 'info');
}

function showFAQ() {
    showNotification('FAQ: Preguntas frecuentes disponibles en la documentación.', 'info');
}

// ===== FUNCIONES DE ESTADO =====

function loadSavedState() {
    if (typeof Editor3D !== 'undefined') {
        const saved = localStorage.getItem('mexicaliBuilder3DState');
        if (saved) {
            try {
                Editor3D.importFromJSON(saved);
            } catch (e) {
                console.error('Error al cargar estado guardado:', e);
            }
        }
    }
}

function saveCurrentState() {
    if (typeof Editor3D !== 'undefined') {
        const state = Editor3D.exportToJSON();
        localStorage.setItem('mexicaliBuilder3DState', state);
    }
}

// ===== FUNCIONES DE NOTIFICACIÓN =====

function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 animate-slideUp`;
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fa-solid ${type === 'success' ? 'fa-check-circle text-green-500' : type === 'error' ? 'fa-exclamation-circle text-red-500' : 'fa-info-circle text-blue-500'}"></i>
            <span class="text-sm">${message}</span>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// ===== FUNCIONES DE VISTA =====

function initLayoutChart() {
    const ctx = document.getElementById('layoutChart');
    if (!ctx) return;
    
    layoutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Construcción (m²)', 'Jardín (m²)'],
            datasets: [{
                data: [200, 150],
                backgroundColor: ['#7a3e2a', '#a69076'],
                hoverOffset: 10
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// ===== EXPORTAR FUNCIONES PARA USO GLOBAL =====
window.MexicaliBuilder = {
    // Funciones de IA
    askAI,
    compareMaterials,
    generateStoryWithAudio,
    suggestPlants,
    analyzeTerrain,
    
    // Funciones de Editor 3D
    loadTemplate,
    saveCurrentState,
    loadSavedState,
    
    // Funciones de UI
    showNotification,
    toggleMobileMenu,
    toggleAILab,
    closeModal,
    stopAudio,
    
    // Funciones de Directorio
    showMaterialsGuide,
    showRegulations,
    showSuppliers,
    showCalculators,
    showFAQ,
    
    // Estado
    currentImageBase64: null,
    currentAudio: null
};

console.log('MexicaliBuilder initialized. Use window.MexicaliBuilder for public functions.');
