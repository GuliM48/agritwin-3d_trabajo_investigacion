// ============================================================================
// AGRI-TWIN 3D - THREE.JS 3D DIGITAL TWIN VIEWER
// DEM Terrain, Multi-Layer Canopy & Soil Horizons, In-situ OGC Probes, & Raycasting
// ============================================================================
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GridCell, FarmField, View3DLayer, SubsurfaceDepth } from '../types';
import { 
  Eye, 
  Layers, 
  Maximize2, 
  RotateCcw, 
  Activity, 
  Info, 
  Compass, 
  ShieldCheck, 
  Sliders, 
  Sparkles,
  MapPin
} from 'lucide-react';

interface ThreeTwinViewerProps {
  field: FarmField;
  cells: GridCell[];
  activeLayer: View3DLayer;
  setActiveLayer: (layer: View3DLayer) => void;
  selectedCell: GridCell | null;
  setSelectedCell: (cell: GridCell | null) => void;
  subsurfaceDepth: SubsurfaceDepth;
  setSubsurfaceDepth: (depth: SubsurfaceDepth) => void;
  julianDay: number;
}

export const ThreeTwinViewer: React.FC<ThreeTwinViewerProps> = ({
  field,
  cells,
  activeLayer,
  setActiveLayer,
  selectedCell,
  setSelectedCell,
  subsurfaceDepth,
  setSubsurfaceDepth,
  julianDay,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [wireframe, setWireframe] = useState<boolean>(false);
  const [elevationExaggeration, setElevationExaggeration] = useState<number>(2.2);
  const [showSubsurfaceCutaway, setShowSubsurfaceCutaway] = useState<boolean>(false);
  const [showSensorProbes, setShowSensorProbes] = useState<boolean>(true);
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
  const [fps, setFps] = useState<number>(60);

  // Three.js instances refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const soilMeshRef = useRef<THREE.Mesh | null>(null);
  const probeGroupRef = useRef<THREE.Group | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraAngleRef = useRef<{ theta: number; phi: number; radius: number }>({
    theta: Math.PI / 4,
    phi: Math.PI / 3.2,
    radius: 42,
  });

  // Calculate cell color based on active layer
  const getCellColor = (c: GridCell, layer: View3DLayer): THREE.Color => {
    const color = new THREE.Color();
    switch (layer) {
      case 'CROP_NDVI': {
        const val = Math.max(0, Math.min(1, c.uav_NDVI));
        if (val < 0.3) color.setRGB(0.85, 0.25, 0.15); // Red/Orange bare soil
        else if (val < 0.6) color.setRGB(0.9, 0.85, 0.2); // Yellow moderate vigor
        else color.setRGB(0.1, 0.45 + (val - 0.6) * 1.2, 0.15); // Vibrant healthy green
        break;
      }
      case 'PREDICTED_YIELD': {
        const norm = Math.max(0, Math.min(1, (c.predictedYield_kg_ha - 6000) / 6500));
        color.setHSL(0.33 * norm, 0.85, 0.45); // Red (low) to Blue/Green (high)
        break;
      }
      case 'GROUND_TRUTH': {
        const norm = Math.max(0, Math.min(1, (c.groundTruthYield_kg_ha - 6000) / 6500));
        color.setHSL(0.33 * norm, 0.85, 0.45);
        break;
      }
      case 'CROP_BIOMASS': {
        const norm = Math.max(0, Math.min(1, c.uav_CanopyHeight_m / 2.5));
        color.setRGB(0.2 + norm * 0.1, 0.3 + norm * 0.6, 0.15 + norm * 0.2);
        break;
      }
      case 'SOIL_ORGANIC_CARBON': {
        const norm = Math.max(0, Math.min(1, (c.soilOrganicCarbon_g_kg - 15) / 30));
        color.setRGB(0.45 - norm * 0.3, 0.3 - norm * 0.2, 0.18 - norm * 0.12); // Rich dark humus brown
        break;
      }
      case 'SOIL_CLAY': {
        const norm = Math.max(0, Math.min(1, (c.soilClay_percent - 15) / 25));
        color.setRGB(0.75 - norm * 0.2, 0.45 + norm * 0.1, 0.35); // Clay terracotta
        break;
      }
      case 'SOIL_MOISTURE': {
        const norm = Math.max(0, Math.min(1, (c.soilMoisture_vol_percent - 15) / 20));
        color.setRGB(0.15, 0.4 + norm * 0.4, 0.7 + norm * 0.25); // Hydro blues
        break;
      }
      case 'SOIL_PH': {
        const norm = Math.max(0, Math.min(1, (c.soilPH - 5.5) / 2.2));
        color.setHSL(0.75 - norm * 0.55, 0.8, 0.5); // Acid (yellow-red) to Alkaline (blue-purple)
        break;
      }
      case 'NITROGEN_RX': {
        const norm = Math.max(0, Math.min(1, (c.nitrogenApplied_kg_ha - 130) / 70));
        color.setRGB(0.85 - norm * 0.6, 0.3 + norm * 0.5, 0.85); // Purple/Violet variable prescription
        break;
      }
      case 'MANAGEMENT_ZONES': {
        if (c.managementZone === 1) color.setRGB(0.13, 0.65, 0.34); // High: Emerald
        else if (c.managementZone === 2) color.setRGB(0.2, 0.6, 0.85); // Medium-High: Cyan/Blue
        else if (c.managementZone === 3) color.setRGB(0.92, 0.68, 0.15); // Medium-Low: Amber
        else color.setRGB(0.88, 0.3, 0.25); // Low: Coral/Red
        break;
      }
      case 'CONFIDENCE_HEATMAP': {
        const norm = Math.max(0, Math.min(1, (c.predictionConfidence - 0.7) / 0.3));
        color.setRGB(0.85 - norm * 0.7, 0.2 + norm * 0.75, 0.3); // Red (low conf) to Green (high conf)
        break;
      }
      case 'UAV_RGB_HIGHRES': {
        color.set(c.uav_RGB_hex);
        break;
      }
      case 'TERRAIN_DEM':
      default: {
        const norm = Math.max(0, Math.min(1, (c.elevation - field.elevationRangeM[0]) / (field.elevationRangeM[1] - field.elevationRangeM[0] || 1)));
        color.setHSL(0.55 - norm * 0.45, 0.75, 0.48); // Elevation hypsometric tint
        break;
      }
    }
    return color;
  };

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b1329'); // Deep cosmic navy/slate
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.4);
    sunLight.position.set(25, 45, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x90b0e0, 0.5);
    fillLight.position.set(-25, 20, -20);
    scene.add(fillLight);

    // Grid Floor Helper
    const gridHelper = new THREE.GridHelper(36, 18, 0x334155, 0x1e293b);
    gridHelper.position.y = -4;
    scene.add(gridHelper);

    // Probe Group
    const probeGroup = new THREE.Group();
    probeGroupRef.current = probeGroup;
    scene.add(probeGroup);

    // Animation / Render Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const updateCameraPosition = () => {
      const { theta, phi, radius } = cameraAngleRef.current;
      camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
      camera.lookAt(0, 0, 0);
    };
    updateCameraPosition();

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      // FPS tracking
      frameCount++;
      if (currentTime - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }

      // Gentle subtle oscillation for probes
      if (probeGroupRef.current) {
        probeGroupRef.current.children.forEach((probe, idx) => {
          probe.position.y += Math.sin(currentTime * 0.003 + idx) * 0.002;
        });
      }

      renderer.render(scene, camera);
    };
    animate(performance.now());

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // Update Geometry & Mesh when cells, layer, elevation, or cutaway changes
  useEffect(() => {
    if (!sceneRef.current || cells.length === 0) return;

    const rows = field.gridRows;
    const cols = field.gridCols;
    const size = 26; // Plane width in Three.js units

    // Remove existing surface mesh
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      (meshRef.current.material as THREE.Material).dispose();
      meshRef.current = null;
    }

    // Remove existing subsurface mesh
    if (soilMeshRef.current) {
      sceneRef.current.remove(soilMeshRef.current);
      soilMeshRef.current.geometry.dispose();
      (soilMeshRef.current.material as THREE.Material).dispose();
      soilMeshRef.current = null;
    }

    // 1. Build Surface DEM Plane
    const geometry = new THREE.PlaneGeometry(size, size, cols - 1, rows - 1);
    geometry.rotateX(-Math.PI / 2); // Lay horizontal

    const posAttr = geometry.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);

    const minElev = field.elevationRangeM[0];
    const maxElev = field.elevationRangeM[1];
    const elevSpan = maxElev - minElev || 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const vertexIndex = r * cols + c;
        const cell = cells.find((cellItem) => cellItem.row === r && cellItem.col === c);

        if (cell) {
          const normElev = (cell.elevation - minElev) / elevSpan;
          const yHeight = normElev * elevationExaggeration;
          posAttr.setY(vertexIndex, yHeight);

          const cellColor = getCellColor(cell, activeLayer);
          colors[vertexIndex * 3] = cellColor.r;
          colors[vertexIndex * 3 + 1] = cellColor.g;
          colors[vertexIndex * 3 + 2] = cellColor.b;
        }
      }
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.65,
      metalness: 0.15,
      wireframe: wireframe,
      side: THREE.DoubleSide,
      flatShading: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    meshRef.current = mesh;
    sceneRef.current.add(mesh);

    // 2. Build Subsurface Soil Horizon Cutaway if toggled
    if (showSubsurfaceCutaway) {
      const soilGeo = new THREE.BoxGeometry(size, 3.5, size);
      soilGeo.translate(0, -1.75, 0);

      const soilMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x3e2723), // Dark humus soil bedrock
        roughness: 0.9,
        transparent: true,
        opacity: 0.85,
        wireframe: wireframe,
      });

      const soilMesh = new THREE.Mesh(soilGeo, soilMat);
      soilMeshRef.current = soilMesh;
      sceneRef.current.add(soilMesh);
    }

    // 3. Build In-Situ OGC SensorThings Probes
    if (probeGroupRef.current) {
      // Clear previous probes
      while (probeGroupRef.current.children.length > 0) {
        const obj = probeGroupRef.current.children[0];
        probeGroupRef.current.remove(obj);
      }

      if (showSensorProbes) {
        const probeLocations = [
          { r: 4, c: 4, name: 'STA Node 1 (Upland Loam)' },
          { r: 18, c: 6, name: 'STA Node 2 (Depression Clay)' },
          { r: 12, c: 19, name: 'STA Node 3 (Central Ridge)' },
        ];

        probeLocations.forEach((loc, i) => {
          const cell = cells.find((c) => c.row === loc.r && c.col === loc.c);
          if (!cell) return;

          const normX = (loc.c / (cols - 1) - 0.5) * size;
          const normZ = (loc.r / (rows - 1) - 0.5) * size;
          const normElev = (cell.elevation - minElev) / elevSpan;
          const yHeight = normElev * elevationExaggeration;

          // Probe Mast
          const mastGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.2, 8);
          const mastMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 });
          const mast = new THREE.Mesh(mastGeo, mastMat);
          mast.position.set(normX, yHeight + 1.1, normZ);

          // Glowing Sensor Beacon on Top
          const beaconGeo = new THREE.SphereGeometry(0.35, 16, 16);
          const beaconMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x0284c7,
            emissiveIntensity: 0.9,
            roughness: 0.2,
          });
          const beacon = new THREE.Mesh(beaconGeo, beaconMat);
          beacon.position.set(normX, yHeight + 2.4, normZ);

          probeGroupRef.current?.add(mast);
          probeGroupRef.current?.add(beacon);
        });
      }
    }
  }, [cells, activeLayer, elevationExaggeration, wireframe, showSubsurfaceCutaway, showSensorProbes]);

  // Mouse drag Orbit rotation & Raycasting cell selection
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraAngleRef.current.theta -= deltaX * 0.008;
      cameraAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2.05, cameraAngleRef.current.phi - deltaY * 0.008));

      const { theta, phi, radius } = cameraAngleRef.current;
      if (cameraRef.current) {
        cameraRef.current.position.x = radius * Math.sin(phi) * Math.cos(theta);
        cameraRef.current.position.y = radius * Math.cos(phi);
        cameraRef.current.position.z = radius * Math.sin(phi) * Math.sin(theta);
        cameraRef.current.lookAt(0, 0, 0);
      }

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Raycast hover over field grid
    if (!containerRef.current || !cameraRef.current || !meshRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
    const intersects = raycaster.intersectObject(meshRef.current);

    if (intersects.length > 0) {
      const uv = intersects[0].uv;
      if (uv) {
        const col = Math.min(field.gridCols - 1, Math.max(0, Math.floor(uv.x * field.gridCols)));
        const row = Math.min(field.gridRows - 1, Math.max(0, Math.floor(uv.y * field.gridRows)));
        const cell = cells.find((c) => c.row === row && c.col === col);
        if (cell) setHoveredCell(cell);
      }
    } else {
      setHoveredCell(null);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cameraAngleRef.current.radius = Math.max(12, Math.min(85, cameraAngleRef.current.radius + e.deltaY * 0.04));
    const { theta, phi, radius } = cameraAngleRef.current;
    if (cameraRef.current) {
      cameraRef.current.position.x = radius * Math.sin(phi) * Math.cos(theta);
      cameraRef.current.position.y = radius * Math.cos(phi);
      cameraRef.current.position.z = radius * Math.sin(phi) * Math.sin(theta);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !meshRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
    const intersects = raycaster.intersectObject(meshRef.current);

    if (intersects.length > 0 && intersects[0].uv) {
      const uv = intersects[0].uv;
      const col = Math.min(field.gridCols - 1, Math.max(0, Math.floor(uv.x * field.gridCols)));
      const row = Math.min(field.gridRows - 1, Math.max(0, Math.floor(uv.y * field.gridRows)));
      const cell = cells.find((c) => c.row === row && c.col === col);
      if (cell) setSelectedCell(cell);
    }
  };

  const resetCameraView = () => {
    cameraAngleRef.current = { theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 42 };
    const { theta, phi, radius } = cameraAngleRef.current;
    if (cameraRef.current) {
      cameraRef.current.position.x = radius * Math.sin(phi) * Math.cos(theta);
      cameraRef.current.position.y = radius * Math.cos(phi);
      cameraRef.current.position.z = radius * Math.sin(phi) * Math.sin(theta);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col">
      {/* 3D Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Top-Left Floating Layer Indicator & Telemetry */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/70 shadow-lg pointer-events-auto flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">3D Digital Twin Engine</div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                {activeLayer.replace(/_/g, ' ')}
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  DOY {julianDay}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex items-center gap-3 font-mono">
            <span>FPS: <strong className="text-emerald-400">{fps}</strong></span>
            <span>Mesh: <strong>{field.gridRows}x{field.gridCols} (10m voxels)</strong></span>
            <span>Area: <strong>{field.areaHa} ha</strong></span>
          </div>
        </div>

        {/* Top-Right Control Toolbar */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {/* Elevation Slider */}
          <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/70 text-xs text-slate-200 flex items-center gap-2 shadow-lg">
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] text-slate-400 font-medium">DEM Exag:</span>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.1"
              value={elevationExaggeration}
              onChange={(e) => setElevationExaggeration(parseFloat(e.target.value))}
              className="w-16 accent-blue-500 cursor-pointer h-1.5"
            />
            <span className="font-mono text-[11px] text-blue-400 font-semibold">{elevationExaggeration}x</span>
          </div>

          {/* Wireframe Toggle */}
          <button
            onClick={() => setWireframe(!wireframe)}
            className={`p-2 rounded-xl border backdrop-blur-md transition-all shadow-lg text-xs font-semibold flex items-center gap-1.5 ${
              wireframe
                ? 'bg-blue-600 border-blue-400 text-white'
                : 'bg-slate-900/90 border-slate-700/70 text-slate-300 hover:bg-slate-800'
            }`}
            title="Toggle Wireframe Mesh"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Soil Subsurface Cutaway Toggle */}
          <button
            onClick={() => setShowSubsurfaceCutaway(!showSubsurfaceCutaway)}
            className={`px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all shadow-lg text-xs font-semibold flex items-center gap-1.5 ${
              showSubsurfaceCutaway
                ? 'bg-amber-600 border-amber-400 text-white'
                : 'bg-slate-900/90 border-slate-700/70 text-slate-300 hover:bg-slate-800'
            }`}
            title="Toggle Subsurface Soil Cutaway Block"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Soil Cutaway</span>
          </button>

          {/* OGC Sensor Probes Toggle */}
          <button
            onClick={() => setShowSensorProbes(!showSensorProbes)}
            className={`p-2 rounded-xl border backdrop-blur-md transition-all shadow-lg ${
              showSensorProbes
                ? 'bg-emerald-600 border-emerald-400 text-white'
                : 'bg-slate-900/90 border-slate-700/70 text-slate-300 hover:bg-slate-800'
            }`}
            title="Toggle In-situ OGC Probes"
          >
            <MapPin className="w-4 h-4" />
          </button>

          {/* Reset Camera */}
          <button
            onClick={resetCameraView}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/70 rounded-xl text-slate-300 backdrop-blur-md transition-all shadow-lg"
            title="Reset 3D Camera Position"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Hover / Inspection Card */}
        {(hoveredCell || selectedCell) && (
          <div className="absolute bottom-4 left-4 z-10 max-w-sm bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-700/80 shadow-2xl text-slate-200 pointer-events-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span className="font-bold text-sm text-slate-100">
                  {selectedCell ? `Selected: [${selectedCell.row}, ${selectedCell.col}]` : `Hover: [${hoveredCell?.row}, ${hoveredCell?.col}]`}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                (selectedCell || hoveredCell)?.managementZone === 1 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                (selectedCell || hoveredCell)?.managementZone === 2 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                (selectedCell || hoveredCell)?.managementZone === 3 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                Zone {(selectedCell || hoveredCell)?.managementZone}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/60 p-2 rounded-lg">
                <div className="text-[10px] text-slate-400">Predicted Yield</div>
                <div className="text-base font-bold text-emerald-400">
                  {(selectedCell || hoveredCell)?.predictedYield_kg_ha.toLocaleString()} <span className="text-[10px] text-slate-300 font-normal">kg/ha</span>
                </div>
              </div>

              <div className="bg-slate-800/60 p-2 rounded-lg">
                <div className="text-[10px] text-slate-400">BARC Ground Truth</div>
                <div className="text-base font-bold text-blue-400">
                  {(selectedCell || hoveredCell)?.groundTruthYield_kg_ha.toLocaleString()} <span className="text-[10px] text-slate-300 font-normal">kg/ha</span>
                </div>
              </div>

              <div className="bg-slate-800/60 p-2 rounded-lg">
                <div className="text-[10px] text-slate-400">UAV NDVI (10m)</div>
                <div className="font-semibold text-slate-200">{(selectedCell || hoveredCell)?.uav_NDVI}</div>
              </div>

              <div className="bg-slate-800/60 p-2 rounded-lg">
                <div className="text-[10px] text-slate-400">Soil Organic C</div>
                <div className="font-semibold text-slate-200">{(selectedCell || hoveredCell)?.soilOrganicCarbon_g_kg} g/kg</div>
              </div>

              <div className="bg-slate-800/60 p-2 rounded-lg">
                <div className="text-[10px] text-slate-400">Nitrogen Applied</div>
                <div className="font-semibold text-slate-200">{(selectedCell || hoveredCell)?.nitrogenApplied_kg_ha} kg N/ha</div>
              </div>

              <div className="bg-slate-800/60 p-2 rounded-lg">
                <div className="text-[10px] text-slate-400">Prediction Confidence</div>
                <div className="font-semibold text-emerald-300">{(((selectedCell || hoveredCell)?.predictionConfidence || 0) * 100).toFixed(1)}%</div>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
              <span>DEM Elev: {(selectedCell || hoveredCell)?.elevation}m</span>
              <span>Soil pH: {(selectedCell || hoveredCell)?.soilPH}</span>
              <span>Moisture: {(selectedCell || hoveredCell)?.soilMoisture_vol_percent}%</span>
            </div>
          </div>
        )}

        {/* Bottom Legend */}
        <div className="absolute bottom-4 right-4 z-10 bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700/70 shadow-lg text-xs">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Layer Palette Legend</div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono">Low</span>
            <div className="w-28 h-2.5 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 via-emerald-500 to-blue-600 shadow-inner" />
            <span className="text-[10px] text-slate-400 font-mono">High</span>
          </div>
        </div>
      </div>

      {/* Layer Picker Bar */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-thin">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-blue-400" /> Capas 3D:
        </span>

        {[
          { id: 'TERRAIN_DEM', label: 'DEM Topografía' },
          { id: 'PREDICTED_YIELD', label: 'Rendimiento Predicho (APSIM+XGB)' },
          { id: 'GROUND_TRUTH', label: 'Ground Truth USDA BARC' },
          { id: 'CROP_NDVI', label: 'NDVI Fusión UAV+S2' },
          { id: 'CROP_BIOMASS', label: 'Biomasa & Altura Canopia' },
          { id: 'MANAGEMENT_ZONES', label: 'Zonas de Manejo (IoU 0.91)' },
          { id: 'SOIL_ORGANIC_CARBON', label: 'Carbono Orgánico Suelo' },
          { id: 'SOIL_MOISTURE', label: 'Humedad de Suelo (STA)' },
          { id: 'SOIL_PH', label: 'pH del Suelo' },
          { id: 'NITROGEN_RX', label: 'Prescripción Nitrógeno' },
          { id: 'CONFIDENCE_HEATMAP', label: 'Mapa de Confianza' },
          { id: 'UAV_RGB_HIGHRES', label: 'UAV Ortofoto RGB' },
        ].map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(layer.id as View3DLayer)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeLayer === layer.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white'
            }`}
          >
            {layer.label}
          </button>
        ))}
      </div>
    </div>
  );
};
