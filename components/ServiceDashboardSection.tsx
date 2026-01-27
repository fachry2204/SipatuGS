
import React from 'react';
import { FileText, CheckCircle2, Clock, Loader2, ArrowUpRight, FileCheck } from 'lucide-react';
import { ServiceRequest, ServiceStatus } from '../types';

interface ServiceDashboardSectionProps {
  requests: ServiceRequest[];
}

const ServiceDashboardSection: React.FC<ServiceDashboardSectionProps> = ({ requests }) => {
  const stats = {
    total: requests.length,
    // Fix: ServiceStatus.PENDING replaced with ServiceStatus.NEW
    pending: requests.filter(r => r.status === ServiceStatus.NEW).length,
    // Fix: ServiceStatus.PROCESSED replaced with ServiceStatus.ACCEPTED and ServiceStatus.WAITING
    processing: requests.filter(r => r.status === ServiceStatus.ACCEPTED || r.status === ServiceStatus.WAITING).length,
    completed: requests.filter(r => r.status === ServiceStatus.COMPLETED || r.status === ServiceStatus.READY).length
  };

  const recentRequests = [...requests].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Dashboard Pelayanan</h2>
           <p className="text-slate-500 text-sm">Ringkasan aktivitas persuratan dan administrasi warga.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
           <div className="flex justify-between items-start">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                 <FileText size={24} />
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                 <ArrowUpRight size={12} /> Active
              </span>
           </div>
           <h3 className="text-3xl font-bold text-slate-800 mt-4">{stats.total}</h3>
           <p className="text-sm text-slate-500 font-medium">Total Permohonan</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex justify-between items-start">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                 <Clock size={24} />
              </div>
           </div>
           <h3 className="text-3xl font-bold text-slate-800 mt-4">{stats.pending}</h3>
           <p className="text-sm text-slate-500 font-medium">Menunggu Verifikasi</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex justify-between items-start">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                 <Loader2 size={24} className="animate-spin-slow" />
              </div>
           </div>
           <h3 className="text-3xl font-bold text-slate-800 mt-4">{stats.processing}</h3>
           <p className="text-sm text-slate-500 font-medium">Sedang Diproses</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex justify-between items-start">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                 <FileCheck size={24} />
              </div>
           </div>
           <h3 className="text-3xl font-bold text-slate-800 mt-4">{stats.completed}</h3>
           <p className="text-sm text-slate-500 font-medium">Selesai / Siap Ambil</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
         <h3 className="text-lg font-bold text-slate-800 mb-6">Permohonan Terbaru</h3>
         <div className="space-y-4">
            {recentRequests.map(req => (
               <div key={req.id} className="flex items-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                     // Fix: ServiceStatus.PENDING replaced with ServiceStatus.NEW
                     req.status === ServiceStatus.NEW ? 'bg-amber-100 text-amber-600' :
                     req.status === ServiceStatus.COMPLETED ? 'bg-green-100 text-green-600' :
                     'bg-blue-100 text-blue-600'
                  }`}>
                     {req.applicantName.charAt(0)}
                  </div>
                  <div className="ml-4 flex-1">
                     <h4 className="font-bold text-slate-800 text-sm">{req.type}</h4>
                     <p className="text-xs text-slate-500">Pemohon: {req.applicantName} • {req.requestDate}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                     // Fix: ServiceStatus.PENDING replaced with ServiceStatus.NEW
                     req.status === ServiceStatus.NEW ? 'bg-amber-50 text-amber-700' :
                     req.status === ServiceStatus.COMPLETED ? 'bg-green-50 text-green-700' :
                     'bg-blue-50 text-blue-700'
                  }`}>
                     {req.status}
                  </span>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default ServiceDashboardSection;
