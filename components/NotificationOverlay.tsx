
import React, { useState, useEffect } from 'react';
import { Bell, X, ArrowRight, Sparkles } from 'lucide-react';
import { getRandomMessage, shouldNotify, markAsNotified } from '../services/notificationService';
import { DailyEntry } from '../types';

interface NotificationOverlayProps {
  entries: DailyEntry[];
  onAction: () => void;
}

const NotificationOverlay: React.FC<NotificationOverlayProps> = ({ entries, onAction }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkNotification = () => {
      if (shouldNotify(entries)) {
        setMessage(getRandomMessage());
        setIsVisible(true);
        markAsNotified();
      }
    };

    // Verifica a cada minuto
    const interval = setInterval(checkNotification, 60000);
    // Verifica também ao montar
    checkNotification();

    return () => clearInterval(interval);
  }, [entries]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] animate-in slide-in-from-top duration-500">
      <div 
        onClick={() => {
          onAction();
          setIsVisible(false);
        }}
        className="bg-slate-900 text-white p-4 rounded-[2rem] shadow-2xl border border-white/10 flex items-center gap-4 active:scale-95 transition-all cursor-pointer ring-4 ring-orange-500/20"
      >
        <div className="bg-orange-500 p-3 rounded-2xl shrink-0 shadow-lg shadow-orange-500/20">
          <Bell size={20} className="text-white animate-bounce" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">GiroCerto</span>
            <div className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="text-[10px] font-bold text-slate-500">Agora</span>
          </div>
          <p className="text-xs font-bold leading-tight text-slate-100 line-clamp-2">
            {message}
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 pl-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
            }}
            className="p-1 hover:bg-white/10 rounded-full text-slate-500"
          >
            <X size={16} />
          </button>
          <ArrowRight size={16} className="text-orange-500" />
        </div>
      </div>
    </div>
  );
};

export default NotificationOverlay;
