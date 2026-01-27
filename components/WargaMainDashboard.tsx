
import React from 'react';
import { 
  User, 
  MapPin, 
  FileText, 
  MessageSquareWarning, 
  Clock, 
  ArrowRight,
  Bell,
  Activity,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Citizen, Report, ServiceRequest, ReportStatus, ServiceStatus } from '../types';

interface WargaMainDashboardProps {
  citizen: Citizen | undefined;
  reports: Report[];
  requests: ServiceRequest[];
  onNavigate: (menu: string) => void;
}

const WargaMainDashboard: React.FC<WargaMainDashboardProps> = ({ citizen, reports, requests, onNavigate }) => {
  if (!citizen) return <div className="p-8 text-center">Data warga tidak ditemukan.</div>;

  // Filter data milik warga ini
  const myReports = reports.filter(r => r.reporterNik === citizen.nik);
  const myRequests = requests.filter(r => r.applicantNik === citizen.nik);

  // Stats
  const activeReports = myReports.filter(r => r.status !== ReportStatus.COMPLETED && r.status !== ReportStatus.REJECTED).length;
  const activeRequests = myRequests.filter(r => r.status !== ServiceStatus.COMPLETED && r.status !== ServiceStatus.REJECTED).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
           <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/30 backdrop-blur-md overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
              {citizen.fotoWajah ? (
                <img src={citizen.fotoWajah} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-white/80" />
              )}
           </div>
           <div className="text-center md:text-left flex-1">
              <p className="text-teal-100 font-medium mb-1 flex items-center justify-center md:justify-start gap-2">
                 <Calendar size={14} /> {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <h2 className="text-3xl font-black mb-1">{getGreeting()}, {citizen.namaLengkap.split(' ')[0]}!</h2>
              <p className="text-white/90 text-sm opacity-90 flex items-center justify-center md:justify-start gap-2">
                 <MapPin size={14} /> {citizen.alamat}, RT {citizen.rt} / RW {citizen.rw}
              </p>
           </div>
           <div className="flex gap-3">
              <button className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl backdrop-blur-md transition-all relative">
                 <Bell size={24} />
                 <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-teal-600 rounded-full animate-pulse"></span>
              </button>
           </div>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black rounded-full mix-blend-overlay filter blur-3xl opacity-10 translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div 
            onClick={() => onNavigate('WARGA_LAPOR')}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
         >
            <div className="flex justify-between items-start relative z-10">
               <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <MessageSquareWarning size={28} />
               </div>
               <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-black uppercase">
                  Laporan
               </span>
            </div>
            <div className="mt-4 relative z-10">
               <h3 className="text-4xl font-black text-slate-800">{activeReports}</h3>
               <p className="text-slate-500 font-medium text-sm">Laporan Sedang Diproses</p>
            </div>
            <ArrowRight className="absolute bottom-6 right-6 text-slate-200 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
         </div>

         <div 
            onClick={() => onNavigate('WARGA_SURAT')}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
         >
            <div className="flex justify-between items-start relative z-10">
               <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <FileText size={28} />
               </div>
               <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-black uppercase">
                  Layanan
               </span>
            </div>
            <div className="mt-4 relative z-10">
               <h3 className="text-4xl font-black text-slate-800">{activeRequests}</h3>
               <p className="text-slate-500 font-medium text-sm">Surat Dalam Pengajuan</p>
            </div>
            <ArrowRight className="absolute bottom-6 right-6 text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Recent Activity Feed */}
         <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
               <Activity className="text-orange-500" size={20} /> Aktivitas Terkini
            </h3>
            
            <div className="space-y-6">
               {[...myReports, ...myRequests]
                  .sort((a, b) => {
                     const dateA = 'timestamp' in a ? a.timestamp : a.requestDate;
                     const dateB = 'timestamp' in b ? b.timestamp : b.requestDate;
                     return new Date(dateB).getTime() - new Date(dateA).getTime();
                  })
                  .slice(0, 5)
                  .map((item, idx) => {
                     const isReport = 'title' in item;
                     const date = isReport ? item.timestamp : item.requestDate;
                     const status = item.status;
                     
                     return (
                        <div key={idx} className="flex gap-4 relative group">
                           {idx !== 4 && <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-slate-100 group-last:hidden"></div>}
                           
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-4 border-white shadow-sm ${
                              isReport ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
                           }`}>
                              {isReport ? <MessageSquareWarning size={16} /> : <FileText size={16} />}
                           </div>
                           
                           <div className="flex-1 pb-1">
                              <div className="flex justify-between items-start">
                                 <h4 className="font-bold text-slate-800 text-sm line-clamp-1">
                                    {isReport ? (item as Report).title : (item as ServiceRequest).type}
                                 </h4>
                                 <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded">
                                    {new Date(date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                                 </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                 {isReport ? (item as Report).description : `Nomor Tiket: ${(item as ServiceRequest).ticketNumber}`}
                              </p>
                              <div className="mt-2">
                                 <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                                    status.includes('Selesai') || status.includes('Ready') ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                 }`}>
                                    {status}
                                 </span>
                              </div>
                           </div>
                        </div>
                     );
                  })}
               
               {[...myReports, ...myRequests].length === 0 && (
                  <div className="text-center py-10 text-slate-400">
                     <p>Belum ada aktivitas.</p>
                  </div>
               )}
            </div>
         </div>

         {/* Quick Action Profile Card */}
         <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl flex flex-col justify-between">
            <div>
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-white/10 rounded-lg">
                     <CheckCircle2 className="text-emerald-400" />
                  </div>
                  <div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status Data</p>
                     <p className="font-black text-lg">Terverifikasi</p>
                  </div>
               </div>
               
               <div className="space-y-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                     <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">NIK</p>
                     <p className="font-mono text-lg tracking-wider">{citizen.nik}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                     <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Nomor KK</p>
                     <p className="font-mono text-lg tracking-wider">{citizen.kk}</p>
                  </div>
               </div>
            </div>
            
            <button 
               onClick={() => onNavigate('WARGA_PROFILE')}
               className="w-full mt-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg"
            >
               Lihat Detail Profil
            </button>
         </div>
      </div>
    </div>
  );
};

export default WargaMainDashboard;
