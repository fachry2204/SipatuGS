
import React, { useState } from 'react';
import { X, AlertTriangle, ShieldCheck, Lock, UserCircle } from 'lucide-react';
import { Citizen, User } from '../types';
import { apiService } from '../services/api';

interface DeleteCitizenModalProps {
  citizen: Citizen;
  users: User[];
  onClose: () => void;
  onConfirm: (id: string) => void;
}

const DeleteCitizenModal: React.FC<DeleteCitizenModalProps> = ({ citizen, users, onClose, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsDeleting(true);

    try {
      // Direct Delete without Authorization
      onConfirm(citizen.id);
      onClose();
    } catch (err) {
      console.error("Delete error:", err);
      setError('Terjadi kesalahan saat menghapus data.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-red-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
        <div className="p-6 bg-red-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-red-900">Konfirmasi Hapus</h3>
            <p className="text-xs text-red-700 font-medium">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                {citizen.namaLengkap.substring(0, 1)}
             </div>
             <div>
               <p className="text-xs text-slate-500 font-medium">Menghapus Data:</p>
               <p className="text-sm font-bold text-slate-800">{citizen.namaLengkap}</p>
               <p className="text-sm text-slate-400 font-mono">{citizen.nik}</p>
             </div>
          </div>
          
          <div className="mb-4 text-xs text-slate-500 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
             Apakah Anda yakin ingin menghapus data warga ini secara permanen dari sistem?
          </div>

          {error && (
            <div className="mb-4 text-xs text-red-600 font-bold bg-red-50 p-3 rounded-lg flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleDelete} className="space-y-4">
            <div className="pt-4 flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
              >
                Batalkan
              </button>
              <button 
                type="submit"
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-100 transition-all flex items-center justify-center"
              >
                {isDeleting ? 'Memproses...' : 'Ya, Hapus Data'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeleteCitizenModal;
