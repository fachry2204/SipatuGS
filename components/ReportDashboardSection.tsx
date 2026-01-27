
import React from 'react';
import { 
  FileWarning, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight,
  MapPin,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { ReportStatus, Report } from '../types';

interface ReportDashboardSectionProps {
  reports: Report[];
}

const ReportDashboardSection: React.FC<ReportDashboardSectionProps> = ({ reports }) => {
  const totalReports = reports.length;
  const newReports = reports.filter(r => r.status === ReportStatus.NEW).length;
  
  // Assigned or In Progress covers specific active states
  const assignedReports = reports.filter(r => 
    r.status === ReportStatus.PENDING_ACCEPTANCE || 
    r.status === ReportStatus.ON_THE_WAY || 
    r.status === ReportStatus.ARRIVED || 
    r.status === ReportStatus.IN_PROGRESS ||
    r.status === ReportStatus.VERIFICATION ||
    r.status === ReportStatus.REVISION
  ).length;
  
  const completedReports = reports.filter(r => r.status === ReportStatus.COMPLETED).length;

  const recentReports = [...reports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard Laporan Warga</h2>
          <p className="text-slate-500 text-sm">Ringkasan pengaduan dan aspirasi warga Grogol Selatan.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
             <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <FileWarning size={24} />
             </div>
             <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                <ArrowUpRight size={12} /> Live
             </span>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mt-4">{newReports}</h3>
          <p className="text-sm text-slate-500 font-medium">Laporan Baru Masuk</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
             <div className="p-3 bg-blue-50 text-blue-600 rounded-xl relative">
                <UserCheck size={24} />
             </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mt-4">{assignedReports}</h3>
          <p className="text-sm text-slate-500 font-medium">Sedang Ditangani PPSU</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
             <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl animate-pulse">
                <TrendingUp size={24} />
             </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mt-4">{totalReports}</h3>
          <p className="text-sm text-slate-500 font-medium">Total Semua Laporan</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
             <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <CheckCircle2 size={24} />
             </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mt-4">{completedReports}</h3>
          <p className="text-sm text-slate-500 font-medium">Laporan Selesai</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reports List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Laporan Terbaru</h3>
          <div className="space-y-4">
            {recentReports.map(report => (
              <div key={report.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                 <img src={report.photoUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                 <div className="flex-1">
                    <div className="flex justify-between items-start">
                       <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{report.title}</h4>
                       <span className="text-xs text-slate-400">{report.timestamp.split(' ')[0]}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{report.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                       <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          report.status === ReportStatus.NEW ? 'bg-red-100 text-red-700 animate-pulse' :
                          report.status === ReportStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                       }`}>
                          {report.status}
                       </span>
                       <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin size={10} /> {report.location}
                       </span>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Priority Alert */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-500" /> Perlu Perhatian (High Priority)
           </h3>
           <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar max-h-[400px]">
              {reports.filter(r => r.priority === 'High' && r.status !== ReportStatus.COMPLETED).slice(0, 5).map(report => (
                 <div key={report.id} className="p-3 bg-red-50 border border-red-100 rounded-xl">
                    <div className="flex justify-between">
                       <span className="text-xs font-bold text-red-700 bg-white px-1.5 py-0.5 rounded border border-red-200">{report.category}</span>
                       <span className="text-[10px] text-red-400">{report.ticketNumber}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 mt-2 line-clamp-2">{report.title}</p>
                    <p className="text-xs text-slate-500 mt-1">Pelapor: {report.reporterName}</p>
                 </div>
              ))}
              {reports.filter(r => r.priority === 'High' && r.status !== ReportStatus.COMPLETED).length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">Tidak ada laporan prioritas tinggi.</div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDashboardSection;
