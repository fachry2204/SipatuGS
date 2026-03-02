import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  UserCircle,
  Phone,
  Calendar,
  Plus,
  Trash2,
  Users
} from 'lucide-react';
import { apiService } from '../services/api';

interface LMKData {
  id: string;
  rwId: string;
  rwNo: string;
  nama: string;
  nik: string;
  phone: string;
  periode: string;
}

const PartnerLMKSection: React.FC = () => {
  const [lmkList, setLmkList] = useState<LMKData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // Success Modal State
  const [rws, setRws] = useState<{id: string, no: string}[]>([]); // To populate RW Dropdown

  // Form State
  const [formData, setFormData] = useState({
    rwId: '',
    nama: '',
    nik: '',
    phone: '',
    periode: '2024-2029'
  });

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      const [lmkData, rwData] = await Promise.all([
        apiService.getLMK(),
        apiService.getRTRW()
      ]);
      
      if (lmkData) setLmkList(lmkData);
      if (rwData) {
        setRws(rwData.map((r: any) => ({ id: r.id, no: r.no })));
      }
    };
    fetchData();
  }, []);

  const filteredLMK = useMemo(() => {
    return lmkList.filter(l => 
      l.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.rwNo?.includes(searchTerm)
    );
  }, [searchTerm, lmkList]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.rwId || !formData.nama) {
        alert("Mohon lengkapi RW dan Nama Anggota LMK.");
        return;
    }

    const rw = rws.find(r => r.id === formData.rwId);
    const newEntry: LMKData = {
        id: `LMK-${Date.now()}`,
        rwId: formData.rwId,
        rwNo: rw ? rw.no : '?',
        nama: formData.nama,
        nik: formData.nik,
        phone: formData.phone,
        periode: formData.periode
    };

    // Optimistic Update
    setLmkList(prev => [...prev, newEntry].sort((a, b) => a.rwNo.localeCompare(b.rwNo)));
    
    // API Call
    await apiService.createLMK(newEntry);

    setIsAddModalOpen(false);
    setFormData({ rwId: '', nama: '', nik: '', phone: '', periode: '2024-2029' });
    setIsSuccessModalOpen(true); // Trigger Success Modal
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
           <h2 className="text-3xl font-black mb-2">Lembaga Musyawarah Kelurahan (LMK)</h2>
           <p className="text-blue-100 max-w-xl">
             Mitra kerja kelurahan dalam menampung dan menyalurkan aspirasi masyarakat serta meningkatkan pemberdayaan masyarakat.
           </p>
        </div>
        <Building2 className="absolute right-0 bottom-0 text-white opacity-10 w-48 h-48 -mr-10 -mb-10" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
         <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
            <Users size={18} />
            <span>Total Anggota: {lmkList.length}</span>
         </div>
         <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                type="text" 
                placeholder="Cari Nama / RW..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
            </div>
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 shrink-0"
            >
                <Plus size={18} /> <span className="hidden sm:inline">Tambah Anggota</span>
            </button>
         </div>
      </div>

      {/* LMK Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredLMK.map((lmk) => (
            <div key={lmk.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 px-4 py-2 rounded-bl-2xl font-black text-sm">
                  RW {lmk.rwNo}
               </div>
               
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                     <UserCircle size={32} className="text-slate-400" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-slate-800">{lmk.nama}</h3>
                     <p className="text-xs text-slate-500 font-mono">{lmk.nik || 'NIK Belum Input'}</p>
                  </div>
               </div>

               <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                     <Phone size={16} className="text-slate-400" />
                     <span className="text-sm font-bold text-slate-700">{lmk.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                     <Calendar size={16} className="text-slate-400" />
                     <span className="text-sm font-bold text-slate-700">Periode {lmk.periode}</span>
                  </div>
               </div>
            </div>
         ))}
      </div>

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-800 text-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 border border-slate-700">
             <h3 className="text-lg font-bold mb-2">Sukses!</h3>
             <p className="text-slate-300 mb-6">Data LMK Berhasil Ditambahkan!</p>
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

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
             <h3 className="text-xl font-bold text-slate-800 mb-6">Tambah Anggota LMK</h3>
             <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 ml-1">Pilih Wilayah RW</label>
                   <select 
                      value={formData.rwId}
                      onChange={(e) => setFormData({...formData, rwId: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      required
                   >
                      <option value="">-- Pilih RW --</option>
                      {rws.map(rw => (
                          <option key={rw.id} value={rw.id}>RW {rw.no}</option>
                      ))}
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 ml-1">Nama Lengkap</label>
                   <input 
                      type="text"
                      value={formData.nama}
                      onChange={(e) => setFormData({...formData, nama: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Contoh: Budi Santoso"
                      required
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 ml-1">NIK</label>
                   <input 
                      type="text"
                      value={formData.nik}
                      onChange={(e) => setFormData({...formData, nik: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      placeholder="16 Digit NIK"
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 ml-1">Nomor Telepon / WA</label>
                   <input 
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0812..."
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 ml-1">Periode Jabatan</label>
                   <input 
                      type="text"
                      value={formData.periode}
                      onChange={(e) => setFormData({...formData, periode: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-200"
                   >
                      Simpan
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerLMKSection;