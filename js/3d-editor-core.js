/**
 * ===== NÚCLEO DEL EDITOR 3D =====
 * 
 * Editor ligero para diseño de casas en 200m²
 * Basado en Three.js
 */

// ===== CONFIGURACIÓN =====
const EditorConfig = {
    terrainWidth: 20,
    terrainDepth: 10,
    units: 'm',
    gridSize: 0.5,
    colors: {
        terrain: 0xf5f5dc,
        grid: 0xcccccc,
        wall: 0xa0522d,
        wallSelected: 0xcd853f,
        roof: 0x8b4513,
        floor: 0xd2b48c,
        window: 0x87ceeb,
        door: 0x654321,
        furniture: 0x4682b4,
        selected: 0xffd700,
        hover: 0xffa500,
    },
    heights: {
        wall: 3.0,
        door: 2.1,
        window: 1.2,
        floor: 0.15,
        roof: 0.2,
    }
};

// ===== ESTADO DEL EDITOR =====
const EditorState = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    terrain: null,
    gridHelper: null,
    walls: [],
    doors: [],
    windows: [],
    roofs: [],
    floors: [],
    furniture: [],
    selectedObject: null,
    hoverObject: null,
    mode: 'select',
    drawMode: 'wall',
    viewMode: '3d',
    isDrawing: false,
    currentDrawing: null,
    isMouseDown: false,
    dragStart: null,
    measurements: [],
    history: [],
    historyIndex: -1,
    showGrid: true,
    snapToGrid: true,
    toolbar: null,
    propertiesPanel: null,
    sidebar: null,
};

// ===== BIBLIOTECA DE ELEMENTOS =====
const ElementLibrary = {
    walls: {
        standard: { width: 0.2, height: 3.0, depth: 1.0, name: 'Pared Estándar' },
        thick: { width: 0.3, height: 3.0, depth: 1.0, name: 'Pared Gruesa' },
        thin: { width: 0.15, height: 3.0, depth: 1.0, name: 'Pared Delgada' },
    },
    doors: {
        single: { width: 0.9, height: 2.1, depth: 0.1, name: 'Puerta Sencilla' },
        double: { width: 1.8, height: 2.1, depth: 0.1, name: 'Puerta Doble' },
        sliding: { width: 2.4, height: 2.1, depth: 0.05, name: 'Puerta Corrediza' },
    },
    windows: {
        standard: { width: 1.2, height: 1.2, depth: 0.1, name: 'Ventana Estándar' },
        large: { width: 2.0, height: 1.5, depth: 0.1, name: 'Ventana Grande' },
        small: { width: 0.8, height: 0.8, depth: 0.1, name: 'Ventana Pequeña' },
    },
    floors: {
        concrete: { height: 0.15, name: 'Piso de Concreto' },
        tile: { height: 0.1, name: 'Piso de Azulejo' },
        wood: { height: 0.15, name: 'Piso de Madera' },
    },
    furniture: {
        sofa: { width: 2.0, height: 0.8, depth: 0.9, name: 'Sofá' },
        chair: { width: 0.6, height: 1.0, depth: 0.6, name: 'Silla' },
        table: { width: 1.2, height: 0.75, depth: 0.8, name: 'Mesa' },
        bed: { width: 1.5, height: 0.5, depth: 2.0, name: 'Cama' },
        cabinet: { width: 1.2, height: 1.8, depth: 0.6, name: 'Gabinete' },
    }
};

// ===== INICIALIZACIÓN =====
async function init3DEditor(containerId) {
    if (typeof THREE === 'undefined') {
        console.error('Three.js no está cargado');
        return false;
    }
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Contenedor ${containerId} no encontrado`);
        return false;
    }
    
    setupScene(container);
    setupCamera(container);
    setupRenderer(container);
    setupControls();
    setupLights();
    createTerrain();
    createGrid();
    setupEventListeners(container);
    setupUI();
    animate();
    
    return true;
}

function setupScene(container) {
    EditorState.scene = new THREE.Scene();
    EditorState.scene.background = new THREE.Color(0xf0f0f0);
}

function setupCamera(container) {
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);
    EditorState.camera = camera;
    
    window.addEventListener('resize', () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        EditorState.renderer.setSize(width, height);
    });
}

function setupRenderer(container) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    EditorState.renderer = renderer;
}

function setupControls() {
    const controls = new THREE.OrbitControls(
        EditorState.camera, 
        EditorState.renderer.domElement
    );
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    EditorState.controls = controls;
}

function setupLights() {
    const scene = EditorState.scene;
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
}

function createTerrain() {
    const width = EditorConfig.terrainWidth;
    const depth = EditorConfig.terrainDepth;
    const geometry = new THREE.PlaneGeometry(width, depth);
    const material = new THREE.MeshStandardMaterial({
        color: EditorConfig.colors.terrain,
        roughness: 0.8,
        metalness: 0.2,
        side: THREE.DoubleSide,
    });
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -0.1;
    terrain.receiveShadow = true;
    terrain.userData = { type: 'terrain', name: 'Terreno' };
    EditorState.terrain = terrain;
    EditorState.scene.add(terrain);
}

function createGrid() {
    const size = Math.max(EditorConfig.terrainWidth, EditorConfig.terrainDepth) * 2;
    const divisions = size / EditorConfig.gridSize;
    const gridHelper = new THREE.GridHelper(size, divisions, EditorConfig.colors.grid, EditorConfig.colors.grid);
    gridHelper.position.y = 0.01;
    gridHelper.userData = { type: 'grid', name: 'Cuadrícula' };
    EditorState.gridHelper = gridHelper;
    EditorState.scene.add(gridHelper);
}

// ===== HERRAMIENTAS DE DIBUJO =====
function startDrawing(elementType, elementId) {
    EditorState.mode = 'draw';
    EditorState.drawMode = elementType;
    EditorState.currentDrawing = { type: elementType, id: elementId, start: null, end: null, object: null };
    updateUIForMode();
}

function getMousePositionOnPlane(event) {
    const container = EditorState.renderer.domElement;
    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, EditorState.camera);
    const intersects = raycaster.intersectObject(EditorState.terrain);
    
    if (intersects.length > 0) {
        const point = intersects[0].point;
        if (EditorState.snapToGrid) {
            const gridSize = EditorConfig.gridSize;
            point.x = Math.round(point.x / gridSize) * gridSize;
            point.z = Math.round(point.z / gridSize) * gridSize;
        }
        return point;
    }
    return null;
}

function handleDrawingClick(event) {
    if (EditorState.mode !== 'draw') return;
    const point = getMousePositionOnPlane(event);
    if (!point) return;
    
    if (!EditorState.currentDrawing.start) {
        EditorState.currentDrawing.start = point.clone();
        createDrawingPreview(point);
    } else {
        EditorState.currentDrawing.end = point.clone();
        createElementFromDrawing();
        removeDrawingPreview();
        EditorState.currentDrawing = null;
        EditorState.mode = 'select';
        updateUIForMode();
    }
}

function createDrawingPreview(startPoint) {
    const { type, id } = EditorState.currentDrawing;
    let elementConfig = ElementLibrary[type][id] || ElementLibrary[type].standard;
    
    let geometry, material, mesh;
    const height = elementConfig.height || (type === 'wall' ? 3.0 : type === 'door' ? 2.1 : 1.2);
    const width = elementConfig.width || 0.2;
    
    if (type === 'wall') {
        geometry = new THREE.BoxGeometry(width, height, 0.01);
        material = new THREE.MeshStandardMaterial({ color: EditorConfig.colors.wall, transparent: true, opacity: 0.7 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(startPoint);
        mesh.position.y += height / 2;
    } else {
        const depth = elementConfig.depth || 0.1;
        geometry = new THREE.BoxGeometry(width, height, depth);
        material = new THREE.MeshStandardMaterial({ 
            color: type === 'door' ? EditorConfig.colors.door : EditorConfig.colors.window,
            transparent: type === 'window',
            opacity: type === 'window' ? 0.7 : 1
        });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(startPoint);
        mesh.position.y += height / 2;
    }
    
    if (mesh) {
        mesh.userData = { type: 'preview', elementType: type, elementId: id, isPreview: true };
        EditorState.currentDrawing.object = mesh;
        EditorState.scene.add(mesh);
    }
}

function updateDrawingPreview(endPoint) {
    if (!EditorState.currentDrawing || !EditorState.currentDrawing.object) return;
    
    const start = EditorState.currentDrawing.start;
    const object = EditorState.currentDrawing.object;
    const { type, id } = EditorState.currentDrawing;
    const elementConfig = ElementLibrary[type][id] || ElementLibrary[type].standard;
    
    if (type === 'wall') {
        const direction = new THREE.Vector3().subVectors(endPoint, start);
        const length = direction.length();
        direction.normalize();
        
        const height = elementConfig.height || 3.0;
        const width = elementConfig.width || 0.2;
        
        object.scale.set(width, height, length);
        const center = new THREE.Vector3().addVectors(start, endPoint).multiplyScalar(0.5);
        object.position.copy(center);
        object.position.y = height / 2;
        object.rotation.y = Math.atan2(direction.x, direction.z);
    }
}

function removeDrawingPreview() {
    if (EditorState.currentDrawing && EditorState.currentDrawing.object) {
        EditorState.scene.remove(EditorState.currentDrawing.object);
        EditorState.currentDrawing.object = null;
    }
}

function createElementFromDrawing() {
    if (!EditorState.currentDrawing || !EditorState.currentDrawing.start || !EditorState.currentDrawing.end) return null;
    
    const start = EditorState.currentDrawing.start;
    const end = EditorState.currentDrawing.end;
    const { type, id } = EditorState.currentDrawing;
    const elementConfig = ElementLibrary[type][id] || ElementLibrary[type].standard;
    
    let mesh, geometry, material;
    
    if (type === 'wall') {
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        direction.normalize();
        
        const width = elementConfig.width || 0.2;
        const height = elementConfig.height || 3.0;
        
        geometry = new THREE.BoxGeometry(width, height, length);
        material = new THREE.MeshStandardMaterial({ color: EditorConfig.colors.wall, roughness: 0.7, metalness: 0.1 });
        mesh = new THREE.Mesh(geometry, material);
        
        const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mesh.position.copy(center);
        mesh.position.y = height / 2;
        mesh.rotation.y = Math.atan2(direction.x, direction.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        mesh.userData = {
            type: 'wall', elementId: id, name: elementConfig.name || 'Pared',
            width, height, length, start: { x: start.x, y: start.y, z: start.z },
            end: { x: end.x, y: end.y, z: end.z }, material: 'concrete'
        };
        EditorState.walls.push(mesh);
    } else if (type === 'door' || type === 'window') {
        const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const direction = new THREE.Vector3().subVectors(end, start);
        const angle = Math.atan2(direction.x, direction.z);
        
        const width = elementConfig.width;
        const height = elementConfig.height;
        const depth = elementConfig.depth || 0.1;
        
        geometry = new THREE.BoxGeometry(width, height, depth);
        material = new THREE.MeshStandardMaterial({ 
            color: type === 'door' ? EditorConfig.colors.door : EditorConfig.colors.window,
            transparent: type === 'window',
            opacity: type === 'window' ? 0.7 : 1,
            roughness: type === 'door' ? 0.5 : 0.1,
            metalness: type === 'door' ? 0.2 : 0.1
        });
        mesh = new THREE.Mesh(geometry, material);
        
        mesh.position.copy(center);
        mesh.position.y = height / 2;
        mesh.rotation.y = angle;
        
        mesh.userData = {
            type, elementId: id, name: elementConfig.name || (type === 'door' ? 'Puerta' : 'Ventana'),
            width, height, depth, position: { x: center.x, y: center.y, z: center.z }, rotation: angle
        };
        
        if (type === 'door') EditorState.doors.push(mesh);
        else EditorState.windows.push(mesh);
    } else if (type === 'furniture') {
        const width = elementConfig.width;
        const height = elementConfig.height;
        const depth = elementConfig.depth;
        
        geometry = new THREE.BoxGeometry(width, height, depth);
        material = new THREE.MeshStandardMaterial({ color: EditorConfig.colors.furniture, roughness: 0.5, metalness: 0.3 });
        mesh = new THREE.Mesh(geometry, material);
        
        mesh.position.copy(start);
        mesh.position.y = height / 2;
        
        mesh.userData = {
            type: 'furniture', elementId: id, name: elementConfig.name || 'Mueble',
            width, height, depth, position: { x: start.x, y: start.y, z: start.z }
        };
        EditorState.furniture.push(mesh);
    }
    
    if (mesh) {
        EditorState.scene.add(mesh);
        saveToHistory('add', mesh);
    }
    return mesh;
}

// ===== SELECCIÓN Y MANIPULACIÓN =====
function selectObject(object) {
    if (EditorState.selectedObject) {
        EditorState.selectedObject.material.color.setHex(getOriginalColor(EditorState.selectedObject));
    }
    if (object && object.userData && object.userData.type !== 'terrain' && object.userData.type !== 'grid') {
        EditorState.selectedObject = object;
        object.material.color.setHex(EditorConfig.colors.selected);
        showProperties(object);
    } else {
        EditorState.selectedObject = null;
        closePropertiesPanel();
    }
}

function getOriginalColor(object) {
    const type = object.userData.type;
    const colors = { wall: 0xa0522d, door: 0x654321, window: 0x87ceeb, roof: 0x8b4513, floor: 0xd2b48c, furniture: 0x4682b4 };
    return colors[type] || 0xcccccc;
}

function deleteSelectedObject() {
    if (!EditorState.selectedObject) return;
    const object = EditorState.selectedObject;
    const type = object.userData.type;
    
    EditorState.scene.remove(object);
    if (type === 'wall') EditorState.walls = EditorState.walls.filter(w => w !== object);
    else if (type === 'door') EditorState.doors = EditorState.doors.filter(d => d !== object);
    else if (type === 'window') EditorState.windows = EditorState.windows.filter(w => w !== object);
    else if (type === 'furniture') EditorState.furniture = EditorState.furniture.filter(f => f !== object);
    
    EditorState.selectedObject = null;
    saveToHistory('delete', object);
    closePropertiesPanel();
}

// ===== HISTORIA =====
function saveToHistory(action, object) {
    if (EditorState.historyIndex < EditorState.history.length - 1) {
        EditorState.history = EditorState.history.slice(0, EditorState.historyIndex + 1);
    }
    EditorState.history.push({ action, object, timestamp: Date.now() });
    EditorState.historyIndex = EditorState.history.length - 1;
}

function undo() {
    if (EditorState.historyIndex < 0) return;
    const action = EditorState.history[EditorState.historyIndex];
    
    if (action.action === 'add') {
        EditorState.scene.remove(action.object);
        const type = action.object.userData.type;
        if (type === 'wall') EditorState.walls = EditorState.walls.filter(w => w !== action.object);
        else if (type === 'door') EditorState.doors = EditorState.doors.filter(d => d !== action.object);
        else if (type === 'window') EditorState.windows = EditorState.windows.filter(w => w !== action.object);
        else if (type === 'furniture') EditorState.furniture = EditorState.furniture.filter(f => f !== action.object);
        if (EditorState.selectedObject === action.object) EditorState.selectedObject = null;
    } else if (action.action === 'delete') {
        EditorState.scene.add(action.object);
        const type = action.object.userData.type;
        if (type === 'wall') EditorState.walls.push(action.object);
        else if (type === 'door') EditorState.doors.push(action.object);
        else if (type === 'window') EditorState.windows.push(action.object);
        else if (type === 'furniture') EditorState.furniture.push(action.object);
    }
    EditorState.historyIndex--;
}

function redo() {
    if (EditorState.historyIndex >= EditorState.history.length - 1) return;
    EditorState.historyIndex++;
    const action = EditorState.history[EditorState.historyIndex];
    
    if (action.action === 'add') {
        EditorState.scene.add(action.object);
        const type = action.object.userData.type;
        if (type === 'wall') EditorState.walls.push(action.object);
        else if (type === 'door') EditorState.doors.push(action.object);
        else if (type === 'window') EditorState.windows.push(action.object);
        else if (type === 'furniture') EditorState.furniture.push(action.object);
    } else if (action.action === 'delete') {
        EditorState.scene.remove(action.object);
        const type = action.object.userData.type;
        if (type === 'wall') EditorState.walls = EditorState.walls.filter(w => w !== action.object);
        else if (type === 'door') EditorState.doors = EditorState.doors.filter(d => d !== action.object);
        else if (type === 'window') EditorState.windows = EditorState.windows.filter(w => w !== action.object);
        else if (type === 'furniture') EditorState.furniture = EditorState.furniture.filter(f => f !== action.object);
        if (EditorState.selectedObject === action.object) EditorState.selectedObject = null;
    }
}

// ===== EXPORTACIÓN =====
function exportToJSON() {
    const data = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        config: { terrainWidth: EditorConfig.terrainWidth, terrainDepth: EditorConfig.terrainDepth, units: EditorConfig.units },
        elements: {
            walls: EditorState.walls.map(w => ({
                type: 'wall', elementId: w.userData.elementId, name: w.userData.name,
                position: { x: w.position.x, y: w.position.y, z: w.position.z },
                rotation: { x: w.rotation.x, y: w.rotation.y, z: w.rotation.z },
                dimensions: { width: w.userData.width, height: w.userData.height, length: w.userData.length },
                start: w.userData.start, end: w.userData.end, material: w.userData.material
            })),
            doors: EditorState.doors.map(d => ({
                type: 'door', elementId: d.userData.elementId, name: d.userData.name,
                position: d.userData.position, rotation: d.userData.rotation,
                dimensions: { width: d.userData.width, height: d.userData.height, depth: d.userData.depth }
            })),
            windows: EditorState.windows.map(w => ({
                type: 'window', elementId: w.userData.elementId, name: w.userData.name,
                position: w.userData.position, rotation: w.userData.rotation,
                dimensions: { width: w.userData.width, height: w.userData.height, depth: w.userData.depth }
            })),
            furniture: EditorState.furniture.map(f => ({
                type: 'furniture', elementId: f.userData.elementId, name: f.userData.name,
                position: f.userData.position,
                dimensions: { width: f.userData.width, height: f.userData.height, depth: f.userData.depth }
            }))
        }
    };
    return JSON.stringify(data, null, 2);
}

function exportToSVG() {
    const width = EditorConfig.terrainWidth * 20;
    const height = EditorConfig.terrainDepth * 20;
    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect x="0" y="0" width="${width}" height="${height}" fill="#f5f5dc" stroke="#ccc"/>`;
    
    const gridSize = EditorConfig.gridSize * 20;
    for (let x = 0; x <= width; x += gridSize) {
        svg += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#eee" stroke-width="0.5"/>`;
    }
    for (let y = 0; y <= height; y += gridSize) {
        svg += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#eee" stroke-width="0.5"/>`;
    }
    
    EditorState.walls.forEach(wall => {
        const start = wall.userData.start;
        const end = wall.userData.end;
        const x1 = (start.x + EditorConfig.terrainWidth / 2) * 20;
        const z1 = (start.z + EditorConfig.terrainDepth / 2) * 20;
        const x2 = (end.x + EditorConfig.terrainWidth / 2) * 20;
        const z2 = (end.z + EditorConfig.terrainDepth / 2) * 20;
        const dx = x2 - x1; const dz = z2 - z1;
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx) * 180 / Math.PI;
        svg += `<rect x="${x1}" y="${z1}" width="${length}" height="${wall.userData.width * 20}" fill="#a0522d" transform="rotate(${angle}, ${x1}, ${z1})"/>`;
    });
    
    svg += '</svg>';
    return svg;
}

async function exportToPNG() {
    return new Promise((resolve) => {
        EditorState.renderer.render(EditorState.scene, EditorState.camera);
        EditorState.renderer.domElement.toBlob((blob) => resolve(blob), 'image/png');
    });
}

async function copyToClipboard(format = 'json') {
    let data = format === 'svg' ? exportToSVG() : exportToJSON();
    try {
        await navigator.clipboard.writeText(data);
        return true;
    } catch (error) {
        console.error('Error al copiar:', error);
        return false;
    }
}

function importFromJSON(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        clearScene();
        
        if (data.config) {
            EditorConfig.terrainWidth = data.config.terrainWidth || 20;
            EditorConfig.terrainDepth = data.config.terrainDepth || 10;
        }
        
        if (EditorState.terrain) EditorState.scene.remove(EditorState.terrain);
        createTerrain();
        if (EditorState.gridHelper) EditorState.scene.remove(EditorState.gridHelper);
        createGrid();
        
        if (data.elements) {
            (data.elements.walls || []).forEach(w => createWallFromData(w));
            (data.elements.doors || []).forEach(d => createDoorFromData(d));
            (data.elements.windows || []).forEach(w => createWindowFromData(w));
            (data.elements.furniture || []).forEach(f => createFurnitureFromData(f));
        }
        return true;
    } catch (error) {
        console.error('Error al importar:', error);
        return false;
    }
}

function createWallFromData(data) {
    const width = data.dimensions?.width || 0.2;
    const height = data.dimensions?.height || 3.0;
    const length = data.dimensions?.length || 1.0;
    const geometry = new THREE.BoxGeometry(width, height, length);
    const material = new THREE.MeshStandardMaterial({ color: EditorConfig.colors.wall, roughness: 0.7, metalness: 0.1 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(data.position.x, data.position.y, data.position.z);
    mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.userData = { type: 'wall', elementId: data.elementId, name: data.name || 'Pared', width, height, length, start: data.start, end: data.end, material: data.material };
    EditorState.walls.push(mesh); EditorState.scene.add(mesh);
}

function createDoorFromData(data) {
    const width = data.dimensions?.width || 0.9; const height = data.dimensions?.height || 2.1; const depth = data.dimensions?.depth || 0.1;
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color: EditorConfig.colors.door, roughness: 0.5, metalness: 0.2 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(data.position.x, data.position.y, data.position.z); mesh.rotation.y = data.rotation || 0;
    mesh.userData = { type: 'door', elementId: data.elementId, name: data.name || 'Puerta', width, height, depth, position: data.position, rotation: data.rotation };
    EditorState.doors.push(mesh); EditorState.scene.add(mesh);
}

function createWindowFromData(data) {
    const width = data.dimensions?.width || 1.2; const height = data.dimensions?.height || 1.2; const depth = data.dimensions?.depth || 0.1;
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color: EditorConfig.colors.window, transparent: true, opacity: 0.7 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(data.position.x, data.position.y, data.position.z); mesh.rotation.y = data.rotation || 0;
    mesh.userData = { type: 'window', elementId: data.elementId, name: data.name || 'Ventana', width, height, depth, position: data.position, rotation: data.rotation };
    EditorState.windows.push(mesh); EditorState.scene.add(mesh);
}

function createFurnitureFromData(data) {
    const width = data.dimensions?.width || 1; const height = data.dimensions?.height || 1; const depth = data.dimensions?.depth || 1;
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color: EditorConfig.colors.furniture, roughness: 0.5, metalness: 0.3 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(data.position.x, data.position.y, data.position.z);
    mesh.userData = { type: 'furniture', elementId: data.elementId, name: data.name || 'Mueble', width, height, depth, position: data.position };
    EditorState.furniture.push(mesh); EditorState.scene.add(mesh);
}

function clearScene() {
    [EditorState.walls, EditorState.doors, EditorState.windows, EditorState.floors, EditorState.furniture].forEach(arr => arr.length = 0);
    const objectsToRemove = [];
    EditorState.scene.traverse(obj => { if (obj.userData && obj.userData.type !== 'terrain' && obj.userData.type !== 'grid') objectsToRemove.push(obj); });
    objectsToRemove.forEach(obj => { EditorState.scene.remove(obj); if (obj.geometry) obj.geometry.dispose(); if (obj.material) obj.material.dispose(); });
    EditorState.selectedObject = null; EditorState.history = []; EditorState.historyIndex = -1; closePropertiesPanel();
}

// ===== EVENTOS =====
function setupEventListeners(container) {
    container.addEventListener('mousedown', onMouseDown, false);
    container.addEventListener('mousemove', onMouseMove, false);
    container.addEventListener('mouseup', onMouseUp, false);
    container.addEventListener('click', onClick, false);
    container.addEventListener('dblclick', onDoubleClick, false);
    window.addEventListener('keydown', onKeyDown, false);
}

function onMouseDown(event) {
    if (event.button !== 0) return;
    const point = getMousePositionOnPlane(event);
    if (!point) return;
    
    if (EditorState.mode === 'draw') {
        handleDrawingClick(event);
    } else if (EditorState.mode === 'select') {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const rect = EditorState.renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, EditorState.camera);
        
        const intersects = raycaster.intersectObjects([...EditorState.walls, ...EditorState.doors, ...EditorState.windows, ...EditorState.furniture]);
        if (intersects.length > 0) {
            selectObject(intersects[0].object);
            EditorState.dragStart = { object: intersects[0].object, position: intersects[0].object.position.clone(), mouse: { x: event.clientX, y: event.clientY } };
        } else {
            selectObject(null);
        }
    }
    EditorState.isMouseDown = true;
}

function onMouseMove(event) {
    const point = getMousePositionOnPlane(event);
    if (EditorState.mode === 'draw' && EditorState.currentDrawing && EditorState.currentDrawing.start) {
        updateDrawingPreview(point);
    }
    if (EditorState.mode === 'select' && EditorState.isMouseDown && EditorState.dragStart) {
        const deltaX = (event.clientX - EditorState.dragStart.mouse.x) * 0.01;
        const deltaZ = (event.clientY - EditorState.dragStart.mouse.y) * 0.01;
        const object = EditorState.dragStart.object;
        const gridSize = EditorState.snapToGrid ? EditorConfig.gridSize : 0.01;
        object.position.x = EditorState.dragStart.position.x - (EditorState.snapToGrid ? Math.round(deltaX / gridSize) * gridSize : deltaX);
        object.position.z = EditorState.dragStart.position.z - (EditorState.snapToGrid ? Math.round(deltaZ / gridSize) * gridSize : deltaZ);
        EditorState.dragStart.mouse = { x: event.clientX, y: event.clientY };
    }
}

function onMouseUp() { EditorState.isMouseDown = false; EditorState.dragStart = null; }
function onClick() {}
function onDoubleClick() { if (EditorState.mode === 'draw' && EditorState.currentDrawing) { removeDrawingPreview(); EditorState.currentDrawing = null; EditorState.mode = 'select'; updateUIForMode(); } }

function onKeyDown(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
    switch (event.key) {
        case 'Delete': case 'Backspace': if (EditorState.mode === 'select') deleteSelectedObject(); break;
        case 'Escape': if (EditorState.mode === 'draw') { removeDrawingPreview(); EditorState.currentDrawing = null; EditorState.mode = 'select'; updateUIForMode(); } else if (EditorState.selectedObject) selectObject(null); break;
        case 'z': if (event.ctrlKey || event.metaKey) undo(); break;
        case 'y': if (event.ctrlKey || event.metaKey) redo(); break;
        case 'c': if (event.ctrlKey || event.metaKey) copyToClipboard('json'); break;
        case 'g': EditorState.snapToGrid = !EditorState.snapToGrid; updateUIForGrid(); break;
    }
}

// ===== UI =====
function setupUI() {
    createToolbar(); createPropertiesPanel(); createSidebar();
    updateUIForMode(); updateUIForSelection(); updateUIForGrid();
}

function createToolbar() {
    const container = document.getElementById('editor-container');
    if (!container) return;
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar-3d';
    toolbar.id = 'toolbar-3d';
    toolbar.style.cssText = 'position: absolute; top: 10px; left: 10px; z-index: 100; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 8px; display: flex; gap: 4px; flex-wrap: wrap;';
    
    const modes = [
        { id: 'select', icon: 'fa-mouse-pointer', label: 'Seleccionar', action: () => { EditorState.mode = 'select'; updateUIForMode(); } },
        { id: 'draw-wall', icon: 'fa-ruler-combined', label: 'Pared', action: () => startDrawing('wall', 'standard') },
        { id: 'draw-door', icon: 'fa-door-open', label: 'Puerta', action: () => startDrawing('door', 'single') },
        { id: 'draw-window', icon: 'fa-window-maximize', label: 'Ventana', action: () => startDrawing('window', 'standard') },
        { id: 'draw-furniture', icon: 'fa-chair', label: 'Mueble', action: () => startDrawing('furniture', 'chair') },
    ];
    modes.forEach(mode => { const btn = document.createElement('button'); btn.innerHTML = `<i class="fa-solid ${mode.icon}"></i>`; btn.title = mode.label; btn.onclick = mode.action; btn.dataset.mode = mode.id; toolbar.appendChild(btn); });
    
    const divider = document.createElement('div'); divider.style.cssText = 'width: 1px; height: 24px; background: #ccc; margin: 0 4px;'; toolbar.appendChild(divider);
    
    const actions = [
        { id: 'undo', icon: 'fa-undo', label: 'Deshacer', action: undo },
        { id: 'redo', icon: 'fa-redo', label: 'Rehacer', action: redo },
        { id: 'clear', icon: 'fa-trash', label: 'Limpiar', action: clearScene },
        { id: 'grid', icon: 'fa-th', label: 'Cuadrícula', action: () => { EditorState.snapToGrid = !EditorState.snapToGrid; updateUIForGrid(); } },
    ];
    actions.forEach(action => { const btn = document.createElement('button'); btn.innerHTML = `<i class="fa-solid ${action.icon}"></i>`; btn.title = action.label; btn.onclick = action.action; btn.dataset.action = action.id; toolbar.appendChild(btn); });
    
    const divider2 = document.createElement('div'); divider2.style.cssText = 'width: 1px; height: 24px; background: #ccc; margin: 0 4px;'; toolbar.appendChild(divider2);
    
    const exports = [
        { id: 'copy-json', icon: 'fa-copy', label: 'Copiar JSON', action: () => copyToClipboard('json') },
        { id: 'copy-svg', icon: 'fa-file-code', label: 'Copiar SVG', action: () => copyToClipboard('svg') },
        { id: 'download-png', icon: 'fa-file-image', label: 'Descargar PNG', action: downloadPNG },
    ];
    exports.forEach(exp => { const btn = document.createElement('button'); btn.innerHTML = `<i class="fa-solid ${exp.icon}"></i>`; btn.title = exp.label; btn.onclick = exp.action; btn.dataset.export = exp.id; toolbar.appendChild(btn); });
    
    container.prepend(toolbar); EditorState.toolbar = toolbar;
}

function createPropertiesPanel() {
    const container = document.getElementById('editor-container');
    if (!container) return;
    const panel = document.createElement('div');
    panel.className = 'properties-panel';
    panel.id = 'properties-panel';
    panel.style.cssText = 'position: absolute; right: 10px; top: 10px; width: 250px; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 10px; z-index: 100; display: none;';
    panel.innerHTML = `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;"><h4 style="margin: 0; font-size: 14px; font-weight: 600;">Propiedades</h4><button onclick="closePropertiesPanel()" style="background: none; border: none; cursor: pointer; font-size: 16px;"><i class="fa-solid fa-times"></i></button></div><div id="properties-content"></div>`;
    container.appendChild(panel); EditorState.propertiesPanel = panel;
}

function createSidebar() {
    const container = document.getElementById('editor-container');
    if (!container) return;
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar-3d';
    sidebar.id = 'sidebar-3d';
    sidebar.style.cssText = 'position: absolute; left: 10px; top: 50px; width: 200px; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 10px; z-index: 100;';
    sidebar.innerHTML = `<div style="margin-bottom: 15px;"><h4 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase;">Biblioteca</h4><div style="display: flex; flex-direction: column; gap: 4px;"><button onclick="showElementCategory('walls')" style="padding: 6px; border: none; background: #f5f5f5; border-radius: 4px; cursor: pointer; font-size: 12px; text-align: left;"><i class="fa-solid fa-ruler-combined"></i> Paredes</button><button onclick="showElementCategory('doors')" style="padding: 6px; border: none; background: #f5f5f5; border-radius: 4px; cursor: pointer; font-size: 12px; text-align: left;"><i class="fa-solid fa-door-open"></i> Puertas</button><button onclick="showElementCategory('windows')" style="padding: 6px; border: none; background: #f5f5f5; border-radius: 4px; cursor: pointer; font-size: 12px; text-align: left;"><i class="fa-solid fa-window-maximize"></i> Ventanas</button><button onclick="showElementCategory('furniture')" style="padding: 6px; border: none; background: #f5f5f5; border-radius: 4px; cursor: pointer; font-size: 12px; text-align: left;"><i class="fa-solid fa-chair"></i> Muebles</button></div></div>`;
    container.appendChild(sidebar); EditorState.sidebar = sidebar;
}

function showElementCategory(category) {
    const items = { walls: ['standard', 'thick', 'thin'], doors: ['single', 'double', 'sliding'], windows: ['standard', 'large', 'small'], furniture: ['sofa', 'chair', 'table', 'bed', 'cabinet'] };
    const list = items[category];
    if (!list) return;
    const container = document.getElementById('editor-container');
    const popup = document.createElement('div');
    popup.style.cssText = 'position: absolute; left: 220px; top: 50px; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.2); padding: 10px; z-index: 200;';
    popup.innerHTML = `<h4 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 600;">${category}</h4>`;
    list.forEach(id => { const btn = document.createElement('button'); btn.textContent = ElementLibrary[category][id].name; btn.style.cssText = 'display: block; width: 100%; padding: 6px; margin: 2px 0; border: none; background: #f5f5f5; border-radius: 4px; cursor: pointer; font-size: 12px; text-align: left;'; btn.onclick = () => { startDrawing(category, id); container.removeChild(popup); }; popup.appendChild(btn); });
    container.appendChild(popup);
}

function showProperties(object) {
    const content = document.getElementById('properties-content');
    if (!content) return;
    const data = object.userData;
    let html = `<div style="margin-bottom: 10px;"><label style="display: block; font-size: 11px; color: #666; margin-bottom: 4px;">Nombre</label><input type="text" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;" value="${data.name || ''}" onchange="updateProperty('name', this.value)"></div>`;
    
    if (data.width !== undefined) html += `<div style="margin-bottom: 10px;"><label style="display: block; font-size: 11px; color: #666; margin-bottom: 4px;">Ancho (m)</label><input type="number" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;" value="${data.width}" onchange="updateProperty('width', parseFloat(this.value))" step="0.01"></div>`;
    if (data.height !== undefined) html += `<div style="margin-bottom: 10px;"><label style="display: block; font-size: 11px; color: #666; margin-bottom: 4px;">Alto (m)</label><input type="number" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;" value="${data.height}" onchange="updateProperty('height', parseFloat(this.value))" step="0.01"></div>`;
    if (data.length !== undefined) html += `<div style="margin-bottom: 10px;"><label style="display: block; font-size: 11px; color: #666; margin-bottom: 4px;">Largo (m)</label><input type="number" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;" value="${data.length}" onchange="updateProperty('length', parseFloat(this.value))" step="0.01"></div>`;
    if (data.depth !== undefined) html += `<div style="margin-bottom: 10px;"><label style="display: block; font-size: 11px; color: #666; margin-bottom: 4px;">Profundidad (m)</label><input type="number" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;" value="${data.depth}" onchange="updateProperty('depth', parseFloat(this.value))" step="0.01"></div>`;
    if (data.material !== undefined) html += `<div style="margin-bottom: 10px;"><label style="display: block; font-size: 11px; color: #666; margin-bottom: 4px;">Material</label><select style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;" onchange="updateProperty('material', this.value)"><option value="concrete" ${data.material === 'concrete' ? 'selected' : ''}>Concreto</option><option value="brick" ${data.material === 'brick' ? 'selected' : ''}>Ladrillo</option><option value="wood" ${data.material === 'wood' ? 'selected' : ''}>Madera</option></select></div>`;
    
    content.innerHTML = html; if (EditorState.propertiesPanel) EditorState.propertiesPanel.style.display = 'block';
}

function closePropertiesPanel() { if (EditorState.propertiesPanel) EditorState.propertiesPanel.style.display = 'none'; }
function updateProperty(key, value) { if (EditorState.selectedObject) { EditorState.selectedObject.userData[key] = value; updateObjectGeometry(EditorState.selectedObject); } }
function updateObjectGeometry(object) { const data = object.userData; const type = data.type; if (type === 'wall') { object.geometry.dispose(); object.geometry = new THREE.BoxGeometry(data.width || 0.2, data.height || 3.0, data.length || 1.0); } else if (type === 'door' || type === 'window') { object.geometry.dispose(); object.geometry = new THREE.BoxGeometry(data.width, data.height, data.depth || 0.1); } else if (type === 'furniture') { object.geometry.dispose(); object.geometry = new THREE.BoxGeometry(data.width, data.height, data.depth); } }
function updateUIForMode() { const toolbar = EditorState.toolbar; if (!toolbar) return; toolbar.querySelectorAll('button[data-mode]').forEach(btn => { btn.classList.remove('active'); if (btn.dataset.mode === EditorState.mode) btn.classList.add('active'); }); }
function updateUIForSelection() { if (EditorState.selectedObject) showProperties(EditorState.selectedObject); else closePropertiesPanel(); }
function updateUIForGrid() { const toolbar = EditorState.toolbar; if (!toolbar) { const gridBtn = toolbar.querySelector('button[data-action="grid"]'); if (gridBtn) gridBtn.classList.toggle('active', EditorState.snapToGrid); } if (EditorState.gridHelper) EditorState.gridHelper.visible = EditorState.snapToGrid; }
async function downloadPNG() { const blob = await exportToPNG(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `diseño-3d-${new Date().toISOString().slice(0, 10)}.png`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }

// ===== ANIMACIÓN =====
function animate() { requestAnimationFrame(animate); if (EditorState.controls) EditorState.controls.update(); if (EditorState.renderer) EditorState.renderer.render(EditorState.scene, EditorState.camera); }

// Exportar
window.Editor3D = { init: init3DEditor, state: EditorState, config: EditorConfig, library: ElementLibrary, startDrawing, deleteSelectedObject, undo, redo, exportToJSON, exportToSVG, exportToPNG, copyToClipboard, importFromJSON, clearScene, changeView: (view) => { const views = { '3d': [15,15,15], 'top': [0,30,0], 'front': [0,10,30], 'side': [30,10,0] }; if (views[view]) { EditorState.camera.position.set(...views[view]); EditorState.camera.lookAt(0,0,0); } }, showElementCategory };
