
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Filter,
  AlertCircle,
  Stamp,
  Timer,
  MessageCircle,
  Pencil,
  Trash2,
  Calendar,
  Layers,
  Loader2,
  CheckCheck,
  Monitor,
  FileSearch // Added FileSearch icon
} from 'lucide-react';
import { ServiceRequest, ServiceStatus, Citizen, User } from '../types';
import AddServiceModal from './AddServiceModal';
import ServiceDetailModal from './ServiceDetailModal';
import AdminVerificationModal from './AdminVerificationModal';

const RequestTimer: React.FC<{ startDate: string, endDate?: string }> = ({ startDate, endDate }) => {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    const update = () => {
      const start = new Date(startDate).getTime();
      const end = endDate ? new Date(endDate).getTime() : new Date().getTime();
      const diff = end - start;
      if (diff < 0) {
        setElapsed('00:00:00');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    update();
    let interval: any;
    if (!endDate) interval = setInterval(update, 1000);
    return () => { if (interval) clearInterval(interval); };
  }, [startDate, endDate]);

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono font-black border whitespace-nowrap shadow-sm ${endDate ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
      <Timer size={10} className={endDate ? '' : 'animate-pulse'} />
      {endDate ? 'TOTAL: ' : ''}{elapsed}
    </div>
  );
};

interface ServiceListSectionProps {
  requests: ServiceRequest[];
  setRequests: React.Dispatch<React.SetStateAction<ServiceRequest[]>>;
  citizens: Citizen[];
  users: User[]; 
  onNavigateToCitizen: () => void;
  isWargaView?: boolean; // New prop to control visibility
  userFilter?: string; // New prop for user specific filtering/autofill
}

const ServiceListSection: React.FC<ServiceListSectionProps> = ({ requests, setRequests, citizens, users, onNavigateToCitizen, isWargaView = false, userFilter }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null); 
  const [requestToDelete, setRequestToDelete] = useState<ServiceRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Status Counts for Cards
  const stats = useMemo(() => {
    return {
      all: requests.length,
      new: requests.filter(r => r.status === ServiceStatus.NEW).length,
      processing: requests.filter(r => r.status === ServiceStatus.ACCEPTED || r.status === ServiceStatus.WAITING).length,
      waitingTtd: requests.filter(r => r.status === ServiceStatus.PROCESSED).length,
      ready: requests.filter(r => r.status === ServiceStatus.READY).length,
      completed: requests.filter(r => r.status === ServiceStatus.COMPLETED).length
    };
  }, [requests]);

  const filteredData = useMemo(() => {
    return requests.filter(item => {
      const matchesSearch = 
        item.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.applicantNik.includes(searchTerm);
      
      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PROCESSING') {
            matchesStatus = item.status === ServiceStatus.ACCEPTED || item.status === ServiceStatus.WAITING;
        } else if (statusFilter === 'WAITING_TTD') {
            matchesStatus = item.status === ServiceStatus.PROCESSED;
        } else {
            matchesStatus = item.status === statusFilter;
        }
      }
      
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAddRequest = (newRequest: ServiceRequest) => {
    if (editingRequest) {
        setRequests(prev => prev.map(r => r.id === newRequest.id ? newRequest : r));
    } else {
        setRequests(prev => [newRequest, ...prev]);
    }
    setIsAddModalOpen(false);
    setEditingRequest(null);
  };

  const handleDeleteSuccess = () => {
    if (requestToDelete) {
        setRequests(prev => prev.filter(r => r.id !== requestToDelete.id));
        setRequestToDelete(null);
        alert("Permohonan berhasil dihapus dari sistem.");
    }
  };

  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
        case ServiceStatus.NEW: return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-50 text-red-600 border border-red-100 uppercase animate-pulse"><AlertCircle size={10}/> Pengajuan Baru</span>;
        case ServiceStatus.ACCEPTED: return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase"><CheckCircle2 size={10}/> Pengajuan Diterima</span>;
        case ServiceStatus.WAITING: return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-100 uppercase"><Clock size={10}/> Dalam Antrian</span>;
        case ServiceStatus.PROCESSED: return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-100 uppercase"><Clock size={10}/> Menunggu Surat Terbit</span>;
        case ServiceStatus.READY: return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-green-50 text-green-700 border border-green-100 uppercase"><Stamp size={10}/> Siap Diambil</span>;
        case ServiceStatus.COMPLETED: return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200 uppercase"><CheckCheck size={10}/> Selesai</span>;
        default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Pelayanan Administrasi Warga</h2>
           <p className="text-slate-500 text-sm">Monitor dan proses permohonan surat warga secara realtime.</p>
        </div>
        <button 
            onClick={() => { setEditingRequest(null); setIsAddModalOpen(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl text-sm font-black transition-all shadow-xl shadow-indigo-100 flex items-center gap-2 transform active:scale-95"
        >
            <Plus size={18} /> {isWargaView ? 'Buat Pengajuan Baru' : 'Buat Pengajuan Loket'}
        </button>
      </div>

      {/* --- STATUS CARD VIEW --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 no-print">
        {/* Total Card */}
        <div 
            onClick={() => setStatusFilter('ALL')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-32 shadow-sm ${statusFilter === 'ALL' ? 'bg-slate-800 border-slate-800 text-white shadow-lg transform scale-105' : 'bg-white border-slate-100 border-b-4 border-b-slate-400 hover:shadow-md hover:-translate-y-1'}`}
        >
            <div className="flex justify-between items-start">
                <span className={`text-[10px] font-black uppercase tracking-widest ${statusFilter === 'ALL' ? 'text-slate-300' : 'text-slate-400'}`}>Semua</span>
                <div className={`p-2 rounded-xl ${statusFilter === 'ALL' ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400'}`}><Layers size={18} /></div>
            </div>
            <span className="text-3xl font-black">{stats.all}</span>
        </div>

        {/* New Request Card - BLINKING (Pulse) */}
        <div 
            onClick={() => setStatusFilter(ServiceStatus.NEW)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-32 shadow-sm ${statusFilter === ServiceStatus.NEW ? 'bg-rose-600 border-rose-600 text-white shadow-lg transform scale-105' : 'bg-white border-slate-100 border-b-4 border-b-rose-500 hover:shadow-md hover:-translate-y-1'}`}
        >
            <div className="flex justify-between items-start">
                <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${statusFilter === ServiceStatus.NEW ? 'text-rose-100' : 'text-rose-600 animate-pulse'}`}>
                    <div className={`w-2 h-2 rounded-full ${statusFilter === ServiceStatus.NEW ? 'bg-white' : 'bg-rose-600'} animate-ping`}></div> Baru
                </span>
                <div className={`p-2 rounded-xl ${statusFilter === ServiceStatus.NEW ? 'bg-white/10 text-white' : 'bg-rose-50 text-rose-500'}`}><AlertCircle size={18} /></div>
            </div>
            <span className="text-3xl font-black">{stats.new}</span>
        </div>

        {/* Processing Card (Accepted + Waiting) */}
        <div 
            onClick={() => setStatusFilter('PROCESSING')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-32 shadow-sm ${statusFilter === 'PROCESSING' ? 'bg-amber-500 border-amber-500 text-white shadow-lg transform scale-105' : 'bg-white border-slate-100 border-b-4 border-b-amber-500 hover:shadow-md hover:-translate-y-1'}`}
        >
            <div className="flex justify-between items-start">
                <span className={`text-[10px] font-black uppercase tracking-widest ${statusFilter === 'PROCESSING' ? 'text-amber-100' : 'text-slate-400'}`}>Antrian</span>
                <div className={`p-2 rounded-xl ${statusFilter === 'PROCESSING' ? 'bg-white/10 text-white' : 'bg-amber-50 text-amber-500'}`}><Clock size={18} /></div>
            </div>
            <span className="text-3xl font-black">{stats.processing}</span>
        </div>

        {/* Waiting Sign Card (NOW: Menunggu Surat Terbit) */}
        <div 
            onClick={() => setStatusFilter('WAITING_TTD')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-32 shadow-sm ${statusFilter === 'WAITING_TTD' ? 'bg-blue-600 border-blue-600 text-white shadow-lg transform scale-105' : 'bg-white border-slate-100 border-b-4 border-b-blue-500 hover:shadow-md hover:-translate-y-1'}`}
        >
            <div className="flex justify-between items-start">
                <span className={`text-[10px] font-black uppercase tracking-widest ${statusFilter === 'WAITING_TTD' ? 'text-blue-100' : 'text-slate-400'}`}>Menunggu Surat Terbit</span>
                <div className={`p-2 rounded-xl ${statusFilter === 'WAITING_TTD' ? 'bg-white/10 text-white' : 'bg-blue-50 text-blue-500'}`}><Loader2 size={18} className={statusFilter === 'WAITING_TTD' ? 'animate-spin' : ''} /></div>
            </div>
            <span className="text-3xl font-black">{stats.waitingTtd}</span>
        </div>

        {/* Ready Card */}
        <div 
            onClick={() => setStatusFilter(ServiceStatus.READY)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-32 shadow-sm ${statusFilter === ServiceStatus.READY ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg transform scale-105' : 'bg-white border-slate-100 border-b-4 border-b-emerald-500 hover:shadow-md hover:-translate-y-1'}`}
        >
            <div className="flex justify-between items-start">
                <span className={`text-[10px] font-black uppercase tracking-widest ${statusFilter === ServiceStatus.READY ? 'text-emerald-100' : 'text-slate-400'}`}>Siap Ambil</span>
                <div className={`p-2 rounded-xl ${statusFilter === ServiceStatus.READY ? 'bg-white/10 text-white' : 'bg-emerald-50 text-emerald-500'}`}><Stamp size={18} /></div>
            </div>
            <span className="text-3xl font-black">{stats.ready}</span>
        </div>

        {/* Completed Card */}
        <div 
            onClick={() => setStatusFilter(ServiceStatus.COMPLETED)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-32 shadow-sm ${statusFilter === ServiceStatus.COMPLETED ? 'bg-teal-600 border-teal-600 text-white shadow-lg transform scale-105' : 'bg-white border-slate-100 border-b-4 border-b-teal-500 hover:shadow-md hover:-translate-y-1'}`}
        >
            <div className="flex justify-between items-start">
                <span className={`text-[10px] font-black uppercase tracking-widest ${statusFilter === ServiceStatus.COMPLETED ? 'text-teal-100' : 'text-slate-400'}`}>Selesai</span>
                <div className={`p-2 rounded-xl ${statusFilter === ServiceStatus.COMPLETED ? 'bg-white/10 text-white' : 'bg-teal-50 text-teal-600'}`}><CheckCheck size={18} /></div>
            </div>
            <span className="text-3xl font-black">{stats.completed}</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
            <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Cari NIK, Nama, atau No Tiket..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 w-full outline-none transition-all shadow-sm"
                />
            </div>
            
            <div className="flex items-center gap-2">
                <Filter size={18} className="text-slate-400" />
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl focus:ring-indigo-500 p-2.5 outline-none shadow-sm cursor-pointer"
                >
                    <option value="ALL">Semua Status</option>
                    <option value={ServiceStatus.NEW}>Pengajuan Baru</option>
                    <option value="PROCESSING">Sedang Diproses</option>
                    <option value="WAITING_TTD">Menunggu Surat Terbit</option>
                    <option value={ServiceStatus.READY}>Siap Diambil</option>
                    <option value={ServiceStatus.COMPLETED}>Selesai</option>
                </select>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-white border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">No. Tiket</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tgl Pengajuan</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lama Proses</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pemohon</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Layanan</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {currentData.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit">{req.ticketNumber}</span>
                                    {req.ticketNumber.includes('KIOSK') && (
                                        <span title="Diajukan via Anjungan Mandiri" className="flex items-center">
                                            <Monitor size={14} className="text-indigo-400" />
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-bold">
                                    <Calendar size={10}/> {new Date(req.requestDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <RequestTimer startDate={req.requestDate} endDate={req.completionDate} />
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <p className="font-black text-slate-800 text-sm">{req.applicantName}</p>
                                    <p className="text-xs text-slate-400 font-mono tracking-tighter">{req.applicantNik}</p>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-600 line-clamp-1">{req.type}</span>
                                    {req.letterNumber && (
                                        <p className="text-[10px] text-indigo-500 font-black mt-1 uppercase">No: {req.letterNumber}</p>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                {getStatusBadge(req.status)}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                    {!isWargaView ? (
                                        <>
                                            <a 
                                                href={`https://wa.me/${req.applicantPhone.replace(/\D/g,'')}`} 
                                                target="_blank"
                                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm"
                                                title="Hubungi WhatsApp"
                                            >
                                                <MessageCircle size={16} />
                                            </a>
                                            <button 
                                                onClick={() => { setEditingRequest(req); setIsAddModalOpen(true); }}
                                                className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                                                title="Edit Data"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button 
                                                onClick={() => setRequestToDelete(req)}
                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                title="Hapus Permohonan"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => setSelectedRequest(req)} 
                                                className="p-2 bg-slate-800 text-white rounded-lg hover:bg-black transition-all shadow-md"
                                                title="Lihat Detail"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        <button 
                                            onClick={() => setSelectedRequest(req)} 
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2"
                                            title="Cek Surat"
                                        >
                                            <FileSearch size={16} />
                                            <span className="text-xs font-bold">Cek Surat</span>
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        {filteredData.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center">
                <FileText size={48} className="text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Data permohonan kosong</p>
            </div>
        )}
      </div>

      {isAddModalOpen && (
        <AddServiceModal 
            onClose={() => { setIsAddModalOpen(false); setEditingRequest(null); }}
            onSave={handleAddRequest}
            citizens={citizens}
            onNavigateToCitizen={onNavigateToCitizen}
            editData={editingRequest}
            currentUserNik={userFilter}
        />
      )}

      {selectedRequest && (
        <ServiceDetailModal 
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onUpdate={(updated) => setRequests(prev => prev.map(r => r.id === updated.id ? updated : r))}
            citizens={citizens}
            isWargaView={isWargaView}
        />
      )}

      {requestToDelete && (
          <AdminVerificationModal 
            isOpen={!!requestToDelete}
            onClose={() => setRequestToDelete(null)}
            onSuccess={handleDeleteSuccess}
            users={users}
            actionType="Delete"
            targetUserName={`REGISTRASI ${requestToDelete.ticketNumber}`}
          />
      )}
    </div>
  );
};

export default ServiceListSection;
