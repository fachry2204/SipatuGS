import React, { useState, useEffect, useMemo } from 'react';
import { 
  UsersRound, 
  Search, 
  UserCircle, 
  Phone, 
  MapPin, 
  Plus, 
  Users,
  HeartHandshake
} from 'lucide-react';
import { apiService } from '../services/api';
import { KarangTaruna } from '../types';

const PartnerKarangTarunaSection: React.FC = () => {
  const [ktList, setKtList] = useState<KarangTaruna[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    nik: '',
    phone: '',
    jabatan: 'Anggota',
    wilayah: ''
  });

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      const data = await apiService.getKarangTaruna();
      if (data) setKtList(data);
    };
    fetchData();
  }, []);

  const filteredKT = useMemo(() => {
    return ktList.filter(l => 
      l.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.wilayah.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, ktList]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.wilayah) {
        alert("Mohon lengkapi Nama dan Wilayah.");
        return;
    }

    const newEntry: KarangTaruna = {
        id: `KT-${Date.now()}`,
        nama: formData.nama,
        nik: formData.nik,
        phone: formData.phone,
        jabatan: formData.jabatan,
        wilayah: formData.wilayah
    };

    // Optimistic Update
    setKtList(prev => [...prev, newEntry]);
    
    // API Call
    await apiService.createKarangTaruna(newEntry);

    setIsAddModalOpen(false);
    setFormData({ nama: '', nik: '', phone: '', jabatan: 'Anggota', wilayah: '' });
    setIsSuccessModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-700 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
           <h2 className="text-3xl font-black mb-2">Karang Taruna</h2>
           <p className="text-teal-100 max-w-xl">
             Wadah pengembangan generasi muda yang tumbuh atas dasar kesadaran dan tanggung jawab sosial.
           </p>
        </div>
        <UsersRound className="absolute right-0 bottom-0 text-white opacity-10 w-48 h-48 -mr-10 -mb-10" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
         <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
            <Users size={18} />
            <span>Total Anggota: {ktList.length}</span>
         </div>
         <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                type="text" 
                placeholder="Cari Nama / Wilayah..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
            </div>
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-teal-200 shrink-0"
            >
                <Plus size={18} /> <span className="hidden sm:inline">Tambah Anggota</span>
            </button>
         </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredKT.map((member) => (
            <div key={member.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 bg-teal-50 text-teal-600 px-4 py-2 rounded-bl-2xl font-black text-xs uppercase tracking-wide">
                  {member.jabatan}
               </div>
               
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                     <UserCircle size={32} className="text-slate-400" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-slate-800">{member.nama}</h3>
                     <p className="text-xs text-slate-500 font-mono">{member.nik || 'NIK Belum Input'}</p>
                  </div>
               </div>

               <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                     <MapPin size={16} className="text-slate-400" />
                     <span className="text-sm font-bold text-slate-700">{member.wilayah}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                     <Phone size={16} className="text-slate-400" />
                     <span className="text-sm font-bold text-slate-700">{member.phone || '-'}</span>
                  </div>
               </div>
            </div>
         ))}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
             <h3 className="text-xl font-bold text-slate-800 mb-6">Tambah Anggota Karang Taruna</h3>
             <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 ml-1">Nama Lengkap</label>
                   <input 
                      type="text"
                      value={formData.nama}
                      onChange={(e) => setFormData({...formData, nama: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Contoh: Budi Santoso"
                      required
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 ml-1">Jabatan</label>
                   <select 
                      value={formData.jabatan}
                      onChange={(e) => setFormData({...formData, jabatan: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500"
                   >
                      <option value="Ketua">Ketua</option>
                      <option value="Wakil Ketua">Wakil Ketua</option>
                      <option value="Sekretaris">Sekretaris</option>
                      <option value="Bendahara">Bendahara</option>
                      <option value="Anggota">Anggota</option>
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 ml-1">Wilayah Tugas</label>
                   <input 
                      type="text"
                      value={formData.wilayah}
                      onChange={(e) => setFormData({...formData, wilayah: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Contoh: RW 01"
                      required
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 ml-1">NIK</label>
                   <input 
                      type="text"
                      value={formData.nik}
                      onChange={(e) => setFormData({...formData, nik: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                      placeholder="16 Digit NIK"
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 ml-1">Nomor Telepon / WA</label>
                   <input 
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="0812..."
                   />
                </div>

                <div className="flex gap-3 pt-4">
                   <button 
                      type="button" 
                      onClick={() => setIsAddModalOpen(false)}
                      className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                   >
                      Batal
                   </button>
                   <button 
                      type="submit" 
                      className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-teal-200"
                   >
                      Simpan
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-800 text-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 border border-slate-700">
             <h3 className="text-lg font-bold mb-2">Sukses!</h3>
             <p className="text-slate-300 mb-6">Data Anggota Karang Taruna Berhasil Ditambahkan!</p>
             <div className="flex justify-end">
                <button 
                  onClick={() => setIsSuccessModalOpen(false)}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl font-bold transition-colors shadow-lg shadow-green-900/20"
                >
                  OK
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerKarangTarunaSection;
