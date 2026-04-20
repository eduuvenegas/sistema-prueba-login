import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => { if (onClose) onClose(); }, 300); // Esperar a la animación de desvanecimiento
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200';
  const textColor = type === 'success' ? 'text-emerald-800' : 'text-red-800';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;
  const iconColor = type === 'success' ? 'text-emerald-500' : 'text-red-500';

  return (
    <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl z-50 transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} ${bgColor} ${textColor}`}>
      <Icon className={`w-6 h-6 ${iconColor}`} />
      <p className="text-sm font-bold">{message}</p>
      <button 
        onClick={() => { setIsVisible(false); setTimeout(() => { if (onClose) onClose(); }, 300); }} 
        className="ml-4 text-gray-400 hover:text-gray-700 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Toast;