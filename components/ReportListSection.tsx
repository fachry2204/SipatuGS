
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Calendar,
  Download,
  Plus,
  ShieldAlert,
  Layers,
  Activity,
  FileWarning,
  PlayCircle,
  RotateCcw,
  XCircle,
  FileText,
  Trash2,
  Timer
} from 'lucide-react';
import { Report, ReportStatus, Staff, User, Citizen } from '../types';
import AddReportModal from './AddReportModal';
import ReportActionModal from './ReportActionModal';
import ReportDetailModal from './ReportDetailModal';
import AdminVerificationModal from './AdminVerificationModal';

// Helper for displaying dates consistently in Indonesian format
const formatDate = (dateString: string) => {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
};

// Component for Real-time Elapsed Timer
const LiveTimer: React.FC<{ startTime: string }> = ({ startTime }) => {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    const calculateElapsed = () => {
      // Robust parsing: Try direct Date object first
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      
      if (isNaN(start)) return '--:--:--';
      
      const diff = now - start;
      
      // If time is in the future or invalid, reset to zero
      if (diff < 0) return '00:00:00';

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Initial update
    setElapsed(calculateElapsed());
    
    // Update every second
    const interval = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-lg text-[11px] font-mono font-bold text-slate-600 border border-slate-200">
      <Timer size={12} className="text-rose-500 animate-pulse" />
      {elapsed}
    </div>
  );
};

interface ReportListSectionProps {
  type: 'active' | 'history';
  reports: Report[];
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
  staffList: Staff[];
  setStaffList: React.Dispatch<React.SetStateAction<Staff[]>>;
  users: User[];
  userFilter?: string; // Optional: NIK of current user to filter reports
  citizens: Citizen[];
}

type FilterType = 'ALL' | 'NEW' | 'PENDING' | 'PROCESS' | 'VERIFY' | 'COMPLETED' | 'REJECTED';

const ReportListSection: React.FC<ReportListSectionProps> = ({ type, reports, setReports, staffList, setStaffList, users, userFilter, citizens }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<FilterType>('ALL'); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDetailReport, setSelectedDetailReport] = useState<Report | null>(null);
  const [actionReport, setActionReport] = useState<{report: Report, role: 'Admin' | 'PPSU'} | null>(null);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);

  const baseData = useMemo(() => {
    let data = reports;
    if (userFilter) {
        data = data.filter(r => r.reporterNik === userFilter);
    }
    if (type === 'active') {
      return data.filter(r => 
        r.status !== ReportStatus.COMPLETED && r.status !== ReportStatus.REJECTED
      );
    } else {
      return data.filter(r => r.status === ReportStatus.COMPLETED || r.status === ReportStatus.REJECTED);
    }
  }, [type, reports, userFilter]);

  const stats = useMemo(() => {
    return {
      all: baseData.length,
      new: baseData.filter(r => r.status === ReportStatus.NEW).length,
      pending: baseData.filter(r => r.status === ReportStatus.PENDING_ACCEPTANCE).length,
      process: baseData.filter(r => [ReportStatus.ON_THE_WAY, ReportStatus.ARRIVED, ReportStatus.IN_PROGRESS].includes(r.status)).length,
      verify: baseData.filter(r => [ReportStatus.VERIFICATION, ReportStatus.REVISION].includes(r.status)).length,
      completed: baseData.filter(r => r.status === ReportStatus.COMPLETED).length,
      rejected: baseData.filter(r => r.status === ReportStatus.REJECTED).length
    };
  }, [baseData]);

  const filteredData = useMemo(() => {
    return baseData.filter(item => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reporterName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;

      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'NEW') matchesStatus = item.status === ReportStatus.NEW;
        else if (statusFilter === 'PENDING') matchesStatus = item.status === ReportStatus.PENDING_ACCEPTANCE;
        else if (statusFilter === 'PROCESS') matchesStatus = [ReportStatus.ON_THE_WAY, ReportStatus.ARRIVED, ReportStatus.IN_PROGRESS].includes(item.status);
        else if (statusFilter === 'VERIFY') matchesStatus = [ReportStatus.VERIFICATION, ReportStatus.REVISION].includes(item.status);
        else if (statusFilter === 'COMPLETED') matchesStatus = item.status === ReportStatus.COMPLETED;
        else if (statusFilter === 'REJECTED') matchesStatus = item.status === ReportStatus.REJECTED;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [baseData, searchTerm, filterCategory, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const categories = Array.from(new Set(reports.map(r => r.category)));

  const handleSaveReport = (newReport: Report) => {
    setReports(prev => [newReport, ...prev]);
    setIsAddModalOpen(false);
    alert("Laporan Berhasil Dikirim! Menunggu Verifikasi Admin.");
  };

  const handleUpdateReport = (updatedReport: Report, staffUpdates?: Staff[]) => {
    setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
    setSelectedDetailReport(updatedReport); 
    if (staffUpdates && staffUpdates.length > 0) {
        setStaffList(prevStaff => prevStaff.map(s => {
            const update = staffUpdates.find(u => u.id === s.id);
            return update ? update : s;
        }));
    }
  };

  const handleDeleteSuccess = () => {
    if (reportToDelete) {
        setReports(prev => prev.filter(r => r.id !== reportToDelete.id));
        setReportToDelete(null);
        setSelectedDetailReport(null); 
        alert("Laporan berhasil dihapus.");
    }
  };

  const handleDetailAction = (report: Report, role: 'Admin' | 'PPSU') => setActionReport({ report, role });

  const getCardStyle = (key: FilterType, colorName: string) => {
    const isActive = statusFilter === key;
    if (isActive) {
        return `p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-32 shadow-lg transform scale-105 bg-${colorName}-600 border-${colorName}-600 text-white relative overflow-hidden z-10`;
    } else {
        return `p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-32 shadow-sm hover:shadow-md bg-white border-slate-100 border-b-4 border-b-${colorName}-500 hover:-translate-y-1 relative overflow-hidden group`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">
             {type === 'active' ? 'Daftar Laporan Masuk' : 'Riwayat Laporan Selesai'}
           </h2>
           <p className="text-slate-500 text-sm">
             {type === 'active' ? 'Kelola laporan yang membutuhkan tindak lanjut.' : 'Arsip laporan yang telah selesai atau ditolak.'}
           </p>
        </div>
        {type === 'active' && (
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-200 flex items-center gap-2"
            >
                <Plus size={18} /> Kirim Laporan
            </button>
        )}
      </div>

      <div className={`grid grid-cols-2 ${type === 'active' ? 'md:grid-cols-5' : 'md:grid-cols-3'} gap-4`}>
        <div onClick={() => setStatusFilter('ALL')} className={getCardStyle('ALL', 'slate')}>
           <div className="flex justify-between items-start relative z-10">
              <span className={`text-xs font-bold uppercase ${statusFilter === 'ALL' ? 'text-slate-100' : 'text-slate-400'}`}>Semua</span>
              <div className={`p-2 rounded-lg ${statusFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}><Layers size={20} /></div>
           </div>
           <span className={`text-3xl font-bold relative z-10 ${statusFilter === 'ALL' ? 'text-white' : 'text-slate-800'}`}>{stats.all}</span>
        </div>
        {type === 'active' ? (
          <>
            <div onClick={() => setStatusFilter('NEW')} className={getCardStyle('NEW', 'red')}>
               <div className="flex justify-between items-start relative z-10">
                  <span className={`text-xs font-bold uppercase ${statusFilter === 'NEW' ? 'text-red-100' : 'text-slate-400'}`}>Baru</span>
                  <div className={`p-2 rounded-lg ${statusFilter === 'NEW' ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'}`}><FileWarning size={20} /></div>
               </div>
               <span className={`text-3xl font-bold relative z-10 ${statusFilter === 'NEW' ? 'text-white' : 'text-slate-800'}`}>{stats.new}</span>
            </div>
            <div onClick={() => setStatusFilter('PENDING')} className={getCardStyle('PENDING', 'amber')}>
               <div className="flex justify-between items-start relative z-10">
                  <span className={`text-xs font-bold uppercase ${statusFilter === 'PENDING' ? 'text-amber-100' : 'text-slate-400'}`}>Menunggu</span>
                  <div className={`p-2 rounded-lg ${statusFilter === 'PENDING' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'}`}><Clock size={20} /></div>
               </div>
               <span className={`text-3xl font-bold relative z-10 ${statusFilter === 'PENDING' ? 'text-white' : 'text-slate-800'}`}>{stats.pending}</span>
            </div>
            <div onClick={() => setStatusFilter('PROCESS')} className={getCardStyle('PROCESS', 'blue')}>
               <div className="flex justify-between items-start relative z-10">
                  <span className={`text-xs font-bold uppercase ${statusFilter === 'PROCESS' ? 'text-blue-100' : 'text-slate-400'}`}>Proses</span>
                  <div className={`p-2 rounded-lg ${statusFilter === 'PROCESS' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}><Activity size={20} /></div>
               </div>
               <span className={`text-3xl font-bold relative z-10 ${statusFilter === 'PROCESS' ? 'text-white' : 'text-slate-800'}`}>{stats.process}</span>
            </div>
            <div onClick={() => setStatusFilter('VERIFY')} className={getCardStyle('VERIFY', 'purple')}>
               <div className="flex justify-between items-start relative z-10">
                  <span className={`text-xs font-bold uppercase ${statusFilter === 'VERIFY' ? 'text-purple-100' : 'text-slate-400'}`}>Verifikasi</span>
                  <div className={`p-2 rounded-lg ${statusFilter === 'VERIFY' ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-600'}`}><ShieldAlert size={20} /></div>
               </div>
               <span className={`text-3xl font-bold relative z-10 ${statusFilter === 'VERIFY' ? 'text-white' : 'text-slate-800'}`}>{stats.verify}</span>
            </div>
          </>
        ) : (
          <>
            <div onClick={() => setStatusFilter('COMPLETED')} className={getCardStyle('COMPLETED', 'green')}>
               <div className="flex justify-between items-start relative z-10">
                  <span className={`text-xs font-bold uppercase ${statusFilter === 'COMPLETED' ? 'text-green-100' : 'text-slate-400'}`}>Selesai</span>
                  <div className={`p-2 rounded-lg ${statusFilter === 'COMPLETED' ? 'bg-white/20 text-white' : 'bg-green-50 text-green-600'}`}><CheckCircle2 size={20} /></div>
               </div>
               <span className={`text-3xl font-bold relative z-10 ${statusFilter === 'COMPLETED' ? 'text-white' : 'text-slate-800'}`}>{stats.completed}</span>
            </div>
            <div onClick={() => setStatusFilter('REJECTED')} className={getCardStyle('REJECTED', 'gray')}>
               <div className="flex justify-between items-start relative z-10">
                  <span className={`text-xs font-bold uppercase ${statusFilter === 'REJECTED' ? 'text-gray-100' : 'text-slate-400'}`}>Ditolak</span>
                  <div className={`p-2 rounded-lg ${statusFilter === 'REJECTED' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}><XCircle size={20} /></div>
               </div>
               <span className={`text-3xl font-bold relative z-10 ${statusFilter === 'REJECTED' ? 'text-white' : 'text-slate-800'}`}>{stats.rejected}</span>
            </div>
          </>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
           <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Cari tiket, judul, atau pelapor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-full outline-none" />
           </div>
           <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="All">Semua Kategori</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
           </select>
        </div>
        {type === 'history' && (
           <button className="flex items-center gap-2 text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-bold bg-slate-50 rounded-lg border border-slate-200"><Download size={16} /> Export Data</button>
        )}
      </div>

      <div className="space-y-4">
        {currentData.map(report => (
           <div key={report.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col md:flex-row gap-4 relative overflow-hidden group">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  report.status === ReportStatus.NEW ? 'bg-red-500 animate-pulse' :
                  report.status === ReportStatus.PENDING_ACCEPTANCE ? 'bg-yellow-500' :
                  report.status === ReportStatus.ON_THE_WAY || report.status === ReportStatus.ARRIVED || report.status === ReportStatus.IN_PROGRESS ? 'bg-blue-600' :
                  report.status === ReportStatus.VERIFICATION || report.status === ReportStatus.REVISION ? 'bg-purple-500' :
                  report.status === ReportStatus.COMPLETED ? 'bg-green-500' : 'bg-slate-300'
              }`}></div>
              <div className="w-full md:w-48 h-32 md:h-auto shrink-0 rounded-xl overflow-hidden relative">
                 <img src={report.photoUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                 <div className={`absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold text-white uppercase ${report.priority === 'High' ? 'bg-red-500' : report.priority === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'}`}>{report.priority}</div>
              </div>
              <div className="flex-1 flex flex-col justify-between py-1 pl-2">
                 <div>
                    <div className="flex justify-between items-start mb-1">
                       <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{report.ticketNumber}</span>
                       <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={12} /> {formatDate(report.timestamp)}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1">{report.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-2">{report.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                       <span className="flex items-center gap-1"><MapPin size={12} /> {report.location}</span>
                       <span className="flex items-center gap-1 text-slate-800 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{report.category}</span>
                       <span>Pelapor: <b>{report.reporterName}</b></span>
                    </div>
                 </div>
                 <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        report.status === ReportStatus.NEW ? 'bg-red-100 text-red-700 animate-pulse' :
                        report.status === ReportStatus.PENDING_ACCEPTANCE ? 'bg-yellow-100 text-yellow-700' :
                        report.status === ReportStatus.ON_THE_WAY || report.status === ReportStatus.ARRIVED || report.status === ReportStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                        report.status === ReportStatus.VERIFICATION || report.status === ReportStatus.REVISION ? 'bg-purple-100 text-purple-700' :
                        report.status === ReportStatus.COMPLETED ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                        {report.status === ReportStatus.NEW ? <ShieldAlert size={12} /> : report.status === ReportStatus.COMPLETED ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {report.status}
                    </span>
                    <div className="flex items-center gap-2">
                       {report.status !== ReportStatus.COMPLETED && report.status !== ReportStatus.REJECTED && <LiveTimer startTime={report.timestamp} />}
                       {!userFilter && (
                           <button onClick={() => setReportToDelete(report)} className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-100" title="Hapus Laporan"><Trash2 size={16} /></button>
                       )}
                       <button onClick={() => setSelectedDetailReport(report)} className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"><Eye size={14} /> Lihat Detail</button>
                    </div>
                 </div>
              </div>
           </div>
        ))}
        {currentData.length === 0 && <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200"><p className="text-slate-400 font-medium">Tidak ada laporan dengan status ini.</p></div>}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
           {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-sm font-bold ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{page}</button>
           ))}
        </div>
      )}

      {isAddModalOpen && (
        <AddReportModal 
            onClose={() => setIsAddModalOpen(false)} 
            onSave={handleSaveReport} 
            citizens={citizens} 
            currentUserNik={userFilter} // Pass logged in user NIK
        />
      )}
      {selectedDetailReport && <ReportDetailModal report={selectedDetailReport} onClose={() => setSelectedDetailReport(null)} onAction={handleDetailAction} onDelete={(!userFilter) ? () => setReportToDelete(selectedDetailReport) : undefined} />}
      {actionReport && <ReportActionModal report={actionReport.report} role={actionReport.role} staffList={staffList} onClose={() => setActionReport(null)} onUpdate={handleUpdateReport} />}
      {reportToDelete && <AdminVerificationModal isOpen={!!reportToDelete} onClose={() => setReportToDelete(null)} onSuccess={handleDeleteSuccess} users={users} actionType="Delete" targetUserName={reportToDelete.title} />}
    </div>
  );
};

export default ReportListSection;
