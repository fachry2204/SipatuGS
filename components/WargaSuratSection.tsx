
import React, { useState } from 'react';
import { FileText, ChevronRight, Clock, PlusCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Citizen } from '../types';

interface WargaSuratSectionProps {
  citizen: Citizen | undefined;
}

const WargaSuratSection: React.FC<WargaSuratSectionProps> = ({ citizen }) => {
  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');

  const services = [
    { id: 1, title: 'Surat Pengantar RT/RW', desc: 'Untuk keperluan administrasi umum', icon: '📝' },
    { id: 2, title: 'Surat Keterangan Domisili', desc: 'Bukti tempat tinggal resmi', icon: '🏠' },
    { id: 3, title: 'Surat Keterangan Usaha', desc: 'Untuk keperluan UMKM / Bank', icon: '💼' },
    { id: 4, title: 'Surat Keterangan Tidak Mampu', desc: 'Untuk beasiswa atau bantuan', icon: '🤝' },
    { id: 5, title: 'Surat Pengantar SKCK', desc: 'Untuk kepolisian', icon: '👮' },
    { id: 6, title: 'Surat Keterangan Belum Menikah', desc: 'Administrasi pernikahan', icon: '💍' },
  ];

  // Mock History
  const history = [
    { id: 101, type: 'Surat Pengantar RT/RW', date: '2024-03-10', status: 'Selesai', note: 'Sudah bisa diambil di kantor kelurahan.' },
    { id: 102, type: 'Surat Keterangan Domisili', date: '2024-02-15', status: 'Ditolak', note: 'Foto KTP buram, mohon upload ulang.' },
    { id: 103, type: 'Surat Keterangan Usaha', date: '2024-03-14', status: 'Diproses', note: 'Sedang verifikasi staff.' },
  ];

  const handleRequest = (service: string) => {
    alert(`Fitur pengajuan ${service} akan segera hadir!`);
  };

  if (!citizen) {
     return <div className="p-8 text-center text-slate-500">Data warga tidak ditemukan.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Layanan Persuratan</h2>
           <p className="text-slate-500 text-sm">Ajukan surat pengantar secara online tanpa antri.</p>
        </div>
        <div className="bg-white p-1 rounded-xl border border-slate-200 flex">
           <button 
             onClick={() => setActiveTab('request')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'request' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
           >
             Buat Pengajuan
           </button>
           <button 
             onClick={() => setActiveTab('history')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
           >
             Riwayat ({history.length})
           </button>
        </div>
      </div>

      {activeTab === 'request' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {services.map(service => (
             <button 
               key={service.id}
               onClick={() => handleRequest(service.title)}
               className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all text-left group flex flex-col justify-between h-full"
             >
                <div>
                   <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{service.icon}</div>
                   <h3 className="font-bold text-slate-800 text-lg group-hover:text-orange-600 transition-colors">{service.title}</h3>
                   <p className="text-sm text-slate-500 mt-1">{service.desc}</p>
                </div>
                <div className="mt-6 flex items-center text-orange-500 text-sm font-bold">
                   Ajukan Sekarang <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
             </button>
           ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
           <div className="divide-y divide-slate-100">
              {history.map(item => (
                 <div key={item.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                       <div className={`p-3 rounded-xl ${
                          item.status === 'Selesai' ? 'bg-green-50 text-green-600' :
                          item.status === 'Ditolak' ? 'bg-red-50 text-red-600' :
                          'bg-blue-50 text-blue-600'
                       }`}>
                          <FileText size={24} />
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-800">{item.type}</h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                             <Clock size={12} /> Diajukan pada {item.date}
                          </p>
                          {item.note && (
                             <p className="text-sm text-slate-600 mt-2 bg-slate-100 p-2 rounded-lg">
                                Note: {item.note}
                             </p>
                          )}
                       </div>
                    </div>
                    <div className="shrink-0">
                       <span className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 w-fit ${
                          item.status === 'Selesai' ? 'bg-green-100 text-green-700' :
                          item.status === 'Ditolak' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                       }`}>
                          {item.status === 'Selesai' ? <CheckCircle2 size={14} /> : 
                           item.status === 'Ditolak' ? <XCircle size={14} /> : <Clock size={14} />}
                          {item.status}
                       </span>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default WargaSuratSection;
