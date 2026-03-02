import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batalkan',
  variant = 'danger',
  isLoading = false
}) => {
  if (!isOpen) return null;

  const getColors = () => {
    switch (variant) {
      case 'danger': return { bg: 'bg-red-50', icon: 'bg-red-100 text-red-600', button: 'bg-red-600 hover:bg-red-700' };
      case 'warning': return { bg: 'bg-amber-50', icon: 'bg-amber-100 text-amber-600', button: 'bg-amber-600 hover:bg-amber-700' };
      default: return { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-600', button: 'bg-blue-600 hover:bg-blue-700' };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl animate-in zoom-in-95 overflow-hidden">
        <div className={`p-6 ${colors.bg} flex items-center gap-4`}>
          <div className={`w-12 h-12 ${colors.icon} rounded-2xl flex items-center justify-center shrink-0`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500 font-medium">Konfirmasi Tindakan</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 text-slate-400 hover:bg-white/50 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            {message}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 py-3 text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 ${colors.button}`}
            >
              {isLoading ? 'Memproses...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
