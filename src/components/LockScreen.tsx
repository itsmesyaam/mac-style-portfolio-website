import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ChevronUp, MessageSquare } from 'lucide-react';

interface LockScreenProps {
  onUnlock: () => void;
  isThemeDark: boolean;
}

export default function LockScreen({ onUnlock, isThemeDark }: LockScreenProps) {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Hour and Minute layout
      let hours = now.getHours();
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTime(`${hours}:${minutes}`);

      // Month name, Day of month, and weekday
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      };
      setDate(now.toLocaleDateString('en-US', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-6 select-none overflow-hidden rounded-[42px] transition-colors duration-500">
      
      {/* Background wallpaper pulling from Google Drive assets folder */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/IMG_4422.JPEG" 
          alt="Lockscreen Wallpaper" 
          className={`w-full h-full object-cover transition-all duration-500 ${
            isThemeDark ? 'brightness-[0.45] contrast-[1.05]' : 'brightness-[0.85] contrast-[0.95]'
          }`}
        />
        <div className="absolute inset-0 bg-slate-950/20 mix-blend-overlay" />
      </div>

      {/* Notch indicator cover */}
      <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-center border border-white/5 pointer-events-none">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-950 ml-auto mr-4" />
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-950 mr-4" />
      </div>

      {/* Top Section: Date & Time */}
      <div className="mt-12 text-center z-10 space-y-1 relative">
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`text-xs font-semibold uppercase tracking-widest ${
            isThemeDark ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          {date}
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={`text-[74px] font-extrabold tracking-tighter leading-none lock-clock-shadow ${
            isThemeDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {time}
        </motion.h1>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`flex justify-center items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${
            isThemeDark ? 'text-indigo-400' : 'text-indigo-600'
          }`}
        >
          <Lock className="w-3 h-3" /> Locked
        </motion.div>
      </div>

      {/* Middle Section: Notification Banner */}
      <div className="flex-1 flex items-center justify-center z-10 w-full px-2">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full bg-white/5 border border-white/10 rounded-3xl p-4 backdrop-blur-md flex items-start gap-3 shadow-xl relative overflow-hidden"
        >
          {/* Accent notification pill */}
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
          
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl shrink-0">
            <MessageSquare className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-left space-y-1">
            <div className="flex justify-between items-center w-full">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">System Notification</span>
              <span className="text-[9px] text-slate-500 font-mono">1m ago</span>
            </div>
            <h4 className="font-extrabold text-xs text-white">Syam Suresh</h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              Technical Project Manager & Creator. BTech Computer Science.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Bottom Section: Swipe zone */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full flex flex-col items-center gap-4 z-10 pb-6 cursor-pointer relative"
        onClick={onUnlock}
      >
        {/* Glowing trigger pill */}
        <div className="flex flex-col items-center gap-1.5 animate-bounce">
          <ChevronUp className="w-5 h-5 text-slate-400" />
          <span className="text-xs font-semibold uppercase tracking-widest sheen-text">
            Swipe Up to Unlock
          </span>
        </div>
        {/* iOS home screen line indicator */}
        <div className="w-32 h-1 bg-white/40 rounded-full mx-auto" />
      </motion.div>

    </div>
  );
}
