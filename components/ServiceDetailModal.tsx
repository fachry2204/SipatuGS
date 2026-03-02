
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, FileText, User, Calendar, Clock, CheckCircle2, Info, Printer, AlertCircle, 
  Send, Upload, ChevronRight, Stamp, ShieldCheck, Home, MapPin, CreditCard, 
  ZoomIn, Timer, QrCode, CheckCircle, FileCheck, Camera, Loader2, FileDown, MessageCircle, History, AlertTriangle,
  Paperclip,
  AlignLeft,
  Hash,
  Globe,
  FileBadge,
  Download // Added Download icon
} from 'lucide-react';
import { ServiceRequest, ServiceStatus, Citizen, Gender, ServiceLog } from '../types';
import { GoogleGenAI } from "@google/genai";

const RequestTimer: React.FC<{ startDate: string, endDate?: string }> = ({ startDate, endDate }) => {
    const [elapsed, setElapsed] = useState('00:00:00');
    useEffect(() => {
        const update = () => {
            const start = new Date(startDate).getTime();
            const end = endDate ? new Date(endDate).getTime() : new Date().getTime();
            const diff = end - start;
            if (diff < 0) return;
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
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-black text-xs shadow-sm ${endDate ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
            <Timer size={14} className={endDate ? '' : 'animate-pulse'} />
            {endDate ? 'DURASI TOTAL: ' : 'LAMA PROSES: '}{elapsed}
        </div>
    );
};

interface ServiceDetailModalProps {
  request: ServiceRequest;
  onClose: () => void;
  onUpdate: (updated: ServiceRequest) => void;
  citizens: Citizen[];
  isWargaView?: boolean; // Added isWargaView prop
}

const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({ request, onClose, onUpdate, citizens, isWargaView = false }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualLetterNumber, setManualLetterNumber] = useState(request.letterNumber || '');
  const [jakEvoNumberInput, setJakEvoNumberInput] = useState(''); // New State for JAK EVO Number
  const [showOfficialPreview, setShowOfficialPreview] = useState(false);
  
  // Confirmation States
  const [confirmStage, setConfirmStage] = useState<'accept' | 'number' | 'upload_confirm' | null>(null);
  const [pendingUploadData, setPendingUploadData] = useState<string | null>(null);

  const [vCodeInput, setVCodeInput] = useState('');
  const [verificationError, setVerificationError] = useState(false);
  const [verificationMode, setVerificationMode] = useState<'manual' | 'scan' | 'upload'>('manual');
  
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const applicant = citizens.find(c => c.nik === request.applicantNik);

  const handleUpdateStatus = (nextStatus: ServiceStatus, extraData: Partial<ServiceRequest> = {}, logNote: string = '', shouldClose: boolean = false) => {
    // Langsung tutup popup konfirmasi
    setConfirmStage(null);
    setIsProcessing(true);
    
    const now = new Date().toISOString();
    const newLog: ServiceLog = {
        status: nextStatus,
        timestamp: now,
        actor: 'Admin/System',
        note: logNote
    };

    setTimeout(() => {
        onUpdate({
            ...request,
            status: nextStatus,
            logs: [...(request.logs || []), newLog],
            ...extraData
        });
        setIsProcessing(false);
        if (shouldClose) onClose();
    }, 400); 
  };

  const handleAccept = () => {
    handleUpdateStatus(ServiceStatus.ACCEPTED, {}, "Pengajuan telah diterima oleh admin kelurahan.", true);
  };

  const handleToProcess = () => {
    // UPDATE: Tidak perlu validasi manualLetterNumber untuk JAK EVO
    // Set placeholder number indicating external process
    const finalNumber = "DIPROSES VIA JAK EVO";
    
    setConfirmStage(null);
    setShowOfficialPreview(false); 

    handleUpdateStatus(
        ServiceStatus.PROCESSED, 
        { letterNumber: finalNumber }, 
        `Data diteruskan ke JAK EVO. Status berubah menjadi Menunggu Surat Terbit.`, 
        true
    );
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
          setPendingUploadData(reader.result as string);
          setConfirmStage('upload_confirm');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalUpload = () => {
    if (!pendingUploadData) return;
    
    // Validation: Require Number if in Processed state
    if (request.status === ServiceStatus.PROCESSED && !jakEvoNumberInput) {
        alert("Mohon masukkan Nomor Surat Terbit dari JAK EVO.");
        setConfirmStage(null);
        return;
    }
    
    const now = new Date().toISOString();
    setConfirmStage(null);
    
    handleUpdateStatus(ServiceStatus.READY, { 
        signedLetterUrl: pendingUploadData,
        verificationCode: request.ticketNumber,
        letterNumber: jakEvoNumberInput || request.letterNumber, // Save real number
        completionDate: now 
    }, "Surat terbit dari JAK EVO berhasil diunggah. Siap diambil.", true);
    setPendingUploadData(null);
  };

  const handleVerifyPickup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVerificationError(false);
    const expected = request.ticketNumber;
    if (vCodeInput.trim().toUpperCase() === expected.toUpperCase()) {
        handleUpdateStatus(ServiceStatus.COMPLETED, {}, "Surat telah diserahkan dan diterima warga.", true);
    } else {
        setVerificationError(true);
        setTimeout(() => setVerificationError(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!request.signedLetterUrl) {
        alert("File surat belum tersedia untuk diunduh.");
        return;
    }
    const link = document.createElement('a');
    link.href = request.signedLetterUrl;
    // Determine extension mostly likely PDF or Image
    const isImage = request.signedLetterUrl.startsWith('data:image');
    const ext = isImage ? 'jpg' : 'pdf';
    link.download = `Surat-${request.ticketNumber}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startCameraScan = async () => {
    setVerificationMode('scan');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      alert("Gagal mengakses kamera.");
      setVerificationMode('manual');
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    setStream(null);
  };

  const getStatusStyle = (status: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.NEW: return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: <AlertCircle size={20} /> };
      case ServiceStatus.ACCEPTED: return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: <CheckCircle2 size={20} /> };
      case ServiceStatus.WAITING: return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: <Clock size={20} /> };
      case ServiceStatus.PROCESSED: return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: <Clock size={20} /> };
      case ServiceStatus.READY: return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <Stamp size={20} /> };
      case ServiceStatus.COMPLETED: return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: <CheckCircle size={20} /> };
      default: return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: <Info size={20} /> };
    }
  };

  const style = getStatusStyle(request.status);

  const isPdf = (url?: string) => url?.startsWith('data:application/pdf');

  if (showOfficialPreview) {
      return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in">
              <div className="bg-white w-full max-w-4xl h-[95vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 no-print">
                      <div className="flex items-center gap-3">
                        <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">Pratinjau Surat Resmi</h4>
                        {request.status === ServiceStatus.PROCESSED && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded uppercase">Siap Cetak & TTD</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => window.print()} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg">
                            <Printer size={16} /> Cetak Sekarang
                        </button>
                        <button onClick={() => { setShowOfficialPreview(false); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-12 bg-white custom-scrollbar print:p-0">
                      <div className="max-w-[210mm] mx-auto bg-white min-h-[297mm] flex flex-col">
                         <div className="flex items-center border-b-4 border-double border-black pb-4 mb-8">
                             <img src="https://upload.wikimedia.org/wikipedia/commons/e/eb/Coat_of_arms_of_Jakarta.svg" className="w-20 h-20 mr-6" alt="Logo" />
                             <div className="text-center flex-1">
                                 <h2 className="text-xl font-bold">PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA</h2>
                                 <h3 className="text-lg font-bold">KOTA ADMINISTRASI JAKARTA SELATAN</h3>
                                 <h1 className="text-2xl font-bold">KECAMATAN KEBAYORAN LAMA</h1>
                                 <h1 className="text-2xl font-bold">KELURAHAN GROGOL SELATAN</h1>
                                 <p className="text-xs">Jl. Teuku Nyak Arif No.1, RT.1/RW.2, Jakarta Selatan, Kode Pos 12220</p>
                             </div>
                         </div>
                         <div className="text-center mb-10">
                             <h3 className="text-lg font-bold underline uppercase">{request.type}</h3>
                             <p className="text-sm font-bold">Nomor: {request.letterNumber || manualLetterNumber || '.............................'}</p>
                         </div>
                         <div className="space-y-6 text-sm leading-relaxed text-justify flex-1">
                            <p>Yang bertanda tangan di bawah ini Lurah Grogol Selatan Kecamatan Kebayoran Lama Kota Administrasi Jakarta Selatan, dengan ini menerangkan bahwa:</p>
                            <div className="pl-12 space-y-2">
                                <div className="grid grid-cols-4"><span>Nama</span><span className="col-span-3">: <b>{request.applicantName}</b></span></div>
                                <div className="grid grid-cols-4"><span>NIK</span><span className="col-span-3">: {request.applicantNik}</span></div>
                                <div className="grid grid-cols-4"><span>Asal Pengantar RT</span><span className="col-span-3">: {request.rtLetterNumber || '-'}</span></div>
                                <div className="grid grid-cols-4"><span>Keperluan</span><span className="col-span-3">: {request.notes || '-'}</span></div>
                            </div>
                            <p>Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
                         </div>
                         <div className="mt-20 flex justify-end">
                            <div className="text-center min-w-[250px]">
                                <p>Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                <p className="mb-24">Lurah Grogol Selatan,</p>
                                <p className="font-bold underline text-lg">BUDI SANTOSO, S.Sos</p>
                                <p>NIP. 19750817 200003 1 001</p>
                            </div>
                         </div>
                         <div className="mt-auto pt-20 flex justify-between items-end border-t border-slate-100">
                             <div className="text-[9px] text-slate-400 font-mono">
                                 SISTEM INFORMASI TERPADU KELURAHAN GROGOL SELATAN<br/>
                                 DI-VALIDASI SECARA ELEKTRONIK PADA: {new Date().toLocaleString()}
                             </div>
                             <div className="flex flex-col items-end gap-2">
                                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${request.ticketNumber}`} className="w-20 h-20" alt="Verification QR" />
                                 <p className="text-[9px] font-black text-indigo-600 uppercase">TIKET: {request.ticketNumber}</p>
                             </div>
                         </div>
                      </div>

                      {request.documents && request.documents.length > 0 && (
                          <div className="mt-12 pt-12 border-t-2 border-dashed border-slate-200 print:border-none print:m-0 print:break-before-page">
                              <div className="max-w-[210mm] mx-auto bg-white min-h-[297mm]">
                                  <div className="flex items-center gap-3 mb-8 border-b-2 border-slate-900 pb-2">
                                      <Paperclip className="text-slate-900" size={24} />
                                      <h3 className="text-xl font-bold uppercase tracking-tight">Lampiran Dokumen Pendukung</h3>
                                  </div>
                                  <p className="text-xs text-slate-500 mb-8 italic">Dokumen lampiran berikut merupakan berkas asli yang diunggah oleh pemohon melalui sistem SIPATU.</p>
                                  
                                  <div className="space-y-12">
                                      {request.documents.map((doc, idx) => (
                                          <div key={idx} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 print:p-0 print:bg-white print:border-none">
                                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Lampiran #{idx + 1}</p>
                                              {isPdf(doc) ? (
                                                  <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl border border-dashed border-slate-300">
                                                      <FileText size={48} className="text-red-500 mb-2" />
                                                      <p className="font-bold text-slate-700">Dokumen PDF Terlampir</p>
                                                      <p className="text-[10px] text-slate-400 mt-1">Silakan lihat lampiran fisik atau digital melalui portal Admin.</p>
                                                  </div>
                                              ) : (
                                                  <div className="rounded-2xl overflow-hidden shadow-xl bg-white border border-slate-100">
                                                      <img src={doc} alt={`Dokumen ${idx+1}`} className="w-full object-contain max-h-[800px]" />
                                                  </div>
                                              )}
                                          </div>
                                      ))}
                                  </div>

                                  <div className="mt-20 pt-10 border-t border-slate-100 text-center">
                                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">Halaman Lampiran Selesai</p>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  const renderConfirmation = () => {
    if (!confirmStage) return null;

    const config = {
        accept: {
            title: "Terima Pengajuan?",
            desc: "Apakah berkas persyaratan warga sudah lengkap? Tekan konfirmasi untuk menerima pengajuan ini.",
            icon: <CheckCircle2 className="text-indigo-600" size={32} />,
            action: handleAccept,
            color: "indigo"
        },
        number: {
            title: "Proses ke JAK EVO?",
            desc: (
                <span>
                    Permohonan akan diteruskan ke sistem JAK EVO untuk penerbitan surat. Lanjutkan?
                </span>
            ),
            icon: <Globe className="text-blue-600" size={32} />,
            action: handleToProcess,
            color: "blue"
        },
        upload_confirm: {
            title: "Konfirmasi Penerbitan Surat",
            desc: (
                <span>
                    Apakah Nomor Surat <b className="text-indigo-600">"{jakEvoNumberInput}"</b> dan file yang diunggah sudah sesuai dengan hasil dari JAK EVO?
                </span>
            ),
            icon: <Upload className="text-emerald-600" size={32} />,
            action: handleFinalUpload,
            color: "emerald"
        }
    }[confirmStage];

    return (
        <div className="absolute inset-0 z-[110] bg-white/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-8 max-w-sm text-center space-y-6 animate-in zoom-in-95">
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-${config.color}-50`}>
                    {config.icon}
                </div>
                <div>
                    <h4 className="text-xl font-black text-slate-800">{config.title}</h4>
                    <div className="text-sm text-slate-500 mt-2">{config.desc}</div>
                </div>
                {isProcessing ? (
                   <div className="flex flex-col items-center gap-3">
                      <Loader2 size={32} className="animate-spin text-emerald-600" />
                      <p className="text-xs font-black text-emerald-600 uppercase animate-pulse">Memproses Data...</p>
                   </div>
                ) : (
                  <div className="flex gap-3">
                      <button 
                          onClick={() => { setConfirmStage(null); setPendingUploadData(null); }}
                          className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-all"
                      >
                          Batal
                      </button>
                      <button 
                          onClick={config.action}
                          disabled={isProcessing}
                          className={`flex-1 py-3 bg-${config.color === 'indigo' ? 'indigo-600' : config.color === 'emerald' ? 'emerald-600' : 'blue-600'} text-white rounded-2xl text-sm font-black shadow-lg shadow-slate-200 transition-all active:scale-95`}
                      >
                          Ya, Lanjutkan
                      </button>
                  </div>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300">
      
      {zoomedImage && (
        <div 
            className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4 cursor-pointer animate-in fade-in"
            onClick={() => setZoomedImage(null)}
        >
            {isPdf(zoomedImage) ? (
                <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col">
                    <div className="p-4 border-b flex justify-between items-center text-slate-800">
                        <span className="font-bold">PDF Dokumen</span>
                        <X size={24} />
                    </div>
                    <iframe src={zoomedImage} className="flex-1 w-full" title="PDF Preview" />
                </div>
            ) : (
                <img src={zoomedImage} alt="Zoomed" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
            )}
            <button className="absolute top-6 right-6 text-white hover:text-red-400 p-2"><X size={40} /></button>
        </div>
      )}

      <div className="bg-white w-full max-w-6xl h-[90vh] flex flex-col rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative">
        
        {renderConfirmation()}

        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 pr-16">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <FileText size={24} />
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Detail Permohonan Persuratan</h3>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                    <p className="text-xs font-mono font-black text-indigo-500 uppercase tracking-widest">{request.ticketNumber}</p>
                    <RequestTimer startDate={request.requestDate} endDate={request.completionDate} />
                </div>
             </div>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-all"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50 custom-scrollbar">
           <div className={`p-6 rounded-[2rem] border-2 flex items-center justify-between ${style.bg} ${style.border} ${style.text}`}>
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white rounded-2xl shadow-sm">
                    {style.icon}
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mb-1">Status Tahapan Saat Ini</p>
                    <p className="text-2xl font-black tracking-tight">{request.status}</p>
                </div>
              </div>
           </div>

           <div className="space-y-6">
              {/* ADMIN ACTIONS: Only show if NOT Warga View */}
              {!isWargaView && request.status === ServiceStatus.NEW && (
                <div className="bg-white p-6 rounded-[2rem] border-2 border-indigo-100 shadow-xl shadow-indigo-100/20">
                    <h4 className="font-black text-slate-800 text-sm mb-4 uppercase tracking-tighter flex items-center gap-2">
                        <ShieldCheck size={16} className="text-indigo-600" /> Verifikasi Pengajuan
                    </h4>
                    <p className="text-sm text-slate-500 mb-6">Warga telah mengajukan surat baru. Silakan tinjau data pemohon dan data pendukung di bawah ini sebelum menerima pengajuan.</p>
                    <button onClick={() => setConfirmStage('accept')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl text-sm font-black shadow-lg shadow-indigo-200 transition-all transform active:scale-95 flex items-center justify-center gap-2">
                        TERIMA & LANJUTKAN
                    </button>
                </div>
              )}

              {/* ADMIN ACTIONS: Modified for JAK EVO INTEGRATION */}
              {!isWargaView && request.status === ServiceStatus.ACCEPTED && (
                <div className="bg-white p-6 rounded-[2rem] border-2 border-amber-100 shadow-xl shadow-amber-100/20">
                    <h4 className="font-black text-slate-800 text-sm mb-4 uppercase tracking-tighter flex items-center gap-2">
                        <Globe size={16} className="text-amber-600" /> Integrasi JAK EVO
                    </h4>
                    <div className="space-y-4">
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 text-sm">
                            <p className="font-bold">Proses Penerbitan Surat</p>
                            <p className="mt-1 text-xs">Klik tombol di bawah untuk meneruskan data permohonan ke sistem JAK EVO. Penomoran surat akan dilakukan secara otomatis oleh sistem pusat.</p>
                        </div>
                        <button 
                            onClick={() => setConfirmStage('number')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl text-sm font-black shadow-lg shadow-blue-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            PROSES SURAT KE JAK EVO <Send size={16} />
                        </button>
                    </div>
                </div>
              )}

              {/* ADMIN UPLOAD: FORM INPUT JAK EVO NUMBER & FILE */}
              {!isWargaView && request.status === ServiceStatus.PROCESSED && (
                  <div className="bg-blue-600 p-8 rounded-[2rem] text-white shadow-xl shadow-blue-100/20 space-y-6">
                      <div className="flex flex-col items-start gap-2">
                          <div className="flex items-center gap-2 mb-2">
                             <div className="p-2 bg-white/20 rounded-lg"><FileBadge size={20}/></div>
                             <h4 className="font-black text-xl uppercase tracking-tighter">Penyelesaian Dokumen JAK EVO</h4>
                          </div>
                          <p className="text-blue-100 text-sm">Silakan masukkan Nomor Surat yang diterbitkan oleh sistem JAK EVO dan unggah file surat resminya.</p>
                      </div>
                      
                      <div className="pt-6 border-t border-blue-400/50 space-y-4">
                         
                         {/* Input Nomor Surat */}
                         <div className="space-y-1">
                            <label className="text-xs font-black uppercase text-blue-200 ml-1">Nomor Surat JAK EVO</label>
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    value={jakEvoNumberInput}
                                    onChange={(e) => setJakEvoNumberInput(e.target.value)}
                                    placeholder="Contoh: 503/1.824.1/2024"
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-slate-800 font-bold outline-none focus:ring-4 focus:ring-blue-400/50 shadow-lg"
                                />
                            </div>
                         </div>

                         {/* Upload Area */}
                         <div className="space-y-1">
                             <label className="text-xs font-black uppercase text-blue-200 ml-1">Upload Surat Terbit (PDF / JPG)</label>
                             <div className="relative group cursor-pointer">
                                <input type="file" onChange={handleFileSelection} accept="image/*,application/pdf" className="absolute inset-0 opacity-0 cursor-pointer z-10" required />
                                <div className="w-full bg-white/10 border-2 border-dashed border-white/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-white/20 transition-all">
                                    <Upload size={24} />
                                    <span className="text-sm font-bold">Klik untuk unggah surat dari JAK EVO</span>
                                </div>
                             </div>
                         </div>
                      </div>
                  </div>
              )}

              {/* PICKUP VERIFICATION: Only Admin View */}
              {!isWargaView && request.status === ServiceStatus.READY && (
                  <div className="bg-emerald-600 p-8 rounded-[2rem] text-white shadow-xl shadow-emerald-100/20 space-y-6">
                      <div className="flex items-center gap-4">
                          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shrink-0">
                              <CheckCircle2 size={32} />
                          </div>
                          <div>
                              <h4 className="font-black text-xl uppercase tracking-tighter">Surat Siap Diambil</h4>
                              <p className="text-emerald-50 text-sm">Surat sudah lengkap dengan TTD. Verifikasi nomor pendaftaran untuk pengambilan warga.</p>
                          </div>
                      </div>

                      <div className="bg-black/20 p-6 rounded-2xl border border-white/10 flex flex-col space-y-6">
                          <div className="flex gap-2">
                             <button onClick={() => { stopCamera(); setVerificationMode('manual'); }} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${verificationMode === 'manual' ? 'bg-white text-emerald-700' : 'bg-white/10 text-white hover:bg-white/20'}`}>MANUAL</button>
                             <button onClick={startCameraScan} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${verificationMode === 'scan' ? 'bg-white text-emerald-700' : 'bg-white/10 text-white hover:bg-white/20'}`}>SCAN QR</button>
                             <button onClick={() => { stopCamera(); setVerificationMode('upload'); }} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${verificationMode === 'upload' ? 'bg-white text-emerald-700' : 'bg-white/10 text-white hover:bg-white/20'}`}>UPLOAD QR</button>
                          </div>
                          {verificationMode === 'manual' && (
                            <form onSubmit={handleVerifyPickup} className="flex flex-col md:flex-row gap-3 w-full">
                                <input type="text" value={vCodeInput} onChange={(e) => setVCodeInput(e.target.value)} placeholder="INPUT NO. PENDAFTARAN..." className={`flex-1 p-4 rounded-xl text-slate-800 font-bold outline-none uppercase transition-all ${verificationError ? 'animate-shake ring-4 ring-red-400' : 'focus:ring-4 focus:ring-white'}`} />
                                <button type="submit" disabled={isProcessing} className="bg-white text-emerald-600 px-8 py-4 rounded-2xl font-black text-sm hover:bg-emerald-50 transition-all shadow-lg active:scale-95 disabled:opacity-50">VERIFIKASI PENGAMBILAN</button>
                            </form>
                          )}
                      </div>
                  </div>
              )}
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                           <User size={14} className="text-indigo-500" /> Data Pemohon Terkait
                        </h4>
                        {applicant ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden border-2 border-slate-50 shadow-inner">
                                        {applicant.fotoWajah ? <img src={applicant.fotoWajah} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-slate-300">{applicant.namaLengkap.charAt(0)}</div>}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{applicant.namaLengkap}</h3>
                                        <p className="text-sm font-mono font-bold text-slate-400 mt-1">NIK: {applicant.nik}</p>
                                        <div className="flex flex-wrap items-center gap-3 mt-2">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-50 text-indigo-600 border border-indigo-100">KK: {applicant.kk}</span>
                                            {/* Hide WhatsApp link for Warga View if wanted, but generally okay to keep for self reference */}
                                            {request.applicantPhone ? (
                                                <a href={`https://wa.me/${request.applicantPhone.replace(/\D/g,'')}`} target="_blank" className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-green-50 text-green-700 border border-green-100 flex items-center gap-1">
                                                    <MessageCircle size={10}/> {request.applicantPhone}
                                                </a>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-50 text-slate-400 border border-slate-100 flex items-center gap-1">
                                                    <MessageCircle size={10}/> -
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alamat Domisili</p>
                                        <p className="text-sm font-bold text-slate-700 leading-snug">{applicant.alamat}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">RT {applicant.rt} / RW {applicant.rw}, {applicant.kelurahan}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempat, Tgl Lahir</p>
                                        <p className="text-sm font-bold text-slate-700">{applicant.tempatLahir}, {applicant.tanggalLahir}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                                <p className="text-slate-500 font-bold text-xs uppercase">Data pemohon tidak sinkron</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        {/* RINGKASAN PERMOHONAN */}
                        <div className="mb-8 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-4">
                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
                                <Info size={14} /> Ringkasan Permohonan
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Jenis Layanan</span>
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-white rounded-lg text-indigo-600 border border-indigo-100 shadow-sm"><FileText size={14} /></div>
                                        <p className="text-xs font-black text-slate-700 uppercase">{request.type}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nomor Pengantar RT</span>
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-white rounded-lg text-indigo-600 border border-indigo-100 shadow-sm"><Hash size={14} /></div>
                                        <p className="text-xs font-black text-indigo-700 uppercase tracking-wider">{request.rtLetterNumber || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Deskripsi / Keperluan</span>
                                    <div className="flex items-start gap-2">
                                        <div className="p-1.5 bg-white rounded-lg text-indigo-600 border border-indigo-100 shadow-sm mt-0.5"><AlignLeft size={14} /></div>
                                        <p className="text-xs font-bold text-slate-600 leading-relaxed italic">"{request.notes || '-'}"</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                           <History size={14} className="text-amber-500" /> Log Status Permohonan
                        </h4>
                        <div className="space-y-6 relative border-l-2 border-slate-100 pl-6 ml-2">
                            {(request.logs || []).slice().reverse().map((log, idx) => (
                                <div key={idx} className="relative">
                                    <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white ${idx === 0 ? 'bg-indigo-600 scale-125 shadow-lg' : 'bg-slate-300'}`}></div>
                                    <div>
                                        <div className="flex justify-between items-center">
                                            <p className={`text-xs font-black uppercase ${idx === 0 ? 'text-indigo-600' : 'text-slate-500'}`}>{log.status}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{log.timestamp && !isNaN(new Date(log.timestamp).getTime()) ? new Date(log.timestamp).toLocaleString('id-ID') : '-'}</p>
                                        </div>
                                        <p className="text-xs text-slate-800 font-bold mt-1">{log.note}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Oleh: {log.actor}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                           <FileCheck size={14} className="text-teal-500" /> Lampiran Data Pendukung
                        </h4>
                        {request.documents && request.documents.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                                {request.documents.map((doc, idx) => (
                                    <div key={idx} onClick={() => setZoomedImage(doc)} className="aspect-square bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative group cursor-pointer shadow-sm">
                                        {isPdf(doc) ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-600"><FileText size={24} /><span className="text-[8px] font-bold mt-1">DOC PDF</span></div>
                                        ) : (
                                            <img src={doc} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={`Lampiran ${idx+1}`} />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ZoomIn size={20} className="text-white" /></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200"><Info size={24} className="mx-auto text-slate-300 mb-2" /><p className="text-[10px] font-bold text-slate-400 uppercase">Tidak Ada Lampiran</p></div>
                        )}
                    </div>

                    {request.signedLetterUrl && (
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">File Surat Terbit (JAK EVO)</h4>
                            <div onClick={() => setZoomedImage(request.signedLetterUrl!)} className="aspect-[3/4] bg-slate-100 rounded-2xl border-2 border-indigo-100 overflow-hidden relative group shadow-lg cursor-pointer transition-transform hover:scale-[1.02]">
                                {isPdf(request.signedLetterUrl) ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 text-indigo-700"><FileDown size={48} className="mb-2" /><span className="text-xs font-black uppercase">Klik untuk Lihat PDF</span></div>
                                ) : (
                                    <img src={request.signedLetterUrl} className="w-full h-full object-cover" alt="Signed" />
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ZoomIn size={24} className="text-white" /></div>
                                <div className="absolute top-2 right-2 p-2 bg-emerald-500 text-white rounded-xl shadow-lg"><CheckCircle size={16}/></div>
                            </div>
                            {/* Display Letter Number */}
                            {request.letterNumber && (
                                <div className="mt-3 text-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nomor Surat</p>
                                    <p className="text-sm font-bold text-slate-800">{request.letterNumber}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
           </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white shrink-0 flex justify-end gap-3 px-8">
           <button onClick={onClose} className="px-8 py-3 text-xs font-black text-slate-400 hover:text-slate-800 transition-all uppercase tracking-widest">Tutup Detail</button>
           {request.status === ServiceStatus.COMPLETED && <div className="px-8 py-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-black flex items-center gap-2 uppercase tracking-widest border border-slate-200 cursor-default"><CheckCircle size={16}/> Layanan Selesai</div>}
           {/* Allow Warga to Print if status is valid */}
           {(request.status === ServiceStatus.PROCESSED || request.status === ServiceStatus.READY || request.status === ServiceStatus.COMPLETED) && request.signedLetterUrl && (
              <button onClick={handleDownload} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-xl shadow-indigo-100 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-widest">
                 <Download size={18} /> DOWNLOAD SURAT
              </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailModal;
