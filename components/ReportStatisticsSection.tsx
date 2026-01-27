
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, ComposedChart, AreaChart, Area
} from 'recharts';
import { 
  FileBarChart, 
  PieChart as PieChartIcon, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Siren, 
  TrendingUp, 
  Filter,
  Download,
  Timer,
  BarChart3,
  X,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  ChevronRight,
  LayoutDashboard,
  Map,
  Trophy,
  Users,
  Play,
  Pause,
  Layers,
  Volume2,
  VolumeX,
  BellRing
} from 'lucide-react';
import { ReportStatus, Report, Staff } from '../types';
import ReportDetailModal from './ReportDetailModal'; 
import ReportActionModal from './ReportActionModal'; 

interface ReportStatisticsSectionProps {
  reports: Report[];
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
  staffList: Staff[];
  setStaffList: React.Dispatch<React.SetStateAction<Staff[]>>;
}

const formatDuration = (ms: number) => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (days > 0) return `${days} Hari ${remainingHours} Jam`;
  return `${hours} Jam`;
};

const ReportStatisticsSection: React.FC<ReportStatisticsSectionProps> = ({ reports, setReports, staffList, setStaffList }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAlertOpen, setIsAlertOpen] = useState(false); 
  const [activeSlide, setActiveSlide] = useState<1 | 2>(1);
  const [slideProgress, setSlideProgress] = useState(0);
  const [isAutoSlideEnabled, setIsAutoSlideEnabled] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | null>(null);
  const [drillDownReports, setDrillDownReports] = useState<Report[]>([]);
  const [detailReport, setDetailReport] = useState<Report | null>(null);
  const [actionData, setActionData] = useState<{report: Report, role: 'Admin' | 'PPSU'} | null>(null);

  // Audio Context for Alarm
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  const stopAlarm = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) {}
      oscillatorRef.current = null;
    }
  };

  const startAlarm = () => {
    stopAlarm();
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 1);
    oscillatorRef.current = osc;
  };

  // Logic to calculate status counts
  const statusCounts = useMemo(() => {
    const counts = {
      [ReportStatus.NEW]: 0, [ReportStatus.PENDING_ACCEPTANCE]: 0,
      [ReportStatus.ON_THE_WAY]: 0, [ReportStatus.ARRIVED]: 0,
      [ReportStatus.IN_PROGRESS]: 0, [ReportStatus.VERIFICATION]: 0,
      [ReportStatus.REVISION]: 0, [ReportStatus.COMPLETED]: 0,
      [ReportStatus.REJECTED]: 0
    };
    reports.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
    return counts;
  }, [reports]);

  // Alert condition evaluation
  const alertSystem = useMemo(() => {
    const newAndPending = statusCounts[ReportStatus.NEW] + statusCounts[ReportStatus.PENDING_ACCEPTANCE];
    const inProgress = statusCounts[ReportStatus.IN_PROGRESS];
    if (newAndPending >= 10) return { level: 'CRITICAL', message: `DARURAT: Penumpukan ${newAndPending} laporan Baru/Menunggu.`, color: 'bg-red-600', icon: <Siren className="animate-pulse text-white" size={48} /> };
    else if (inProgress >= 15) return { level: 'WARNING', message: `PERINGATAN: ${inProgress} laporan sedang dikerjakan.`, color: 'bg-amber-500', icon: <AlertTriangle className="text-white" size={48} /> };
    else return { level: 'SAFE', message: 'STATUS AMAN: Operasional berjalan normal.', color: 'bg-emerald-600', icon: <CheckCircle2 className="text-white" size={32} /> };
  }, [statusCounts]);

  // Timer 5 second logic for Alert
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAlertOpen && alertSystem.level !== 'SAFE') {
        setIsAlertOpen(true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isAlertOpen, alertSystem]);

  // Alarm Sound logic
  useEffect(() => {
    let soundInterval: any;
    if (isAlertOpen && (alertSystem.level === 'CRITICAL' || alertSystem.level === 'WARNING')) {
        soundInterval = setInterval(startAlarm, 1200);
    } else {
        stopAlarm();
    }
    return () => {
        clearInterval(soundInterval);
        stopAlarm();
    };
  }, [isAlertOpen, alertSystem.level]);

  // Slide system logic
  useEffect(() => {
    const intervalTime = 100;
    const totalSteps = 100;
    let timer: any;
    const isModalOpen = !!(selectedStatus || detailReport || actionData || isAlertOpen);
    if (isAutoSlideEnabled && !isModalOpen) {
      timer = setInterval(() => {
        setSlideProgress((prev) => {
          if (prev >= totalSteps) {
            setActiveSlide((current) => (current === 1 ? 2 : 1));
            return 0;
          }
          return prev + 1;
        });
      }, intervalTime);
    }
    return () => clearInterval(timer);
  }, [isAutoSlideEnabled, selectedStatus, detailReport, actionData, isAlertOpen]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const kpiData = useMemo(() => {
    const total = reports.length;
    const completed = statusCounts[ReportStatus.COMPLETED];
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    let totalDurationMs = 0;
    let completedCount = 0;
    reports.forEach(r => {
      if (r.status === ReportStatus.COMPLETED) {
        const start = new Date(r.timestamp).getTime();
        const end = start + (Math.random() * 172800000); 
        totalDurationMs += (end - start);
        completedCount++;
      }
    });
    const avgTime = completedCount > 0 ? totalDurationMs / completedCount : 0;
    return { total, completed, completionRate: completionRate.toFixed(1), avgTimeStr: formatDuration(avgTime) };
  }, [reports, statusCounts]);

  const rwStats = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => {
        const match = r.location.match(/RW\s*(\d+)/i);
        if (match) {
            const rwNumber = parseInt(match[1], 10);
            const rwKey = `RW ${rwNumber.toString().padStart(2, '0')}`;
            counts[rwKey] = (counts[rwKey] || 0) + 1;
        }
    });
    return Object.keys(counts).map(key => ({ name: key, count: counts[key] })).sort((a, b) => b.count - a.count).slice(0, 10); 
  }, [reports]);

  const categoryStats = useMemo(() => {
      const counts: Record<string, number> = {};
      reports.forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; });
      return Object.keys(counts).map(key => ({ name: key, value: counts[key] })).sort((a, b) => b.value - a.value);
  }, [reports]);

  const topReporters = useMemo(() => {
      const counts: Record<string, number> = {};
      reports.forEach(r => {
          if (r.reporterName && r.reporterName !== 'Warga') counts[r.reporterName] = (counts[r.reporterName] || 0) + 1;
      });
      return Object.keys(counts).map(key => ({ name: key, count: counts[key] })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [reports]);

  const handleCardClick = (status: ReportStatus) => {
    const filtered = reports.filter(r => r.status === status);
    setDrillDownReports(filtered);
    setSelectedStatus(status);
  };

  const handleUpdateReport = (updatedReport: Report, staffUpdates?: Staff[]) => {
    setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
    setDrillDownReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
    if (detailReport?.id === updatedReport.id) setDetailReport(updatedReport);
    if (staffUpdates && staffUpdates.length > 0) {
        setStaffList(prevStaff => prevStaff.map(s => { const update = staffUpdates.find(u => u.id === s.id); return update ? update : s; }));
    }
  };

  // Fix: Added handleDetailAction to resolve "Cannot find name 'handleDetailAction'" error
  const handleDetailAction = (report: Report, role: 'Admin' | 'PPSU') => {
    setActionData({ report, role });
  };

  const getAssignedStaff = (staffIds?: string[]) => staffIds ? staffList.filter(s => staffIds.includes(s.id)) : [];
  const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* --- POPUP ALERT WITH SOUND LOGIC --- */}
      {isAlertOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in zoom-in-95 duration-300">
            <div className={`${alertSystem.color} p-10 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.6)] max-w-2xl w-full mx-4 border-4 border-white/30 relative overflow-hidden group`}>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                <button 
                  onClick={() => setIsAlertOpen(false)} 
                  className="absolute top-6 right-6 p-3 bg-black/20 hover:bg-black/40 rounded-full text-white transition-all transform hover:rotate-90"
                >
                  <X size={28} />
                </button>
                <div className="flex flex-col items-center text-center text-white space-y-6 relative z-10">
                    <div className="p-6 bg-white/20 rounded-full mb-2 ring-8 ring-white/10 animate-bounce">
                      {alertSystem.icon}
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-5xl font-black tracking-tighter uppercase">{alertSystem.level}</h2>
                      <div className="h-1 w-24 bg-white/50 mx-auto rounded-full"></div>
                    </div>
                    <p className="text-2xl font-bold max-w-lg leading-tight bg-black/15 p-6 rounded-2xl border border-white/10">
                      {alertSystem.message}
                    </p>
                    <div className="flex gap-4 w-full">
                      <button 
                        onClick={() => setIsAlertOpen(false)} 
                        className="flex-1 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black hover:bg-slate-100 shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0 uppercase tracking-widest"
                      >
                        TUTUP ALARM
                      </button>
                    </div>
                    <p className="text-white/60 text-xs font-mono animate-pulse flex items-center gap-2">
                       <Volume2 size={12} /> ALARM AKTIF • MONITORING LIVE
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* --- DRILL DOWN MODAL --- */}
      {selectedStatus && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
           <div className="bg-white w-full max-w-4xl max-h-[85vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                 <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FileBarChart className="text-orange-500" /> Daftar Laporan</h3>
                    <p className="text-sm text-slate-500 uppercase tracking-wide">Status: <span className="font-bold text-orange-600">{selectedStatus}</span></p>
                 </div>
                 <button onClick={() => setSelectedStatus(null)} className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">
                 <div className="space-y-4">
                    {drillDownReports.map(report => {
                       const assigned = getAssignedStaff(report.assignedStaffIds);
                       return (
                          <div key={report.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
                             <div className="flex gap-4 flex-1">
                                <img src={report.photoUrl} className="w-24 h-24 rounded-xl object-cover bg-slate-100 shrink-0" alt="" />
                                <div>
                                   <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">{report.ticketNumber}</span>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${report.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{report.priority}</span>
                                   </div>
                                   <h4 className="font-bold text-slate-800 text-base line-clamp-1">{report.title}</h4>
                                   <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2">
                                      <span className="flex items-center gap-1"><MapPin size={10} /> {report.location}</span>
                                      <span className="flex items-center gap-1"><Calendar size={10} /> {report.timestamp}</span>
                                   </div>
                                </div>
                             </div>
                             <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Petugas</p>{assigned.length > 0 ? <div className="flex flex-col gap-2">{assigned.map(staff => (<div key={staff.id} className="flex items-center gap-2"><img src={staff.fotoProfile} className="w-6 h-6 rounded-full object-cover" alt="" /><span className="text-xs font-bold text-slate-700 truncate">{staff.namaLengkap}</span></div>))}</div> : <p className="text-xs text-slate-400 italic">Belum ada.</p>}</div>
                                <div className="mt-4 flex gap-2"><button onClick={() => setDetailReport(report)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-lg text-xs font-bold transition-colors">Detail</button><button onClick={() => setActionData({report, role: 'Admin'})} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-bold transition-colors shadow-md">Action</button></div>
                             </div>
                          </div>
                       );
                    })}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- HEADER COMMAND CENTER --- */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <div className="relative z-10">
           <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
             <Activity className="text-orange-500" /> STATISTIK COMMAND CENTER
           </h2>
           <p className="text-slate-400 text-sm mt-1 font-mono uppercase">Laporan Realtime Wilayah Grogol Selatan</p>
        </div>
        <div className="flex items-center gap-6 relative z-10">
           <div className="text-right hidden md:block">
              <p className="text-2xl font-bold font-mono">{currentTime.toLocaleTimeString('id-ID')}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">{currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
           </div>
           <div className="h-10 w-px bg-slate-700 hidden md:block"></div>
           <div className="flex flex-col items-end gap-1">
             <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${alertSystem.level === 'CRITICAL' ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`}></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Status Alarm: {isAlertOpen ? 'ON' : 'OFF'}</span>
             </div>
             <button 
                onClick={() => setIsAlertOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2 transition-all border border-indigo-400/30"
              >
                <BellRing size={14} className={isAlertOpen ? 'animate-bounce' : ''} /> Panggil Alert Manual
             </button>
           </div>
        </div>
      </div>

      {/* --- SLIDE CONTENT --- */}
      <div className="min-h-[500px]">
        {activeSlide === 1 ? (
            <div className="space-y-6 animate-in slide-in-from-left-8 duration-700 fade-in">
                <div className={`${alertSystem.color} rounded-2xl p-4 shadow-lg text-white flex items-center justify-between border border-white/10 transition-colors`}>
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">{alertSystem.level === 'SAFE' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}</div>
                        <div><h3 className="font-bold text-sm tracking-wide">SISTEM MONITORING: {alertSystem.level}</h3><p className="text-white/90 text-[10px] font-medium uppercase tracking-tight">{alertSystem.message}</p></div>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Laporan</p><div className="flex items-end justify-between"><h3 className="text-3xl font-black text-slate-800">{kpiData.total}</h3><BarChart3 size={20} className="text-blue-500 mb-1" /></div></div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Selesai</p><div className="flex items-end justify-between"><h3 className="text-3xl font-black text-emerald-600">{kpiData.completed}</h3><CheckCircle2 size={20} className="text-emerald-500 mb-1" /></div></div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Rate Selesai</p><div className="flex items-end justify-between"><h3 className="text-3xl font-black text-indigo-600">{kpiData.completionRate}%</h3><Activity size={20} className="text-indigo-500 mb-1" /></div></div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm col-span-2"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Rata-Rata Pengerjaan</p><div className="flex items-center gap-3"><div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Timer size={24} /></div><div><h3 className="text-xl font-black text-slate-800">{kpiData.avgTimeStr}</h3><p className="text-[9px] text-slate-500 italic">Siklus: 'Baru' ke 'Selesai'</p></div></div></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                    {[{ id: ReportStatus.NEW, label: 'Baru', color: 'red', count: statusCounts[ReportStatus.NEW] }, { id: ReportStatus.PENDING_ACCEPTANCE, label: 'Menunggu', color: 'amber', count: statusCounts[ReportStatus.PENDING_ACCEPTANCE] }, { id: ReportStatus.ON_THE_WAY, label: 'OTW', color: 'orange', count: statusCounts[ReportStatus.ON_THE_WAY] }, { id: ReportStatus.ARRIVED, label: 'Sampai', color: 'blue', count: statusCounts[ReportStatus.ARRIVED] }, { id: ReportStatus.IN_PROGRESS, label: 'Kerja', color: 'indigo', count: statusCounts[ReportStatus.IN_PROGRESS] }, { id: ReportStatus.VERIFICATION, label: 'Verif', color: 'purple', count: statusCounts[ReportStatus.VERIFICATION] }, { id: ReportStatus.REVISION, label: 'Revisi', color: 'pink', count: statusCounts[ReportStatus.REVISION] }, { id: ReportStatus.COMPLETED, label: 'Selesai', color: 'emerald', count: statusCounts[ReportStatus.COMPLETED] }].map((status, idx) => (
                        <div key={idx} onClick={() => handleCardClick(status.id)} className={`relative p-4 rounded-2xl border-t-4 bg-white shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden border-${status.color}-500`}><p className={`text-[10px] font-black uppercase text-${status.color}-600 mb-1`}>{status.label}</p><h4 className="text-2xl font-black text-slate-800">{status.count}</h4></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"><h3 className="font-bold text-slate-800 text-sm mb-6 flex items-center gap-2 uppercase tracking-wider"><TrendingUp size={16} className="text-blue-500" /> Tren Laporan (7 Hari Terakhir)</h3><div className="h-80 w-full"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={[{ day: 'Sen', masuk: 12, selesai: 10 }, { day: 'Sel', masuk: 19, selesai: 15 }, { day: 'Rab', masuk: 15, selesai: 12 }, { day: 'Kam', masuk: 25, selesai: 20 }, { day: 'Jum', masuk: 32, selesai: 28 }, { day: 'Sab', masuk: 20, selesai: 18 }, { day: 'Min', masuk: 15, selesai: 15 }]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} /><Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} /><Bar dataKey="masuk" name="Masuk" barSize={16} fill="#3b82f6" radius={[4, 4, 0, 0]} /><Line type="monotone" dataKey="selesai" name="Selesai" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} /></ComposedChart></ResponsiveContainer></div></div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 text-sm mb-6 flex items-center gap-2 uppercase tracking-wider"><Layers size={16} className="text-purple-500" /> Komposisi Kategori</h3>
                        <div className="h-64 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                      data={categoryStats} 
                                      cx="50%" 
                                      cy="50%" 
                                      innerRadius={60} 
                                      outerRadius={80} 
                                      paddingAngle={5} 
                                      dataKey="value"
                                    >
                                        {categoryStats.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Total</p>
                                <p className="text-2xl font-black text-slate-800">{kpiData.total}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 overflow-hidden">
                          {categoryStats.slice(0, 6).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}></div>
                                <span className="text-[10px] font-bold text-slate-600 truncate">{item.name}</span>
                              </div>
                              <span className="text-[10px] font-black text-slate-800 ml-1">{item.value}</span>
                            </div>
                          ))}
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-700 fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden"><MapPin className="absolute -right-4 -bottom-4 text-white opacity-20 w-32 h-32" /><p className="text-blue-100 font-bold text-[10px] uppercase tracking-widest mb-1">RW Teraktif</p><h4 className="text-3xl font-black">{rwStats[0]?.name || '-'}</h4><p className="text-xs font-medium mt-1 opacity-90">{rwStats[0]?.count || 0} Laporan</p></div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden"><PieChartIcon className="absolute -right-4 -bottom-4 text-white opacity-20 w-32 h-32" /><p className="text-purple-100 font-bold text-[10px] uppercase tracking-widest mb-1">Kategori Dominan</p><h4 className="text-3xl font-black">{categoryStats[0]?.name || '-'}</h4><p className="text-xs font-medium mt-1 opacity-90">{((categoryStats[0]?.value / kpiData.total) * 100).toFixed(1)}% Populasi Laporan</p></div>
                    <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden"><Users className="absolute -right-4 -bottom-4 text-white opacity-20 w-32 h-32" /><p className="text-teal-100 font-bold text-[10px] uppercase tracking-widest mb-1">Top Pelapor</p><h4 className="text-2xl font-black truncate">{topReporters[0]?.name || '-'}</h4><p className="text-xs font-medium mt-1 opacity-90">{topReporters[0]?.count || 0} Kontribusi</p></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"><h4 className="font-bold text-slate-800 text-sm mb-6 flex items-center gap-2 uppercase tracking-wider"><Trophy size={16} className="text-yellow-500" /> Peringkat Wilayah (RW) Teraktif</h4><div className="h-[350px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={rwStats} layout="vertical" margin={{ left: 40, right: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" /><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeights: 700, fill: '#475569'}} /><Tooltip contentStyle={{ borderRadius: '16px' }} /><Bar dataKey="count" name="Jumlah" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={24} /></BarChart></ResponsiveContainer></div></div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"><h4 className="font-bold text-slate-800 text-sm mb-6 flex items-center gap-2 uppercase tracking-wider"><PieChartIcon size={16} className="text-indigo-500" /> Komposisi Masalah</h4><div className="space-y-4">{categoryStats.map((cat, idx) => (<div key={idx} className="flex flex-col gap-1"><div className="flex justify-between items-center text-[10px] font-black text-slate-700"><span>{cat.name}</span><span>{cat.value}</span></div><div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(cat.value / kpiData.total) * 100}%`, backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}></div></div></div>))}</div></div>
                </div>
            </div>
        )}
      </div>

      {/* --- FOOTER INFO --- */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-400 mt-6">
         <p className="uppercase tracking-widest font-mono">Data Live • Sinkronisasi Terakhir: {new Date().toLocaleTimeString()}</p>
         <div className="flex gap-4 mt-2 md:mt-0"><span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> SLA Kritis ({'>'}24 Jam)</span><span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Operasional Normal</span></div>
      </div>
      {detailReport && <ReportDetailModal report={detailReport} onClose={() => setDetailReport(null)} onAction={handleDetailAction} />}
      {actionData && <ReportActionModal report={actionData.report} role={actionData.role} staffList={staffList} onClose={() => setActionData(null)} onUpdate={handleUpdateReport} />}
    </div>
  );
};

export default ReportStatisticsSection;
