import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  title?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ 
  isOpen, 
  onClose, 
  message, 
  title = "Berhasil!" 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={32} />
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            {message}
          </p>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold rounded-xl transition-colors duration-200 shadow-lg shadow-emerald-200"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
