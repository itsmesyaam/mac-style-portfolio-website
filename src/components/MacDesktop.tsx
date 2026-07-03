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
  Award, FileText, Cpu, Layers, 
  Image as ImageIcon, Folder,
  Volume2, Wifi, Battery, Sliders,
  Database, Terminal
} from 'lucide-react';

interface DesktopIcon {
  id: string;
  type: 'experience' | 'projects' | 'settings' | 'photos' | 'social' | 'power_bi' | 'sql' | 'ui_ux' | 'figma' | 'tableau' | 'excel' | 'frameworks';
  title: string;
  url?: string;
  iconType: 'document' | 'folder' | 'settings' | 'photos' | 'linkedin' | 'github' | 'behance' | 'instagram' | 'pinterest' | 'app';
  initX: number;
  initY: number;
  width: number;
  height: number;
}

interface MacWindow {
  id: 'experience' | 'projects' | 'settings' | 'photos' | 'power_bi' | 'sql' | 'ui_ux' | 'figma' | 'tableau' | 'excel' | 'frameworks';
  title: string;
  width: number;
  height: number;
  minimized?: boolean;
}

interface MediaItem {
  id: string;
  source: 'drive' | 'behance' | 'instagram' | 'pinterest' | 'social';
  title: string;
  category: string;
  imgUrl: string;
  link: string;
  description: string;
}

const mediaItems: MediaItem[] = [
  { 
    id: 'drive-1', 
    source: 'drive', 
    title: 'Primary Profile Portrait', 
    category: 'Google Drive', 
    imgUrl: '/IMG_4422.JPEG', 
    link: 'https://drive.google.com/drive/folders/1WIZz2soHvTTqPlFj3c2sF3aqZr0XAjvg?usp=drive_link',
    description: 'Main professional avatar shot from the shared Google Drive folder.'
  },
  { 
    id: 'drive-2', 
    source: 'behance', 
    title: 'Creative Workframe Shoot', 
    category: 'Behance Project', 
    imgUrl: '/IMG_4423.JPEG', 
    link: 'https://www.behance.net/syams11',
    description: 'Creative project shoot from the shared Google Drive assets.'
  },
  { 
    id: 'drive-3', 
    source: 'instagram', 
    title: 'Digital Sprints Layout', 
    category: 'Instagram Story', 
    imgUrl: '/IMG_4424.PNG', 
    link: 'https://www.instagram.com/stories.syam/',
    description: 'Workframe illustration mapping agile sprint goals.'
  },
  { 
    id: 'drive-4', 
    source: 'pinterest', 
    title: 'Geometric Design Pin', 
    category: 'Pinterest Board', 
    imgUrl: '/IMG_4425.JPEG', 
    link: 'https://in.pinterest.com/framesbysyam/',
    description: 'Structural and interface design system details.'
  }
];

export default function MacDesktop() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const runnerRef = useRef<Runner | null>(null);
  const bodiesRef = useRef<{ [key: string]: Body }>({});
  const iconClickRef = useRef<{ [key: string]: { x: number; y: number; time: number } }>({});
  
  // System control configs
  const [gravity, setGravity] = useState<number>(0); // Zero gravity default so icons/windows drift
  const [bounciness, setBounciness] = useState<number>(0.6); // Medium bounciness
  const [isThemeDark, setIsThemeDark] = useState<boolean>(true);
  const [controlCenterOpen, setControlCenterOpen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Dock magnification hover state
  const [hoveredDockIdx, setHoveredDockIdx] = useState<number | null>(null);

  // Active windows states
  const [openWindows, setOpenWindows] = useState<MacWindow[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);

  // Layout page states inside windows
  const [projectsActiveTab, setProjectsActiveTab] = useState<'bram' | 'zaira'>('bram');
  const [photosActiveTab, setPhotosActiveTab] = useState<'all' | 'drive' | 'behance' | 'instagram' | 'pinterest' | 'social'>('all');
  const [settingsActiveTab, setSettingsActiveTab] = useState<'profile' | 'analytics' | 'frameworks'>('profile');
  const [frameworksActiveTab, setFrameworksActiveTab] = useState<'management' | 'marketing' | 'infrastructure'>('management');

  // Handle Menu bar clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      setCurrentTime(now.toLocaleDateString('en-US', options));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Window size tracking
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dense grid of floating desktop icons
  const icons: DesktopIcon[] = [
    // Column 1 (Leftmost edge)
    { id: 'experience', type: 'experience', title: 'Experience.doc', iconType: 'document', initX: 100, initY: 100, width: 70, height: 70 },
    { id: 'projects', type: 'projects', title: 'Projects', iconType: 'folder', initX: 100, initY: 200, width: 70, height: 70 },
    { id: 'settings', type: 'settings', title: 'Settings', iconType: 'settings', initX: 100, initY: 300, width: 70, height: 70 },
    { id: 'photos', type: 'photos', title: 'Photos.app', iconType: 'photos', initX: 100, initY: 400, width: 70, height: 70 },
    { id: 'frameworks', type: 'frameworks', title: 'System Frameworks', iconType: 'folder', initX: 100, initY: 500, width: 70, height: 70 },

    // Column 2 (Specialized Technical Tools & Skill Apps)
    { id: 'power_bi', type: 'power_bi', title: 'Power BI.app', iconType: 'app', initX: 210, initY: 100, width: 70, height: 70 },
    { id: 'sql', type: 'sql', title: 'SQL.app', iconType: 'app', initX: 210, initY: 200, width: 70, height: 70 },
    { id: 'ui_ux', type: 'ui_ux', title: 'UI/UX.app', iconType: 'app', initX: 210, initY: 300, width: 70, height: 70 },
    { id: 'figma', type: 'figma', title: 'Figma.app', iconType: 'app', initX: 210, initY: 400, width: 70, height: 70 },
    { id: 'tableau', type: 'tableau', title: 'Tableau.app', iconType: 'app', initX: 210, initY: 500, width: 70, height: 70 },
    { id: 'excel', type: 'excel', title: 'Excel.app', iconType: 'app', initX: 210, initY: 600, width: 70, height: 70 },
    
    // Floating Social Nodes (Right side cluster)
    { id: 'social-linkedin', type: 'social', title: 'LinkedIn', url: 'https://www.linkedin.com/in/syamsuresh/', iconType: 'linkedin', initX: window.innerWidth - 100, initY: 120, width: 60, height: 60 },
    { id: 'social-github', type: 'social', title: 'GitHub', url: 'https://github.com/itsmesyaam', iconType: 'github', initX: window.innerWidth - 100, initY: 220, width: 60, height: 60 },
    { id: 'social-behance', type: 'social', title: 'Behance', url: 'https://www.behance.net/syams11', iconType: 'behance', initX: window.innerWidth - 100, initY: 320, width: 60, height: 60 },
    { id: 'social-instagram', type: 'social', title: 'Instagram', url: 'https://www.instagram.com/stories.syam/', iconType: 'instagram', initX: window.innerWidth - 100, initY: 420, width: 60, height: 60 },
    { id: 'social-pinterest', type: 'social', title: 'Pinterest', url: 'https://in.pinterest.com/framesbysyam/', iconType: 'pinterest', initX: window.innerWidth - 100, initY: 520, width: 60, height: 60 },
  ];

  // Initialize physics loop
  useEffect(() => {
    if (!canvasRef.current) return;

    const wWidth = window.innerWidth;
    const wHeight = window.innerHeight;

    // 1. Create Engine
    const engine = Engine.create({
      gravity: { x: 0, y: gravity, scale: 0.001 }
    });
    engineRef.current = engine;
    const world = engine.world;

    // 2. Boundaries (Bounces off top Menu bar: y=40, and bottom Dock: y=wHeight-90)
    const wallOptions = { isStatic: true, restitution: bounciness, friction: 0.1 };
    const walls = [
      Bodies.rectangle(wWidth / 2, 20, wWidth + 400, 40, wallOptions), // Top wall
      Bodies.rectangle(wWidth / 2, wHeight - 35, wWidth + 400, 90, wallOptions), // Bottom wall (Dock cover)
      Bodies.rectangle(-20, wHeight / 2, 40, wHeight + 400, wallOptions), // Left wall
      Bodies.rectangle(wWidth + 20, wHeight / 2, 40, wHeight + 400, wallOptions) // Right wall
    ];
    Composite.add(world, walls);

    // 3. Add desktop icons as physical bodies (Check if already open to maintain static/freeze states)
    const tempBodies: { [key: string]: Body } = {};
    icons.forEach((icon) => {
      // Keep boundaries relative
      const x = Math.min(icon.initX, wWidth - 80);
      const y = Math.min(icon.initY, wHeight - 120);

      const isAppOpen = openWindows.some(w => w.id === icon.type);

      const body = Bodies.rectangle(x, y, icon.width, icon.height, {
        restitution: bounciness,
        frictionAir: 0.015,
        friction: 0.1,
        isStatic: isAppOpen, // Freeze icon body in place if its corresponding window/page is active
        chamfer: { radius: icon.type === 'social' ? 12 : 16 },
        label: `icon-${icon.id}`
      });
      tempBodies[icon.id] = body;
      Composite.add(world, body);
    });
    bodiesRef.current = tempBodies;

    // 4. Mouse Constraint for flling and grabbing
    const mouse = Mouse.create(canvasRef.current);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.15,
        render: { visible: false }
      }
    });
    Composite.add(world, mouseConstraint);

    // Sync coordinate positions of physics bodies with CSS elements
    let animationId: number;
    const syncDOM = () => {
      // Sync Icons
      icons.forEach((icon) => {
        const body = tempBodies[icon.id];
        const el = document.getElementById(`icon-${icon.id}`);
        if (body && el) {
          el.style.transform = `translate3d(${body.position.x - icon.width / 2}px, ${body.position.y - icon.height / 2}px, 0) rotate(${body.angle}rad)`;
        }
      });

      // Sync Windows
      openWindows.forEach((win) => {
        const body = bodiesRef.current[`window-${win.id}`];
        const el = document.getElementById(`window-${win.id}`);
        if (body && el) {
          el.style.transform = `translate3d(${body.position.x - win.width / 2}px, ${body.position.y - win.height / 2}px, 0) rotate(${body.angle}rad)`;
        }
      });

      animationId = requestAnimationFrame(syncDOM);
    };
    syncDOM();

    // Restrict dragging to only the title bar for windows
    Events.on(mouseConstraint, 'startdrag', (event: any) => {
      const clickedBody = event.body;
      if (clickedBody && clickedBody.label.startsWith('window-')) {
        const winId = clickedBody.label.replace('window-', '');
        const win = openWindows.find(w => w.id === winId);
        if (win) {
          setActiveWindowId(win.id);
          
          // Get mouse click relative to body center
          const clickX = event.mouse.position.x - clickedBody.position.x;
          const clickY = event.mouse.position.y - clickedBody.position.y;
          
          // Rotate clicked coords back to align with unrotated box
          const angle = -clickedBody.angle;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const localY = clickX * sin + clickY * cos;
          
          // Verify if click is within top 38px (title bar)
          const halfHeight = win.height / 2;
          const titleBarHeight = 38;
          const isTitleBarClick = localY >= -halfHeight && localY <= -halfHeight + titleBarHeight;
          
          if (!isTitleBarClick) {
            // Cancel mouse pull
            const mc = mouseConstraint as any;
            mc.body = null;
            if (mc.constraint) {
              mc.constraint.bodyB = null;
            }
          }
        }
      } else if (clickedBody && clickedBody.label.startsWith('icon-')) {
        const iconId = clickedBody.label.replace('icon-', '');
        setActiveWindowId(iconId);
      }
    });

    // Detect click vs drag on bodies
    let clickStartX = 0;
    let clickStartY = 0;
    let clickStartTime = 0;

    const handleMouseDown = (e: MouseEvent) => {
      clickStartX = e.clientX;
      clickStartY = e.clientY;
      clickStartTime = Date.now();
    };

    const handleMouseUp = (e: MouseEvent) => {
      const clickDist = Math.hypot(e.clientX - clickStartX, e.clientY - clickStartY);
      const clickDuration = Date.now() - clickStartTime;

      if (clickDist < 5 && clickDuration < 300) {
        // Look for intersecting bodies
        const activeBodies = Composite.allBodies(world).filter(b => !b.isStatic);
        const clicked = Query.point(activeBodies, mouse.position);
        if (clicked.length > 0) {
          const clickedBody = clicked[0];
          if (clickedBody.label.startsWith('icon-')) {
            const iconId = clickedBody.label.replace('icon-', '');
            const icon = icons.find(i => i.id === iconId);
            if (icon) {
              if (icon.type === 'social') {
                window.open(icon.url, '_blank');
              } else {
                openAppWindow(icon.type);
              }
            }
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
  }, [openWindows, gravity]);

  // Adjust bounciness/restitution in real-time
  useEffect(() => {
    if (engineRef.current) {
      const world = engineRef.current.world;
      const allBodies = Composite.allBodies(world);
      allBodies.forEach((body) => {
        if (!body.isStatic) {
          body.restitution = bounciness;
        }
      });
    }
  }, [bounciness]);

  // Add/remove boundary walls and scale positions on resize
  useEffect(() => {
    if (engineRef.current) {
      const world = engineRef.current.world;
      const allBodies = Composite.allBodies(world);
      
      const wWidth = window.innerWidth;
      const wHeight = window.innerHeight;
      
      allBodies.forEach((body) => {
        if (body.isStatic) {
          if (body.position.y < 50) { // Top wall
            Body.setPosition(body, { x: wWidth / 2, y: 20 });
          } else if (body.position.y > wHeight - 100) { // Bottom wall
            Body.setPosition(body, { x: wWidth / 2, y: wHeight - 35 });
          } else if (body.position.x < 50) { // Left wall
            Body.setPosition(body, { x: -20, y: wHeight / 2 });
          } else { // Right wall
            Body.setPosition(body, { x: wWidth + 20, y: wHeight / 2 });
          }
        }
      });
    }
  }, [dimensions]);

  // Open window function
  const openAppWindow = (
    id: 'experience' | 'projects' | 'settings' | 'photos' | 'power_bi' | 'sql' | 'ui_ux' | 'figma' | 'tableau' | 'excel' | 'frameworks',
    clickedIconId?: string
  ) => {
    const iconIdToFreeze = clickedIconId || id;

    // Freeze icon's physics body in place
    const iconBody = bodiesRef.current[iconIdToFreeze];
    if (iconBody) {
      Body.setStatic(iconBody, true);
    }

    // If window is already open, force-bring to front and apply small velocity kick
    if (openWindows.some(w => w.id === id)) {
      setActiveWindowId(id);
      const winBody = bodiesRef.current[`window-${id}`];
      if (winBody) {
        Body.setVelocity(winBody, { x: (Math.random() - 0.5) * 5, y: -3 });
      }
      return;
    }

    let title = '';
    let w = 560;
    let h = 420;

    switch (id) {
      case 'experience':
        title = 'Experience.txt - TextEdit';
        w = 560;
        h = 440;
        break;
      case 'projects':
        title = 'Projects Finder';
        w = 620;
        h = 420;
        break;
      case 'settings':
        title = 'System Settings';
        w = 640;
        h = 460;
        break;
      case 'photos':
        title = 'Photos';
        w = 680;
        h = 460;
        break;
      case 'power_bi':
        title = 'Power BI.app';
        w = 520;
        h = 380;
        break;
      case 'sql':
        title = 'SQL.app - bash - 80x24';
        w = 550;
        h = 400;
        break;
      case 'ui_ux':
        title = 'UI/UX.app';
        w = 560;
        h = 400;
        break;
      case 'figma':
        title = 'Figma.app';
        w = 600;
        h = 440;
        break;
      case 'tableau':
        title = 'Tableau.app';
        w = 540;
        h = 390;
        break;
      case 'excel':
        title = 'Excel.app';
        w = 580;
        h = 400;
        break;
      case 'frameworks':
        title = 'System Frameworks';
        w = 600;
        h = 420;
        break;
    }

    const newWindow: MacWindow = { id, title, width: w, height: h };
    
    // Add window state
    setOpenWindows(prev => [...prev, newWindow]);
    setActiveWindowId(id);

    // Create Matter.js physics body for the window
    const wWidth = window.innerWidth;
    const wHeight = window.innerHeight;
    const winBody = Bodies.rectangle(wWidth / 2 + (Math.random() - 0.5) * 100, wHeight / 2 + (Math.random() - 0.5) * 60, w, h, {
      restitution: bounciness,
      frictionAir: 0.04, // heavy air friction so it slows down nicely
      friction: 0.1,
      chamfer: { radius: 14 },
      label: `window-${id}`
    });

    // Set custom high inertia so it rotates slowly and feels solid
    Body.setInertia(winBody, winBody.inertia * 6);
    bodiesRef.current[`window-${id}`] = winBody;

    // Add to engine world
    if (engineRef.current) {
      Composite.add(engineRef.current.world, winBody);
    }
  };

  // Close window function
  const closeAppWindow = (id: string) => {
    setOpenWindows(prev => prev.filter(w => w.id !== id));
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }

    // Remove physics body
    const body = bodiesRef.current[`window-${id}`];
    if (body && engineRef.current) {
      Composite.remove(engineRef.current.world, body);
      delete bodiesRef.current[`window-${id}`];
    }

    // Unfreeze all associated icon bodies and release them back to drift
    const iconBody = bodiesRef.current[id];
    if (iconBody) {
      Body.setStatic(iconBody, false);
      Body.setVelocity(iconBody, { x: (Math.random() - 0.5) * 1.5, y: (Math.random() - 0.5) * 1.5 });
    }
  };

  // Reset desktop layouts
  const handleResetDesktop = () => {
    // Close all open windows
    openWindows.forEach(win => {
      closeAppWindow(win.id);
    });

    // Reset icons coordinates
    icons.forEach(icon => {
      const body = bodiesRef.current[icon.id];
      if (body) {
        Body.setStatic(body, false);
        Body.setPosition(body, { x: icon.initX, y: icon.initY });
        Body.setVelocity(body, { x: 0, y: 0 });
        Body.setAngle(body, 0);
        Body.setAngularVelocity(body, 0);
      }
    });

    setGravity(0);
    setBounciness(0.6);
  };

  // Dock items list
  const dockItems = [
    { id: 'experience', label: 'Experience', colorClass: 'from-blue-500 to-indigo-600', icon: <FileText className="w-7 h-7 text-white" /> },
    { id: 'projects', label: 'Projects', colorClass: 'from-amber-400 to-orange-500', icon: <Folder className="w-7 h-7 text-white" /> },
    { id: 'settings', label: 'System Settings', colorClass: 'from-slate-500 to-slate-700', icon: <Sliders className="w-7 h-7 text-white" /> },
    { id: 'photos', label: 'Photos', colorClass: 'from-pink-500 via-red-500 to-yellow-400', icon: <ImageIcon className="w-7 h-7 text-white" /> },
  ];

  // Helper to calculate magnification scale factor
  const getDockItemScale = (index: number) => {
    if (hoveredDockIdx === null) return 1.0;
    const distance = Math.abs(index - hoveredDockIdx);
    if (distance === 0) return 1.45;
    if (distance === 1) return 1.25;
    if (distance === 2) return 1.1;
    return 1.0;
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-screen h-screen overflow-hidden select-none font-sans transition-all duration-700 ${
        isThemeDark 
          ? 'bg-slate-950 text-slate-100' 
          : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Desktop Wallpaper Canvas Cover (8K premium macOS abstract style) */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=3840&q=80" 
          alt="Desktop Wallpaper" 
          className={`w-full h-full object-cover transition-all duration-700 ${
            isThemeDark ? 'brightness-[0.45] contrast-[1.04] saturate-[0.85]' : 'brightness-[0.85] contrast-[0.95]'
          }`}
        />
        <div className={`absolute inset-0 transition-colors duration-700 ${
          isThemeDark ? 'bg-slate-950/20' : 'bg-white/10'
        }`} />
      </div>

      {/* Ambient background glow filters */}
      <div className="absolute top-24 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-40 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
      
      {/* 2D Physics Canvas */}
      <canvas 
        ref={canvasRef} 
        width={window.innerWidth} 
        height={window.innerHeight} 
        className="absolute inset-0 z-0 sandbox-canvas" 
      />

      {/* Persistent macOS Menu Bar */}
      <div className="absolute top-0 left-0 right-0 h-10 glass-nav z-50 flex items-center justify-between px-5 text-white/95 text-xs font-semibold shadow-sm select-none">
        <div className="flex items-center gap-4.5">
          <svg 
            onClick={handleResetDesktop}
            className="w-4 h-4 text-white hover:text-indigo-400 transition-colors cursor-pointer clickable"
            viewBox="0 0 170 170" 
            fill="currentColor"
          >
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.3-2.03-14.88-6.47-3.38-2.63-7.22-7.14-11.53-13.56-10.12-14.93-17.78-31.95-23-51.05-4.32-15.82-6.48-30.82-6.48-45.02 0-16.2 3.79-29.89 11.36-41.07 7.58-11.18 17.51-17.22 29.81-18.12 4.9-.38 10.42 1.06 16.58 4.3 6.16 3.24 10.96 4.31 14.42 3.19 3.69-1.22 8.44-2.8 14.24-4.73 5.8-1.93 11.13-2.68 15.99-2.28 17.52 1.42 31.06 8.52 40.63 21.32-15.82 9.59-23.49 22.37-23 38.33.51 12.16 5.17 22.34 13.99 30.54 8.81 8.2 19.34 12.82 31.57 13.88-2.23 6.64-5.32 13.54-9.27 20.73zM119.53 19c0-10.92 4.18-20.91 12.54-29.98C123.77-2.38 113.84-2.86 102.32 2c-5.59 2.38-10.53 5.92-14.81 10.6-4.58 5.01-7.85 10.87-9.82 17.58-2.62 9 0 17.9 3.38 26.69 11.33 1.34 21.26.13 29.74-8.87 5.76-6.13 8.72-13.13 8.72-20z"/>
          </svg>
          <span className="font-bold cursor-default">Syam Suresh</span>
          <span className="opacity-40 font-normal">|</span>
          <span onClick={() => openAppWindow('experience')} className="hover:text-indigo-400 cursor-pointer transition-colors clickable hidden sm:inline">Experience</span>
          <span onClick={() => openAppWindow('projects')} className="hover:text-indigo-400 cursor-pointer transition-colors clickable hidden sm:inline">Projects</span>
          <span onClick={() => openAppWindow('settings')} className="hover:text-indigo-400 cursor-pointer transition-colors clickable hidden sm:inline">Settings</span>
          <span onClick={() => openAppWindow('photos')} className="hover:text-indigo-400 cursor-pointer transition-colors clickable hidden sm:inline">Photos</span>
        </div>

        {/* Right Status utilities */}
        <div className="flex items-center gap-4">
          <Wifi className="w-3.5 h-3.5" />
          <Battery className="w-4 h-4 text-emerald-400" />
          <Volume2 className="w-3.5 h-3.5" />
          <div 
            onClick={() => setControlCenterOpen(!controlCenterOpen)}
            className={`p-1 rounded hover:bg-white/10 cursor-pointer transition-all flex items-center justify-center clickable ${
              controlCenterOpen ? 'bg-white/15' : ''
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <span className="cursor-default select-none tracking-tight">{currentTime}</span>
        </div>
      </div>

      {/* Control Center drop-down Panel */}
      <AnimatePresence>
        {controlCenterOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-12 right-5 w-80 bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 z-50 text-left shadow-2xl space-y-4 shadow-black"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Control Center</h3>
              <button 
                onClick={handleResetDesktop} 
                className="text-[10px] font-bold bg-white/10 hover:bg-indigo-600 transition-colors text-white py-1 px-2.5 rounded-full flex items-center gap-1.5 clickable"
              >
                Reset Canvas
              </button>
            </div>

            {/* Gravity Adjuster Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-white">
                <span>Gravity Strength</span>
                <span className="text-indigo-400">
                  {gravity === 0 ? '0.0 (Anti-Gravity)' : `${gravity.toFixed(2)}`}
                </span>
              </div>
              <input
                type="range"
                min="-0.8"
                max="0.8"
                step="0.05"
                value={gravity}
                onChange={(e) => setGravity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
              />
              <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                <span>-0.8 (UP)</span>
                <span>0.0 (FLOAT)</span>
                <span>0.8 (DOWN)</span>
              </div>
            </div>

            {/* Bounciness Adjuster Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-white">
                <span>Bounciness (Restitution)</span>
                <span className="text-indigo-400">{(bounciness * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={bounciness}
                onChange={(e) => setBounciness(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
              />
              <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                <span>0.1 (SOLID)</span>
                <span>1.0 (BOUNCY)</span>
              </div>
            </div>

            {/* Aesthetics Toggle */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs font-semibold text-slate-300">Desktop Theme</span>
              <button 
                onClick={() => setIsThemeDark(!isThemeDark)}
                className="py-1.5 px-3 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all text-xs font-bold text-white flex items-center gap-1.5 clickable"
              >
                {isThemeDark ? 'Dark Mode' : 'Light Mode'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Desktop Icons Grid */}
      {icons.map((icon) => {
        const isAppOpen = openWindows.some(w => w.id === icon.type);

        return (
          <div 
            key={icon.id}
            id={`icon-${icon.id}`}
            onMouseDown={(e) => {
              iconClickRef.current[icon.id] = { x: e.clientX, y: e.clientY, time: Date.now() };
            }}
            onMouseUp={(e) => {
              const start = iconClickRef.current[icon.id];
              if (start) {
                const clickDist = Math.hypot(e.clientX - start.x, e.clientY - start.y);
                const clickDuration = Date.now() - start.time;
                if (clickDist < 6 && clickDuration < 300) {
                  if (icon.type === 'social') {
                    window.open(icon.url, '_blank');
                  } else {
                    openAppWindow(icon.type);
                  }
                }
              }
            }}
            className={`absolute z-10 select-none flex flex-col items-center justify-center cursor-grab active:cursor-grabbing text-center desktop-icon-glow transition-opacity duration-300 ${
              isAppOpen ? 'opacity-40' : 'opacity-100'
            }`}
            style={{ width: icon.width, height: icon.height }}
          >
            {/* Document icon */}
            {icon.iconType === 'document' && (
              <div className="w-11 h-13 bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg flex flex-col justify-between p-1.5 shadow relative overflow-hidden">
                <div className="w-5 h-1.5 bg-indigo-500 rounded-sm mb-1" />
                <div className="space-y-1">
                  <div className="w-full h-0.5 bg-slate-300 dark:bg-slate-700" />
                  <div className="w-full h-0.5 bg-slate-300 dark:bg-slate-700" />
                  <div className="w-4/5 h-0.5 bg-slate-300 dark:bg-slate-700" />
                </div>
                <FileText className="w-3.5 h-3.5 text-indigo-400 absolute bottom-1 right-1" />
              </div>
            )}

            {/* Folder icon */}
            {icon.iconType === 'folder' && (
              <div className="w-13 h-11 bg-amber-400/90 dark:bg-amber-600/90 border border-amber-500/80 rounded-lg flex flex-col justify-end p-1.5 shadow relative">
                <div className="absolute top-[-3px] left-0 w-5 h-2 bg-amber-400/90 dark:bg-amber-600/90 rounded-sm border-t border-l border-amber-500/80" />
                <Folder className="w-4 h-4 text-amber-900 absolute top-2 left-2 opacity-65" />
              </div>
            )}

            {/* Settings App icon */}
            {icon.iconType === 'settings' && (
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow">
                <Sliders className="w-6 h-6 text-slate-300" />
              </div>
            )}

            {/* Photos App icon */}
            {icon.iconType === 'photos' && (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-yellow-400 border border-white/20 flex items-center justify-center shadow">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
            )}

            {/* App icons */}
            {icon.iconType === 'app' && (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-900 border border-indigo-500/20 flex items-center justify-center shadow relative overflow-hidden">
                {icon.id === 'power_bi' && <Award className="w-6 h-6 text-yellow-400" />}
                {icon.id === 'sql' && <Terminal className="w-6 h-6 text-emerald-400" />}
                {icon.id === 'ui_ux' && <Layers className="w-6 h-6 text-pink-400" />}
                {icon.id === 'figma' && <Cpu className="w-6 h-6 text-rose-400" />}
                {icon.id === 'tableau' && <Database className="w-6 h-6 text-blue-400" />}
                {icon.id === 'excel' && <FileText className="w-6 h-6 text-emerald-500" />}
              </div>
            )}

            {/* Social Icons mapping */}
            {icon.iconType === 'linkedin' && (
              <div className="w-11 h-11 bg-blue-600 border border-blue-500 rounded-xl flex items-center justify-center shadow">
                <Linkedin className="w-5.5 h-5.5 text-white" />
              </div>
            )}
            {icon.iconType === 'github' && (
              <div className="w-11 h-11 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center shadow">
                <Github className="w-5.5 h-5.5 text-white" />
              </div>
            )}
            {icon.iconType === 'behance' && (
              <div className="w-11 h-11 bg-blue-700 border border-blue-600 rounded-xl flex items-center justify-center shadow">
                <Behance className="w-5.5 h-5.5 text-white" />
              </div>
            )}
            {icon.iconType === 'instagram' && (
              <div className="w-11 h-11 bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 border border-pink-500/20 rounded-xl flex items-center justify-center shadow">
                <Instagram className="w-5.5 h-5.5 text-white" />
              </div>
            )}
            {icon.iconType === 'pinterest' && (
              <div className="w-11 h-11 bg-red-600 border border-red-500 rounded-xl flex items-center justify-center shadow">
                <Pinterest className="w-5.5 h-5.5 text-white" />
              </div>
            )}

            <span className="text-[10px] font-bold text-white select-none pointer-events-none mt-1 truncate max-w-[80px] drop-shadow-md">
              {icon.title}
            </span>
          </div>
        );
      })}

      {/* Render Active Windows */}
      {openWindows.map((win) => {
        const isActive = activeWindowId === win.id;
        
        return (
          <div 
            key={win.id}
            id={`window-${win.id}`}
            onClick={() => setActiveWindowId(win.id)}
            className={`absolute mac-window rounded-2xl z-20 overflow-hidden shadow-2xl ${
              isActive ? 'ring-2 ring-indigo-500/35 ring-offset-2 ring-offset-slate-900/50' : 'opacity-95'
            }`}
            style={{ width: win.width, height: win.height }}
          >
            {/* Window title bar */}
            <div className="mac-title-bar relative">
              <div className="flex items-center gap-2">
                <div onClick={() => closeAppWindow(win.id)} className="mac-btn mac-btn-close clickable" />
                <div className="mac-btn mac-btn-minimize pointer-events-none" />
                <div className="mac-btn mac-btn-zoom pointer-events-none" />
              </div>
              <span className="absolute left-1/2 -translate-x-1/2 text-slate-300 text-xs font-bold font-mono tracking-tight pointer-events-none">
                {win.title}
              </span>
            </div>

            {/* Window scrollable content */}
            <div className="flex-1 overflow-y-auto p-5 text-left bg-slate-900/70 text-slate-200 text-xs leading-normal select-text scrollbar-thin">
              
              {/* EXPERIENCE WINDOW */}
              {win.id === 'experience' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
                    <FileText className="w-6 h-6 text-indigo-400" />
                    <div>
                      <h2 className="font-extrabold text-base text-white">Experience.txt</h2>
                      <span className="text-[9px] text-slate-500">Last Modified: Jul 2026</span>
                    </div>
                  </div>

                  <div className="space-y-5 relative pl-4 border-l-2 border-slate-800">
                    <div className="relative space-y-1">
                      <div className="absolute top-1.5 left-[-21px] w-2.5 h-2.5 rounded-full bg-blue-500 border border-slate-900" />
                      <div className="flex justify-between items-center">
                        <h3 className="font-extrabold text-sm text-white">Project Manager</h3>
                        <span className="text-[10px] text-indigo-400 font-mono">Jul 2025 - Present</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">BELL & RING TECH</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Leading phase management operations, ERP application sweeps, integration models for structural engineering solutions, and coordinate developer sprints.
                      </p>
                    </div>

                    <div className="relative space-y-1">
                      <div className="absolute top-1.5 left-[-21px] w-2.5 h-2.5 rounded-full bg-indigo-500 border border-slate-900" />
                      <div className="flex justify-between items-center">
                        <h3 className="font-extrabold text-sm text-white">Project Manager</h3>
                        <span className="text-[10px] text-slate-400 font-mono">Dec 2024 - Dec 2025</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">SYNAPZY (Kochi, India)</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Steered client tech analysts alignment models, sprint planning, and backend integrations.
                      </p>
                    </div>

                    <div className="relative space-y-1">
                      <div className="absolute top-1.5 left-[-21px] w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-900" />
                      <div className="flex justify-between items-center">
                        <h3 className="font-extrabold text-sm text-white">Business Analyst</h3>
                        <span className="text-[10px] text-slate-400 font-mono">Nov 2022 - Dec 2024</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">SBS TECHNOLOGIES (Bengaluru, India)</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Organized client product specification lists, business process models, and system flows.
                      </p>
                    </div>

                    <div className="relative space-y-1">
                      <div className="absolute top-1.5 left-[-21px] w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-900" />
                      <div className="flex justify-between items-center">
                        <h3 className="font-extrabold text-sm text-white">Data Analyst</h3>
                        <span className="text-[10px] text-slate-400 font-mono">Jun 2022 - Nov 2022</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Nikolas Tesla Technologies (Kollam, India)</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Engineered custom reporting parameters, relational databases checks, and Power BI dashboards.
                      </p>
                    </div>

                    <div className="relative space-y-1">
                      <div className="absolute top-1.5 left-[-21px] w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-900" />
                      <div className="flex justify-between items-center">
                        <h3 className="font-extrabold text-sm text-white">Web & UI/UX Design Residency</h3>
                        <span className="text-[10px] text-slate-400 font-mono">Jul 2019</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Keltron KSG</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Practiced digital wireframing, frontend layouts, responsive setups, and client portals layout.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* PROJECTS HUB */}
              {win.id === 'projects' && (
                <div className="flex flex-col h-full space-y-4">
                  <div className="flex gap-2.5 border-b border-white/5 pb-3">
                    <button 
                      onClick={() => setProjectsActiveTab('bram')}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all clickable ${
                        projectsActiveTab === 'bram' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      B-Ram Nirman
                    </button>
                    <button 
                      onClick={() => setProjectsActiveTab('zaira')}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all clickable ${
                        projectsActiveTab === 'zaira' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Zaira E-comm
                    </button>
                  </div>

                  {projectsActiveTab === 'bram' ? (
                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4 flex-1">
                      <div className="flex items-center gap-2">
                        <Folder className="w-5 h-5 text-indigo-400 animate-pulse" />
                        <h3 className="font-extrabold text-sm text-white">B-Ram Nirman Pvt. Ltd.</h3>
                      </div>
                      <p className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider">Role: Technical Content Strategy & Web Operational Management</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Managed technical layout guidelines, structural framework scopes, and custom web blueprints for engineering architectures. Authored robust enterprise profiles detailing steel frameworks and structural layout blueprints.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4 flex-1">
                      <div className="flex items-center gap-2">
                        <Folder className="w-5 h-5 text-rose-400 animate-pulse" />
                        <h3 className="font-extrabold text-sm text-white">Zaira Ecommerce</h3>
                      </div>
                      <p className="text-[11px] text-rose-400 font-bold uppercase tracking-wider">Role: Brand Development Lead</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Led strategic transformation model converting a clothing boutique brand into a scalable digital e-commerce identity ecosystem. Work extended to material integration parameters, structure profiles, and design branding integrations for glass processing layouts.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* SYSTEM SETTINGS */}
              {win.id === 'settings' && (
                <div className="flex h-full gap-4">
                  <div className="w-48 bg-white/3 shrink-0 border border-white/5 rounded-xl p-2.5 space-y-2.5 text-[11px]">
                    <div className="flex items-center gap-2.5 p-1 border-b border-white/5 pb-2.5">
                      <img 
                        src="/IMG_4422.JPEG" 
                        alt="Syam Profile Settings" 
                        className="w-9 h-9 rounded-full object-cover border border-white/10 shadow"
                      />
                      <div className="truncate text-left">
                        <h4 className="font-bold text-white truncate text-[11px]">Syam Suresh</h4>
                        <span className="text-[8px] text-slate-500 block truncate">BTech CS</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSettingsActiveTab('profile')}
                      className={`w-full p-2.5 rounded-lg flex items-center gap-2 transition-colors clickable text-left ${
                        settingsActiveTab === 'profile' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" /> Profile Info
                    </button>
                    <button 
                      onClick={() => setSettingsActiveTab('analytics')}
                      className={`w-full p-2.5 rounded-lg flex items-center gap-2 transition-colors clickable text-left ${
                        settingsActiveTab === 'analytics' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <Cpu className="w-3.5 h-3.5" /> Data Analytics
                    </button>
                    <button 
                      onClick={() => setSettingsActiveTab('frameworks')}
                      className={`w-full p-2.5 rounded-lg flex items-center gap-2 transition-colors clickable text-left ${
                        settingsActiveTab === 'frameworks' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" /> Technical Strategy
                    </button>
                  </div>

                  <div className="flex-1 bg-white/3 border border-white/5 rounded-xl p-4 overflow-y-auto space-y-4">
                    {settingsActiveTab === 'profile' && (
                      <div className="space-y-3.5 text-left">
                        <h3 className="font-extrabold text-sm text-white">Profile & Education</h3>
                        <div className="space-y-1">
                          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">University Credentials</p>
                          <h4 className="font-extrabold text-white text-xs">BTech in Computer Science & Engineering</h4>
                          <span className="text-slate-500 font-semibold block text-[10px]">APJ Abdul Kalam Technological University</span>
                        </div>
                      </div>
                    )}

                    {settingsActiveTab === 'analytics' && (
                      <div className="space-y-3 text-left">
                        <h3 className="font-extrabold text-sm text-white">Data & Analytics</h3>
                        <div className="grid grid-cols-1 gap-2.5 pt-1">
                          <div className="bg-slate-900/60 p-3 rounded-lg border border-white/5">
                            <span className="font-bold text-white block text-xs">Power BI Visualization</span>
                          </div>
                          <div className="bg-slate-900/60 p-3 rounded-lg border border-white/5">
                            <span className="font-bold text-white block text-xs">Tableau Specialist environment</span>
                          </div>
                          <div className="bg-slate-900/60 p-3 rounded-lg border border-white/5">
                            <span className="font-bold text-white block text-xs">Relational Database Querying</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsActiveTab === 'frameworks' && (
                      <div className="space-y-3 text-left">
                        <h3 className="font-extrabold text-sm text-white">Technical Strategy & Frameworks</h3>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="bg-slate-900/60 p-3 rounded-lg border border-white/5">
                            <span className="font-bold text-white block text-[11px]">Network Architecture</span>
                          </div>
                          <div className="bg-slate-900/60 p-3 rounded-lg border border-white/5">
                            <span className="font-bold text-white block text-[11px]">Mobile Security Analysis</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PHOTOS APP */}
              {win.id === 'photos' && (
                <div className="flex h-full gap-4">
                  {/* Left-hand Navigation Shelf */}
                  <div className="w-40 bg-white/3 shrink-0 border border-white/5 rounded-xl p-2.5 space-y-1.5 text-[11px]">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block px-2 pb-1.5 border-b border-white/5 mb-1.5">Library Shelf</span>
                    <button 
                      onClick={() => setPhotosActiveTab('all')}
                      className={`w-full p-2.5 rounded-lg flex items-center gap-2 transition-colors clickable text-left ${
                        photosActiveTab === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> All Media
                    </button>
                    <button 
                      onClick={() => setPhotosActiveTab('drive')}
                      className={`w-full p-2.5 rounded-lg flex items-center gap-2 transition-colors clickable text-left ${
                        photosActiveTab === 'drive' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <Folder className="w-3.5 h-3.5 text-blue-400" /> Google Drive
                    </button>
                    <button 
                      onClick={() => setPhotosActiveTab('behance')}
                      className={`w-full p-2.5 rounded-lg flex items-center gap-2 transition-colors clickable text-left ${
                        photosActiveTab === 'behance' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <Behance className="w-3.5 h-3.5 text-white" /> Behance Projects
                    </button>
                    <button 
                      onClick={() => setPhotosActiveTab('instagram')}
                      className={`w-full p-2.5 rounded-lg flex items-center gap-2 transition-colors clickable text-left ${
                        photosActiveTab === 'instagram' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <Instagram className="w-3.5 h-3.5 text-rose-500" /> Instagram Grid
                    </button>
                    <button 
                      onClick={() => setPhotosActiveTab('pinterest')}
                      className={`w-full p-2.5 rounded-lg flex items-center gap-2 transition-colors clickable text-left ${
                        photosActiveTab === 'pinterest' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <Pinterest className="w-3.5 h-3.5 text-red-500" /> Pinterest Boards
                    </button>
                    <button 
                      onClick={() => setPhotosActiveTab('social')}
                      className={`w-full p-2.5 rounded-lg flex items-center gap-2 transition-colors clickable text-left ${
                        photosActiveTab === 'social' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <Linkedin className="w-3.5 h-3.5 text-blue-500" /> Prof. Identity
                    </button>
                  </div>

                  {/* Masonry-style Grid Pane */}
                  <div className="flex-1 bg-white/3 border border-white/5 rounded-xl p-4 overflow-y-auto scrollbar-thin">
                    <div className="grid grid-cols-2 gap-4">
                      {mediaItems
                        .filter(item => {
                          if (photosActiveTab === 'all') return true;
                          if (photosActiveTab === 'drive') return true;
                          if (photosActiveTab === 'social') return item.source === 'drive'; // LinkedIn profile photo
                          return item.source === photosActiveTab;
                        })
                        .map(item => (
                          <a 
                            key={item.id}
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="group block bg-slate-950/40 border border-white/5 rounded-xl overflow-hidden shadow hover:shadow-lg hover:border-white/10 transition-all clickable"
                          >
                            <div className="aspect-video relative overflow-hidden bg-slate-900">
                              <img 
                                src={item.imgUrl} 
                                alt={item.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <span className="absolute top-2 right-2 text-[7px] font-bold text-white font-mono bg-black/60 px-1.5 py-0.5 rounded-full border border-white/10 uppercase">
                                {item.category}
                              </span>
                            </div>
                            <div className="p-3 text-left space-y-1">
                              <h4 className="font-extrabold text-[11px] text-white truncate">{item.title}</h4>
                              <p className="text-[9px] text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                            </div>
                          </a>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* POWER BI WINDOW */}
              {win.id === 'power_bi' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
                    <Award className="w-6 h-6 text-yellow-400" />
                    <div>
                      <h2 className="font-extrabold text-base text-white">Power BI.app</h2>
                      <span className="text-[9px] text-slate-500">Data Visualization Utility</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-slate-300">
                      Showcasing advanced dashboarding structures, analytics systems, and database reporting metrics.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-950/60 p-3.5 border border-white/5 rounded-xl text-center space-y-1 shadow">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Efficiency</span>
                        <span className="text-base font-extrabold text-white text-glow-indigo">94.2%</span>
                      </div>
                      <div className="bg-slate-950/60 p-3.5 border border-white/5 rounded-xl text-center space-y-1 shadow">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Active Queries</span>
                        <span className="text-base font-extrabold text-emerald-400">14K</span>
                      </div>
                      <div className="bg-slate-950/60 p-3.5 border border-white/5 rounded-xl text-center space-y-1 shadow">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Visual Reports</span>
                        <span className="text-base font-extrabold text-indigo-400">240+</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SQL TERMINAL WINDOW */}
              {win.id === 'sql' && (
                <div className="font-mono text-slate-300 text-xs space-y-3.5">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <Terminal className="w-5 h-5 text-emerald-400" />
                    <span className="text-[10px] text-slate-400">SQL Terminal - bash - 80x24</span>
                  </div>
                  <div className="bg-black/60 p-4 rounded-xl border border-white/5 space-y-2 overflow-x-auto leading-relaxed shadow-inner">
                    <p className="text-slate-500">$ syam-db-shell --query</p>
                    <p className="text-slate-400">Connecting to postgresql://syamsuresh@localhost:5432/portfolio...</p>
                    <p className="text-emerald-400">Connected. Running database analysis check...</p>
                    <br />
                    <p className="text-indigo-300 font-bold">SELECT role, count(projects) FROM experience GROUP BY role;</p>
                    <p className="text-slate-500">+-------------------+-------+</p>
                    <p className="text-slate-300">| role              | count |</p>
                    <p className="text-slate-500">+-------------------+-------+</p>
                    <p className="text-slate-300">| Project Manager   |     2 |</p>
                    <p className="text-slate-300">| Business Analyst  |     1 |</p>
                    <p className="text-slate-300">| Data Analyst      |     1 |</p>
                    <p className="text-slate-500">+-------------------+-------+</p>
                    <p className="text-slate-500">3 rows returned (0.002s)</p>
                  </div>
                </div>
              )}

              {/* UI/UX WINDOW */}
              {win.id === 'ui_ux' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
                    <Layers className="w-6 h-6 text-pink-400" />
                    <div>
                      <h2 className="font-extrabold text-base text-white">UI/UX.app</h2>
                      <span className="text-[9px] text-slate-500">Design Interface Framework</span>
                    </div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                    <h3 className="font-extrabold text-xs text-white">Keltron KSG Design Residency (2019)</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Practiced design processes including wireframe prototypes, layout structures, user personas, interface alignments, and frontend CSS grids strategies.
                    </p>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
                      <span>Credential ID:</span>
                      <span className="text-white">KI007195</span>
                    </div>
                  </div>
                </div>
              )}

              {/* FIGMA WINDOW */}
              {win.id === 'figma' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
                    <Cpu className="w-6 h-6 text-rose-400" />
                    <div>
                      <h2 className="font-extrabold text-base text-white">Figma.app</h2>
                      <span className="text-[9px] text-slate-500">Visual Component Prototyping</span>
                    </div>
                  </div>
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 space-y-3.5 shadow-inner">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Interactive Components Workspace</span>
                    
                    {/* Mock layers list and visual canvas side-by-side */}
                    <div className="grid grid-cols-3 gap-3 h-36">
                      <div className="bg-white/3 rounded p-2 border border-white/5 space-y-1 text-[8px] font-mono text-slate-500 text-left">
                        <div className="text-indigo-400">❖ Hero Section</div>
                        <div className="pl-2">◇ Profile Photo Frame</div>
                        <div className="pl-2">◇ Introduction Text</div>
                        <div className="text-pink-400">❖ Floating Navbar</div>
                        <div className="pl-2">◇ Glass Blur Card</div>
                      </div>
                      <div className="col-span-2 bg-white/5 border border-white/10 rounded flex items-center justify-center relative overflow-hidden">
                        {/* Mock design canvas */}
                        <div className="w-24 h-16 bg-slate-900 border border-indigo-500/20 rounded shadow flex items-center justify-center">
                          <span className="text-[9px] text-indigo-400 font-bold">Figma Canvas</span>
                        </div>
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TABLEAU WINDOW */}
              {win.id === 'tableau' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
                    <Database className="w-6 h-6 text-blue-400" />
                    <div>
                      <h2 className="font-extrabold text-base text-white">Tableau.app</h2>
                      <span className="text-[9px] text-slate-500">Business Intelligence Platform</span>
                    </div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                    <h3 className="font-extrabold text-xs text-white">Enterprise Reporting & Data Mapping</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Tableau Specialist Environment. Creating visual business dashboards, predictive modeling reporting charts, mapping relational data flows, and configuring automated scheduling refreshes.
                    </p>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
                      <span>Verification License:</span>
                      <span className="text-white">3359-40515012</span>
                    </div>
                  </div>
                </div>
              )}

              {/* EXCEL SPREADSHEET WINDOW */}
              {win.id === 'excel' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <FileText className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold text-white">Excel.app - Portfolio_Sheet.xlsx</span>
                  </div>
                  <div className="bg-slate-950/60 rounded-xl border border-white/5 overflow-hidden shadow-inner text-[10px] font-mono">
                    {/* Mock Excel sheet cells */}
                    <div className="grid grid-cols-4 bg-slate-900 border-b border-white/5 p-2 font-bold text-slate-400">
                      <span>Skill Area</span>
                      <span>Level</span>
                      <span>Focus Domain</span>
                      <span>Formula Logic</span>
                    </div>
                    <div className="divide-y divide-white/5 text-slate-300">
                      <div className="grid grid-cols-4 p-2">
                        <span>Data Modeling</span>
                        <span className="text-emerald-400">Expert</span>
                        <span>Google Sheets</span>
                        <span className="text-slate-500">=SUM(VLOOKUP)</span>
                      </div>
                      <div className="grid grid-cols-4 p-2">
                        <span>Business Analytics</span>
                        <span className="text-emerald-400">Expert</span>
                        <span>Strategy Modeling</span>
                        <span className="text-slate-500">=INDEX(MATCH)</span>
                      </div>
                      <div className="grid grid-cols-4 p-2">
                        <span>Relational DB</span>
                        <span className="text-indigo-400">Advanced</span>
                        <span>SQL Architecture</span>
                        <span className="text-slate-500">=JOIN(TABLES)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SYSTEM FRAMEWORKS MULTI-TAB WINDOW */}
              {win.id === 'frameworks' && (
                <div className="flex flex-col h-full space-y-4">
                  {/* Finder-like sidebar tab selector */}
                  <div className="flex gap-2.5 border-b border-white/5 pb-3">
                    <button 
                      onClick={() => setFrameworksActiveTab('management')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all clickable ${
                        frameworksActiveTab === 'management' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Management
                    </button>
                    <button 
                      onClick={() => setFrameworksActiveTab('marketing')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all clickable ${
                        frameworksActiveTab === 'marketing' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Marketing & Growth
                    </button>
                    <button 
                      onClick={() => setFrameworksActiveTab('infrastructure')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all clickable ${
                        frameworksActiveTab === 'infrastructure' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Infrastructure
                    </button>
                  </div>

                  {/* Tab contents panel */}
                  {frameworksActiveTab === 'management' && (
                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3.5 flex-1">
                      <h4 className="font-extrabold text-sm text-white">Project & Strategic Operations</h4>
                      <p className="text-slate-300">Organizing execution workflows, roadmaps, agile planning setups, and client metrics:</p>
                      <ul className="space-y-1.5 text-[11px] text-slate-400 pl-4 list-disc">
                        <li>Technical Project Management & sprints scheduling.</li>
                        <li>IT Business Analysis frameworks & requirements specification.</li>
                        <li>Customer management systems & Voice of the Customer (VoC) feedback loops.</li>
                      </ul>
                    </div>
                  )}

                  {frameworksActiveTab === 'marketing' && (
                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3.5 flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-extrabold text-sm text-white">Marketing, Strategy & Content</h4>
                        <span className="text-[9px] text-indigo-400 font-mono bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">Simplilearn Credential</span>
                      </div>
                      <p className="text-slate-300">Managing digital growth parameters and user acquisition structures:</p>
                      <ul className="space-y-1.5 text-[11px] text-slate-400 pl-4 list-disc">
                        <li>Advanced Mobile Marketing (Credential ID: <span className="font-bold text-white font-mono">10294424</span>).</li>
                        <li>Digital Acquisition campaigns & advertising pipelines.</li>
                        <li>CMS Platform Management & SEO content structures.</li>
                      </ul>
                    </div>
                  )}

                  {frameworksActiveTab === 'infrastructure' && (
                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3.5 flex-1">
                      <h4 className="font-extrabold text-sm text-white">Network & Development Systems</h4>
                      <p className="text-slate-300">Frontend engineering layouts and platform configurations:</p>
                      <ul className="space-y-1.5 text-[11px] text-slate-400 pl-4 list-disc">
                        <li>Network Architectures & Routing models.</li>
                        <li>Ethical Hacking - Mobile Platforms security analyses.</li>
                        <li>Front-End Web Development (HTML/CSS architectures).</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        );
      })}

      {/* Persistent Bottom Magnification Dock */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 h-[76px] mac-dock rounded-[24px] px-4 flex items-center gap-4.5 z-40 select-none">
        {dockItems.map((item, idx) => {
          const isAppOpen = openWindows.some(w => w.id === item.id);
          const scaleFactor = getDockItemScale(idx);
          
          return (
            <div 
              key={item.id}
              onClick={() => openAppWindow(item.id as any)}
              onMouseEnter={() => setHoveredDockIdx(idx)}
              onMouseLeave={() => setHoveredDockIdx(null)}
              className="flex flex-col items-center justify-center relative cursor-pointer mac-dock-item clickable"
              style={{
                transform: `scale(${scaleFactor})`,
                margin: `0 ${Math.max(0, (scaleFactor - 1) * 8)}px`
              }}
            >
              {/* App icon frame */}
              <div className={`w-13 h-13 rounded-2xl bg-gradient-to-tr ${item.colorClass} border border-white/20 flex items-center justify-center shadow-lg transition-shadow hover:shadow-xl`}>
                {item.icon}
              </div>
              
              {/* Active Indicator dot */}
              {isAppOpen && (
                <div className="absolute bottom-[-6px] w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
