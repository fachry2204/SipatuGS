
import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Users,
  ZoomIn,
  Navigation,
  RotateCcw,
  Trash2,
  Timer
} from 'lucide-react';
import L from 'leaflet';
import { Report, ReportStatus, DutyStatus } from '../types';
import { MOCK_STAFF } from '../constants';

// Component for Real-time Elapsed Timer
const LiveTimer: React.FC<{ startTime: string }> = ({ startTime }) => {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    const calculateElapsed = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      
      if (isNaN(start)) return '--:--:--';
      
      const diff = now - start;
      if (diff < 0) return '00:00:00';

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    setElapsed(calculateElapsed());
    const interval = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
      <span className="text-[10px] font-bold text-slate-500 uppercase">Lama Waktu Laporan :</span>
      <div className="flex items-center gap-1 text-xs font-mono font-bold text-rose-600">
        <Timer size={14} className="animate-pulse" />
        {elapsed}
      </div>
    </div>
  );
};

interface ReportDetailModalProps {
  report: Report;
  onClose: () => void;
  onAction: (report: Report, role: 'Admin' | 'PPSU') => void; // Trigger action modal
  onDelete?: () => void; // Optional delete callback
}

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ report, onClose, onAction, onDelete }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Get Assigned Staff Details
  const assignedStaff = report.assignedStaffIds 
    ? MOCK_STAFF.filter(staff => report.assignedStaffIds?.includes(staff.id))
    : [];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Cleanup existing map
    if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current).setView([report.latitude, report.longitude], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Custom Red Pin
    const redIcon = L.divIcon({
      className: 'custom-red-pin',
      html: `
        <div class="relative w-8 h-8">
          <div class="relative w-8 h-8 rounded-full border-2 border-white shadow-md bg-red-600 flex items-center justify-center">
             <div class="w-3 h-3 bg-white rounded-full"></div>
          </div>
          <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-3 bg-red-600"></div>
        </div>
      `,
      iconSize: [32, 40],
      iconAnchor: [16, 40]
    });

    L.marker([report.latitude, report.longitude], { icon: redIcon }).addTo(map);
    mapInstanceRef.current = map;

    setTimeout(() => map.invalidateSize(), 300);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [report]);

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
        case ReportStatus.NEW: return 'bg-red-100 text-red-700';
        case ReportStatus.PENDING_ACCEPTANCE: return 'bg-yellow-100 text-yellow-700';
        case ReportStatus.ON_THE_WAY: return 'bg-orange-100 text-orange-700';
        case ReportStatus.ARRIVED: return 'bg-blue-100 text-blue-700';
        case ReportStatus.IN_PROGRESS: return 'bg-indigo-100 text-indigo-700';
        case ReportStatus.VERIFICATION: return 'bg-purple-100 text-purple-700';
        case ReportStatus.REVISION: return 'bg-pink-100 text-pink-700';
        case ReportStatus.COMPLETED: return 'bg-green-100 text-green-700';
        case ReportStatus.REJECTED: return 'bg-gray-100 text-gray-700';
        default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Zoom Modal Overlay */}
      {zoomedImage && (
        <div 
            className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
            onClick={() => setZoomedImage(null)}
        >
            <img src={zoomedImage} alt="Zoomed View" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
            <button className="absolute top-4 right-4 text-white hover:text-red-400 p-2"><X size={32} /></button>
        </div>
      )}

      <div className="bg-white w-full max-w-5xl h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative">
        
        {/* Floating Close Button - Fixed Position */}
        <button 
             onClick={onClose}
             className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors z-[110] backdrop-blur-md"
        >
             <X size={20} />
        </button>

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 pr-16">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">
                        {report.ticketNumber}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${getStatusColor(report.status)}`}>
                        {report.status}
                    </span>
                    
                    {/* LIVE TIMER IN HEADER */}
                    {report.status !== ReportStatus.COMPLETED && report.status !== ReportStatus.REJECTED && (
                        <LiveTimer startTime={report.timestamp} />
                    )}
                </div>
                <h3 className="text-xl font-bold text-slate-800 line-clamp-1 mt-1">{report.title}</h3>
            </div>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Visuals */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Main Photo */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <h4 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Foto Laporan</h4>
                        <div 
                            className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative group cursor-pointer"
                            onClick={() => setZoomedImage(report.photoUrl)}
                        >
                            <img src={report.photoUrl} alt="Bukti" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ZoomIn className="text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Report Location Map */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <h4 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Lokasi Kejadian</h4>
                        <div className="h-48 rounded-xl overflow-hidden border border-slate-200 relative z-0 mb-3">
                            <div ref={mapContainerRef} className="w-full h-full z-0" />
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <MapPin size={16} className="shrink-0 mt-0.5 text-red-500" />
                                <span className="leading-tight">{report.location}</span>
                            </div>
                            
                            <a 
                                href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2.5 rounded-xl text-sm font-bold transition-colors border border-blue-200"
                            >
                                <ExternalLink size={16} /> Buka Google Maps
                            </a>
                        </div>
                    </div>

                    {/* Arrival Evidence Section */}
                    {report.photoArrival && (
                      <div className="bg-blue-50 p-4 rounded-2xl shadow-sm border border-blue-100">
                        <h4 className="text-sm font-bold text-blue-800 mb-3 uppercase tracking-wider flex items-center gap-2">
                           <Navigation size={16} /> Bukti Kedatangan Petugas
                        </h4>

                        {/* Arrival Photo */}
                        <div
                            className="aspect-video rounded-xl overflow-hidden bg-slate-200 border border-blue-200 relative group cursor-pointer mb-3 shadow-inner"
                            onClick={() => setZoomedImage(report.photoArrival!)}
                        >
                            <img src={report.photoArrival} alt="Bukti Sampai" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ZoomIn className="text-white" />
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                                Foto Lokasi
                            </div>
                        </div>

                        {/* GPS Info */}
                        {report.gpsArrival && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] text-blue-900 bg-white p-2 rounded border border-blue-100 font-mono">
                                    <span>Lat: {report.gpsArrival.lat.toFixed(6)}</span>
                                    <span>Lng: {report.gpsArrival.lng.toFixed(6)}</span>
                                </div>
                                <a
                                    href={`https://www.google.com/maps?q=${report.gpsArrival.lat},${report.gpsArrival.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                >
                                    <Navigation size={14} /> Buka Peta GPS Kedatangan
                                </a>
                            </div>
                        )}
                        {!report.gpsArrival && (
                            <div className="text-xs text-red-500 italic bg-red-50 p-2 rounded border border-red-100">
                                * Data GPS tidak tersedia saat check-in.
                            </div>
                        )}
                      </div>
                    )}

                    {/* NEW: Completion Evidence Section */}
                    {report.photoCompletion && (
                        <div className="bg-green-50 p-4 rounded-2xl shadow-sm border border-green-100">
                            <h4 className="text-sm font-bold text-green-800 mb-3 uppercase tracking-wider flex items-center gap-2">
                                <CheckCircle2 size={16} /> Bukti Pekerjaan Selesai
                            </h4>
                            <div
                                className="aspect-video rounded-xl overflow-hidden bg-slate-200 border border-green-200 relative group cursor-pointer shadow-inner"
                                onClick={() => setZoomedImage(report.photoCompletion!)}
                            >
                                <img src={report.photoCompletion} alt="Bukti Selesai" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <ZoomIn className="text-white" />
                                </div>
                                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                                    Hasil Akhir
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NEW: Revision Evidence Section */}
                    {report.photoRevision && (
                        <div className="bg-orange-50 p-4 rounded-2xl shadow-sm border border-orange-100">
                            <h4 className="text-sm font-bold text-orange-800 mb-3 uppercase tracking-wider flex items-center gap-2">
                                <RotateCcw size={16} /> Bukti Revisi Pekerjaan
                            </h4>
                            <div
                                className="aspect-video rounded-xl overflow-hidden bg-slate-200 border border-orange-200 relative group cursor-pointer shadow-inner"
                                onClick={() => setZoomedImage(report.photoRevision!)}
                            >
                                <img src={report.photoRevision} alt="Bukti Revisi" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <ZoomIn className="text-white" />
                                </div>
                                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                                    Perbaikan
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Details & History */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Info Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h4 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Detail Informasi</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase">Kategori</label>
                                    <p className="text-sm font-bold text-slate-800 mt-1">{report.category}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase">Waktu Pelaporan</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar size={14} className="text-slate-400" />
                                        <p className="text-sm font-bold text-slate-800">{report.timestamp}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase">Prioritas</label>
                                    <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-bold ${
                                        report.priority === 'High' ? 'bg-red-100 text-red-700' : 
                                        report.priority === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {report.priority} Priority
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase">Pelapor</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <User size={14} className="text-slate-400" />
                                        <p className="text-sm font-bold text-slate-800">{report.reporterName}</p>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5 mb-2">NIK: {report.reporterNik || '-'}</p>
                                    
                                    {report.reporterPhone ? (
                                        <a 
                                            href={`https://wa.me/${report.reporterPhone.replace(/[^0-9]/g, '')}`} 
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-green-200"
                                        >
                                            <MessageCircle size={14} /> Hubungi WhatsApp
                                        </a>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">Tidak ada nomor kontak</span>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase">Deskripsi Masalah</label>
                                    <p className="text-sm text-slate-700 mt-1 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        "{report.description}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ASSIGNED PPSU SECTION */}
                    {assignedStaff.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h4 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                                <Users size={16} /> Tim PPSU Bertugas
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {assignedStaff.map(staff => (
                                    <div key={staff.id} className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl">
                                        <img src={staff.fotoProfile} alt={staff.namaLengkap} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{staff.namaLengkap}</p>
                                            <p className="text-xs text-slate-500">{staff.nomorAnggota}</p>
                                            <span className="text-[10px] font-bold bg-white text-orange-600 px-2 py-0.5 rounded border border-orange-100 mt-1 inline-block">
                                                Status: {staff.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timeline / History */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h4 className="text-sm font-bold text-slate-500 mb-6 uppercase tracking-wider">Riwayat Status</h4>
                        <div className="relative pl-4 border-l-2 border-slate-100 space-y-8">
                            {report.logs.slice().reverse().map((log, index) => (
                                <div key={index} className="relative">
                                    <div className={`absolute -left-[21px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                                        index === 0 ? 'bg-blue-500 ring-4 ring-blue-50' : 'bg-slate-300'
                                    }`}></div>
                                    <div>
                                        <p className={`text-sm font-bold ${index === 0 ? 'text-slate-800' : 'text-slate-500'}`}>
                                            {log.status}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                            <Clock size={10} /> {log.timestamp} • oleh {log.actor}
                                        </p>
                                        {log.note && (
                                            <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded border border-slate-100 italic">
                                                "{log.note}"
                                            </p>
                                        )}

                                        {/* Dynamic Photo Thumbnails based on Status */}
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {/* ARRIVAL PHOTO */}
                                            {log.status === ReportStatus.ARRIVED && report.photoArrival && (
                                                <div className="group cursor-pointer" onClick={() => setZoomedImage(report.photoArrival!)}>
                                                    <p className="text-[10px] font-bold text-blue-500 mb-1">Kedatangan:</p>
                                                    <img 
                                                        src={report.photoArrival} 
                                                        alt="Arrival" 
                                                        className="w-20 h-20 rounded-lg object-cover border border-blue-200 hover:opacity-80 transition-opacity"
                                                    />
                                                </div>
                                            )}

                                            {/* COMPLETION PHOTO */}
                                            {log.status === ReportStatus.VERIFICATION && report.photoCompletion && (
                                                <div className="group cursor-pointer" onClick={() => setZoomedImage(report.photoCompletion!)}>
                                                    <p className="text-[10px] font-bold text-green-600 mb-1">Hasil Pekerjaan:</p>
                                                    <img 
                                                        src={report.photoCompletion} 
                                                        alt="Completion" 
                                                        className="w-20 h-20 rounded-lg object-cover border border-green-200 hover:opacity-80 transition-opacity"
                                                    />
                                                </div>
                                            )}

                                            {/* REVISION PHOTO */}
                                            {(log.status === ReportStatus.VERIFICATION || log.status === ReportStatus.COMPLETED) && report.photoRevision && (
                                                <div className="group cursor-pointer" onClick={() => setZoomedImage(report.photoRevision!)}>
                                                    <p className="text-[10px] font-bold text-orange-600 mb-1">Hasil Revisi:</p>
                                                    <img 
                                                        src={report.photoRevision} 
                                                        alt="Revision" 
                                                        className="w-20 h-20 rounded-lg object-cover border border-orange-200 hover:opacity-80 transition-opacity"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-white shrink-0 flex justify-end gap-3">
            {/* NEW: Delete Button (Available for authorized users via props) */}
            {onDelete && (
                <button
                    onClick={onDelete}
                    className="px-6 py-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 mr-auto"
                >
                    <Trash2 size={18} /> Hapus Laporan
                </button>
            )}

            {/* Action Buttons based on status */}
            {report.status === ReportStatus.NEW && (
                <>
                    <button 
                        onClick={() => onAction(report, 'Admin')}
                        className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm transition-colors"
                    >
                        Tolak Laporan
                    </button>
                    <button 
                        onClick={() => onAction(report, 'Admin')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                    >
                        <CheckCircle2 size={18} /> Verifikasi & Tugaskan PPSU
                    </button>
                </>
            )}

            {/* If assigned/progress, show view only for admin mostly, or update button */}
            {(report.status !== ReportStatus.NEW && report.status !== ReportStatus.COMPLETED && report.status !== ReportStatus.REJECTED && report.status !== ReportStatus.VERIFICATION) && (
                <span className="text-sm font-bold text-slate-500 italic py-3 px-4">
                    Sedang Diproses Petugas
                </span>
            )}

            {report.status === ReportStatus.VERIFICATION && (
                <button 
                    onClick={() => onAction(report, 'Admin')}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-200 transition-all flex items-center gap-2"
                >
                    <CheckCircle2 size={18} /> Verifikasi Hasil Pekerjaan
                </button>
            )}

            {/* Read Only View if Completed/Rejected */}
            {(report.status === ReportStatus.COMPLETED || report.status === ReportStatus.REJECTED) && (
                <span className="text-sm font-bold text-slate-400 italic py-3 px-4">
                    Laporan Selesai (Read Only)
                </span>
            )}
        </div>
      </div>
    </div>
  );
};

export default ReportDetailModal;
