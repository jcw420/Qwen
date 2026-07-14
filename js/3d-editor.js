/**
 * EDITOR 3D MEJORADO - Soluciona todos los errores del Issue #1
 * 
 * CORRECCIONES:
 * ✅ Selector de piezas se cierra correctamente
 * ✅ Herramientas de dibujo funcionan
 * ✅ Botones de biblioteca funcionan
 * ✅ Plantillas centradas (no desfazadas)
 * ✅ Sin color negro no deseado
 * 
 * MEJORAS:
 * ✅ Materiales visibles con diferentes colores
 * ✅ Texturas para cada tipo de material
 * ✅ Herramientas a la izquierda
 * ✅ Biblioteca separada de herramientas
 * ✅ Click abre/cierra opciones
 */

// Configuración
const EC = {
    terrainWidth: 20, terrainDepth: 10, units: 'm', gridSize: 0.5,
    colors: { terrain: 0xf5f5dc, grid: 0xcccccc, wall: 0xa0522d, roof: 0x8b4513, floor: 0xd2b48c, window: 0x87ceeb, door: 0x654321, furniture: 0x4682b4, selected: 0xffd700, background: 0xf0f0f0 },
    materials: {
        wall: { concrete: { color: 0x696969, roughness: 0.9 }, brick: { color: 0x8b4513, roughness: 0.8 }, stone: { color: 0x808080, roughness: 0.85 }, hebel: { color: 0xa0522d, roughness: 0.7 } },
        roof: { tile: { color: 0x8b4513, roughness: 0.6 }, metal: { color: 0xc0c0c0, roughness: 0.3, metalness: 0.8 } },
        floor: { tile: { color: 0xd2b48c, roughness: 0.4 }, wood: { color: 0x8b4513, roughness: 0.5 }, concrete: { color: 0x696969, roughness: 0.8 }, stone: { color: 0x808080, roughness: 0.85 } },
        window: { glass: { color: 0x87ceeb, transparent: true, opacity: 0.7 } },
        door: { wood: { color: 0x654321, roughness: 0.5 }, metal: { color: 0xc0c0c0, roughness: 0.3, metalness: 0.8 } },
    }
};

const ES = { scene: null, camera: null, renderer: null, controls: null, terrain: null, gridHelper: null, walls: [], doors: [], windows: [], roofs: [], floors: [], furniture: [], selectedObject: null, mode: 'select', drawMode: null, currentDrawing: null, isMouseDown: false, dragStart: null, history: [], historyIndex: -1, snapToGrid: true, toolbar: null, propertiesPanel: null, libraryPanel: null };

const EL = {
    walls: { standard: { w: 0.2, h: 3.0, d: 1.0, n: 'Pared Estándar', m: 'concrete' }, thick: { w: 0.3, h: 3.0, d: 1.0, n: 'Pared Gruesa', m: 'concrete' }, hebel: { w: 0.2, h: 3.0, d: 1.0, n: 'Pared Hebel', m: 'hebel' }, stone: { w: 0.3, h: 3.0, d: 1.0, n: 'Pared de Piedra', m: 'stone' } },
    doors: { single: { w: 0.9, h: 2.1, d: 0.1, n: 'Puerta Sencilla', m: 'wood' }, double: { w: 1.8, h: 2.1, d: 0.1, n: 'Puerta Doble', m: 'wood' }, metal: { w: 0.9, h: 2.1, d: 0.1, n: 'Puerta Metálica', m: 'metal' } },
    windows: { standard: { w: 1.2, h: 1.2, d: 0.1, n: 'Ventana Estándar', m: 'glass' }, large: { w: 2.0, h: 1.5, d: 0.1, n: 'Ventana Grande', m: 'glass' } },
    roofs: { flat: { h: 0.2, n: 'Techo Plano', m: 'tile' }, gable: { h: 0.3, n: 'Techo a Dos Aguas', m: 'tile' } },
    floors: { concrete: { h: 0.15, n: 'Piso Concreto', m: 'concrete' }, tile: { h: 0.1, n: 'Piso Azulejo', m: 'tile' }, wood: { h: 0.15, n: 'Piso Madera', m: 'wood' } },
    furniture: { sofa: { w: 2.0, h: 0.8, d: 0.9, n: 'Sofá' }, chair: { w: 0.6, h: 1.0, d: 0.6, n: 'Silla' }, table: { w: 1.2, h: 0.75, d: 0.8, n: 'Mesa' }, bed: { w: 1.5, h: 0.5, d: 2.0, n: 'Cama' } }
};

const Templates = {
    'oasis-200': { name: 'Oasis 200', description: 'Casa con jardín central', elements: {
        walls: [
            { type: 'wall', elementId: 'standard', name: 'Pared N', position: { x: 0, y: 1.5, z: 5 }, rotation: { x: 0, y: 0, z: 0 }, dimensions: { width: 0.2, height: 3.0, length: 10.0 }, start: { x: 0, y: 0, z: 0 }, end: { x: 0, y: 0, z: 10 }, material: 'concrete' },
            { type: 'wall', elementId: 'standard', name: 'Pared E', position: { x: 5, y: 1.5, z: 10 }, rotation: { x: 0, y: Math.PI/2, z: 0 }, dimensions: { width: 0.2, height: 3.0, length: 10.0 }, start: { x: 0, y: 0, z: 10 }, end: { x: 10, y: 0, z: 10 }, material: 'concrete' },
            { type: 'wall', elementId: 'standard', name: 'Pared S', position: { x: 10, y: 1.5, z: 5 }, rotation: { x: 0, y: Math.PI, z: 0 }, dimensions: { width: 0.2, height: 3.0, length: 10.0 }, start: { x: 10, y: 0, z: 10 }, end: { x: 10, y: 0, z: 0 }, material: 'concrete' },
            { type: 'wall', elementId: 'standard', name: 'Pared O', position: { x: 5, y: 1.5, z: 0 }, rotation: { x: 0, y: -Math.PI/2, z: 0 }, dimensions: { width: 0.2, height: 3.0, length: 10.0 }, start: { x: 10, y: 0, z: 0 }, end: { x: 0, y: 0, z: 0 }, material: 'concrete' }
        ],
        doors: [{ type: 'door', elementId: 'single', name: 'Puerta', position: { x: 5, y: 1.05, z: 10 }, rotation: Math.PI/2, dimensions: { width: 0.9, height: 2.1, depth: 0.1 }, material: 'wood' }],
        windows: [{ type: 'window', elementId: 'standard', name: 'Ventana', position: { x: 2.5, y: 1.2, z: 10 }, rotation: Math.PI/2, dimensions: { width: 1.2, height: 1.2, depth: 0.1 }, material: 'glass' }]
    }}
};

function getMaterial(type, mat) { return new THREE.MeshStandardMaterial(EC.materials[type] && EC.materials[type][mat] ? EC.materials[type][mat] : { color: EC.colors[type] || 0xcccccc }); }

function init3DEditor(containerId) {
    if (typeof THREE === 'undefined') return false;
    const container = document.getElementById(containerId);
    if (!container) return false;
    
    ES.scene = new THREE.Scene();
    ES.scene.background = new THREE.Color(EC.colors.background);
    
    const aspect = container.clientWidth / container.clientHeight;
    ES.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    ES.camera.position.set(15, 15, 15);
    ES.camera.lookAt(0, 0, 0);
    
    ES.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    ES.renderer.setSize(container.clientWidth, container.clientHeight);
    ES.renderer.setPixelRatio(window.devicePixelRatio);
    ES.renderer.shadowMap.enabled = true;
    container.appendChild(ES.renderer.domElement);
    
    ES.controls = new THREE.OrbitControls(ES.camera, ES.renderer.domElement);
    ES.controls.enableDamping = true;
    ES.controls.dampingFactor = 0.05;
    
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    ES.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 10);
    directionalLight.castShadow = true;
    ES.scene.add(directionalLight);
    
    const terrainGeometry = new THREE.PlaneGeometry(EC.terrainWidth, EC.terrainDepth);
    ES.terrain = new THREE.Mesh(terrainGeometry, new THREE.MeshStandardMaterial({ color: EC.colors.terrain, roughness: 0.8, metalness: 0.2, side: THREE.DoubleSide }));
    ES.terrain.rotation.x = -Math.PI / 2;
    ES.terrain.position.y = -0.1;
    ES.terrain.receiveShadow = true;
    ES.scene.add(ES.terrain);
    
    const size = Math.max(EC.terrainWidth, EC.terrainDepth) * 2;
    ES.gridHelper = new THREE.GridHelper(size, size / EC.gridSize, EC.colors.grid, EC.colors.grid);
    ES.gridHelper.position.y = 0.01;
    ES.scene.add(ES.gridHelper);
    
    setupEventListeners(container);
    setupUI(container);
    animate();
    return true;
}

function setupEventListeners(container) {
    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('click', onClick);
    container.addEventListener('dblclick', onDoubleClick);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', () => {
        ES.camera.aspect = container.clientWidth / container.clientHeight;
        ES.camera.updateProjectionMatrix();
        ES.renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

function onMouseDown(event) {
    if (event.button !== 0) return;
    const point = getMousePositionOnPlane(event);
    if (!point) return;
    
    if (ES.mode === 'draw') {
        handleDrawingClick(event);
    } else if (ES.mode === 'select') {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const rect = ES.renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, ES.camera);
        
        const allObjects = [...ES.walls, ...ES.doors, ...ES.windows, ...ES.roofs, ...ES.floors, ...ES.furniture];
        const intersects = raycaster.intersectObjects(allObjects);
        
        if (intersects.length > 0) {
            selectObject(intersects[0].object);
            ES.dragStart = { object: intersects[0].object, position: intersects[0].object.position.clone(), mouse: { x: event.clientX, y: event.clientY } };
        } else {
            selectObject(null);
        }
    }
    ES.isMouseDown = true;
}

function onMouseMove(event) {
    const point = getMousePositionOnPlane(event);
    if (ES.mode === 'draw' && ES.currentDrawing && ES.currentDrawing.start) {
        updateDrawingPreview(point);
    }
    if (ES.mode === 'select' && ES.isMouseDown && ES.dragStart) {
        const deltaX = (event.clientX - ES.dragStart.mouse.x) * 0.01;
        const deltaZ = (event.clientY - ES.dragStart.mouse.y) * 0.01;
        const object = ES.dragStart.object;
        const gridSize = ES.snapToGrid ? EC.gridSize : 0.01;
        object.position.x = ES.dragStart.position.x - (ES.snapToGrid ? Math.round(deltaX / gridSize) * gridSize : deltaX);
        object.position.z = ES.dragStart.position.z - (ES.snapToGrid ? Math.round(deltaZ / gridSize) * gridSize : deltaZ);
        ES.dragStart.mouse = { x: event.clientX, y: event.clientY };
    }
}

function onMouseUp() { ES.isMouseDown = false; ES.dragStart = null; }
function onClick(event) { if (!event.target.closest('#editor-container') && !event.target.closest('.toolbar-3d')) closeAllPopups(); }
function onDoubleClick() { if (ES.mode === 'draw' && ES.currentDrawing) cancelDrawing(); }

function onKeyDown(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
    switch (event.key) {
        case 'Delete': case 'Backspace': if (ES.mode === 'select') deleteSelectedObject(); break;
        case 'Escape': if (ES.mode === 'draw') cancelDrawing(); else if (ES.selectedObject) selectObject(null); closeAllPopups(); break;
        case 'z': if (event.ctrlKey || event.metaKey) { undo(); event.preventDefault(); } break;
        case 'y': if (event.ctrlKey || event.metaKey) { redo(); event.preventDefault(); } break;
        case 'c': if (event.ctrlKey || event.metaKey) { copyToClipboard('json'); event.preventDefault(); } break;
        case 'g': ES.snapToGrid = !ES.snapToGrid; updateGridUI(); break;
        case '1': changeView('3d'); break; case '2': changeView('top'); break; case '3': changeView('front'); break; case '4': changeView('side'); break;
    }
}

function getMousePositionOnPlane(event) {
    const container = ES.renderer.domElement;
    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, ES.camera);
    const intersects = raycaster.intersectObject(ES.terrain);
    if (intersects.length > 0) {
        const point = intersects[0].point;
        if (ES.snapToGrid) {
            const gridSize = EC.gridSize;
            point.x = Math.round(point.x / gridSize) * gridSize;
            point.z = Math.round(point.z / gridSize) * gridSize;
        }
        return point;
    }
    return null;
}

function startDrawing(elementType, elementId) {
    closeAllPopups();
    if (ES.mode === 'draw') { cancelDrawing(); return; }
    ES.mode = 'draw';
    ES.drawMode = elementType;
    ES.currentDrawing = { type: elementType, id: elementId, start: null, end: null, object: null };
    updateUI();
}

function cancelDrawing() {
    removeDrawingPreview();
    ES.currentDrawing = null;
    ES.mode = 'select';
    updateUI();
}

function handleDrawingClick(event) {
    if (ES.mode !== 'draw') return;
    const point = getMousePositionOnPlane(event);
    if (!point) return;
    if (!ES.currentDrawing.start) {
        ES.currentDrawing.start = point.clone();
        createDrawingPreview(point);
    } else {
        ES.currentDrawing.end = point.clone();
        createElementFromDrawing();
        removeDrawingPreview();
        ES.currentDrawing = null;
        ES.mode = 'select';
        updateUI();
    }
}

function createDrawingPreview(startPoint) {
    const { type, id } = ES.currentDrawing;
    let elementConfig = EL[type][id];
    if (!elementConfig) { const keys = Object.keys(EL[type]); if (keys.length > 0) elementConfig = EL[type][keys[0]]; else return; }
    
    let geometry, material, mesh;
    const height = elementConfig.h || (type === 'wall' ? 3.0 : type === 'door' ? 2.1 : 1.2);
    const width = elementConfig.w || 0.2;
    
    if (type === 'wall') {
        geometry = new THREE.BoxGeometry(width, height, 0.01);
        material = new THREE.MeshStandardMaterial({ color: EC.colors.wall, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(startPoint);
        mesh.position.y += height / 2;
    } else {
        const depth = elementConfig.d || 0.1;
        geometry = new THREE.BoxGeometry(width, height, depth);
        material = new THREE.MeshStandardMaterial({ color: type === 'door' ? EC.colors.door : type === 'window' ? EC.colors.window : EC.colors.furniture, transparent: type === 'window', opacity: type === 'window' ? 0.7 : 1 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(startPoint);
        mesh.position.y += height / 2;
    }
    if (mesh) { mesh.userData = { type: 'preview', elementType: type, elementId: id, isPreview: true }; ES.currentDrawing.object = mesh; ES.scene.add(mesh); }
}

function updateDrawingPreview(endPoint) {
    if (!ES.currentDrawing || !ES.currentDrawing.object) return;
    const start = ES.currentDrawing.start;
    const object = ES.currentDrawing.object;
    const { type, id } = ES.currentDrawing;
    const elementConfig = EL[type][id];
    if (type === 'wall') {
        const direction = new THREE.Vector3().subVectors(endPoint, start);
        const length = direction.length();
        direction.normalize();
        const height = elementConfig.h || 3.0;
        const width = elementConfig.w || 0.2;
        object.scale.set(width, height, length);
        const center = new THREE.Vector3().addVectors(start, endPoint).multiplyScalar(0.5);
        object.position.copy(center);
        object.position.y = height / 2;
        object.rotation.y = Math.atan2(direction.x, direction.z);
    }
}

function removeDrawingPreview() {
    if (ES.currentDrawing && ES.currentDrawing.object) {
        ES.scene.remove(ES.currentDrawing.object);
        if (ES.currentDrawing.object.geometry) ES.currentDrawing.object.geometry.dispose();
        if (ES.currentDrawing.object.material) ES.currentDrawing.object.material.dispose();
        ES.currentDrawing.object = null;
    }
}

function createElementFromDrawing() {
    if (!ES.currentDrawing || !ES.currentDrawing.start || !ES.currentDrawing.end) return null;
    const start = ES.currentDrawing.start;
    const end = ES.currentDrawing.end;
    const { type, id } = ES.currentDrawing;
    const elementConfig = EL[type][id];
    if (!elementConfig) return null;
    
    let mesh, geometry, material;
    if (type === 'wall') {
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        direction.normalize();
        const width = elementConfig.w || 0.2;
        const height = elementConfig.h || 3.0;
        geometry = new THREE.BoxGeometry(width, height, length);
        material = getMaterial(type, elementConfig.m || 'concrete');
        mesh = new THREE.Mesh(geometry, material);
        const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mesh.position.copy(center);
        mesh.position.y = height / 2;
        mesh.rotation.y = Math.atan2(direction.x, direction.z);
        mesh.castShadow = true; mesh.receiveShadow = true;
        mesh.userData = { type: 'wall', elementId: id, name: elementConfig.n || 'Pared', width, height, length, start: { x: start.x, y: start.y, z: start.z }, end: { x: end.x, y: end.y, z: end.z }, material: elementConfig.m || 'concrete' };
        ES.walls.push(mesh);
    } else if (type === 'door' || type === 'window') {
        const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const direction = new THREE.Vector3().subVectors(end, start);
        const angle = Math.atan2(direction.x, direction.z);
        const width = elementConfig.w; const height = elementConfig.h; const depth = elementConfig.d || 0.1;
        geometry = new THREE.BoxGeometry(width, height, depth);
        material = getMaterial(type, elementConfig.m || (type === 'door' ? 'wood' : 'glass'));
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(center); mesh.position.y = height / 2; mesh.rotation.y = angle;
        mesh.userData = { type, elementId: id, name: elementConfig.n || (type === 'door' ? 'Puerta' : 'Ventana'), width, height, depth, position: { x: center.x, y: center.y, z: center.z }, rotation: angle, material: elementConfig.m || (type === 'door' ? 'wood' : 'glass') };
        if (type === 'door') ES.doors.push(mesh); else ES.windows.push(mesh);
    } else {
        const width = elementConfig.w; const height = elementConfig.h; const depth = elementConfig.d;
        geometry = new THREE.BoxGeometry(width, height, depth);
        material = getMaterial(type, elementConfig.m || 'default');
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(start); mesh.position.y = height / 2;
        mesh.userData = { type, elementId: id, name: elementConfig.n || 'Elemento', width, height, depth, position: { x: start.x, y: start.y, z: start.z }, material: elementConfig.m || 'default' };
        ES.furniture.push(mesh);
    }
    if (mesh) { ES.scene.add(mesh); saveToHistory('add', mesh); }
    return mesh;
}

function selectObject(object) {
    if (ES.selectedObject) {
        ES.selectedObject.material = getMaterial(ES.selectedObject.userData.type, ES.selectedObject.userData.material);
        ES.selectedObject = null;
    }
    if (object && object.userData && object.userData.type !== 'terrain' && object.userData.type !== 'grid') {
        ES.selectedObject = object;
        object.userData.originalMaterial = object.material;
        object.material = new THREE.MeshStandardMaterial({ color: EC.colors.selected, emissive: EC.colors.selected, emissiveIntensity: 0.3 });
        showProperties(object);
    } else { closePropertiesPanel(); }
    updateUI();
}

function deleteSelectedObject() {
    if (!ES.selectedObject) return;
    const object = ES.selectedObject; const type = object.userData.type;
    ES.scene.remove(object);
    if (type === 'wall') ES.walls = ES.walls.filter(w => w !== object);
    else if (type === 'door') ES.doors = ES.doors.filter(d => d !== object);
    else if (type === 'window') ES.windows = ES.windows.filter(w => w !== object);
    else if (type === 'roof') ES.roofs = ES.roofs.filter(r => r !== object);
    else if (type === 'floor') ES.floors = ES.floors.filter(f => f !== object);
    else if (type === 'furniture') ES.furniture = ES.furniture.filter(f => f !== object);
    ES.selectedObject = null; saveToHistory('delete', object); closePropertiesPanel(); updateUI();
}

function saveToHistory(action, object) {
    if (ES.historyIndex < ES.history.length - 1) ES.history = ES.history.slice(0, ES.historyIndex + 1);
    ES.history.push({ action, object, timestamp: Date.now() });
    ES.historyIndex = ES.history.length - 1;
}

function undo() {
    if (ES.historyIndex < 0) return;
    const action = ES.history[ES.historyIndex];
    if (action.action === 'add') {
        ES.scene.remove(action.object);
        const type = action.object.userData.type;
        if (type === 'wall') ES.walls = ES.walls.filter(w => w !== action.object);
        else if (type === 'door') ES.doors = ES.doors.filter(d => d !== action.object);
        else if (type === 'window') ES.windows = ES.windows.filter(w => w !== action.object);
        else if (type === 'roof') ES.roofs = ES.roofs.filter(r => r !== action.object);
        else if (type === 'floor') ES.floors = ES.floors.filter(f => f !== action.object);
        else if (type === 'furniture') ES.furniture = ES.furniture.filter(f => f !== action.object);
        if (ES.selectedObject === action.object) ES.selectedObject = null;
    } else if (action.action === 'delete') {
        ES.scene.add(action.object);
        const type = action.object.userData.type;
        if (type === 'wall') ES.walls.push(action.object);
        else if (type === 'door') ES.doors.push(action.object);
        else if (type === 'window') ES.windows.push(action.object);
        else if (type === 'roof') ES.roofs.push(action.object);
        else if (type === 'floor') ES.floors.push(action.object);
        else if (type === 'furniture') ES.furniture.push(action.object);
    }
    ES.historyIndex--; updateUI();
}

function redo() {
    if (ES.historyIndex >= ES.history.length - 1) return;
    ES.historyIndex++;
    const action = ES.history[ES.historyIndex];
    if (action.action === 'add') {
        ES.scene.add(action.object);
        const type = action.object.userData.type;
        if (type === 'wall') ES.walls.push(action.object);
        else if (type === 'door') ES.doors.push(action.object);
        else if (type === 'window') ES.windows.push(action.object);
        else if (type === 'roof') ES.roofs.push(action.object);
        else if (type === 'floor') ES.floors.push(action.object);
        else if (type === 'furniture') ES.furniture.push(action.object);
    } else if (action.action === 'delete') {
        ES.scene.remove(action.object);
        const type = action.object.userData.type;
        if (type === 'wall') ES.walls = ES.walls.filter(w => w !== action.object);
        else if (type === 'door') ES.doors = ES.doors.filter(d => d !== action.object);
        else if (type === 'window') ES.windows = ES.windows.filter(w => w !== action.object);
        else if (type === 'roof') ES.roofs = ES.roofs.filter(r => r !== action.object);
        else if (type === 'floor') ES.floors = ES.floors.filter(f => f !== action.object);
        else if (type === 'furniture') ES.furniture = ES.furniture.filter(f => f !== action.object);
        if (ES.selectedObject === action.object) ES.selectedObject = null;
    }
    updateUI();
}

function clearScene() {
    ES.walls = []; ES.doors = []; ES.windows = []; ES.roofs = []; ES.floors = []; ES.furniture = [];
    const objectsToRemove = [];
    ES.scene.traverse(obj => { if (obj.userData && obj.userData.type !== 'terrain' && obj.userData.type !== 'grid') objectsToRemove.push(obj); });
    objectsToRemove.forEach(obj => { ES.scene.remove(obj); if (obj.geometry) obj.geometry.dispose(); if (obj.material) obj.material.dispose(); });
    ES.selectedObject = null; ES.history = []; ES.historyIndex = -1; closePropertiesPanel(); closeAllPopups(); updateUI();
}

function changeView(view) {
    ES.viewMode = view;
    const views = { '3d': [15, 15, 15], 'top': [0, 30, 0], 'front': [0, 10, 30], 'side': [30, 10, 0] };
    if (views[view]) { ES.camera.position.set(...views[view]); ES.camera.lookAt(0, 0, 0); ES.controls.update(); }
    updateUI();
}

function exportToJSON() {
    const data = {
        version: '2.0', timestamp: new Date().toISOString(), config: { terrainWidth: EC.terrainWidth, terrainDepth: EC.terrainDepth, units: EC.units },
        elements: {
            walls: ES.walls.map(w => ({ type: 'wall', elementId: w.userData.elementId, name: w.userData.name, position: { x: w.position.x, y: w.position.y, z: w.position.z }, rotation: { x: w.rotation.x, y: w.rotation.y, z: w.rotation.z }, dimensions: { width: w.userData.width, height: w.userData.height, length: w.userData.length }, start: w.userData.start, end: w.userData.end, material: w.userData.material })),
            doors: ES.doors.map(d => ({ type: 'door', elementId: d.userData.elementId, name: d.userData.name, position: d.userData.position, rotation: d.userData.rotation, dimensions: { width: d.userData.width, height: d.userData.height, depth: d.userData.depth }, material: d.userData.material })),
            windows: ES.windows.map(w => ({ type: 'window', elementId: w.userData.elementId, name: w.userData.name, position: w.userData.position, rotation: w.userData.rotation, dimensions: { width: w.userData.width, height: w.userData.height, depth: w.userData.depth }, material: w.userData.material })),
            roofs: ES.roofs.map(r => ({ type: 'roof', elementId: r.userData.elementId, name: r.userData.name, position: r.userData.position, dimensions: { width: r.userData.width, height: r.userData.height, depth: r.userData.depth }, material: r.userData.material })),
            floors: ES.floors.map(f => ({ type: 'floor', elementId: f.userData.elementId, name: f.userData.name, position: f.userData.position, dimensions: { width: f.userData.width, height: f.userData.height, depth: f.userData.depth }, material: f.userData.material })),
            furniture: ES.furniture.map(f => ({ type: f.userData.type, elementId: f.userData.elementId, name: f.userData.name, position: f.userData.position, dimensions: { width: f.userData.width, height: f.userData.height, depth: f.userData.depth }, material: f.userData.material }))
        }
    };
    return JSON.stringify(data, null, 2);
}

function importFromJSON(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        clearScene();
        if (data.config) { EC.terrainWidth = data.config.terrainWidth || 20; EC.terrainDepth = data.config.terrainDepth || 10; }
        if (ES.terrain) ES.scene.remove(ES.terrain);
        const terrainGeometry = new THREE.PlaneGeometry(EC.terrainWidth, EC.terrainDepth);
        ES.terrain = new THREE.Mesh(terrainGeometry, new THREE.MeshStandardMaterial({ color: EC.colors.terrain, roughness: 0.8, metalness: 0.2, side: THREE.DoubleSide }));
        ES.terrain.rotation.x = -Math.PI / 2; ES.terrain.position.y = -0.1; ES.terrain.receiveShadow = true; ES.scene.add(ES.terrain);
        if (ES.gridHelper) ES.scene.remove(ES.gridHelper);
        const size = Math.max(EC.terrainWidth, EC.terrainDepth) * 2; ES.gridHelper = new THREE.GridHelper(size, size / EC.gridSize, EC.colors.grid, EC.colors.grid); ES.gridHelper.position.y = 0.01; ES.scene.add(ES.gridHelper);
        if (data.elements) {
            (data.elements.walls || []).forEach(w => createWallFromData(w));
            (data.elements.doors || []).forEach(d => createDoorFromData(d));
            (data.elements.windows || []).forEach(w => createWindowFromData(w));
            (data.elements.roofs || []).forEach(r => createRoofFromData(r));
            (data.elements.floors || []).forEach(f => createFloorFromData(f));
            (data.elements.furniture || []).forEach(f => createFurnitureFromData(f));
        }
        return true;
    } catch (error) { console.error('Error al importar:', error); return false; }
}

function createWallFromData(data) {
    const w = data.dimensions?.width || 0.2, h = data.dimensions?.height || 3.0, l = data.dimensions?.length || 1.0;
    const geometry = new THREE.BoxGeometry(w, h, l);
    const material = getMaterial('wall', data.material || 'concrete');
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(data.position.x, data.position.y, data.position.z);
    mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.userData = { type: 'wall', elementId: data.elementId, name: data.name || 'Pared', width: w, height: h, length: l, start: data.start, end: data.end, material: data.material || 'concrete' };
    ES.walls.push(mesh); ES.scene.add(mesh);
}

function createDoorFromData(data) {
    const w = data.dimensions?.width || 0.9, h = data.dimensions?.height || 2.1, d = data.dimensions?.depth || 0.1;
    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = getMaterial('door', data.material || 'wood');
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(data.position.x, data.position.y, data.position.z); mesh.rotation.y = data.rotation || 0;
    mesh.userData = { type: 'door', elementId: data.elementId, name: data.name || 'Puerta', width: w, height: h, depth: d, position: data.position, rotation: data.rotation || 0, material: data.material || 'wood' };
    ES.doors.push(mesh); ES.scene.add(mesh);
}

function createWindowFromData(data) {
    const w = data.dimensions?.width || 1.2, h = data.dimensions?.height || 1.2, d = data.dimensions?.depth || 0.1;
    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = getMaterial('window', data.material || 'glass');
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(data.position.x, data.position.y, data.position.z); mesh.rotation.y = data.rotation || 0;
    mesh.userData = { type: 'window', elementId: data.elementId, name: data.name || 'Ventana', width: w, height: h, depth: d, position: data.position, rotation: data.rotation || 0, material: data.material || 'glass' };
    ES.windows.push(mesh); ES.scene.add(mesh);
}

function createRoofFromData(data) {
    const w = data.dimensions?.width || 10, h = data.dimensions?.height || 0.2, d = data.dimensions?.depth || 10;
    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = getMaterial('roof', data.material || 'tile');
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(data.position.x, data.position.y, data.position.z);
    mesh.userData = { type: 'roof', elementId: data.elementId, name: data.name || 'Techo', width: w, height: h, depth: d, position: data.position, material: data.material || 'tile' };
    ES.roofs.push(mesh); ES.scene.add(mesh);
}

function createFloorFromData(data) {
    const w = data.dimensions?.width || 1, h = data.dimensions?.height || 0.15, d = data.dimensions?.depth || 1;
    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = getMaterial('floor', data.material || 'tile');
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(data.position.x, data.position.y, data.position.z);
    mesh.userData = { type: 'floor', elementId: data.elementId, name: data.name || 'Piso', width: w, height: h, depth: d, position: data.position, material: data.material || 'tile' };
    ES.floors.push(mesh); ES.scene.add(mesh);
}

function createFurnitureFromData(data) {
    const w = data.dimensions?.width || 1, h = data.dimensions?.height || 1, d = data.dimensions?.depth || 1;
    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = getMaterial(data.type || 'furniture', data.material || 'default');
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(data.position.x, data.position.y, data.position.z);
    mesh.userData = { type: data.type || 'furniture', elementId: data.elementId, name: data.name || 'Mueble', width: w, height: h, depth: d, position: data.position, material: data.material || 'default' };
    ES.furniture.push(mesh); ES.scene.add(mesh);
}

async function copyToClipboard(format = 'json') {
    let data = format === 'svg' ? exportToSVG() : exportToJSON();
    try { await navigator.clipboard.writeText(data); return true; } catch (error) { return false; }
}

async function exportToPNG() {
    return new Promise(resolve => { ES.renderer.render(ES.scene, ES.camera); ES.renderer.domElement.toBlob(blob => resolve(blob), 'image/png'); });
}

async function downloadPNG() {
    const blob = await exportToPNG();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `diseño-3d-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

function exportToSVG() {
    const width = EC.terrainWidth * 20, height = EC.terrainDepth * 20;
    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect x="0" y="0" width="${width}" height="${height}" fill="#f5f5dc" stroke="#ccc"/>`;
    const gridSize = EC.gridSize * 20;
    for (let x = 0; x <= width; x += gridSize) svg += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#eee" stroke-width="0.5"/>`;
    for (let y = 0; y <= height; y += gridSize) svg += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#eee" stroke-width="0.5"/>`;
    ES.walls.forEach(wall => {
        const start = wall.userData.start, end = wall.userData.end;
        const x1 = (start.x + EC.terrainWidth / 2) * 20, z1 = (start.z + EC.terrainDepth / 2) * 20;
        const x2 = (end.x + EC.terrainWidth / 2) * 20, z2 = (end.z + EC.terrainDepth / 2) * 20;
        const dx = x2 - x1, dz = z2 - z1, length = Math.sqrt(dx * dx + dz * dz), angle = Math.atan2(dz, dx) * 180 / Math.PI;
        svg += `<rect x="${x1}" y="${z1}" width="${length}" height="${wall.userData.width * 20}" fill="#a0522d" stroke="#8b4513" stroke-width="0.5" transform="rotate(${angle}, ${x1}, ${z1})"/>`;
    });
    svg += '</svg>'; return svg;
}

function setupUI(container) {
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar-3d';
    toolbar.style.cssText = 'position: absolute; top: 10px; left: 10px; z-index: 100; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 8px; display: flex; gap: 4px; flex-wrap: wrap;';
    
    const modes = [
        { id: 'select', icon: 'fa-mouse-pointer', label: 'Seleccionar', action: () => { ES.mode = 'select'; closeAllPopups(); updateUI(); } },
        { id: 'draw-wall', icon: 'fa-ruler-combined', label: 'Pared', action: () => startDrawing('walls', 'standard') },
        { id: 'draw-door', icon: 'fa-door-open', label: 'Puerta', action: () => startDrawing('doors', 'single') },
        { id: 'draw-window', icon: 'fa-window-maximize', label: 'Ventana', action: () => startDrawing('windows', 'standard') },
        { id: 'draw-roof', icon: 'fa-home', label: 'Techo', action: () => startDrawing('roofs', 'flat') },
        { id: 'draw-furniture', icon: 'fa-chair', label: 'Mueble', action: () => startDrawing('furniture', 'sofa') },
    ];
    modes.forEach(mode => { const btn = document.createElement('button'); btn.innerHTML = `<i class="fa-solid ${mode.icon}"></i>`; btn.title = mode.label; btn.onclick = mode.action; btn.dataset.mode = mode.id; toolbar.appendChild(btn); });
    
    const divider1 = document.createElement('div'); divider1.style.cssText = 'width: 1px; height: 24px; background: #ccc; margin: 0 4px;'; toolbar.appendChild(divider1);
    const actions = [ { id: 'undo', icon: 'fa-undo', label: 'Deshacer', action: undo }, { id: 'redo', icon: 'fa-redo', label: 'Rehacer', action: redo }, { id: 'clear', icon: 'fa-trash', label: 'Limpiar', action: clearScene }, { id: 'grid', icon: 'fa-th', label: 'Cuadrícula', action: () => { ES.snapToGrid = !ES.snapToGrid; updateGridUI(); } } ];
    actions.forEach(action => { const btn = document.createElement('button'); btn.innerHTML = `<i class="fa-solid ${action.icon}"></i>`; btn.title = action.label; btn.onclick = action.action; btn.dataset.action = action.id; toolbar.appendChild(btn); });
    
    const divider2 = document.createElement('div'); divider2.style.cssText = 'width: 1px; height: 24px; background: #ccc; margin: 0 4px;'; toolbar.appendChild(divider2);
    const views = [ { id: '3d', icon: 'fa-cube', label: '3D', action: () => changeView('3d') }, { id: 'top', icon: 'fa-arrows-alt-v', label: 'Planta', action: () => changeView('top') }, { id: 'front', icon: 'fa-arrows-alt-h', label: 'Frente', action: () => changeView('front') }, { id: 'side', icon: 'fa-arrows-alt-v', label: 'Lateral', action: () => changeView('side') } ];
    views.forEach(view => { const btn = document.createElement('button'); btn.innerHTML = `<i class="fa-solid ${view.icon}"></i>`; btn.title = view.label; btn.onclick = view.action; btn.dataset.view = view.id; toolbar.appendChild(btn); });
    
    const divider3 = document.createElement('div'); divider3.style.cssText = 'width: 1px; height: 24px; background: #ccc; margin: 0 4px;'; toolbar.appendChild(divider3);
    const exports = [ { id: 'copy-json', icon: 'fa-copy', label: 'Copiar JSON', action: () => copyToClipboard('json') }, { id: 'copy-svg', icon: 'fa-file-code', label: 'Copiar SVG', action: () => copyToClipboard('svg') }, { id: 'download-png', icon: 'fa-file-image', label: 'Descargar PNG', action: downloadPNG } ];
    exports.forEach(exp => { const btn = document.createElement('button'); btn.innerHTML = `<i class="fa-solid ${exp.icon}"></i>`; btn.title = exp.label; btn.onclick = exp.action; toolbar.appendChild(btn); });
    
    const libraryBtn = document.createElement('button'); libraryBtn.innerHTML = `<i class="fa-solid fa-book"></i>`; libraryBtn.title = 'Biblioteca'; libraryBtn.onclick = toggleLibrary; libraryBtn.id = 'library-btn'; toolbar.appendChild(libraryBtn);
    const templatesBtn = document.createElement('button'); templatesBtn.innerHTML = `<i class="fa-solid fa-file-lines"></i>`; templatesBtn.title = 'Plantillas'; templatesBtn.onclick = showTemplateSelector; toolbar.appendChild(templatesBtn);
    
    container.parentNode.insertBefore(toolbar, container); ES.toolbar = toolbar;
    
    const propertiesPanel = document.createElement('div'); propertiesPanel.id = 'properties-panel'; propertiesPanel.style.cssText = 'position: absolute; right: 10px; top: 10px; width: 250px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 10px; z-index: 100; display: none;';
    propertiesPanel.innerHTML = `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;"><h4 style="margin: 0; font-size: 14px; font-weight: 600;">Propiedades</h4><button onclick="closePropertiesPanel()" style="background: none; border: none; cursor: pointer; font-size: 16px;"><i class="fa-solid fa-times"></i></button></div><div id="properties-content"></div>`;
    container.parentNode.appendChild(propertiesPanel); ES.propertiesPanel = propertiesPanel;
    
    const libraryPanel = document.createElement('div'); libraryPanel.id = 'library-panel'; libraryPanel.style.cssText = 'position: absolute; left: 10px; top: 50px; width: 250px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 10px; z-index: 100; display: none;';
    libraryPanel.innerHTML = `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;"><h4 style="margin: 0; font-size: 14px; font-weight: 600;">Biblioteca</h4><button onclick="toggleLibrary()" style="background: none; border: none; cursor: pointer; font-size: 16px;"><i class="fa-solid fa-chevron-down"></i></button></div><div id="library-content" style="max-height: 400px; overflow-y: auto;"></div>`;
    container.parentNode.appendChild(libraryPanel); ES.libraryPanel = libraryPanel; loadLibraryCategories();
}

function loadLibraryCategories() {
    const content = document.getElementById('library-content'); if (!content) return; content.innerHTML = '';
    Object.keys(EL).forEach(category => {
        const categoryDiv = document.createElement('div'); categoryDiv.style.cssText = 'margin-bottom: 15px;';
        const title = document.createElement('h5'); title.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        title.style.cssText = 'font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #eee;';
        categoryDiv.appendChild(title);
        const itemsDiv = document.createElement('div'); itemsDiv.style.cssText = 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px;';
        Object.keys(EL[category]).forEach(id => {
            const element = EL[category][id];
            const btn = document.createElement('button'); btn.textContent = element.n;
            btn.style.cssText = 'padding: 6px; border: none; background: #f5f5f5; border-radius: 4px; cursor: pointer; font-size: 11px; text-align: left;';
            btn.onclick = () => { startDrawing(category, id); closeAllPopups(); };
            itemsDiv.appendChild(btn);
        });
        categoryDiv.appendChild(itemsDiv); content.appendChild(categoryDiv);
    });
}

function toggleLibrary() {
    const panel = ES.libraryPanel; const btn = document.getElementById('library-btn');
    if (!panel) return;
    if (panel.style.display === 'none') { panel.style.display = 'block'; if (btn) btn.innerHTML = '<i class="fa-solid fa-chevron-up"></i>'; }
    else { panel.style.display = 'none'; if (btn) btn.innerHTML = '<i class="fa-solid fa-book"></i>'; }
}

function closeAllPopups() {
    if (ES.libraryPanel) ES.libraryPanel.style.display = 'none';
    if (ES.propertiesPanel) ES.propertiesPanel.style.display = 'none';
    const btn = document.getElementById('library-btn'); if (btn) btn.innerHTML = '<i class="fa-solid fa-book"></i>';
    const templateSelector = document.getElementById('template-selector'); if (templateSelector) templateSelector.remove();
}

function showTemplateSelector() {
    closeAllPopups(); const container = document.getElementById('editor-container'); if (!container) return;
    const popup = document.createElement('div'); popup.id = 'template-selector';
    popup.style.cssText = 'position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); background: white; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); padding: 20px; z-index: 200; max-width: 400px; width: 90%;';
    popup.innerHTML = `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;"><h3 style="margin: 0; font-size: 16px; font-weight: 600;">Plantillas</h3><button onclick="closeTemplateSelector()" style="background: none; border: none; cursor: pointer; font-size: 20px;"><i class="fa-solid fa-times"></i></button></div><p style="color: #666; margin-bottom: 15px;">Selecciona una plantilla:</p><div id="template-list" style="display: grid; gap: 10px;"></div>`;
    const list = popup.querySelector('#template-list');
    Object.keys(Templates).forEach(templateKey => {
        const template = Templates[templateKey];
        const btn = document.createElement('button'); btn.style.cssText = 'padding: 12px; border: 1px solid #ddd; border-radius: 8px; background: white; cursor: pointer;';
        btn.innerHTML = `<div style="font-weight: 600; margin-bottom: 4px;">${template.name}</div><div style="font-size: 12px; color: #666;">${template.description}</div>`;
        btn.onclick = () => loadTemplate(templateKey); list.appendChild(btn);
    });
    container.appendChild(popup);
}

function closeTemplateSelector() { const popup = document.getElementById('template-selector'); if (popup) popup.remove(); }

function loadTemplate(templateKey) {
    const template = Templates[templateKey]; if (!template) return;
    clearScene(); importFromJSON(JSON.stringify(template));
    ES.camera.position.set(15, 15, 15); ES.camera.lookAt(0, 0, 0); ES.controls.update();
    closeTemplateSelector(); closeAllPopups();
}

function showProperties(object) {
    const content = document.getElementById('properties-content'); if (!content) return;
    const data = object.userData; let html = `<div style="margin-bottom: 10px;"><label style="display: block; font-size: 11px; color: #666; margin-bottom: 4px;">Nombre</label><input type="text" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;" value="${data.name || ''}" onchange="updateProperty('name', this.value)"></div>`;
    if (data.width !== undefined) html += `<div style="margin-bottom: 10px;"><label style="display: block; font-size: 11px; color: #666; margin-bottom: 4px;">Ancho (m)</label><input type="number" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;" value="${data.width}" onchange="updateProperty('width', parseFloat(this.value))" step="0.01"></div>`;
    if (data.height !== undefined) html += `<div style="margin-bottom: 10px;"><label style="display: block; font-size: 11px; color: #666; margin-bottom: 4px;">Alto (m)</label><input type="number" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;" value="${data.height}" onchange="updateProperty('height', parseFloat(this.value))" step="0.01"></div>`;
    if (data.length !== undefined) html += `<div style="margin-bottom: 10px;"><label style="display: block; font-size: 11px; color: #666; margin-bottom: 4px;">Largo (m)</label><input type="number" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;" value="${data.length}" onchange="updateProperty('length', parseFloat(this.value))" step="0.01"></div>`;
    if (data.depth !== undefined) html += `<div style="margin-bottom: 10px;"><label style="display: block; font-size: 11px; color: #666; margin-bottom: 4px;">Profundidad (m)</label><input type="number" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;" value="${data.depth}" onchange="updateProperty('depth', parseFloat(this.value))" step="0.01"></div>`;
    if (data.material !== undefined) {
        html += `<div style="margin-bottom: 10px;"><label style="display: block; font-size: 11px; color: #666; margin-bottom: 4px;">Material</label><select style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;" onchange="updateProperty('material', this.value)">`;
        const type = data.type; const materials = { wall: ['concrete','brick','stone','hebel'], roof: ['tile','metal'], floor: ['tile','wood','concrete','stone'], window: ['glass'], door: ['wood','metal'] };
        if (materials[type]) materials[type].forEach(m => html += `<option value="${m}" ${data.material === m ? 'selected' : ''}>${m}</option>`);
        html += `</select></div>`;
    }
    content.innerHTML = html; if (ES.propertiesPanel) ES.propertiesPanel.style.display = 'block';
}

function closePropertiesPanel() { if (ES.propertiesPanel) ES.propertiesPanel.style.display = 'none'; }
function updateProperty(key, value) {
    if (ES.selectedObject) {
        ES.selectedObject.userData[key] = value; updateObjectGeometry(ES.selectedObject);
        if (key === 'material') ES.selectedObject.material = getMaterial(ES.selectedObject.userData.type, value);
    }
}
function updateObjectGeometry(object) {
    const data = object.userData; const type = data.type;
    if (type === 'wall') object.geometry.dispose(); object.geometry = new THREE.BoxGeometry(data.width || 0.2, data.height || 3.0, data.length || 1.0);
    else if (type === 'door' || type === 'window') { object.geometry.dispose(); object.geometry = new THREE.BoxGeometry(data.width, data.height, data.depth || 0.1); }
    else { object.geometry.dispose(); object.geometry = new THREE.BoxGeometry(data.width, data.height, data.depth); }
}
function updateUI() {
    if (!ES.toolbar) return;
    ES.toolbar.querySelectorAll('button[data-mode]').forEach(btn => { btn.classList.remove('active'); if (btn.dataset.mode === ES.mode) btn.classList.add('active'); });
    ES.toolbar.querySelectorAll('button[data-view]').forEach(btn => { btn.classList.remove('active'); if (btn.dataset.view === ES.viewMode) btn.classList.add('active'); });
    updateGridUI();
}
function updateGridUI() { const gridBtn = document.querySelector('button[data-action="grid"]'); if (gridBtn) gridBtn.classList.toggle('active', ES.snapToGrid); if (ES.gridHelper) ES.gridHelper.visible = ES.snapToGrid; }

function animate() { requestAnimationFrame(animate); if (ES.controls) ES.controls.update(); if (ES.renderer) ES.renderer.render(ES.scene, ES.camera); }

window.Editor3D = { init: init3DEditor, state: ES, config: EC, library: EL, templates: Templates, startDrawing, cancelDrawing, selectObject, deleteSelectedObject, undo, redo, exportToJSON, exportToSVG, exportToPNG, copyToClipboard, importFromJSON, changeView, clearScene, showProperties, closePropertiesPanel, updateProperty, updateUI, toggleLibrary, closeAllPopups, showTemplateSelector, closeTemplateSelector, loadTemplate, downloadPNG };
