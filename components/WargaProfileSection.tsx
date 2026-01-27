
import React from 'react';
import { Citizen, Gender } from '../types';
import { 
  User, 
  MapPin, 
  Phone, 
  Briefcase, 
  Calendar, 
  Heart, 
  Droplets, 
  CreditCard,
  Home
} from 'lucide-react';

interface WargaProfileSectionProps {
  citizen: Citizen | undefined;
}

const WargaProfileSection: React.FC<WargaProfileSectionProps> = ({ citizen }) => {
  if (!citizen) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-3xl shadow-sm border border-slate-100 text-center p-8">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <User size={40} className="text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Data Tidak Ditemukan</h3>
        <p className="text-slate-500 mt-2 max-w-md">
          Data kependudukan Anda belum terhubung dengan akun ini. Silakan hubungi admin kelurahan atau RT/RW setempat untuk sinkronisasi NIK.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-orange-500 to-amber-500 relative">
           <div className="absolute inset-0 bg-black/10"></div>
        </div>

        <div className="px-8 pb-8">
           <div className="flex flex-col md:flex-row gap-6 items-end -mt-12 relative z-10">
              <div className="w-32 h-32 rounded-3xl border-4 border-white bg-white shadow-lg overflow-hidden flex items-center justify-center">
                 {citizen.fotoWajah ? (
                    <img src={citizen.fotoWajah} alt={citizen.namaLengkap} className="w-full h-full object-cover" />
                 ) : (
                    <User size={48} className="text-slate-300" />
                 )}
              </div>
              <div className="flex-1 mb-2">
                 <h2 className="text-3xl font-bold text-slate-800">{citizen.namaLengkap}</h2>
                 <p className="text-slate-500 font-medium flex items-center gap-2">
                    <CreditCard size={16} /> NIK: {citizen.nik}
                 </p>
              </div>
              <div className="mb-2">
                 <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${
                    citizen.statusKtp === 'KTP DKI' ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'bg-orange-50 text-orange-700 border border-orange-100'
                 }`}>
                    {citizen.statusKtp}
                 </span>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              {/* Personal Info */}
              <div className="space-y-6">
                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                       <User size={16} /> Data Pribadi
                    </h3>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <span className="text-sm text-slate-500">Jenis Kelamin</span>
                          <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                             {citizen.jenisKelamin}
                          </span>
                       </div>
                       <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <span className="text-sm text-slate-500">Tempat Lahir</span>
                          <span className="text-sm font-bold text-slate-800">{citizen.tempatLahir}</span>
                       </div>
                       <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <span className="text-sm text-slate-500">Tanggal Lahir</span>
                          <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                             <Calendar size={14} className="text-orange-500" />
                             {new Date(citizen.tanggalLahir).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                          </span>
                       </div>
                       <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <span className="text-sm text-slate-500">Agama</span>
                          <span className="text-sm font-bold text-slate-800">{citizen.agama}</span>
                       </div>
                       <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <span className="text-sm text-slate-500">Status Kawin</span>
                          <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                             <Heart size={14} className="text-pink-500" />
                             {citizen.statusPerkawinan}
                          </span>
                       </div>
                       <div className="flex justify-between items-center pb-2">
                          <span className="text-sm text-slate-500">Gol. Darah</span>
                          <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                             <Droplets size={14} className="text-red-500" />
                             {citizen.golonganDarah}
                          </span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Contact & Job */}
              <div className="space-y-6">
                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                       <MapPin size={16} /> Domisili & Pekerjaan
                    </h3>
                    <div className="space-y-4">
                       <div className="space-y-1">
                          <label className="text-xs text-slate-500 font-bold">Alamat Lengkap</label>
                          <p className="text-sm text-slate-800 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                             {citizen.alamat}
                          </p>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                             <label className="text-xs text-slate-500 block mb-1">RT / RW</label>
                             <p className="text-sm font-bold text-slate-800">{citizen.rt} / {citizen.rw}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                             <label className="text-xs text-slate-500 block mb-1">Kelurahan</label>
                             <p className="text-sm font-bold text-slate-800">{citizen.kelurahan}</p>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-4 pt-2 border-t border-slate-200">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                             <Briefcase size={18} />
                          </div>
                          <div>
                             <p className="text-xs text-slate-500">Pekerjaan</p>
                             <p className="text-sm font-bold text-slate-800">{citizen.pekerjaan}</p>
                          </div>
                       </div>

                       <div className="flex items-center gap-4 pt-2">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                             <Phone size={18} />
                          </div>
                          <div>
                             <p className="text-xs text-slate-500">WhatsApp Terdaftar</p>
                             <p className="text-sm font-bold text-slate-800">+{citizen.nomorWhatsapp}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Family Card Info */}
                 <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <Home className="text-orange-400" />
                        <div>
                           <p className="text-xs text-slate-400 uppercase font-bold">Nomor Kartu Keluarga</p>
                           <p className="text-lg font-mono font-bold tracking-wider">{citizen.kk}</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                       *Pastikan data KK Anda selalu terupdate. Hubungi RT/RW setempat jika ada perubahan anggota keluarga.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default WargaProfileSection;
