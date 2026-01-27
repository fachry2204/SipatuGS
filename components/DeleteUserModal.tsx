
import React, { useState } from 'react';
import { X, AlertTriangle, ShieldCheck, Lock, Mail } from 'lucide-react';
import { User, Role } from '../types';

interface DeleteUserModalProps {
  userToDelete: User;
  users: User[]; // Need access to all users to verify credentials
  onClose: () => void;
  onConfirm: (id: string) => void;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ userToDelete, users, onClose, onConfirm }) => {
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsDeleting(true);

    // Simulate API Processing delay
    setTimeout(() => {
      // 1. Find the user attempting to delete
      const adminUser = users.find(u => u.email?.toLowerCase() === adminEmail.toLowerCase());

      // 2. Validation Logic
      if (!adminUser) {
        setError('Email tidak ditemukan dalam database sistem.');
        setIsDeleting(false);
        return;
      }

      // 3. Check Role Permission
      const allowedRoles = ['Administrator', 'Admin', 'Pimpinan'];
      if (!allowedRoles.includes(adminUser.role)) {
        setError(`Role '${adminUser.role}' tidak memiliki izin menghapus user.`);
        setIsDeleting(false);
        return;
      }

      // 4. Check Password 
      // Compare input password with the password stored in the user object.
      // If adminUser has no password set (e.g. legacy data), we might fallback or deny.
      // Here we assume password exists as per updated types and logic.
      if (adminUser.password !== password) {
        setError('Password salah.');
        setIsDeleting(false);
        return;
      }

      // Success
      onConfirm(userToDelete.id);
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
            <h3 className="font-bold text-red-900">Hapus User</h3>
            <p className="text-xs text-red-700 font-medium">Verifikasi otorisasi diperlukan.</p>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
             <img src={userToDelete.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
             <div>
               <p className="text-xs text-slate-500 font-medium">Menghapus Akun:</p>
               <p className="text-sm font-bold text-slate-800">{userToDelete.username}</p>
               <p className="text-[10px] text-slate-400">{userToDelete.role}</p>
             </div>
          </div>
          
          <div className="mb-4 text-xs text-slate-500 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
             Masukkan Email & Password dari akun dengan hak akses <b>Administrator</b>, <b>Admin</b>, atau <b>Pimpinan</b>.
          </div>

          {error && (
            <div className="mb-4 text-xs text-red-600 font-bold bg-red-50 p-3 rounded-lg flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleDelete} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">Email Admin / Pimpinan</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@jakarta.go.id" 
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
                {isDeleting ? 'Memproses...' : 'Konfirmasi Hapus'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
