
import React, { useEffect, useRef } from 'react';
import { 
  X, 
  MapPin, 
  MessageCircle, 
  Calendar, 
  User, 
  CreditCard, 
  Briefcase, 
  Flag, 
  Home, 
  Search,
  Users,
  Pencil,
  Trash2,
  Droplets,
  Heart,
  Globe,
  Plane
} from 'lucide-react';
import L from 'leaflet';
import { Citizen, Gender } from '../types';

interface CitizenProfileModalProps {
  citizen: Citizen;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSearchKK: (kk: string) => void;
}

const CitizenProfileModal: React.FC<CitizenProfileModalProps> = ({ citizen, onClose, onEdit, onDelete, onSearchKK }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Determine Citizen Type for Display Logic
  const isPendatang = citizen.statusKtp === 'Pendatang';
  const isWNA = citizen.kewarganegaraan === 'WNA';

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Default coordinates if not present
    const lat = citizen.latitude || -6.231984;
    const lng = citizen.longitude || 106.778875;

    if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
    }

    // Initialize Map
    const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false
    }).setView([lat, lng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Custom Marker
    const marker = L.marker([lat, lng]).addTo(map);
    
    mapInstanceRef.current = map;

    // Invalidate size after modal animation
    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [citizen]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-50 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative">
        
        {/* Floating Close Button - Fixed Position */}
        <button 
             onClick={onClose}
             className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors z-[60] backdrop-blur-md"
        >
             <X size={20} />
        </button>

        {/* Content Section - Banner is now inside scroll view to prevent clipping */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            
            {/* Header Banner */}
            <div className="h-32 bg-gradient-to-r from-teal-600 to-emerald-600 shrink-0 relative">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            </div>

            <div className="px-6 md:px-8 pb-8">
                
                {/* Profile Header Block - Overlapping Banner */}
                <div className="flex flex-col md:flex-row gap-6 mb-8 -mt-12 items-end relative z-10">
                    {/* Profile Image */}
                    <div className="shrink-0 mx-auto md:mx-0 relative">
                        <div className="w-32 h-32 rounded-3xl border-[6px] border-white bg-white shadow-xl overflow-hidden flex items-center justify-center relative z-10">
                            {citizen.fotoWajah ? (
                                /* FIX: Changed object-cover to object-contain and added bg-slate-50 */
                                <img src={citizen.fotoWajah} alt={citizen.namaLengkap} className="w-full h-full object-contain bg-slate-50" />
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center text-4xl font-bold text-white ${citizen.jenisKelamin === Gender.MALE ? 'bg-blue-400' : 'bg-pink-400'}`}>
                                    {citizen.namaLengkap.substring(0,1)}
                                </div>
                            )}
                        </div>
                        <div className={`absolute bottom-2 -right-2 px-3 py-1 rounded-full text-[10px] font-bold shadow-md z-20 border-2 border-white uppercase ${citizen.jenisKelamin === Gender.MALE ? 'bg-blue-500 text-white' : 'bg-pink-500 text-white'}`}>
                            {citizen.jenisKelamin}
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 text-center md:text-left pt-2 md:pt-0">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">
                            {citizen.namaLengkap}
                        </h2>
                        <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
                            <CreditCard size={16} /> NIK: {citizen.nik}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 w-full md:w-auto shrink-0 justify-center">
                        <button 
                            onClick={onEdit}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl text-sm font-bold transition-all shadow-sm"
                        >
                            <Pencil size={16} /> Edit
                        </button>
                        <button 
                            onClick={onDelete}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-100 rounded-xl text-sm font-bold transition-all shadow-sm"
                        >
                            <Trash2 size={16} /> Hapus
                        </button>
                    </div>
                </div>

                {/* KK Card */}
                <div className="mb-8">
                    <button 
                        onClick={() => onSearchKK(citizen.kk)}
                        className="w-full bg-white p-4 rounded-2xl border border-orange-100 shadow-sm hover:shadow-md hover:border-orange-300 transition-all group flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                                <Users size={24} />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">Kartu Keluarga</p>
                                <p className="text-lg font-bold text-slate-800">{citizen.kk}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-400 group-hover:text-orange-600 transition-colors">
                            Lihat Anggota <Search size={16} />
                        </div>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Personal Data & Origin */}
                    <div className="space-y-6">
                        {/* Biodata Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                                <User size={16} /> Biodata Lengkap
                            </h3>
                            
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Tempat Lahir</label>
                                        <p className="font-semibold text-slate-700">{citizen.tempatLahir}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Tanggal Lahir</label>
                                        <div className="flex items-center gap-2 font-semibold text-slate-700">
                                            <Calendar size={14} className="text-teal-500" /> 
                                            {new Date(citizen.tanggalLahir).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Agama</label>
                                        <p className="font-semibold text-slate-700">{citizen.agama}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Gol. Darah</label>
                                        <div className="flex items-center gap-2 font-semibold text-slate-700">
                                            <Droplets size={14} className="text-red-500" />
                                            {citizen.golonganDarah || '-'}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Status Perkawinan</label>
                                        <div className="flex items-center gap-2 font-semibold text-slate-700">
                                            <Heart size={14} className="text-pink-500" />
                                            {citizen.statusPerkawinan}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Pekerjaan</label>
                                        <div className="flex items-center gap-2 font-semibold text-slate-700">
                                            <Briefcase size={14} className="text-slate-400" />
                                            {citizen.pekerjaan}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                        <div>
                                            <label className="text-xs text-slate-400 block">Status KTP</label>
                                            <p className={`font-bold ${isPendatang ? 'text-orange-600' : 'text-slate-700'}`}>{citizen.statusKtp}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 block text-right">Kewarganegaraan</label>
                                            <p className={`font-bold text-right ${isWNA ? 'text-purple-600' : 'text-slate-700'}`}>{citizen.kewarganegaraan}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* NEW: Origin Details for Migrants (Pendatang) or Foreigners (WNA) */}
                        {(isPendatang || isWNA) && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1 h-full ${isWNA ? 'bg-purple-500' : 'bg-orange-500'}`}></div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    {isWNA ? <Globe size={16} className="text-purple-500" /> : <Plane size={16} className="text-orange-500" />}
                                    {isWNA ? 'Informasi Warga Asing' : 'Daerah Asal (Pendatang)'}
                                </h3>
                                
                                <div className="space-y-4">
                                    {isWNA ? (
                                        <>
                                            <div>
                                                <label className="text-xs text-slate-400 block mb-1">Negara Asal</label>
                                                <p className="font-bold text-slate-800 text-lg">{citizen.negaraAsal || '-'}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-400 block mb-1">Nomor Paspor / Dokumen Imigrasi</label>
                                                <p className="font-mono font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 inline-block">
                                                    {citizen.nomorPaspor || 'Tidak Ada Data'}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <label className="text-xs text-slate-400 block mb-1">Alamat Asli (Sesuai KTP)</label>
                                                <p className="font-bold text-slate-800 leading-snug">{citizen.alamatAsli || '-'}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Provinsi</label>
                                                    <p className="font-semibold text-slate-700">{citizen.asalProvinsi || '-'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Kota/Kabupaten</label>
                                                    <p className="font-semibold text-slate-700">{citizen.asalKota || '-'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Kecamatan</label>
                                                    <p className="font-semibold text-slate-700">{citizen.asalKecamatan || '-'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Kelurahan</label>
                                                    <p className="font-semibold text-slate-700">{citizen.asalKelurahan || '-'}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Address */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                                <MapPin size={16} /> Domisili & Kontak
                            </h3>

                            <div className="space-y-6 flex-1">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 mt-1">
                                        <Home size={18} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Alamat Lengkap</label>
                                        <p className="font-bold text-slate-800 leading-snug">{citizen.alamat}</p>
                                        <p className="text-sm text-slate-500 mt-1">
                                            RT {citizen.rt} / RW {citizen.rw}, {citizen.kelurahan}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {citizen.kecamatan}, {citizen.kota}, {citizen.provinsi}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                                        <MessageCircle size={18} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Kontak WhatsApp</label>
                                        <a 
                                            href={`https://wa.me/${citizen.nomorWhatsapp}`} 
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-bold text-green-600 hover:text-green-700 hover:underline text-lg font-mono"
                                        >
                                            +{citizen.nomorWhatsapp}
                                        </a>
                                    </div>
                                </div>

                                {/* Mini Map */}
                                <div className="pt-4 mt-auto">
                                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                                        <div ref={mapContainerRef} className="w-full h-full z-0" />
                                        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur px-2 py-1 text-[10px] rounded shadow-sm text-slate-500 z-[400] font-mono">
                                            {citizen.latitude?.toFixed(5)}, {citizen.longitude?.toFixed(5)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenProfileModal;
