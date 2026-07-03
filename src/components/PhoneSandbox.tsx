import { useEffect, useRef, useState } from 'react';
import { 
  Engine, World, Bodies, Body, Composite, 
  Mouse, MouseConstraint, Events, Query, Runner 
} from 'matter-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Github, Linkedin, Instagram, Pinterest, Behance 
} from './BrandIcons';
import { 
  RotateCcw, Sparkles, Camera, Moon, Sun, 
  Folder, X, Award, Calendar, 
  ChevronRight, ArrowLeft, Image as ImageIcon, Info 
} from 'lucide-react';
import LockScreen from './LockScreen';

interface SandboxItem {
  id: string;
  type: 'widget-profile' | 'icon' | 'placeholder';
  title: string;
  subtitle?: string;
  width: number;
  height: number;
  colorClass: string;
  initX: number;
  initY: number;
  chamferRadius: number;
}

export default function PhoneSandbox() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const runnerRef = useRef<Runner | null>(null);
  const bodiesRef = useRef<{ [key: string]: Body }>({});
  const [gravity, setGravity] = useState<number>(0); // ambient 0 gravity so elements drift/float freely
  const [bounciness, setBounciness] = useState<number>(0.6); // medium bouncy
  const [scale, setScale] = useState<number>(1);
  const [isThemeDark, setIsThemeDark] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(true);

  const isLockedRef = useRef<boolean>(true);
  isLockedRef.current = isLocked;
  
  // Custom iOS sheets modal active state
  const [activeSheet, setActiveSheet] = useState<'calendar' | 'files' | 'photos' | 'settings' | null>(null);
  const [frozenBody, setFrozenBody] = useState<Body | null>(null);
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number }>({ x: 180, y: 300 });

  // Layout bounds for iPhone screen mockup (360 width, 720 height)
  const width = 360;
  const height = 720;

  // Custom pages tabs
  const [filesActivePage, setFilesActivePage] = useState<'bram' | 'zaira'>('bram');
  const [photosActiveTab, setPhotosActiveTab] = useState<'library' | 'foryou' | 'albums'>('library');
  const [settingsActivePage, setSettingsActivePage] = useState<'main' | 'analytics' | 'frameworks'>('main');

  const items: SandboxItem[] = [
    // Profile Widget (Horizontal rectangular squircle)
    {
      id: 'profile',
      type: 'widget-profile',
      title: "Syam Suresh",
      subtitle: "Project Manager | Tech Analyst",
      width: 320,
      height: 120,
      colorClass: "bg-gradient-to-r from-indigo-950/70 via-indigo-900/60 to-purple-900/60 text-white border border-indigo-500/20",
      initX: 180,
      initY: 90,
      chamferRadius: 22
    },
    // Custom Apps
    {
      id: 'app-calendar',
      type: 'icon',
      title: "Calendar",
      width: 64,
      height: 64,
      colorClass: "bg-white border border-slate-200 text-slate-900 hover:border-slate-300",
      initX: 65,
      initY: 220,
      chamferRadius: 16
    },
    {
      id: 'app-files',
      type: 'icon',
      title: "Files",
      width: 64,
      height: 64,
      colorClass: "bg-slate-900 border border-indigo-500/20 text-indigo-400 hover:border-indigo-500/40",
      initX: 140,
      initY: 220,
      chamferRadius: 16
    },
    {
      id: 'app-photos',
      type: 'icon',
      title: "Photos",
      width: 64,
      height: 64,
      colorClass: "bg-gradient-to-tr from-cyan-900/40 via-purple-900/40 to-rose-900/40 border border-white/10 text-white",
      initX: 220,
      initY: 220,
      chamferRadius: 16
    },
    {
      id: 'app-settings',
      type: 'icon',
      title: "Settings",
      width: 64,
      height: 64,
      colorClass: "bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600",
      initX: 295,
      initY: 220,
      chamferRadius: 16
    },
    // Media visual placeholders (Aesthetic drifting blocks)
    {
      id: 'media-1',
      type: 'placeholder',
      title: "Frame 1",
      subtitle: "Arch Perspective",
      width: 100,
      height: 100,
      colorClass: "bg-slate-900/80 border border-slate-800/80 text-slate-400 hover:text-slate-300",
      initX: 100,
      initY: 340,
      chamferRadius: 18
    },
    {
      id: 'media-2',
      type: 'placeholder',
      title: "Frame 2",
      subtitle: "Digital Design",
      width: 100,
      height: 100,
      colorClass: "bg-gradient-to-tr from-indigo-950/60 to-cyan-950/60 border border-indigo-500/20 text-cyan-400",
      initX: 260,
      initY: 340,
      chamferRadius: 18
    },
    {
      id: 'media-3',
      type: 'placeholder',
      title: "Frame 3",
      subtitle: "Visual Media",
      width: 100,
      height: 100,
      colorClass: "bg-purple-950/80 border border-purple-900/60 text-purple-300",
      initX: 180,
      initY: 450,
      chamferRadius: 18
    }
  ];

  // Auto-scale to fit smaller viewport sizes
  useEffect(() => {
    const handleResize = () => {
      const parent = sceneRef.current?.parentElement;
      if (parent) {
        const parentWidth = parent.clientWidth;
        const parentHeight = parent.clientHeight;
        const scaleW = parentWidth / (width + 60);
        const scaleH = parentHeight / (height + 150);
        const newScale = Math.min(scaleW, scaleH, 1.05);
        setScale(Math.max(newScale, 0.45));
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Physics Initialization
  useEffect(() => {
    if (!canvasRef.current) return;

    // 1. Create Engine
    const engine = Engine.create({
      gravity: { x: 0, y: gravity, scale: 0.001 }
    });
    engineRef.current = engine;
    const world = engine.world;

    // 2. Create boundaries (bottom wall placed at y=580 to prevent floating bodies overlapping with bottom Dock)
    const wallOptions = { isStatic: true, restitution: bounciness, friction: 0.1 };
    const walls = [
      Bodies.rectangle(width / 2, -50, width + 200, 100, wallOptions), // Top
      Bodies.rectangle(width / 2, 595, width + 200, 30, wallOptions), // Bottom (above Dock)
      Bodies.rectangle(-50, height / 2, 100, height + 200, wallOptions), // Left
      Bodies.rectangle(width + 50, height / 2, 100, height + 200, wallOptions) // Right
    ];
    Composite.add(world, walls);

    // 3. Create Rigid Bodies for elements
    const tempBodies: { [key: string]: Body } = {};
    items.forEach((item) => {
      const body = Bodies.rectangle(item.initX, item.initY, item.width, item.height, {
        restitution: bounciness,
        frictionAir: 0.02,
        friction: 0.1,
        chamfer: { radius: item.chamferRadius },
        label: item.id
      });
      tempBodies[item.id] = body;
      Composite.add(world, body);
    });
    bodiesRef.current = tempBodies;

    // 4. Mouse Constraint for canvas drags
    const mouse = Mouse.create(canvasRef.current);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.15,
        render: { visible: false }
      }
    });
    Composite.add(world, mouseConstraint);

    // Coordinate Sync loop
    let animationId: number;
    const syncDOM = () => {
      items.forEach((item) => {
        const body = tempBodies[item.id];
        const el = document.getElementById(`body-${item.id}`);
        if (body && el) {
          el.style.transform = `translate3d(${body.position.x - item.width / 2}px, ${body.position.y - item.height / 2}px, 0) rotate(${body.angle}rad)`;
        }
      });
      animationId = requestAnimationFrame(syncDOM);
    };
    syncDOM();

    // Mouse pointer cursor state handles
    Events.on(mouseConstraint, 'mousemove', (event) => {
      const activeBodies = Composite.allBodies(world).filter(b => !b.isStatic);
      const hovered = Query.point(activeBodies, event.mouse.position);
      if (hovered.length > 0) {
        canvasRef.current!.style.cursor = 'grab';
      } else {
        canvasRef.current!.style.cursor = 'default';
      }
    });

    Events.on(mouseConstraint, 'startdrag', () => {
      canvasRef.current!.style.cursor = 'grabbing';
    });

    Events.on(mouseConstraint, 'enddrag', () => {
      canvasRef.current!.style.cursor = 'default';
    });

    // Check quick clicks vs drags
    let clickStartX = 0;
    let clickStartY = 0;
    let clickStartTime = 0;

    const handleMouseDown = (e: MouseEvent) => {
      if (isLockedRef.current) return;
      clickStartX = e.clientX;
      clickStartY = e.clientY;
      clickStartTime = Date.now();
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isLockedRef.current) return;
      const clickDist = Math.hypot(e.clientX - clickStartX, e.clientY - clickStartY);
      const clickDuration = Date.now() - clickStartTime;

      if (clickDist < 6 && clickDuration < 280) {
        const bodiesList = Composite.allBodies(world).filter(b => !b.isStatic);
        const clicked = Query.point(bodiesList, mouse.position);
        if (clicked.length > 0) {
          const clickedBody = clicked[0];
          const item = items.find(i => i.id === clickedBody.label);
          if (item && item.id.startsWith('app-')) {
            // Lock the clicked body in place (freeze physics) and zoom open the app
            Body.setStatic(clickedBody, true);
            setFrozenBody(clickedBody);
            setClickCoords({ x: clickedBody.position.x, y: clickedBody.position.y });
            setActiveSheet(item.id.replace('app-', '') as any);
          }
        }
      }
    };

    const canvasElement = canvasRef.current;
    canvasElement.addEventListener('mousedown', handleMouseDown);
    canvasElement.addEventListener('mouseup', handleMouseUp);

    // Start Runner
    const runner = Runner.create();
    Runner.run(runner, engine);
    runnerRef.current = runner;

    return () => {
      cancelAnimationFrame(animationId);
      Runner.stop(runner);
      Engine.clear(engine);
      World.clear(world, false);
      if (canvasElement) {
        canvasElement.removeEventListener('mousedown', handleMouseDown);
        canvasElement.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, []);

  // Update Gravity in real-time
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.gravity.y = gravity;
    }
  }, [gravity]);

  // Update Restitution/Bounciness in real-time
  useEffect(() => {
    if (engineRef.current) {
      const world = engineRef.current.world;
      const allBodies = Composite.allBodies(world);
      allBodies.forEach((body) => {
        body.restitution = bounciness;
      });
    }
  }, [bounciness]);

  // Close sheet panel and unfreeze physics body
  const closeSheet = () => {
    if (frozenBody) {
      // Small timeout to let zoom animation finish before unfreezing physics
      setTimeout(() => {
        Body.setStatic(frozenBody, false);
        setFrozenBody(null);
      }, 300);
    }
    setActiveSheet(null);
  };

  const handleReset = () => {
    if (frozenBody) {
      Body.setStatic(frozenBody, false);
      setFrozenBody(null);
    }
    setActiveSheet(null);
    items.forEach((item) => {
      const body = bodiesRef.current[item.id];
      if (body) {
        Body.setPosition(body, { x: item.initX, y: item.initY });
        Body.setVelocity(body, { x: 0, y: 0 });
        Body.setAngle(body, 0);
        Body.setAngularVelocity(body, 0);
      }
    });
  };

  // Pre-calculate spring offset for Framer Motion zoom coordinates
  const zoomOffsetX = clickCoords.x - width / 2;
  const zoomOffsetY = clickCoords.y - height / 2;

  return (
    <div className="relative flex flex-col items-center justify-center p-2 select-none w-full">
      {/* Interface layouts wrapper */}
      <div className="flex flex-col lg:flex-row gap-8 items-center justify-center w-full max-w-5xl z-10">
        
        {/* Left Side: Brand introduction panel and sandbox inputs */}
        <div className="flex flex-col text-left space-y-6 max-w-md w-full px-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Project Manager & Analyst OS</span>
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Syam Suresh
            </h1>
            <h2 className="text-lg font-medium text-indigo-400">
              Technical Project Manager & Creator
            </h2>
          </div>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Welcome to my physical sandbox portfolio. Tap <span className="text-indigo-400 font-semibold">Calendar</span>, <span className="text-indigo-400 font-semibold">Files</span>, <span className="text-indigo-400 font-semibold">Photos</span>, or <span className="text-indigo-400 font-semibold">Settings</span> inside the simulator to zoom open detailed iOS-style layout pages containing credentials and achievements.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-md">
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 border-b border-white/10 pb-2">
              Simulator Controls
            </h3>

            {/* Gravity Controller Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Gravity Strength</span>
                <span className="text-indigo-400">
                  {gravity === 0 ? '0.0 (Anti-Gravity / Float)' : `${gravity.toFixed(2)} m/s²`}
                </span>
              </div>
              <input
                type="range"
                min="-1.5"
                max="1.5"
                step="0.05"
                value={gravity}
                onChange={(e) => setGravity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>-1.5 (UPWARD)</span>
                <span>0.0 (FLOAT)</span>
                <span>1.5 (DOWNWARD)</span>
              </div>
            </div>

            {/* Bounciness / Restitution Controller Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Bounciness (Restitution)</span>
                <span className="text-indigo-400">{(bounciness * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={bounciness}
                onChange={(e) => setBounciness(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>0.1 (DAMPED)</span>
                <span>1.0 (HYPER BOUNCY)</span>
              </div>
            </div>

            {/* Actions button group */}
            <div className="pt-2 flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-xs font-bold text-white flex items-center justify-center gap-2 clickable"
              >
                <RotateCcw className="w-4 h-4" /> Reset Layout
              </button>
              <button
                onClick={() => setIsThemeDark(!isThemeDark)}
                className="py-3 px-4 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-xs font-bold text-white flex items-center justify-center clickable"
                aria-label="Toggle simulator background wallpaper theme"
              >
                {isThemeDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              </button>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Tip: Try grabbing, tossing, and throwing the icons!</span>
          </div>
        </div>

        {/* Right Side: iPhone simulator device housing */}
        <div ref={sceneRef} className="relative flex items-center justify-center p-4">
          
          {/* Outer case wrapper */}
          <div 
            style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
            className={`relative w-[384px] h-[744px] rounded-[52px] bg-slate-950 border-[10px] border-slate-800/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden transition-all duration-300 ${
              isThemeDark ? 'bg-slate-950' : 'bg-slate-100'
            }`}
          >
            {/* Immersive Lock Screen Entryway */}
            <AnimatePresence>
              {isLocked && (
                <motion.div
                  key="lockscreen"
                  initial={{ opacity: 1, y: 0 }}
                  exit={{ 
                    opacity: 0, 
                    y: -720, 
                    transition: { type: 'spring', stiffness: 240, damping: 28 } 
                  }}
                  className="absolute inset-0 z-50 pointer-events-auto"
                >
                  <LockScreen onUnlock={() => setIsLocked(false)} isThemeDark={isThemeDark} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dynamic notch island */}
            <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-center border border-white/5 pointer-events-none">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-950 ml-auto mr-4" />
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-950 mr-4" />
            </div>

            {/* Apple wallpaper mesh gradient background */}
            <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${
              isThemeDark 
                ? 'bg-gradient-to-b from-[#0a0f1d] via-[#020509] to-[#04060b] opacity-100'
                : 'bg-gradient-to-b from-[#f0f4ff] via-[#e5e9ff] to-[#fbfbfe] opacity-100'
            }`} />

            {/* Reflection glaze effect */}
            <div className="absolute inset-0 phone-reflection z-30 pointer-events-none rounded-[42px]" />

            {/* Absolute positioning rendering layers */}
            <div className="absolute inset-0 z-20 pointer-events-none p-4">
              {items.map((item) => {
                const style: React.CSSProperties = {
                  width: item.width,
                  height: item.height,
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  transformOrigin: 'center center',
                  willChange: 'transform'
                };

                return (
                  <div
                    key={item.id}
                    id={`body-${item.id}`}
                    style={style}
                    className={`rounded-3xl p-4 flex flex-col justify-between overflow-hidden shadow-lg select-none ${item.colorClass}`}
                  >
                    {/* 1. Profile widget layout */}
                    {item.type === 'widget-profile' && (
                      <div className="flex flex-col justify-between h-full text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/35 flex items-center justify-center font-bold text-indigo-400 text-sm shrink-0">
                            SS
                          </div>
                          <div>
                            <h3 className="font-extrabold text-xs text-white tracking-tight">{item.title}</h3>
                            <p className="text-[9px] text-indigo-300 font-medium leading-tight">{item.subtitle}</p>
                          </div>
                        </div>
                        <div className="text-[8px] text-slate-400 leading-snug border-t border-white/5 pt-2 mt-2 font-mono">
                          BTech CS | APJ Abdul Kalam Tech Univ
                        </div>
                      </div>
                    )}

                    {/* 2. Custom app icon layouts */}
                    {item.type === 'icon' && (
                      <div className="flex flex-col items-center justify-center h-full w-full">
                        {/* Custom app icons */}
                        {item.id === 'app-calendar' && (
                          <div className="w-11 h-11 bg-white rounded-xl flex flex-col items-center justify-center text-rose-500 shadow border border-slate-100 shrink-0">
                            <span className="text-[8px] font-bold uppercase">Jul</span>
                            <span className="text-xl font-extrabold leading-none text-slate-800">03</span>
                          </div>
                        )}
                        {item.id === 'app-files' && <Folder className="w-8 h-8 text-blue-400" />}
                        {item.id === 'app-photos' && <Camera className="w-8 h-8 text-purple-400" />}
                        {item.id === 'app-settings' && <RotateCcw className="w-8 h-8 text-slate-400 animate-spin-slow" />}
                        
                        <span className="text-[8px] font-bold text-slate-400 mt-1.5">{item.title}</span>
                      </div>
                    )}

                    {/* 3. Media visual placeholder frames */}
                    {item.type === 'placeholder' && (
                      <div className="flex flex-col justify-between h-full text-left">
                        <Camera className="w-4 h-4 text-slate-400/80" />
                        <div>
                          <h5 className="font-bold text-[9px] text-slate-300 leading-tight">{item.title}</h5>
                          <p className="text-[7px] text-slate-500 leading-tight">{item.subtitle}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Persistent Bottom Dock System */}
            <div className="absolute bottom-5 left-4 right-4 h-20 rounded-[28px] bg-white/10 border border-white/10 backdrop-blur-md px-6 flex items-center justify-around z-35 pointer-events-auto">
              <a 
                href="https://github.com/itsmesyaam" 
                target="_blank" 
                rel="noreferrer"
                className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-white hover:scale-105 duration-200 transition-all clickable shadow"
                aria-label="GitHub Profile"
              >
                <Github className="w-6 h-6" />
              </a>

              <a 
                href="https://www.linkedin.com/in/syamsuresh/" 
                target="_blank" 
                rel="noreferrer"
                className="w-12 h-12 bg-blue-900 border border-blue-800 rounded-2xl flex items-center justify-center text-white hover:scale-105 duration-200 transition-all clickable shadow"
                aria-label="LinkedIn Profile"
              >
                <Linkedin className="w-6 h-6" />
              </a>

              <a 
                href="https://www.behance.net/syams11" 
                target="_blank" 
                rel="noreferrer"
                className="w-12 h-12 bg-indigo-950 border border-indigo-900 rounded-2xl flex items-center justify-center text-white hover:scale-105 duration-200 transition-all clickable shadow"
                aria-label="Behance Profile"
              >
                <Behance className="w-6 h-6" />
              </a>

              <a 
                href="https://www.instagram.com/stories.syam/" 
                target="_blank" 
                rel="noreferrer"
                className="w-12 h-12 bg-gradient-to-tr from-yellow-600 via-pink-600 to-purple-600 rounded-2xl flex items-center justify-center text-white hover:scale-105 duration-200 transition-all clickable shadow"
                aria-label="Instagram Profile"
              >
                <Instagram className="w-6 h-6" />
              </a>

              <a 
                href="https://in.pinterest.com/framesbysyam/" 
                target="_blank" 
                rel="noreferrer"
                className="w-12 h-12 bg-rose-750 border border-rose-700 rounded-2xl flex items-center justify-center text-white hover:scale-105 duration-200 transition-all clickable shadow"
                aria-label="Pinterest Profile"
              >
                <Pinterest className="w-6 h-6" />
              </a>
            </div>

            {/* Matter.js interaction canvas */}
            <canvas 
              ref={canvasRef}
              width={width}
              height={height}
              className="absolute inset-0 z-30 sandbox-canvas cursor-default"
            />

            {/* Immersive iOS Modal App Pages */}
            <AnimatePresence>
              {activeSheet && (
                <motion.div 
                  initial={{ scale: 0.15, opacity: 0, x: zoomOffsetX, y: zoomOffsetY }}
                  animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
                  exit={{ scale: 0.15, opacity: 0, x: zoomOffsetX, y: zoomOffsetY }}
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-2xl flex flex-col pointer-events-auto p-5 pt-12"
                >
                  {/* Status Bar spacing / Drag Bar handle */}
                  <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 shrink-0" />
                  
                  {/* Panel Header */}
                  <div className="flex justify-between items-center mb-4 shrink-0">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      {activeSheet === 'calendar' && <Calendar className="w-4.5 h-4.5 text-rose-500" />}
                      {activeSheet === 'files' && <Folder className="w-4.5 h-4.5 text-blue-500" />}
                      {activeSheet === 'photos' && <Camera className="w-4.5 h-4.5 text-purple-500" />}
                      {activeSheet === 'settings' && <RotateCcw className="w-4.5 h-4.5 text-slate-400" />}
                      {activeSheet === 'calendar' && 'Calendar'}
                      {activeSheet === 'files' && 'Files Explorer'}
                      {activeSheet === 'photos' && 'Photos Library'}
                      {activeSheet === 'settings' && 'Settings'}
                    </h3>
                    <button 
                      onClick={closeSheet} 
                      className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors clickable"
                      aria-label="Close app page"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  {/* Scrollable details wrapper */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-left pb-6">
                    
                    {/* CALENDAR.APP TIMELINE VIEW */}
                    {activeSheet === 'calendar' && (
                      <div className="space-y-6">
                        
                        {/* Native iOS Calendar widget design */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-center">
                          <div className="text-center bg-rose-500 text-white rounded-xl p-2 w-14 shrink-0 shadow">
                            <span className="block text-[8px] font-bold uppercase leading-none">JUL</span>
                            <span className="block text-2xl font-extrabold leading-none mt-0.5">03</span>
                            <span className="block text-[8px] font-semibold mt-0.5">FRI</span>
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xs text-white">No events today</h4>
                            <p className="text-[10px] text-slate-400">Syam Suresh's milestone calendar</p>
                          </div>
                        </div>

                        <div className="relative border-l border-white/10 pl-5 ml-2 space-y-6">
                          
                          {/* BELL & RING */}
                          <div className="relative">
                            <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-rose-500 border border-slate-950" />
                            <h4 className="font-bold text-sm text-white">BELL & RING TECH</h4>
                            <p className="text-[11px] text-rose-400 font-semibold">Project Manager</p>
                            <p className="text-[9px] text-slate-500 font-mono mt-0.5">Jul 2025 - Present</p>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                              Managing final content architectures and delivery schedules for web assets.
                            </p>
                          </div>

                          {/* Simplilearn 2026 */}
                          <div className="relative">
                            <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-amber-500 border border-slate-950" />
                            <h4 className="font-bold text-sm text-white">Advanced Mobile Marketing</h4>
                            <p className="text-[11px] text-amber-400 font-semibold">Simplilearn Credential <span className="text-[9px] text-slate-500 font-mono">(ID: 10294424)</span></p>
                            <p className="text-[9px] text-slate-500 font-mono mt-0.5">Jun 2026</p>
                          </div>

                          {/* SYNAPZY */}
                          <div className="relative">
                            <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border border-slate-950" />
                            <h4 className="font-bold text-sm text-white">SYNAPZY</h4>
                            <p className="text-[11px] text-blue-400 font-semibold">Project Manager • Kochi, India</p>
                            <p className="text-[9px] text-slate-500 font-mono mt-0.5">Dec 2024 - Dec 2025</p>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                              Led cross-functional teams in Kochi delivering customized digital strategy profiles.
                            </p>
                          </div>

                          {/* CBAP Designation */}
                          <div className="relative">
                            <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-amber-500 border border-slate-950" />
                            <h4 className="font-bold text-sm text-white">IT Business Analysis Designation</h4>
                            <p className="text-[11px] text-amber-400 font-semibold">Introduction to CBAP <span className="text-[9px] text-slate-500 font-mono">(ID: 6919713)</span></p>
                            <p className="text-[9px] text-slate-500 font-mono mt-0.5">Jul 2024</p>
                          </div>

                          {/* SBS TECHNOLOGIES */}
                          <div className="relative">
                            <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-teal-500 border border-slate-950" />
                            <h4 className="font-bold text-sm text-white">SBS TECHNOLOGIES</h4>
                            <p className="text-[11px] text-teal-400 font-semibold">Business Analyst • Bengaluru Operations</p>
                            <p className="text-[9px] text-slate-500 font-mono mt-0.5">Nov 2022 - Dec 2024</p>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                              Bridged developer tasks with business analysis roadmaps and user case studies.
                            </p>
                          </div>

                          {/* NIKOLAS TESLA */}
                          <div className="relative">
                            <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-purple-500 border border-slate-950" />
                            <h4 className="font-bold text-sm text-white">Nikolas Tesla Technologies</h4>
                            <p className="text-[11px] text-purple-400 font-semibold">Data Analyst • Kollam</p>
                            <p className="text-[9px] text-slate-500 font-mono mt-0.5">Jun 2022 - Nov 2022</p>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                              Managed system queries, analytics spreadsheets, and databases.
                            </p>
                          </div>

                          {/* KELTRON */}
                          <div className="relative">
                            <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-slate-500 border border-slate-950" />
                            <h4 className="font-bold text-sm text-white">Keltron KSG</h4>
                            <p className="text-[11px] text-slate-400 font-semibold">Web & UI/UX Design Residency</p>
                            <p className="text-[9px] text-slate-500 font-mono mt-0.5">Jul 2019</p>
                          </div>

                        </div>
                      </div>
                    )}

                    {/* FILES.APP PROJECTS HUB */}
                    {activeSheet === 'files' && (
                      <div className="space-y-4">
                        {/* iOS-style tab selector for projects */}
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
                          <button 
                            onClick={() => setFilesActivePage('bram')}
                            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all clickable ${
                              filesActivePage === 'bram' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'
                            }`}
                          >
                            B-Ram Nirman
                          </button>
                          <button 
                            onClick={() => setFilesActivePage('zaira')}
                            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all clickable ${
                              filesActivePage === 'zaira' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'
                            }`}
                          >
                            Zaira E-comm
                          </button>
                        </div>

                        {/* Page content display */}
                        {filesActivePage === 'bram' ? (
                          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2">
                              <Folder className="w-5 h-5 text-blue-400" />
                              <h4 className="font-extrabold text-sm text-white">B-Ram Nirman Pvt. Ltd.</h4>
                            </div>
                            <p className="text-[11px] text-indigo-400 font-semibold">Role: Technical Content Strategy & Web Operational Phase Management</p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Focused on structural design execution frameworks and enterprise engineering profiles. Authored clear layout architectures, responsive presentation platforms, and custom branding integrations.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2">
                              <Folder className="w-5 h-5 text-rose-400" />
                              <h4 className="font-extrabold text-sm text-white">Zaira Ecommerce</h4>
                            </div>
                            <p className="text-[11px] text-rose-400 font-semibold">Role: Brand Development Lead</p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Managed transition strategy from a clothing boutique brand into a scalable digital e-commerce identity ecosystem. Expanded system parameters to material assets (branding integration across construction profiles and structural glass treatment designs).
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* PHOTOS.APP GALLERY VIEW */}
                    {activeSheet === 'photos' && (
                      <div className="flex flex-col h-full space-y-4">
                        
                        {/* Tab contents */}
                        {photosActiveTab === 'library' && (
                          <div className="grid grid-cols-3 gap-2 flex-1">
                            {/* Streamed Google Drive Assets */}
                            <div className="aspect-square rounded-lg border border-white/5 relative overflow-hidden group shadow">
                              <img 
                                src="/IMG_4422.JPEG" 
                                alt="IMG_4422.JPEG" 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1">
                                <span className="block text-[6px] font-mono text-white truncate text-center">IMG_4422.JPEG</span>
                              </div>
                            </div>

                            <div className="aspect-square rounded-lg border border-white/5 relative overflow-hidden group shadow">
                              <img 
                                src="/untitled_design.jpg" 
                                alt="untitled_design.jpg" 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1">
                                <span className="block text-[6px] font-mono text-white truncate text-center">Design.JPG</span>
                              </div>
                            </div>

                            <div className="aspect-square rounded-lg border border-white/5 relative overflow-hidden group shadow">
                              <img 
                                src="/arch_perspective.jpg" 
                                alt="arch_perspective.jpg" 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1">
                                <span className="block text-[6px] font-mono text-white truncate text-center">Arch.JPG</span>
                              </div>
                            </div>

                            {/* Additional placeholders */}
                            <div className="aspect-square bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-600 text-[8px] font-bold">
                              Placeholder
                            </div>
                            <div className="aspect-square bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-600 text-[8px] font-bold">
                              Placeholder
                            </div>
                            <div className="aspect-square bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-600 text-[8px] font-bold">
                              Placeholder
                            </div>
                          </div>
                        )}

                        {photosActiveTab === 'foryou' && (
                          <div className="space-y-4">
                            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-left space-y-2">
                              <Sparkles className="w-5 h-5 text-indigo-400" />
                              <h4 className="font-extrabold text-xs text-white">Visual Creations Spotlight</h4>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                Curating frames by Syam Suresh. Check out structural design portfolios on Behance or aesthetic updates on Instagram.
                              </p>
                            </div>
                          </div>
                        )}

                        {photosActiveTab === 'albums' && (
                          <div className="space-y-3">
                            <a 
                              href="https://www.behance.net/syams11" 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors clickable text-left"
                            >
                              <div className="flex items-center gap-3">
                                <Folder className="w-4.5 h-4.5 text-indigo-400" />
                                <div>
                                  <h4 className="text-xs font-bold text-white">Behance Portfolio</h4>
                                  <p className="text-[9px] text-slate-500">syams11</p>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            </a>

                            <a 
                              href="https://in.pinterest.com/framesbysyam/" 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors clickable text-left"
                            >
                              <div className="flex items-center gap-3">
                                <Folder className="w-4.5 h-4.5 text-rose-500" />
                                <div>
                                  <h4 className="text-xs font-bold text-white">Pinterest Frames</h4>
                                  <p className="text-[9px] text-slate-500">framesbysyam</p>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            </a>
                          </div>
                        )}

                        {/* iOS Photos bottom tab bar */}
                        <div className="flex justify-around border-t border-white/10 pt-3 mt-auto shrink-0 bg-slate-900/90 py-1 rounded-xl">
                          <button 
                            onClick={() => setPhotosActiveTab('library')}
                            className={`flex flex-col items-center gap-1 text-[9px] font-bold clickable ${
                              photosActiveTab === 'library' ? 'text-indigo-400' : 'text-slate-500'
                            }`}
                          >
                            <ImageIcon className="w-4 h-4" /> Library
                          </button>
                          <button 
                            onClick={() => setPhotosActiveTab('foryou')}
                            className={`flex flex-col items-center gap-1 text-[9px] font-bold clickable ${
                              photosActiveTab === 'foryou' ? 'text-indigo-400' : 'text-slate-500'
                            }`}
                          >
                            <Sparkles className="w-4 h-4" /> For You
                          </button>
                          <button 
                            onClick={() => setPhotosActiveTab('albums')}
                            className={`flex flex-col items-center gap-1 text-[9px] font-bold clickable ${
                              photosActiveTab === 'albums' ? 'text-indigo-400' : 'text-slate-500'
                            }`}
                          >
                            <Folder className="w-4 h-4" /> Albums
                          </button>
                        </div>
                      </div>
                    )}

                    {/* SETTINGS.APP SYSTEM CONFIGS */}
                    {activeSheet === 'settings' && (
                      <div className="space-y-4">
                        
                        {/* Main settings options index */}
                        {settingsActivePage === 'main' && (
                          <div className="space-y-4">
                            {/* Profile Header panel */}
                            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3 text-left">
                              <img 
                                src="/IMG_4422.JPEG" 
                                alt="Syam Profile Avatar" 
                                className="w-12 h-12 rounded-full object-cover border border-white/20 shrink-0" 
                              />
                              <div>
                                <h4 className="font-extrabold text-sm text-white leading-snug">Syam Suresh</h4>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">BTech in Computer Science</p>
                                <p className="text-[9px] text-slate-500 font-medium">APJ Abdul Kalam Technological University</p>
                              </div>
                            </div>

                            {/* Skills Navigation list group */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
                              
                              <button 
                                onClick={() => setSettingsActivePage('analytics')}
                                className="w-full flex items-center justify-between p-3.5 hover:bg-white/5 transition-colors text-left clickable"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                    <Award className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs font-semibold text-white">Data & System Analytics</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-500" />
                              </button>

                              <button 
                                onClick={() => setSettingsActivePage('frameworks')}
                                className="w-full flex items-center justify-between p-3.5 hover:bg-white/5 transition-colors text-left clickable"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                    <Info className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs font-semibold text-white">Frameworks & Growths</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-500" />
                              </button>

                            </div>
                          </div>
                        )}

                        {/* Sub-view: Analytics */}
                        {settingsActivePage === 'analytics' && (
                          <div className="space-y-4">
                            <button 
                              onClick={() => setSettingsActivePage('main')}
                              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors shrink-0 mb-2 clickable"
                            >
                              <ArrowLeft className="w-4 h-4" /> Back to Settings
                            </button>

                            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5 text-left">
                              <div className="p-3.5 space-y-1">
                                <h4 className="text-xs font-bold text-white">Power BI</h4>
                                <p className="text-[10px] text-slate-400">Interactive dashboard layouts and data visualization modelling.</p>
                              </div>
                              <div className="p-3.5 space-y-1">
                                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                                  Tableau Software <span className="text-[9px] font-mono text-amber-500 font-bold uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">EXPERT</span>
                                </h4>
                                <p className="text-[10px] text-slate-400">Expert ecosystem credentials (Credential ID: 3359-40515012).</p>
                              </div>
                              <div className="p-3.5 space-y-1">
                                <h4 className="text-xs font-bold text-white">SQL Databases</h4>
                                <p className="text-[10px] text-slate-400">Database querying, relational structuring, schemas, and analytics checks.</p>
                              </div>
                              <div className="p-3.5 space-y-1">
                                <h4 className="text-xs font-bold text-white">Advanced Spreadsheets</h4>
                                <p className="text-[10px] text-slate-400">System management matrices across Google Sheets and Microsoft Excel.</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Sub-view: Frameworks */}
                        {settingsActivePage === 'frameworks' && (
                          <div className="space-y-4">
                            <button 
                              onClick={() => setSettingsActivePage('main')}
                              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors shrink-0 mb-2 clickable"
                            >
                              <ArrowLeft className="w-4 h-4" /> Back to Settings
                            </button>

                            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5 text-left">
                              <div className="p-3.5 space-y-1">
                                <h4 className="text-xs font-bold text-white">Network & Mobile Security</h4>
                                <p className="text-[10px] text-slate-400">Platform security architectures, data transmission sweeps, and network analysis.</p>
                              </div>
                              <div className="p-3.5 space-y-1">
                                <h4 className="text-xs font-bold text-white">Front-End Infrastructure</h4>
                                <p className="text-[10px] text-slate-400">Structuring modular, responsive presentations using modern HTML/CSS/Tailwind.</p>
                              </div>
                              <div className="p-3.5 space-y-1">
                                <h4 className="text-xs font-bold text-white">Customer Acquisition</h4>
                                <p className="text-[10px] text-slate-400">Digital marketing funnel structures, audience segmenting, and performance metrics tracking.</p>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>

      </div>
    </div>
  );
}
