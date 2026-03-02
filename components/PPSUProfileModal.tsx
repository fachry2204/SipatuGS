
import React, { useEffect, useRef } from 'react';
import { 
  X, 
  MapPin, 
  MessageCircle, 
  Calendar, 
  Pencil, 
  Trash2, 
  User as UserIcon,
  CreditCard,
  Map as MapIcon
} from 'lucide-react';
import L from 'leaflet';
import { PPSU, User } from '../types';

interface PPSUProfileModalProps {
  staff: PPSU;
  onClose: () => void;
  user: User;
  onDelete: () => void;
  onEdit: () => void;
}

const PPSUProfileModal: React.FC<PPSUProfileModalProps> = ({ staff, onClose, user, onDelete, onEdit }) => {
  const isAuthorized = ['Admin', 'KASI', 'Pimpinan'].includes(user.role);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Cleanup existing map if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Map
    const map = L.map(mapContainerRef.current).setView([staff.latitude, staff.longitude], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Custom Marker
    const colorClass = 'bg-orange-500';
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="relative w-8 h-8">
          <div class="absolute inset-0 rounded-full ${colorClass} opacity-40 animate-ping"></div>
          <div class="relative w-8 h-8 rounded-full border-2 border-white shadow-md ${colorClass} flex items-center justify-center">
            <img src="${staff.fotoProfile}" class="w-full h-full rounded-full object-cover p-[1px]" />
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    L.marker([staff.latitude, staff.longitude], { icon: customIcon }).addTo(map);

    mapInstanceRef.current = map;

    // Invalidate size after modal animation to prevent gray map
    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [staff]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative">
        
        {/* Floating Close Button */}
        <button 
             onClick={onClose}
             className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors z-[60]"
        >
             <X size={20} />
        </button>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Banner moved inside scroll view */}
            <div className="h-32 bg-gradient-to-r from-orange-400 to-orange-600 shrink-0 relative">
            </div>

            <div className="px-8 pb-8">
              {/* Profile Header - Overlapping Banner */}
              <div className="relative -mt-16 mb-6 flex flex-col items-center text-center">
                 <div className="w-32 h-32 rounded-3xl bg-white p-1.5 shadow-xl rotate-3 hover:rotate-0 transition-transform duration-300">
                    <img src={staff.fotoProfile} alt={staff.namaLengkap} className="w-full h-full object-cover rounded-2xl" />
                 </div>
                 <div className="mt-4">
                    <h2 className="text-2xl font-black text-slate-800 mb-1">{staff.namaLengkap}</h2>
                    <p className="text-orange-600 font-bold bg-orange-50 px-3 py-1 rounded-full inline-block">{staff.nomorAnggota}</p>
                 </div>
              </div>

              {/* Status Bar */}
              <div className="flex justify-center gap-4 mb-8">
                 <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    <div className={`w-3 h-3 rounded-full ${
                        staff.status === 'Online' ? 'bg-green-500' : 
                        staff.status === 'Bertugas' ? 'bg-blue-500' :
                        staff.status === 'Standby' ? 'bg-amber-500' : 'bg-slate-300'
                    }`}></div>
                    <span className="text-sm font-bold text-slate-600">{staff.status}</span>
                 </div>
                 <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    <CreditCard size={16} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-600 font-mono">{staff.nik}</span>
                 </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Personal Info */}
                 <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <UserIcon size={16} /> Informasi Pribadi
                    </h3>
                    
                    <div className="space-y-3">
                       <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
                             <UserIcon size={16} />
                          </div>
                          <div>
                             <p className="text-xs text-slate-400 font-bold uppercase">Jenis Kelamin</p>
                             <p className="font-bold text-slate-700">{staff.jenisKelamin}</p>
                          </div>
                       </div>

                       <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
                             <MessageCircle size={16} />
                          </div>
                          <div>
                             <p className="text-xs text-slate-400 font-bold uppercase">WhatsApp</p>
                             <a href={`https://wa.me/${staff.nomorWhatsapp}`} target="_blank" className="font-bold text-green-600 hover:underline">
                                {staff.nomorWhatsapp}
                             </a>
                          </div>
                       </div>

                       <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
                             <MapPin size={16} />
                          </div>
                          <div>
                             <p className="text-xs text-slate-400 font-bold uppercase">Alamat</p>
                             <p className="font-bold text-slate-700 text-sm">{staff.alamatLengkap}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Work Info */}
                 <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                       <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                           <Calendar size={16} /> Informasi Tugas
                       </h3>
                       <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
                             <Calendar size={16} />
                          </div>
                          <div>
                             <p className="text-xs text-slate-400 font-bold uppercase">Tanggal Masuk</p>
                             <p className="font-bold text-slate-700">
                                {new Date(staff.tanggalMasuk).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                             </p>
                          </div>
                       </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-48 relative overflow-hidden group">
                       <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2 relative z-10">
                           <MapIcon size={16} /> Lokasi Terakhir
                       </h3>
                       <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>
                       <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-transparent pointer-events-none z-0 h-12"></div>
                    </div>
                 </div>
              </div>
            </div>
        </div>

        {/* Action Footer */}
        {isAuthorized && (
           <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
              <button 
                 onClick={onEdit}
                 className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-100"
              >
                 <Pencil size={18} /> Edit Data
              </button>
              <button 
                 onClick={onDelete}
                 className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-100"
              >
                 <Trash2 size={18} /> Hapus Data
              </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default PPSUProfileModal;
