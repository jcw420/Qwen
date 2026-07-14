/**
 * FUNCIONES PRINCIPALES DE MEXICALI BUILDER
 * Soluciona Issue #1: Errores del Editor 3D
 */

let currentImageBase64 = null;
let currentAudio = null;

// Inicializar al cargar
window.addEventListener('DOMContentLoaded', function() {
    if (typeof Editor3D !== 'undefined') {
        Editor3D.init('editor-container');
    }
    loadSavedState();
    window.addEventListener('beforeunload', saveCurrentState);
});

// Navegación móvil
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('hidden');
}

// Manejo de imágenes
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

// Funciones de IA con fallback local
async function askAI() {
    const input = document.getElementById('ai-input');
    const chat = document.getElementById('chat-messages');
    const q = input.value.trim();
    if (!q && !currentImageBase64) return;
    
    if (chat) {
        chat.innerHTML += `<div class="bg-desert-800 text-white p-3 rounded-2xl rounded-tr-none shadow-sm ml-auto max-w-[85%] mb-4"><strong>Tú:</strong> ${q || "Analiza esta imagen."}</div>`;
        input.value = "";
        chat.scrollTop = chat.scrollHeight;
    }
    
    const loadingId = 'loading-' + Date.now();
    if (chat) {
        chat.innerHTML += `<div id="${loadingId}" class="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-desert-100 max-w-[85%] mb-4"><div class="loading-spinner"></div></div>`;
        chat.scrollTop = chat.scrollHeight;
    }
    
    try {
        if (typeof AI !== 'undefined' && AI.config.groq.apiKey && AI.config.groq.apiKey !== 'gsk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
            const system = `Eres un arquitecto experto en clima desértico en Mexicali. Analiza eficiencia térmica, materiales y normativas. Sé técnico pero claro.`;
            const response = await AI.callGroq(q || "Analiza este plano arquitectónico para clima desértico.", system, 0.7, 2048);
            if (chat) {
                document.getElementById(loadingId).remove();
                if (response) chat.innerHTML += `<div class="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-desert-100 max-w-[85%] mb-4"><strong>Ingeniero AI ✨:</strong> ${response}</div>`;
                else chat.innerHTML += `<div class="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-desert-100 max-w-[85%] mb-4"><strong>Ingeniero AI ✨:</strong> Configura tu API Key de Groq.</div>`;
            }
        } else {
            document.getElementById(loadingId).remove();
            const localResponse = getLocalAIResponse(q);
            if (chat) chat.innerHTML += `<div class="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-desert-100 max-w-[85%] mb-4"><strong>Ingeniero AI ✨:</strong> ${localResponse}</div>`;
        }
    } catch (error) {
        if (chat) {
            document.getElementById(loadingId).remove();
            chat.innerHTML += `<div class="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-desert-100 max-w-[85%] mb-4"><strong>Ingeniero AI ✨:</strong> Error de conexión. Verifica tu API Key.</div>`;
        }
    }
    
    if (chat) chat.scrollTop = chat.scrollHeight;
    clearImage();
}

function getLocalAIResponse(query) {
    const q = query.toLowerCase();
    if (q.includes('plano') || q.includes('diseño') || q.includes('casa')) {
        return `Para clima desértico en Mexicali, recomiendo:
1. Orientación norte-sur para ventilación natural
2. Paredes de bloque térmico o Hebel
3. Techos con aislamiento XPS de 2"
4. Ventanas con vidrio bajo emisivo
5. Jardín interior con plantas nativas`;
    } else if (q.includes('material') || q.includes('costo')) {
        return `Materiales recomendados:
- Paredes: Hebel (R-2.5, $1,200/m²) o Block (R-0.8, $800/m²)
- Techos: Losa con XPS ($450/m², R-10)
- Ventanas: Doble vidrio ($3,500/m²)
- Pisos: Cerámico ($200-400/m²)`;
    } else if (q.includes('terreno') || q.includes('suelo')) {
        return `Análisis de terreno para Mexicali:
- Tipo: Arcilloso con arena
- Capacidad: 1-2 kg/cm²
- Cimentación: Mínimo 80cm de profundidad
- Drenaje: Recomendado perimetral
- Nivel freático: 10-15m (no afecta)`;
    }
    return `Soy asistente de arquitectura para clima desértico. Puedo ayudarte con análisis de planos, materiales, eficiencia térmica y normativas de Mexicali.`;
}

async function compareMaterials() {
    const mat = document.getElementById('material-select').value;
    const resBox = document.getElementById('material-res');
    if (!resBox) return;
    
    resBox.classList.remove('hidden');
    resBox.innerHTML = '<div class="flex justify-center p-4"><div class="loading-spinner"></div></div>';
    
    try {
        if (typeof AI !== 'undefined' && AI.config.groq.apiKey) {
            const system = `Eres ingeniero civil. Genera tabla comparativa en HTML (Tailwind) de materiales para clima desértico.`;
            const response = await AI.callGroq(`Compara: ${mat} para casa de 200m2 en Mexicali.`, system, 0.3, 2048);
            resBox.innerHTML = `<div class="text-[11px] bg-white p-3 rounded-xl border border-desert-100 shadow-inner">${response}</div>`;
        } else {
            const comparisons = {
                'Hebel vs Block': `<table class="w-full text-xs"><thead class="bg-desert-100"><tr><th class="p-2 text-left">Material</th><th class="p-2 text-left">R-Value</th><th class="p-2 text-left">Costo/m²</th><th class="p-2 text-left">Ahorro</th></tr></thead><tbody><tr class="border-b border-desert-100"><td class="p-2">Hebel</td><td class="p-2">2.5</td><td class="p-2">$1,200</td><td class="p-2">30-40%</td></tr><tr><td class="p-2">Block</td><td class="p-2">0.8</td><td class="p-2">$800</td><td class="p-2">10-15%</td></tr></tbody></table><p class="mt-2 text-xs">ROI: 3-5 años</p>`,
                'XPS vs Techo': `<table class="w-full text-xs"><thead class="bg-desert-100"><tr><th class="p-2 text-left">Material</th><th class="p-2 text-left">R-Value</th><th class="p-2 text-left">Costo/m²</th><th class="p-2 text-left">Ahorro</th></tr></thead><tbody><tr class="border-b border-desert-100"><td class="p-2">XPS 2"</td><td class="p-2">10.0</td><td class="p-2">$450</td><td class="p-2">40-50%</td></tr><tr><td class="p-2">Techo Limpio</td><td class="p-2">0.5</td><td class="p-2">$200</td><td class="p-2">0-5%</td></tr></tbody></table><p class="mt-2 text-xs">ROI: 2-3 años</p>`,
                'Vidrio Doble': `<table class="w-full text-xs"><thead class="bg-desert-100"><tr><th class="p-2 text-left">Tipo</th><th class="p-2 text-left">U-Value</th><th class="p-2 text-left">Costo/m²</th><th class="p-2 text-left">Ahorro</th></tr></thead><tbody><tr class="border-b border-desert-100"><td class="p-2">Doble</td><td class="p-2">1.2</td><td class="p-2">$3,500</td><td class="p-2">25-35%</td></tr><tr><td class="p-2">Sencillo</td><td class="p-2">5.8</td><td class="p-2">$1,800</td><td class="p-2">0%</td></tr></tbody></table><p class="mt-2 text-xs">ROI: 5-7 años</p>`
            };
            resBox.innerHTML = `<div class="text-[11px] bg-white p-3 rounded-xl border border-desert-100 shadow-inner">${comparisons[mat] || 'Selecciona una opción'}</div>`;
        }
    } catch (error) {
        resBox.innerHTML = '<div class="text-red-500 text-xs p-2">Error al calcular</div>';
    }
}

async function generateStoryWithAudio() {
    const modal = document.getElementById('story-modal');
    const content = document.getElementById('story-content');
    if (!modal || !content) return;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    content.innerHTML = "<p class='text-center py-10 animate-pulse'>Generando...</p>";
    
    try {
        if (typeof AI !== 'undefined' && AI.config.groq.apiKey) {
            const system = `Eres arquitecto poético. Escribe relato de 80-100 palabras sobre casa fresca en Mexicali a 45°C. Usa lenguaje evocador.`;
            const text = await AI.callGroq("Crea memoria sensorial de casa fresca en desierto.", system, 0.7, 512);
            content.innerText = text;
            if (AI.config.elevenLabs.apiKey) {
                const audioUrl = await AI.generateSpeech(text);
                if (audioUrl) playAudio(audioUrl);
            } else if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'es-MX'; utterance.rate = 1;
                window.speechSynthesis.speak(utterance);
                showAudioIndicator(true);
                utterance.onend = () => showAudioIndicator(false);
            }
        } else {
            const story = "El sol de Mexicali quema a 45°C, pero al cruzar el umbral de tu Oasis, una brisa fresca te envuelve. Las paredes de Hebel guardan el calor afuera, mientras el jardín susurra con agua. La luz filtrada por celosías dibuja patrones en el piso frío. Aquí, el desierto espera respetuoso.";
            content.innerText = story;
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(story);
                utterance.lang = 'es-MX'; utterance.rate = 1;
                window.speechSynthesis.speak(utterance);
                showAudioIndicator(true);
                utterance.onend = () => showAudioIndicator(false);
            }
        }
    } catch (error) {
        content.innerHTML = "<p class='text-red-500 text-center'>Error al generar</p>";
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
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    showAudioIndicator(false);
}

function showAudioIndicator(show) {
    const indicator = document.getElementById('audio-indicator');
    const stopBtn = document.getElementById('stop-audio');
    if (indicator) {
        if (show) { indicator.classList.remove('hidden'); indicator.classList.add('animate-pulse'); }
        else { indicator.classList.add('hidden'); indicator.classList.remove('animate-pulse'); }
    }
    if (stopBtn) stopBtn.classList.toggle('hidden', !show);
}

function closeModal() {
    stopAudio();
    const modal = document.getElementById('story-modal');
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
}

async function suggestPlants() {
    const resBox = document.getElementById('plant-res');
    if (!resBox) return;
    
    resBox.innerHTML = "<div class='text-center py-2'><i class='fa-solid fa-circle-notch fa-spin text-green-500'></i></div>";
    
    try {
        if (typeof AI !== 'undefined' && AI.config.groq.apiKey) {
            const system = `Eres biólogo. Responde JSON: {"plants":[{"n":"Nombre","s":"Científico","b":"Beneficio","w":"Agua","h":"Altura","i":"icono"}]}`;
            const response = await AI.callGroq("Sugiere 5 plantas nativas para Mexicali.", system, 0.3, 1024);
            try {
                const data = JSON.parse(response.replace(/```json|```/g, ""));
                resBox.innerHTML = "";
                data.plants.forEach(p => {
                    resBox.innerHTML += `<div class="bg-green-50 p-2 rounded-lg border border-green-100 flex items-center gap-3"><i class="fa-solid ${p.i || 'fa-seedling'} text-green-600"></i><div class="text-[11px] leading-tight"><strong>${p.n} (${p.s})</strong><br><span class="text-green-700">${p.b}</span><br><span class="text-xs text-green-500">Agua: ${p.w} | Altura: ${p.h}m</span></div></div>`;
                });
            } catch (e) { resBox.innerHTML = "<div class='text-red-500 text-xs p-2'>Error al procesar</div>"; }
        } else {
            const plants = [
                { n: "Palo Verde", s: "Parkinsonia", b: "Sombra, fijación N", w: "bajo", h: "6-10", i: "fa-tree" },
                { n: "Desert Willow", s: "Chilopsis", b: "Sombra, flores", w: "bajo", h: "4-8", i: "fa-tree" },
                { n: "Ocotillo", s: "Fouquieria", b: "Cercas, flores rojas", w: "muy bajo", h: "2-4", i: "fa-tree" },
                { n: "Agave", s: "Agave", b: "Paisajismo, fibra", w: "muy bajo", h: "0.5-2", i: "fa-seedling" },
            ];
            resBox.innerHTML = "";
            plants.forEach(p => {
                resBox.innerHTML += `<div class="bg-green-50 p-2 rounded-lg border border-green-100 flex items-center gap-3"><i class="fa-solid ${p.i} text-green-600"></i><div class="text-[11px] leading-tight"><strong>${p.n} (${p.s})</strong><br><span class="text-green-700">${p.b}</span><br><span class="text-xs text-green-500">Agua: ${p.w} | Altura: ${p.h}m</span></div></div>`;
            });
        }
    } catch (error) { resBox.innerHTML = "<div class='text-red-500 text-xs p-2'>Error al cargar</div>"; }
}

async function analyzeTerrain() {
    const resBox = document.getElementById('terrain-res');
    if (!resBox) return;
    
    resBox.classList.remove('hidden');
    resBox.innerHTML = "<div class='text-center py-2'><i class='fa-solid fa-circle-notch fa-spin text-amber-500'></i></div>";
    
    try {
        if (typeof AI !== 'undefined' && AI.config.groq.apiKey) {
            const system = `Eres ingeniero geotécnico. Analiza terreno para construcción en Mexicali.`;
            const response = await AI.callGroq("Analiza consideraciones geotécnicas para casa de 200m2 en Mexicali.", system, 0.3, 2048);
            resBox.innerHTML = `<div class="text-[11px] bg-white p-3 rounded-xl border border-desert-100 shadow-inner">${response}</div>`;
        } else {
            resBox.innerHTML = `<div class="bg-white p-3 rounded-xl border border-desert-100 shadow-inner text-xs"><h4 class="font-bold text-desert-800 mb-2">Análisis de Terreno</h4><ul class="list-disc list-inside space-y-1 text-slate-600"><li><strong>Suelo:</strong> Arcilloso con arena (1-2 kg/cm²)</li><li><strong>Cimentación:</strong> Mínimo 80cm</li><li><strong>Drenaje:</strong> Perimetral recomendado</li><li><strong>Freático:</strong> 10-15m (no afecta)</li></ul></div>`;
        }
    } catch (error) { resBox.innerHTML = "<div class='text-red-500 text-xs p-2'>Error al analizar</div>"; }
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

// Funciones de directorio
function loadTemplate(name) {
    if (typeof Editor3D !== 'undefined') {
        Editor3D.loadTemplate(name);
        showNotification('Plantilla cargada correctamente', 'success');
    }
}

function showMaterialsGuide() { showNotification('Guía de materiales disponible en documentación', 'info'); }
function showRegulations() { showNotification('Normativas disponibles en documentación', 'info'); }
function showSuppliers() { showNotification('Proveedores disponibles en documentación', 'info'); }
function showCalculators() { showNotification('Calculadoras integradas en Laboratorio IA', 'info'); }
function showFAQ() { showNotification('FAQ disponible en documentación', 'info'); }

// Estado
function loadSavedState() {
    if (typeof Editor3D !== 'undefined') {
        const saved = localStorage.getItem('mexicaliBuilder3DState');
        if (saved) {
            try { Editor3D.importFromJSON(saved); }
            catch (e) { console.error('Error loading state:', e); }
        }
    }
}

function saveCurrentState() {
    if (typeof Editor3D !== 'undefined') {
        const state = Editor3D.exportToJSON();
        localStorage.setItem('mexicaliBuilder3DState', state);
    }
}

// Notificaciones
function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 animate-slideUp`;
    notification.innerHTML = `<div class="flex items-center gap-3"><i class="fa-solid ${type === 'success' ? 'fa-check-circle text-green-500' : type === 'error' ? 'fa-exclamation-circle text-red-500' : 'fa-info-circle text-blue-500'}"></i><span class="text-sm">${message}</span></div>`;
    document.body.appendChild(notification);
    setTimeout(() => { notification.style.animation = 'fadeOut 0.3s ease-out'; setTimeout(() => notification.remove(), 300); }, duration);
}

// Exportar
window.MexicaliBuilder = { askAI, compareMaterials, generateStoryWithAudio, suggestPlants, analyzeTerrain, toggleAILab, loadTemplate, showMaterialsGuide, showRegulations, showSuppliers, showCalculators, showFAQ, showNotification };
