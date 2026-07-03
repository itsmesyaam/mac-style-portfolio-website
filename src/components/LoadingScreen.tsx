import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [subtitle, setSubtitle] = useState('Initializing system modules...');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Increment loading progress percentage
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 15);

    // Swap loading messages
    const messages = [
      'Compiling front-end assets...',
      'Loading Matter.js physics configurations...',
      'Structuring Apple gallery grids...',
      'Optimizing SEO & Open Graph indices...',
      'Building Digital Experiences...'
    ];

    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      if (msgIndex < messages.length) {
        setSubtitle(messages[msgIndex]);
        msgIndex++;
      }
    }, 400);

    return () => {
      clearInterval(progressInterval);
      clearInterval(msgInterval);
    };
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const timeout = setTimeout(() => {
        setIsVisible(false);
        // Small delay to let fadeout animation complete
        setTimeout(onComplete, 500);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [progress, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 select-none"
        >
          {/* Decorative glowing background gradients */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/5 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/5 blur-[120px]" />

          {/* Centered logo and titles */}
          <div className="flex flex-col items-center space-y-6 max-w-xs w-full z-10 text-center">
            
            {/* Animated Logo (Geometric pulsing SVG shape) */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.05, 1], opacity: 1 }}
              transition={{ 
                opacity: { duration: 0.8 },
                scale: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }
              }}
              className="w-20 h-20 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 rounded-3xl p-0.5 shadow-2xl flex items-center justify-center relative overflow-hidden"
            >
              {/* Spinning reflection shine inside logo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-sheen pointer-events-none" style={{ animationDuration: '3s' }} />
              <svg 
                className="w-10 h-10 text-white" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </motion.div>

            {/* Typography */}
            <div className="space-y-1">
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl font-extrabold tracking-[0.25em] text-white pl-[0.25em]"
              >
                SYAM
              </motion.h1>
              <motion.p 
                key={subtitle}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-[11px] font-mono text-slate-500 tracking-wider h-4"
              >
                {subtitle}
              </motion.p>
            </div>

            {/* Circular Progress Bar Indicator */}
            <div className="w-full pt-4 space-y-2">
              <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden relative border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                />
              </div>
              <span className="text-[10px] font-bold font-mono text-indigo-400">
                {progress}%
              </span>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
