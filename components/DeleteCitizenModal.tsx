
import React, { useState } from 'react';
import { X, AlertTriangle, ShieldCheck, Lock, UserCircle } from 'lucide-react';
import { Citizen, User } from '../types';
import { MOCK_USERS } from '../constants'; // Importing users to verify credentials

interface DeleteCitizenModalProps {
  citizen: Citizen;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

const DeleteCitizenModal: React.FC<DeleteCitizenModalProps> = ({ citizen, onClose, onConfirm }) => {
  const [identifier, setIdentifier] = useState(''); // Username, Email, or NIK
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsDeleting(true);

    // Simulate API Processing delay
    setTimeout(() => {
      // 1. Find the user attempting to delete from MOCK_USERS
      const adminUser = MOCK_USERS.find(u => 
        u.username.toLowerCase() === identifier.toLowerCase() ||
        (u.email && u.email.toLowerCase() === identifier.toLowerCase()) ||
        (u.nik && u.nik === identifier)
      );

      // 2. Validation Logic
      if (!adminUser) {
        setError('User tidak ditemukan dalam database sistem.');
        setIsDeleting(false);
        return;
      }

      // 3. Check Role Permission
      const allowedRoles = ['Administrator', 'Admin', 'Pimpinan'];
      if (!allowedRoles.includes(adminUser.role)) {
        setError(`Akses Ditolak. Role '${adminUser.role}' tidak memiliki izin menghapus data warga. Hubungi Administrator.`);
        setIsDeleting(false);
        return;
      }

      // 4. Check Password 
      if (adminUser.password !== password) {
        setError('Password salah.');
        setIsDeleting(false);
        return;
      }

      // Success
      onConfirm(citizen.id);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-red-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
        <div className="p-6 bg-red-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-red-900">Hapus Data Warga</h3>
            <p className="text-xs text-red-700 font-medium">Otorisasi Pimpinan/Admin Diperlukan.</p>
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
               <p className="text-[10px] text-slate-400 font-mono">{citizen.nik}</p>
             </div>
          </div>
          
          <div className="mb-4 text-xs text-slate-500 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
             Hanya <b>Administrator</b>, <b>Admin</b>, atau <b>Pimpinan</b> yang dapat menghapus data ini.
          </div>

          {error && (
            <div className="mb-4 text-xs text-red-600 font-bold bg-red-50 p-3 rounded-lg flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleDelete} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">ID Otorisasi (Username/Email/NIK)</label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Username, Email, atau NIK" 
                  required
                  className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none" 
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1 text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda" 
                  required
                  className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none" 
                />
              </div>
            </div>

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
                {isDeleting ? 'Memproses...' : 'Hapus Data'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeleteCitizenModal;
