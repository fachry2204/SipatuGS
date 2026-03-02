
import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, Lock } from 'lucide-react';
import { PPSU, User } from '../types';

interface DeletePPSUModalProps {
  staff: PPSU;
  onClose: () => void;
  onConfirm: () => void;
  user: User;
}

const DeletePPSUModal: React.FC<DeletePPSUModalProps> = ({ staff, onClose, onConfirm, user }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeleting(true);
    // Direct Delete without Authorization
    onConfirm();
    // onClose(); // Parent handles close
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-red-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
        <div className="p-6 bg-red-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-red-900">Konfirmasi Hapus PPSU</h3>
            <p className="text-xs text-red-700 font-medium">Tindakan ini permanen dan tidak dapat dibatalkan.</p>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
             <img src={staff.fotoProfile} alt="" className="w-10 h-10 rounded-full object-cover" />
             <div>
               <p className="text-xs text-slate-500 font-medium">Menghapus Data:</p>
               <p className="text-sm font-bold text-slate-800">{staff.namaLengkap} ({staff.nomorAnggota})</p>
             </div>
          </div>
          
          <div className="mb-4 text-xs text-slate-500 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
             Apakah Anda yakin ingin menghapus data PPSU ini secara permanen?
          </div>

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

export default DeletePPSUModal;
