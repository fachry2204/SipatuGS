
import React, { useState, useMemo } from 'react';
import { 
  Home, 
  Users, 
  MapPin, 
  ChevronRight, 
  Search, 
  UserCircle,
  Phone,
  Building2,
  X,
  Plus,
  Save
} from 'lucide-react';

// Interfaces for this specific view
interface RTData {
  no: string;
  ketua: string;
  phone: string;
  kkCount: number;
}

interface RWData {
  no: string;
  ketua: string;
  phone: string;
  location: string;
  rtList: RTData[];
}

// Mock Data Generator based on requested RWs
const TARGET_RWS = ['01', '02', '03', '05', '06', '08', '09', '10', '11', '12', '13'];

const NAMES = [
  'Budi Santoso', 'Slamet Riyadi', 'Agus Salim', 'Joko Widodo', 'Bambang Pamungkas', 
  'Hendra Setiawan', 'Rudi Hartono', 'Siti Aminah', 'Dewi Sartika', 'Rina Nose', 'Eko Patrio'
];

const generateRWData = (): RWData[] => {
  return TARGET_RWS.map((no, index) => {
    // Generate random RTs for each RW (between 8 to 15 RTs)
    const rtCount = Math.floor(Math.random() * 8) + 8;
    const rts: RTData[] = Array.from({ length: rtCount }, (_, i) => ({
      no: `0${i + 1}`.slice(-3), // 001, 002...
      ketua: NAMES[Math.floor(Math.random() * NAMES.length)],
      phone: `081${Math.floor(Math.random() * 100000000)}`,
      kkCount: Math.floor(Math.random() * 50) + 30
    }));

    return {
      no: no,
      ketua: `Ketua RW ${no}`, // Placeholder name
      phone: `0812${Math.floor(Math.random() * 100000000)}`,
      location: `Sekretariat RW ${no}, Kel. Grogol Selatan`,
      rtList: rts
    };
  });
};

const PartnerRTRWSection: React.FC = () => {
  // Convert Mock Data to State
  const [rwList, setRwList] = useState<RWData[]>(generateRWData());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRW, setSelectedRW] = useState<RWData | null>(null);
  
  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRWData, setNewRWData] = useState({
    no: '',
    ketua: '',
    phone: '',
    location: ''
  });

  const filteredRW = useMemo(() => {
    return rwList.filter(rw => 
      rw.no.includes(searchTerm) || 
      rw.ketua.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, rwList]);

  const totalRT = rwList.reduce((acc, curr) => acc + curr.rtList.length, 0);
  const totalKK = rwList.reduce((acc, curr) => acc + curr.rtList.reduce((rAcc, rCurr) => rAcc + rCurr.kkCount, 0), 0);

  const handleSaveRW = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRWData.no || !newRWData.ketua) {
        alert("Mohon lengkapi Nomor RW dan Nama Ketua.");
        return;
    }

    const newEntry: RWData = {
        no: newRWData.no.padStart(2, '0'),
        ketua: newRWData.ketua,
        phone: newRWData.phone || '-',
        location: newRWData.location || 'Lokasi belum diatur',
        rtList: []
    };

    setRwList(prev => [...prev, newEntry].sort((a, b) => a.no.localeCompare(b.no)));
    setIsAddModalOpen(false);
    setNewRWData({ no: '', ketua: '', phone: '', location: '' });
    alert("Data RW Berhasil Ditambahkan!");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
           <Home className="absolute -right-4 -bottom-4 text-white opacity-10 w-32 h-32" />
           <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Total Wilayah</p>
           <h3 className="text-4xl font-black">{rwList.length} <span className="text-lg font-medium text-slate-400">RW</span></h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center relative overflow-hidden group">
           <div className="absolute right-4 top-4 p-3 bg-orange-50 text-orange-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Building2 size={24} />
           </div>
           <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Total Rukun Tetangga</p>
           <h3 className="text-3xl font-black text-slate-800">{totalRT} <span className="text-sm font-medium text-slate-400">RT</span></h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center relative overflow-hidden group">
           <div className="absolute right-4 top-4 p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Users size={24} />
           </div>
           <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Estimasi Kepala Keluarga</p>
           <h3 className="text-3xl font-black text-slate-800">{totalKK} <span className="text-sm font-medium text-slate-400">KK</span></h3>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
         <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="text-orange-500" /> Data RW & RT
         </h2>
         <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                type="text" 
                placeholder="Cari Nomor RW..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
            </div>
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-200 shrink-0"
            >
                <Plus size={18} /> <span className="hidden sm:inline">Tambah Wilayah</span>
            </button>
         </div>
      </div>

      {/* RW Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {filteredRW.map((rw) => (
            <div 
              key={rw.no}
              onClick={() => setSelectedRW(rw)}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
               
               <div className="relative z-10">
                  <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-xl font-black mb-4 shadow-lg">
                     {rw.no}
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Rukun Warga {rw.no}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                     <MapPin size={12} /> {rw.location}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-50">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <UserCircle size={16} className="text-slate-400" />
                           <span className="text-sm font-bold text-slate-700">{rw.ketua}</span>
                        </div>
                     </div>
                     <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl">
                        <span className="text-xs font-bold text-slate-500 pl-1">Jumlah RT</span>
                        <span className="bg-white px-3 py-1 rounded-lg text-xs font-black text-orange-600 shadow-sm border border-slate-100">
                           {rw.rtList.length} RT
                        </span>
                     </div>
                  </div>
               </div>
            </div>
         ))}
      </div>

      {/* Detail Modal (RT List) */}
      {selectedRW && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-4xl max-h-[85vh] flex flex-col rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                 <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-orange-600 text-white rounded-3xl flex items-center justify-center text-2xl font-black shadow-lg shadow-orange-200">
                       {selectedRW.no}
                    </div>
                    <div>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Data Wilayah</p>
                       <h2 className="text-2xl font-black text-slate-800">Rukun Warga {selectedRW.no}</h2>
                       <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-1">
                          <MapPin size={14} /> {selectedRW.location}
                       </p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedRW(null)} className="p-2 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full border border-slate-200 transition-all">
                    <X size={24} />
                 </button>
              </div>

              {/* RT List Content */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Building2 size={20} className="text-blue-500" /> Daftar Rukun Tetangga (RT)
                    </h3>
                    <button className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                        <Plus size={14} /> Tambah RT
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedRW.rtList.map((rt) => (
                       <div key={rt.no} className="p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all flex items-center gap-4 group bg-slate-50/50 hover:bg-white">
                          <div className="w-12 h-12 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                             {rt.no}
                          </div>
                          <div className="flex-1">
                             <p className="text-xs font-bold text-slate-400 uppercase">Ketua RT {rt.no}</p>
                             <h4 className="font-bold text-slate-800">{rt.ketua}</h4>
                             <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[10px] font-mono bg-green-50 text-green-700 px-2 py-0.5 rounded flex items-center gap-1 border border-green-100">
                                   <Phone size={10} /> {rt.phone}
                                </span>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold border border-slate-200">
                                   {rt.kkCount} KK
                                </span>
                             </div>
                          </div>
                          <ChevronRight className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                       </div>
                    ))}
                    {selectedRW.rtList.length === 0 && (
                        <div className="col-span-2 text-center py-8 text-slate-400 text-sm italic">
                            Belum ada data RT di wilayah ini.
                        </div>
                    )}
                 </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 text-right">
                 <button 
                    onClick={() => setSelectedRW(null)}
                    className="px-6 py-3 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-900 transition-all"
                 >
                    Tutup Detail
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Add New RW Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl animate-in zoom-in-95">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[2rem]">
                 <h3 className="font-bold text-slate-800">Tambah Data RW</h3>
                 <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all">
                    <X size={20} />
                 </button>
              </div>
              
              <form onSubmit={handleSaveRW} className="p-6 space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Nomor RW</label>
                    <input 
                        type="text" 
                        placeholder="Contoh: 14" 
                        value={newRWData.no}
                        onChange={(e) => setNewRWData({...newRWData, no: e.target.value})}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Nama Ketua RW</label>
                    <input 
                        type="text" 
                        placeholder="Nama Lengkap Ketua" 
                        value={newRWData.ketua}
                        onChange={(e) => setNewRWData({...newRWData, ketua: e.target.value})}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Nomor Telepon</label>
                    <input 
                        type="text" 
                        placeholder="0812xxxx" 
                        value={newRWData.phone}
                        onChange={(e) => setNewRWData({...newRWData, phone: e.target.value})}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Alamat Sekretariat</label>
                    <textarea 
                        rows={2}
                        placeholder="Lokasi posko/sekretariat..." 
                        value={newRWData.location}
                        onChange={(e) => setNewRWData({...newRWData, location: e.target.value})}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                    ></textarea>
                 </div>

                 <div className="pt-4 flex gap-3">
                    <button 
                        type="button" 
                        onClick={() => setIsAddModalOpen(false)}
                        className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm"
                    >
                        Batal
                    </button>
                    <button 
                        type="submit"
                        className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 shadow-lg transition-all text-sm flex items-center justify-center gap-2"
                    >
                        <Save size={16} /> Simpan
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};

export default PartnerRTRWSection;
