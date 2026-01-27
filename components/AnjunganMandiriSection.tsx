
import React, { useState } from 'react';
import { 
  ChevronLeft, 
  CheckCircle2, 
  FileText, 
  Briefcase, 
  Building2, 
  HeartHandshake, 
  User, 
  Scale, 
  ScanFace,
  Loader2,
  Home,
  Activity,
  Search,
  Clock,
  Stamp,
  XCircle,
  FileCheck,
  LogOut // Ditambahkan
} from 'lucide-react';
import { SystemSettings, Citizen, ServiceRequest, ServiceRating, ServiceType, ServiceStatus, ServiceRatingValue } from '../types';

interface AnjunganMandiriSectionProps {
  settings: SystemSettings;
  citizens: Citizen[];
  requests: ServiceRequest[];
  ratings: ServiceRating[];
  onSaveRequest: (req: ServiceRequest) => void;
  onSaveRating: (rating: ServiceRating) => void;
  onExit: () => void; // Ditambahkan prop onExit
}

type Step = 'WELCOME' | 'VERIFICATION' | 'SERVICE_SELECT' | 'FORM' | 'SUCCESS' | 'RATING' | 'RATING_THANKYOU' | 'CHECK_STATUS' | 'STATUS_DETAIL';

const AnjunganMandiriSection: React.FC<AnjunganMandiriSectionProps> = ({ settings, citizens, requests, onSaveRequest, onSaveRating, onExit }) => {
  const [step, setStep] = useState<Step>('WELCOME');
  const [nikInput, setNikInput] = useState('');
  const [ticketInput, setTicketInput] = useState(''); // State untuk input tiket
  const [verifiedCitizen, setVerifiedCitizen] = useState<Citizen | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [formNotes, setFormNotes] = useState('');
  const [formRtLetter, setFormRtLetter] = useState('');
  const [createdRequest, setCreatedRequest] = useState<ServiceRequest | null>(null);
  const [foundRequest, setFoundRequest] = useState<ServiceRequest | null>(null); // State untuk hasil pencarian
  const [isLoading, setIsLoading] = useState(false);

  // Background Image Style
  const bgStyle = {
    backgroundImage: `linear-gradient(rgba(17, 24, 39, 0.7), rgba(17, 24, 39, 0.8)), url(${settings.anjunganBackground || 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?q=80&w=2000'})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  const handleVerifyNik = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
        const citizen = citizens.find(c => c.nik === nikInput);
        if (citizen) {
            setVerifiedCitizen(citizen);
            setStep('SERVICE_SELECT');
        } else {
            alert('NIK Tidak Ditemukan. Pastikan Anda sudah terdaftar di Kelurahan.');
        }
        setIsLoading(false);
    }, 800);
  };

  const handleCheckStatus = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
        // Cari request berdasarkan nomor tiket (case insensitive)
        const request = requests.find(r => r.ticketNumber.toUpperCase() === ticketInput.toUpperCase());
        
        if (request) {
            setFoundRequest(request);
            setStep('STATUS_DETAIL');
        } else {
            alert('Nomor Tiket tidak ditemukan. Mohon periksa kembali.');
        }
        setIsLoading(false);
    }, 800);
  };

  const handleServiceSelect = (type: ServiceType) => {
    setSelectedService(type);
    setStep('FORM');
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedCitizen || !selectedService) return;

    setIsLoading(true);
    
    // Simulate processing
    setTimeout(() => {
        const typeCode = selectedService.substring(0, 3).toUpperCase();
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const random = Math.floor(1000 + Math.random() * 9000);
        const ticketNumber = `KIOSK-${typeCode}-${date}-${random}`;

        const newRequest: ServiceRequest = {
            id: `SRV-${Date.now()}`,
            ticketNumber: ticketNumber,
            rtLetterNumber: formRtLetter.toUpperCase(),
            requestDate: new Date().toISOString(),
            type: selectedService,
            applicantNik: verifiedCitizen.nik,
            applicantName: verifiedCitizen.namaLengkap,
            applicantPhone: verifiedCitizen.nomorWhatsapp,
            status: ServiceStatus.NEW,
            notes: formNotes,
            logs: [{ status: ServiceStatus.NEW, timestamp: new Date().toISOString(), actor: 'Kiosk System', note: 'Pengajuan Mandiri via Anjungan' }]
        };

        onSaveRequest(newRequest);
        setCreatedRequest(newRequest);
        setStep('SUCCESS');
        setIsLoading(false);
    }, 1500);
  };

  const handleRatingSubmit = (ratingVal: ServiceRatingValue) => {
    if (!createdRequest) return;
    
    const newRating: ServiceRating = {
        id: `RTG-${Date.now()}`,
        ticketNumber: createdRequest.ticketNumber,
        rating: ratingVal,
        timestamp: new Date().toISOString(),
        serviceType: createdRequest.type
    };
    onSaveRating(newRating);
    setStep('RATING_THANKYOU');
    
    // Reset after delay
    setTimeout(() => {
        setStep('WELCOME');
        setNikInput('');
        setVerifiedCitizen(null);
        setSelectedService(null);
        setFormNotes('');
        setFormRtLetter('');
        setCreatedRequest(null);
    }, 3000);
  };

  const getServiceVisuals = (type: ServiceType) => {
    switch(type) {
        case ServiceType.NTCR: return { icon: <HeartHandshake size={40} />, color: 'text-pink-500', bg: 'bg-pink-50', border: 'hover:border-pink-300' };
        case ServiceType.SKTM: return { icon: <Home size={40} />, color: 'text-orange-500', bg: 'bg-orange-50', border: 'hover:border-orange-300' };
        case ServiceType.PENGHASILAN: return { icon: <Briefcase size={40} />, color: 'text-green-500', bg: 'bg-green-50', border: 'hover:border-green-300' };
        case ServiceType.SKU: return { icon: <Building2 size={40} />, color: 'text-blue-500', bg: 'bg-blue-50', border: 'hover:border-blue-300' };
        case ServiceType.LEGALISASI: return { icon: <Scale size={40} />, color: 'text-purple-500', bg: 'bg-purple-50', border: 'hover:border-purple-300' };
        default: return { icon: <FileText size={40} />, color: 'text-slate-500', bg: 'bg-slate-50', border: 'hover:border-slate-300' };
    }
  };

  // FUNGSI BARU: Render Status Besar dengan Keterangan
  const renderDetailedStatus = (status: ServiceStatus) => {
    // Common classes for compactness
    const containerClasses = "border-2 p-4 rounded-3xl flex flex-col items-center text-center gap-2 mb-6 shadow-sm";
    const iconContainerClasses = "p-3 text-white rounded-full shadow-md";
    const titleClasses = "text-2xl font-black uppercase tracking-tight leading-none mb-1";
    const descClasses = "font-bold text-sm leading-tight max-w-lg mx-auto";

    switch (status) {
        case ServiceStatus.READY:
            return (
                <div className={`${containerClasses} bg-emerald-50 border-emerald-400 animate-pulse shadow-emerald-100`}>
                    <div className={`${iconContainerClasses} bg-emerald-500`}>
                        <Stamp size={32} />
                    </div>
                    <div>
                        <h2 className={`${titleClasses} text-emerald-700`}>SIAP DIAMBIL</h2>
                        <p className={`${descClasses} text-emerald-800`}>
                            Surat Anda sudah selesai dicetak dan ditandatangani. Silakan ambil di Loket Pelayanan.
                        </p>
                    </div>
                </div>
            );
        case ServiceStatus.NEW:
            return (
                <div className={`${containerClasses} bg-rose-50 border-rose-300`}>
                    <div className={`${iconContainerClasses} bg-rose-500`}>
                        <Clock size={32} />
                    </div>
                    <div>
                        <h2 className={`${titleClasses} text-rose-700`}>MENUNGGU VERIFIKASI</h2>
                        <p className={`${descClasses} text-rose-800`}>
                            Permohonan Anda sedang dalam antrean pemeriksaan petugas. Mohon menunggu konfirmasi selanjutnya.
                        </p>
                    </div>
                </div>
            );
        case ServiceStatus.ACCEPTED:
        case ServiceStatus.WAITING:
            return (
                <div className={`${containerClasses} bg-amber-50 border-amber-300`}>
                    <div className={`${iconContainerClasses} bg-amber-500`}>
                        <Loader2 size={32} className="animate-spin" />
                    </div>
                    <div>
                        <h2 className={`${titleClasses} text-amber-700`}>SEDANG DIPROSES</h2>
                        <p className={`${descClasses} text-amber-800`}>
                            Berkas Anda telah diterima dan sedang diproses oleh tim administrasi kelurahan.
                        </p>
                    </div>
                </div>
            );
        case ServiceStatus.PROCESSED:
            return (
                <div className={`${containerClasses} bg-blue-50 border-blue-300`}>
                    <div className={`${iconContainerClasses} bg-blue-600`}>
                        <FileCheck size={32} />
                    </div>
                    <div>
                        <h2 className={`${titleClasses} text-blue-800`}>MENUNGGU SURAT TERBIT</h2>
                        <p className={`${descClasses} text-blue-800`}>
                            Draft surat sudah jadi dan sedang menunggu tanda tangan pimpinan kelurahan.
                        </p>
                    </div>
                </div>
            );
        case ServiceStatus.COMPLETED:
            return (
                <div className={`${containerClasses} bg-slate-100 border-slate-300`}>
                    <div className={`${iconContainerClasses} bg-slate-600`}>
                        <CheckCircle2 size={32} />
                    </div>
                    <div>
                        <h2 className={`${titleClasses} text-slate-700`}>LAYANAN SELESAI</h2>
                        <p className={`${descClasses} text-slate-600`}>
                            Surat sudah diserahkan dan diterima oleh pemohon. Terima kasih telah menggunakan layanan ini.
                        </p>
                    </div>
                </div>
            );
        case ServiceStatus.REJECTED:
            return (
                <div className={`${containerClasses} bg-red-50 border-red-300`}>
                    <div className={`${iconContainerClasses} bg-red-600`}>
                        <XCircle size={32} />
                    </div>
                    <div>
                        <h2 className={`${titleClasses} text-red-800`}>PENGAJUAN DITOLAK</h2>
                        <p className={`${descClasses} text-red-800`}>
                            Mohon maaf, pengajuan Anda ditolak karena data tidak lengkap atau tidak sesuai. Silakan hubungi petugas loket.
                        </p>
                    </div>
                </div>
            );
        default:
            return null;
    }
  };

  // Render content based on step
  const renderContent = () => {
    switch(step) {
      case 'WELCOME':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-10 animate-in fade-in zoom-in-95 duration-500">
             <div className="w-32 h-32 bg-white/10 rounded-[2rem] flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl animate-bounce-slow">
                <Activity size={64} className="text-white" />
             </div>
             <div className="space-y-2">
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase drop-shadow-lg">
                   Anjungan Mandiri
                </h1>
                <p className="text-xl md:text-2xl text-blue-100 font-medium tracking-wide drop-shadow-md">
                   Pelayanan Administrasi Warga Cepat & Mudah
                </p>
             </div>
             
             {/* Main Action Buttons */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-4">
                <button 
                  onClick={() => setStep('VERIFICATION')}
                  className="group relative px-8 py-8 bg-white text-indigo-900 rounded-[2.5rem] shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-4"
                >
                   <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FileText size={40} />
                   </div>
                   <div className="space-y-1">
                      <span className="text-2xl font-black uppercase tracking-widest block">Buat Pengajuan</span>
                      <span className="text-sm font-medium text-slate-500 block">Surat Pengantar & Keterangan</span>
                   </div>
                </button>

                <button 
                  onClick={() => setStep('CHECK_STATUS')}
                  className="group relative px-8 py-8 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white rounded-[2.5rem] shadow-xl hover:bg-white/20 transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-4"
                >
                   <div className="w-20 h-20 bg-white/20 text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Search size={40} />
                   </div>
                   <div className="space-y-1">
                      <span className="text-2xl font-black uppercase tracking-widest block">Cek Status</span>
                      <span className="text-sm font-medium text-blue-100 block">Lacak Progres Surat Anda</span>
                   </div>
                </button>
             </div>

             <p className="text-white/50 text-sm mt-4 font-mono">Pilih menu untuk melanjutkan</p>
          </div>
        );

      case 'VERIFICATION':
        return (
          <div className="w-full max-w-2xl bg-white rounded-[3rem] p-12 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300">
             <div className="text-center mb-8">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                   <ScanFace size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Verifikasi Identitas</h2>
                <p className="text-slate-500 text-lg mt-2">Masukkan NIK Anda untuk melanjutkan pembuatan surat.</p>
             </div>
             
             <form onSubmit={handleVerifyNik} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-2">Nomor Induk Kependudukan (NIK)</label>
                   <input 
                     type="text" 
                     value={nikInput}
                     onChange={(e) => setNikInput(e.target.value.replace(/\D/g, ''))}
                     placeholder="Masukkan 16 digit NIK" 
                     maxLength={16}
                     className="w-full p-6 bg-slate-50 border-4 border-slate-100 rounded-[2rem] text-3xl font-black text-center text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-300 tracking-widest"
                     autoFocus
                   />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                   <button 
                     type="button" 
                     onClick={() => setStep('WELCOME')} 
                     className="py-5 rounded-2xl text-xl font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                   >
                     Batal
                   </button>
                   <button 
                     type="submit" 
                     disabled={nikInput.length < 16 || isLoading}
                     className="py-5 bg-indigo-600 text-white rounded-2xl text-xl font-black shadow-lg hover:bg-indigo-700 hover:shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                   >
                     {isLoading ? <Loader2 className="animate-spin" /> : 'Lanjutkan'}
                   </button>
                </div>
             </form>
          </div>
        );

      case 'CHECK_STATUS':
        return (
          <div className="w-full max-w-2xl bg-white rounded-[3rem] p-12 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300">
             <div className="text-center mb-8">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                   <Search size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Cek Status Surat</h2>
                <p className="text-slate-500 text-lg mt-2">Masukkan Nomor Tiket pendaftaran Anda.</p>
             </div>
             
             <form onSubmit={handleCheckStatus} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-2">Nomor Tiket / Registrasi</label>
                   <input 
                     type="text" 
                     value={ticketInput}
                     onChange={(e) => setTicketInput(e.target.value.toUpperCase())}
                     placeholder="CONTOH: KIOSK-SKU-2024..." 
                     className="w-full p-6 bg-slate-50 border-4 border-slate-100 rounded-[2rem] text-2xl font-black text-center text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all placeholder:text-slate-300 uppercase"
                     autoFocus
                   />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                   <button 
                     type="button" 
                     onClick={() => setStep('WELCOME')} 
                     className="py-5 rounded-2xl text-xl font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                   >
                     Batal
                   </button>
                   <button 
                     type="submit" 
                     disabled={!ticketInput || isLoading}
                     className="py-5 bg-emerald-600 text-white rounded-2xl text-xl font-black shadow-lg hover:bg-emerald-700 hover:shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                   >
                     {isLoading ? <Loader2 className="animate-spin" /> : 'Cari Data'}
                   </button>
                </div>
             </form>
          </div>
        );

      case 'STATUS_DETAIL':
        if (!foundRequest) return null;
        return (
          // Changed max-w-3xl to max-w-6xl for wider display
          <div className="w-full max-w-6xl bg-white rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300 h-[85vh] flex flex-col">
             <div className="flex justify-between items-start mb-8 shrink-0">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Status Pengajuan</h3>
                    <p className="text-slate-500 font-medium mt-1">Detail informasi tiket Anda</p>
                </div>
                <div className="bg-slate-100 px-4 py-2 rounded-xl text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nomor Tiket</p>
                    <p className="text-lg font-mono font-black text-indigo-600">{foundRequest.ticketNumber}</p>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                
                {/* NEW: Render Big Status Banner */}
                {renderDetailedStatus(foundRequest.status)}

                <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Nama Pemohon</p>
                            <p className="text-xl font-black text-slate-800">{foundRequest.applicantName}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Jenis Layanan</p>
                            <p className="text-xl font-black text-indigo-600">{foundRequest.type}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tanggal Masuk</p>
                            <p className="text-lg font-bold text-slate-700">{new Date(foundRequest.requestDate).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Keperluan</p>
                            <p className="text-sm font-medium text-slate-600 italic line-clamp-2">"{foundRequest.notes}"</p>
                        </div>
                    </div>
                </div>

                {/* Log History */}
                <div className="space-y-6 pl-4 border-l-4 border-slate-100 ml-4">
                    {foundRequest.logs.slice().reverse().map((log, idx) => (
                        <div key={idx} className="relative">
                            <div className={`absolute -left-[22px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm ${idx === 0 ? 'bg-indigo-600 scale-125' : 'bg-slate-300'}`}></div>
                            <div>
                                <p className={`font-black uppercase text-sm ${idx === 0 ? 'text-indigo-700' : 'text-slate-500'}`}>{log.status}</p>
                                <p className="text-[10px] text-slate-400 font-mono mb-1">{new Date(log.timestamp).toLocaleString('id-ID')}</p>
                                {log.note && <p className="text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-xl inline-block border border-slate-100 mt-1">"{log.note}"</p>}
                            </div>
                        </div>
                    ))}
                </div>
             </div>

             <div className="mt-6 pt-6 border-t border-slate-100 shrink-0">
                <button 
                  onClick={() => { setStep('CHECK_STATUS'); setFoundRequest(null); setTicketInput(''); }} 
                  className="w-full py-4 bg-slate-800 text-white rounded-2xl text-lg font-black shadow-lg hover:bg-slate-900 transition-all uppercase tracking-widest"
                >
                  Cari Tiket Lain
                </button>
             </div>
          </div>
        );

      case 'SERVICE_SELECT':
        return (
          <div className="w-full max-w-7xl h-[85vh] flex flex-col animate-in zoom-in-95 p-4">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-3xl md:text-4xl font-black text-white mb-1 uppercase tracking-tight drop-shadow-md">Halo, {verifiedCitizen?.namaLengkap.split(' ')[0]}! 👋</h3>
                    <p className="text-indigo-100 text-lg font-medium drop-shadow-sm">Pilih layanan surat yang Anda butuhkan.</p>
                </div>
                <div className="hidden md:block text-right text-white/80 text-sm font-bold bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                   <p>{verifiedCitizen?.nik}</p>
                   <p>{verifiedCitizen?.alamat}</p>
                </div>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar p-2 flex-1 pb-4">
                {Object.values(ServiceType).map((type) => {
                   const visual = getServiceVisuals(type);
                   return (
                      <button 
                        key={type} 
                        onClick={() => handleServiceSelect(type)}
                        className={`bg-white hover:bg-white/95 p-8 rounded-[2.5rem] shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all group text-left flex flex-col items-center text-center gap-6 justify-center h-full min-h-[220px] border-4 border-transparent ${visual.border}`}
                      >
                         <div className={`w-24 h-24 md:w-28 md:h-28 rounded-full ${visual.bg} flex items-center justify-center ${visual.color} group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                            {visual.icon}
                         </div>
                         <h4 className="font-black text-slate-800 text-lg md:text-xl leading-tight uppercase tracking-tight">{type}</h4>
                      </button>
                   );
                })}
             </div>
             
             <div className="mt-4 flex justify-center shrink-0">
                <button 
                    onClick={() => setStep('VERIFICATION')} 
                    className="bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 px-8 py-3 rounded-full font-bold text-lg shadow-xl transition-all flex items-center gap-2 backdrop-blur-md active:scale-95"
                >
                    <ChevronLeft size={24} /> KEMBALI
                </button>
             </div>
          </div>
        );

      case 'FORM':
        return (
          <div className="w-full max-w-3xl bg-white rounded-[2.5rem] p-10 shadow-2xl animate-in slide-in-from-right-10 fade-in duration-300 h-[80vh] flex flex-col">
             <div className="text-center mb-8 shrink-0">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Detail Permohonan</h3>
                <p className="text-slate-500 font-medium mt-1">{selectedService}</p>
             </div>

             <form onSubmit={handleSubmitRequest} className="flex-1 flex flex-col gap-6 overflow-y-auto px-2 custom-scrollbar">
                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-2">Nomor Pengantar RT/RW <span className="text-red-500">*</span></label>
                   <input 
                     type="text" 
                     required
                     value={formRtLetter}
                     onChange={(e) => setFormRtLetter(e.target.value.toUpperCase())}
                     placeholder="Contoh: 001/RT.005/02/2024" 
                     className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-lg font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all uppercase"
                   />
                </div>
                
                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-2">Keperluan / Keterangan <span className="text-red-500">*</span></label>
                   <textarea 
                     required
                     value={formNotes}
                     onChange={(e) => setFormNotes(e.target.value)}
                     placeholder="Jelaskan keperluan surat..." 
                     rows={4}
                     className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-lg font-medium text-slate-800 outline-none focus:border-indigo-500 transition-all resize-none"
                   ></textarea>
                </div>

                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex gap-4 items-start">
                   <div className="p-2 bg-white rounded-full text-blue-600 shadow-sm"><User size={24} /></div>
                   <div>
                      <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Pemohon</p>
                      <p className="text-lg font-bold text-blue-900">{verifiedCitizen?.namaLengkap}</p>
                      <p className="text-sm text-blue-700">{verifiedCitizen?.nik}</p>
                   </div>
                </div>
             </form>

             <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setStep('SERVICE_SELECT')} 
                  className="py-4 rounded-2xl text-lg font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                >
                  Kembali
                </button>
                <button 
                  onClick={handleSubmitRequest}
                  disabled={isLoading}
                  className="py-4 bg-indigo-600 text-white rounded-2xl text-lg font-black shadow-lg hover:bg-indigo-700 hover:shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Kirim Permohonan'}
                </button>
             </div>
          </div>
        );

      case 'SUCCESS':
        return (
          <div className="w-full max-w-2xl bg-white rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 duration-500 text-center">
             <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-slow">
                <CheckCircle2 size={48} />
             </div>
             <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tight mb-4">Permohonan Berhasil!</h2>
             <p className="text-slate-500 text-lg mb-8">
               Data Anda telah masuk ke sistem kami. Silakan catat atau foto nomor tiket di bawah ini untuk pengambilan surat.
             </p>
             
             <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 mb-8 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Nomor Tiket Antrian</p>
                <p className="text-4xl md:text-5xl font-mono font-black text-indigo-600 tracking-wider select-all">{createdRequest?.ticketNumber}</p>
             </div>

             <button 
               onClick={() => setStep('RATING')}
               className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-xl font-black shadow-lg hover:bg-indigo-700 transition-all transform hover:-translate-y-1 active:translate-y-0"
             >
               Selesai
             </button>
          </div>
        );

      case 'RATING':
        return (
          <div className="w-full max-w-4xl bg-white rounded-[3rem] p-12 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-500 text-center">
             <h3 className="text-3xl font-black text-slate-800 mb-2">Bagaimana pengalaman Anda?</h3>
             <p className="text-slate-500 text-lg mb-10">Bantu kami meningkatkan pelayanan dengan memberikan penilaian.</p>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <button onClick={() => handleRatingSubmit('Sangat Baik')} className="group flex flex-col items-center gap-4 p-6 rounded-3xl border-4 border-transparent hover:border-green-100 hover:bg-green-50 transition-all transform hover:scale-105">
                   <div className="text-6xl group-hover:scale-110 transition-transform">🤩</div>
                   <span className="font-bold text-slate-600 group-hover:text-green-600">Sangat Puas</span>
                </button>
                <button onClick={() => handleRatingSubmit('Baik')} className="group flex flex-col items-center gap-4 p-6 rounded-3xl border-4 border-transparent hover:border-blue-100 hover:bg-blue-50 transition-all transform hover:scale-105">
                   <div className="text-6xl group-hover:scale-110 transition-transform">😊</div>
                   <span className="font-bold text-slate-600 group-hover:text-blue-600">Puas</span>
                </button>
                <button onClick={() => handleRatingSubmit('Biasa')} className="group flex flex-col items-center gap-4 p-6 rounded-3xl border-4 border-transparent hover:border-slate-200 hover:bg-slate-100 transition-all transform hover:scale-105">
                   <div className="text-6xl group-hover:scale-110 transition-transform">😐</div>
                   <span className="font-bold text-slate-600">Biasa Saja</span>
                </button>
                <button onClick={() => handleRatingSubmit('Buruk')} className="group flex flex-col items-center gap-4 p-6 rounded-3xl border-4 border-transparent hover:border-red-100 hover:bg-red-50 transition-all transform hover:scale-105">
                   <div className="text-6xl group-hover:scale-110 transition-transform">😠</div>
                   <span className="font-bold text-slate-600 group-hover:text-red-600">Kecewa</span>
                </button>
             </div>
             
             <button onClick={() => handleRatingSubmit('Baik')} className="mt-12 text-slate-400 font-bold hover:text-slate-600 text-sm">Lewati Penilaian</button>
          </div>
        );

      case 'RATING_THANKYOU':
        return (
          <div className="text-center text-white animate-in zoom-in duration-500">
             <div className="text-8xl mb-6 animate-bounce">🙏</div>
             <h2 className="text-5xl font-black uppercase tracking-tight mb-4 drop-shadow-lg">Terima Kasih!</h2>
             <p className="text-2xl text-white/90 font-medium">Layanan mandiri akan kembali ke halaman utama.</p>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden" style={bgStyle}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        
        {/* Top Bar info */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10">
           <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-white flex items-center gap-4 shadow-lg">
              <img src={settings.logo || ''} alt="Logo" className="w-12 h-12 object-contain" />
              <div>
                 <h1 className="font-black text-lg leading-tight uppercase">{settings.systemName}</h1>
                 <p className="text-xs text-white/70">{settings.subName}</p>
              </div>
           </div>
           
           <div className="flex gap-4">
             {/* Clock */}
             <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 text-white font-mono text-xl font-bold shadow-lg hidden md:block">
                {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
             </div>

             {/* Exit Button */}
             <button 
                onClick={onExit}
                className="bg-white/10 hover:bg-red-600/80 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-white transition-all shadow-lg group"
                title="Keluar / Tampilkan Menu"
             >
                <LogOut size={24} />
             </button>
           </div>
        </div>

        {/* Main Content Area */}
        <div className="relative z-20 w-full h-full flex flex-col items-center justify-center p-4">
           {renderContent()}
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 text-center text-white/40 text-sm font-medium z-10 w-full">
           &copy; {new Date().getFullYear()} Kelurahan Grogol Selatan • Anjungan Mandiri v1.0
        </div>
    </div>
  );
};

export default AnjunganMandiriSection;
