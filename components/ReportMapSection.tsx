
import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { MapPin, Layers, ChevronUp, ChevronDown, Navigation, Calendar, Minimize2, Maximize2, Eye, ShieldCheck, Search, X, Timer } from 'lucide-react';
import { ReportStatus, Report, Staff } from '../types';
import ReportDetailModal from './ReportDetailModal';
import ReportActionModal from './ReportActionModal';

// Component for Real-time Elapsed Timer
const LiveTimer: React.FC<{ startTime: string, compact?: boolean }> = ({ startTime, compact = false }) => {
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

  if (compact) {
    return (
      <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
        <Timer size={10} className="animate-pulse" />
        {elapsed}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-mono font-bold text-slate-600 border border-slate-200">
      <Timer size={12} className="text-rose-500 animate-pulse" />
      {elapsed}
    </div>
  );
};

interface ReportMapSectionProps {
  reports: Report[];
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
  staffList: Staff[];
  setStaffList: React.Dispatch<React.SetStateAction<Staff[]>>;
}

const ReportMapSection: React.FC<ReportMapSectionProps> = ({ reports, setReports, staffList, setStaffList }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  
  const [activeFilter, setActiveFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals for Detail and Actions
  const [detailReport, setDetailReport] = useState<Report | null>(null);
  const [actionData, setActionData] = useState<{report: Report, role: 'Admin' | 'PPSU'} | null>(null);

  // Minimize States
  const [isListMinimized, setIsListMinimized] = useState(false);
  const [isLegendMinimized, setIsLegendMinimized] = useState(false);

  // 1. Filter Data: Exclude Completed and Rejected
  const activeReports = useMemo(() => {
    return reports.filter(r => 
        r.status !== ReportStatus.COMPLETED && 
        r.status !== ReportStatus.REJECTED
    );
  }, [reports]);

  // 2. Filter Displayed Data based on Legend Selection AND Search Term
  const displayedReports = useMemo(() => {
    let filtered = activeReports;

    // Filter by Status
    if (activeFilter !== 'ALL') {
      filtered = filtered.filter(r => r.status === activeFilter);
    }

    // Filter by Search Term
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(lowerTerm) ||
        r.ticketNumber.toLowerCase().includes(lowerTerm) ||
        r.location.toLowerCase().includes(lowerTerm)
      );
    }

    return filtered;
  }, [activeReports, activeFilter, searchTerm]);

  // Stats for Legend
  const stats = useMemo(() => ({
     all: activeReports.length,
     new: activeReports.filter(r => r.status === ReportStatus.NEW).length,
     pending: activeReports.filter(r => r.status === ReportStatus.PENDING_ACCEPTANCE).length,
     otw: activeReports.filter(r => r.status === ReportStatus.ON_THE_WAY).length,
     arrived: activeReports.filter(r => r.status === ReportStatus.ARRIVED).length,
     progress: activeReports.filter(r => r.status === ReportStatus.IN_PROGRESS).length,
     verify: activeReports.filter(r => r.status === ReportStatus.VERIFICATION).length,
     revision: activeReports.filter(r => r.status === ReportStatus.REVISION).length,
  }), [activeReports]);

  // Helper to fly to location
  const flyToReport = (report: Report) => {
    setSelectedReport(report);
    mapInstanceRef.current?.flyTo([report.latitude, report.longitude], 18, {
        animate: true,
        duration: 1.5
    });
  };

  // Handle Updates from Action Modal
  const handleUpdateReport = (updatedReport: Report, staffUpdates?: Staff[]) => {
    setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
    // Update local selected states if they match
    if (selectedReport?.id === updatedReport.id) setSelectedReport(updatedReport);
    if (detailReport?.id === updatedReport.id) setDetailReport(updatedReport);

    if (staffUpdates && staffUpdates.length > 0) {
        setStaffList(prevStaff => {
            return prevStaff.map(s => {
                const update = staffUpdates.find(u => u.id === s.id);
                return update ? update : s;
            });
        });
    }
  };

  const handleDetailAction = (report: Report, role: 'Admin' | 'PPSU') => {
    setActionData({ report, role });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([-6.2297, 106.7800], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    displayedReports.forEach(report => {
        let colorClass = 'bg-slate-500';
        let ringClass = 'border-white';
        let animationHtml = '';

        // Status Styling Logic
        if (report.status === ReportStatus.NEW) {
            colorClass = 'bg-red-600';
            // Custom rapid wide blink for NEW
            animationHtml = `<div class="absolute inset-0 -m-3 rounded-full bg-red-500 opacity-60 animate-ping-rapid"></div>`;
        } else if (report.status === ReportStatus.PENDING_ACCEPTANCE) {
            colorClass = 'bg-yellow-500';
            animationHtml = `<div class="absolute inset-0 rounded-full bg-yellow-500 opacity-60 animate-pulse"></div>`;
        } else if (report.status === ReportStatus.ON_THE_WAY) {
            colorClass = 'bg-orange-500';
            animationHtml = `<div class="absolute inset-0 rounded-full bg-orange-500 opacity-60 animate-pulse"></div>`;
        } else if (report.status === ReportStatus.ARRIVED) {
            colorClass = 'bg-blue-500';
        } else if (report.status === ReportStatus.IN_PROGRESS) {
            colorClass = 'bg-indigo-600';
            animationHtml = `<div class="absolute inset-0 rounded-full bg-indigo-600 opacity-60 animate-pulse"></div>`;
        } else if (report.status === ReportStatus.VERIFICATION) {
            colorClass = 'bg-purple-600';
        } else if (report.status === ReportStatus.REVISION) {
            colorClass = 'bg-pink-600';
            ringClass = 'border-pink-200';
        }

        const customIcon = L.divIcon({
            className: 'custom-report-marker',
            html: `
              <div class="relative w-6 h-6 group cursor-pointer hover:scale-110 transition-transform">
                 ${animationHtml}
                 <div class="relative w-6 h-6 rounded-full border-2 ${ringClass} shadow-md ${colorClass} flex items-center justify-center z-10">
                    <div class="w-2 h-2 bg-white rounded-full"></div>
                 </div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        const marker = L.marker([report.latitude, report.longitude], { icon: customIcon });
        marker.on('click', () => {
            flyToReport(report);
        });
        markersLayerRef.current?.addLayer(marker);
    });
  }, [displayedReports]);

  // Legend Button Helper
  const LegendBtn = ({ status, label, count, color, activeKey }: any) => (
    <button 
        onClick={() => setActiveFilter(status)} 
        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeFilter === activeKey ? `bg-${color}-50 text-${color}-800 border border-${color}-100` : 'text-slate-500 hover:bg-slate-50'
        }`}
    >
        <span className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full bg-${color}-500 ${activeKey === ReportStatus.NEW ? 'animate-ping' : ''}`}></div> 
            {label}
        </span>
        <span className={`bg-${color}-100 text-${color}-700 px-1.5 rounded min-w-[20px] text-center`}>{count}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full w-full relative">
       {/* Filters Overlay - Collapsible */}
       <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 transition-all duration-300">
          <div className={`bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-white/50 transition-all duration-300 overflow-hidden ${isLegendMinimized ? 'w-12 h-12 p-0 flex items-center justify-center cursor-pointer' : 'w-64 p-4 max-h-[70vh]'}`}>
             
             {/* Header */}
             <div 
               className={`flex items-center justify-between ${isLegendMinimized ? 'w-full h-full p-0 justify-center' : 'mb-3'}`}
               onClick={() => setIsLegendMinimized(!isLegendMinimized)}
             >
                {!isLegendMinimized && (
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Layers size={18} className="text-blue-600" /> Status Laporan
                    </h3>
                )}
                <button className="text-slate-400 hover:text-slate-600">
                    {isLegendMinimized ? <Layers size={20} className="text-blue-600" /> : <ChevronUp size={18} />}
                </button>
             </div>

             {/* Content */}
             {!isLegendMinimized && (
                 <div className="space-y-1 overflow-y-auto custom-scrollbar max-h-[60vh]">
                    <button onClick={() => setActiveFilter('ALL')} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors mb-2 ${activeFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    <span>Semua Aktif</span>
                    <span className="bg-white/20 text-white px-1.5 rounded">{stats.all}</span>
                    </button>
                    
                    <LegendBtn status={ReportStatus.NEW} activeKey={ReportStatus.NEW} label="Baru" count={stats.new} color="red" />
                    <LegendBtn status={ReportStatus.PENDING_ACCEPTANCE} activeKey={ReportStatus.PENDING_ACCEPTANCE} label="Menunggu" count={stats.pending} color="yellow" />
                    <LegendBtn status={ReportStatus.ON_THE_WAY} activeKey={ReportStatus.ON_THE_WAY} label="Petugas OTW" count={stats.otw} color="orange" />
                    <LegendBtn status={ReportStatus.ARRIVED} activeKey={ReportStatus.ARRIVED} label="Sampai Lokasi" count={stats.arrived} color="blue" />
                    <LegendBtn status={ReportStatus.IN_PROGRESS} activeKey={ReportStatus.IN_PROGRESS} label="Dikerjakan" count={stats.progress} color="indigo" />
                    <LegendBtn status={ReportStatus.VERIFICATION} activeKey={ReportStatus.VERIFICATION} label="Verifikasi" count={stats.verify} color="purple" />
                    <LegendBtn status={ReportStatus.REVISION} activeKey={ReportStatus.REVISION} label="Revisi" count={stats.revision} color="pink" />
                 </div>
             )}
          </div>
       </div>

       {/* Map */}
       <div className="relative flex-1 bg-slate-100 overflow-hidden">
            <div ref={mapContainerRef} className="w-full h-full z-0" />
            
            {/* Selected Report Card Overlay (Popup Laporan) */}
            {selectedReport && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 w-[90%] md:w-96 z-[1000] bg-white rounded-2xl shadow-2xl p-4 border border-slate-100 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="flex gap-4">
                        <img src={selectedReport.photoUrl} className="w-24 h-24 rounded-xl object-cover shrink-0 bg-slate-100" alt="" />
                        <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">{selectedReport.ticketNumber}</span>
                            <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Tutup</button>
                        </div>
                        <h4 className="font-bold text-slate-800 mt-1 line-clamp-1">{selectedReport.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{selectedReport.description}</p>
                        <div className="mt-2 flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1 ${
                                selectedReport.status === ReportStatus.NEW ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                                {selectedReport.status}
                            </span>
                            {/* LIVE TIMER IN POPUP */}
                            <LiveTimer startTime={selectedReport.timestamp} />
                        </div>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                        <button 
                            onClick={() => setDetailReport(selectedReport)}
                            className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                            <ShieldCheck size={14} /> Lihat Detail & Aksi
                        </button>
                        <a 
                            href={`https://www.google.com/maps?q=${selectedReport.latitude},${selectedReport.longitude}`}
                            target="_blank"
                            className="bg-slate-50 hover:bg-slate-100 text-slate-600 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                            <Navigation size={14} /> Rute
                        </a>
                    </div>
                </div>
            )}
       </div>

       {/* Bottom List Section - Resizable */}
       <div className={`bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col shrink-0 transition-all duration-300 ease-in-out ${isListMinimized ? 'h-14' : 'h-72'}`}>
          <div 
            className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => setIsListMinimized(!isListMinimized)}
          >
             <div className="flex items-center gap-4 flex-1">
                <button className="text-slate-400 shrink-0">
                    {isListMinimized ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                <div className="shrink-0">
                    <h3 className="text-sm font-bold text-slate-800">Daftar Laporan {activeFilter !== 'ALL' ? `(${activeFilter})` : 'Aktif'}</h3>
                    {!isListMinimized && <p className="text-xs text-slate-500 hidden sm:block">Klik item untuk menuju lokasi laporan.</p>}
                </div>
                
                {/* Search Bar - Only show when expanded */}
                {!isListMinimized && (
                    <div 
                        className="relative flex-1 max-w-xs ml-4"
                        onClick={(e) => e.stopPropagation()} // Prevent collapse when clicking input
                    >
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari tiket, judul..." 
                            className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-full text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                )}
             </div>
             
             <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-lg ml-2 shrink-0">
                {displayedReports.length} Laporan
             </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white">
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {displayedReports.map(report => (
                    <div 
                        key={report.id}
                        onClick={() => flyToReport(report)}
                        className={`
                            group flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md
                            ${selectedReport?.id === report.id 
                                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' 
                                : 'bg-white border-slate-100 hover:border-blue-200'
                            }
                        `}
                    >
                        <div className="relative shrink-0">
                            <img src={report.photoUrl} alt="" className="w-12 h-12 rounded-lg object-cover bg-slate-200" />
                            {report.status === ReportStatus.NEW && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-ping"></span>
                            )}
                        </div>
                        
                        <div className="overflow-hidden min-w-0 flex-1">
                            <div className="flex justify-between items-center mb-0.5 gap-2">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                    report.status === ReportStatus.NEW ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {report.status === ReportStatus.NEW ? 'BARU' : report.status.split(' ')[0]}
                                </span>
                                {/* LIVE TIMER COMPACT IN LIST */}
                                <LiveTimer startTime={report.timestamp} compact />
                            </div>
                            <h4 className="text-xs font-bold text-slate-700 truncate">{report.title}</h4>
                            <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                <MapPin size={10} /> {report.location}
                            </p>
                        </div>
                    </div>
                ))}
                {displayedReports.length === 0 && (
                    <div className="col-span-full py-8 text-center text-slate-400 text-sm">
                        Tidak ada laporan yang sesuai pencarian/filter.
                    </div>
                )}
             </div>
          </div>
       </div>

        {/* DETAIL MODAL */}
        {detailReport && (
            <ReportDetailModal 
                report={detailReport}
                onClose={() => setDetailReport(null)}
                onAction={handleDetailAction}
            />
        )}

        {/* ACTION MODAL */}
        {actionData && (
            <ReportActionModal 
                report={actionData.report}
                role={actionData.role}
                staffList={staffList}
                onClose={() => setActionData(null)}
                onUpdate={handleUpdateReport}
            />
        )}
    </div>
  );
};

export default ReportMapSection;
