import React, { useState, useEffect } from 'react';
import { X, Save, FileText, User, AlignLeft, Info, AlertTriangle, UserPlus, MapPin, Upload, Trash2, Printer, CheckCircle2, Home, UserCheck } from 'lucide-react';
import { ServiceRequest, ServiceType, ServiceStatus, Citizen } from '../types';

interface AddServiceModalProps {
  onClose: () => void;
  onSave: (request: ServiceRequest) => void;
  citizens: Citizen[];
  onNavigateToCitizen: () => void;
  editData?: ServiceRequest | null;
  currentUserNik?: string; // New Prop for Auto-fill
}

const AddServiceModal: React.FC<AddServiceModalProps> = ({ onClose, onSave, citizens, onNavigateToCitizen, editData, currentUserNik }) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<ServiceRequest | null>(null);
  
  const [formData, setFormData] = useState({
    nik: editData?.applicantNik || '',
    name: editData?.applicantName || '',
    type: editData?.type || ServiceType.SKTM,
    notes: editData?.notes || '',
    ticketNumber: editData?.ticketNumber || '',
    rtLetterNumber: editData?.rtLetterNumber || ''
  });

  const [foundCitizen, setFoundCitizen] = useState<Citizen | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [documents, setDocuments] = useState<string[]>(editData?.documents || []);

  const generateTicketNumber = (type: ServiceType) => {
    const typeCode = type.match(/\(([^)]+)\)/)?.[1] || type.substring(0, 3).toUpperCase();
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `REG-${typeCode}-${date}-${random}`;
  };

  useEffect(() => {
    if (!editData) {
        setFormData(prev => ({
          ...prev,
          ticketNumber: generateTicketNumber(prev.type)
        }));
        
        // Auto-fill logic for Warga Login
        if (currentUserNik) {
            const citizen = citizens.find(c => c.nik === currentUserNik);
            if (citizen) {
                setFoundCitizen(citizen);
                setFormData(prev => ({ 
                    ...prev, 
                    nik: citizen.nik,
                    name: citizen.namaLengkap 
                }));
                setHasChecked(true);
            }
        }
    } else {
        const citizen = citizens.find(c => c.nik === editData.applicantNik);
        if (citizen) {
            setFoundCitizen(citizen);
            setHasChecked(true);
        }
    }
  }, [editData, currentUserNik, citizens]);

  const handleNikChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, nik: val }));
    setHasChecked(false);
    
    if (val.length === 16) {
      const citizen = citizens.find(c => c.nik === val);
      if (citizen) {
        setFoundCitizen(citizen);
        setFormData(prev => ({ ...prev, name: citizen.namaLengkap }));
      } else {
        setFoundCitizen(null);
        setFormData(prev => ({ ...prev, name: '' }));
      }
      setHasChecked(true);
    } else {
      setFoundCitizen(null);
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as ServiceType;
    setFormData(prev => ({
      ...prev,
      type: newType,
      ticketNumber: editData ? prev.ticketNumber : generateTicketNumber(newType)
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDocuments(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundCitizen) {
      alert("Wajib memilih warga yang terdaftar.");
      return;
    }

    if (!formData.rtLetterNumber) {
      alert("Wajib memasukkan Nomor Surat Pengantar dari RT.");
      return;
    }

    const newRequest: ServiceRequest = {
      id: editData?.id || `SRV-${Date.now()}`,
      ticketNumber: formData.ticketNumber,
      rtLetterNumber: formData.rtLetterNumber.toUpperCase(),
      requestDate: editData?.requestDate || new Date().toISOString(),
      type: formData.type,
      applicantNik: formData.nik,
      applicantName: formData.name,
      applicantPhone: foundCitizen.nomorWhatsapp,
      status: editData?.status || ServiceStatus.NEW,
      notes: formData.notes,
      documents: documents.length > 0 ? documents : undefined,
      logs: editData?.logs || [
        { status: ServiceStatus.NEW, timestamp: new Date().toISOString(), actor: 'Warga', note: 'Pengajuan Baru.' }
      ]
    };

    if (editData) {
        onSave(newRequest);
    } else {
        setSubmittedData(newRequest);
        setIsSuccess(true);
    }
  };

  const handlePrintResi = () => {
    window.print();
  };

  const handleFinalSave = () => {
    if (submittedData) {
        onSave(submittedData);
    }
  };

  if (isSuccess && submittedData) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg max-h-[95vh] flex flex-col rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-8 text-center no-print">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Pendaftaran Berhasil</h3>
                        <p className="text-sm text-slate-500 mt-2 px-4">Silakan simpan atau cetak resi pendaftaran di bawah ini sebagai bukti untuk pengambilan surat.</p>
                    </div>

                    <div className="p-8 bg-white border-y border-dashed border-slate-200 mx-4 print:border-none print:m-0 print:p-10 mb-6">
                        <div className="flex flex-col items-center text-center mb-8">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/e/eb/Coat_of_arms_of_Jakarta.svg" className="w-16 h-16 mb-4" alt="Logo" />
                            <h4 className="font-bold text-slate-800 uppercase text-base tracking-tight">Resi Pendaftaran Layanan Warga</h4>
                            <p className="text-xs text-slate-500 font-medium">Kelurahan Grogol Selatan, Jakarta Selatan</p>
                        </div>

                        <div className="space-y-5 text-sm">
                            <div className="flex justify-between border-b border-slate-50 pb-3">
                                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Nomor Tiket</span>
                                <span className="font-mono font-bold text-indigo-600 text-base">{submittedData.ticketNumber}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-3">
                                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">No. Pengantar RT</span>
                                <span className="font-bold text-slate-800">{submittedData.rtLetterNumber}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-3">
                                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Tanggal Daftar</span>
                                <span className="font-bold text-slate-800">{new Date(submittedData.requestDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-3">
                                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Nama Pemohon</span>
                                <span className="font-bold text-slate-800">{submittedData.applicantName}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-3">
                                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">NIK</span>
                                <span className="font-mono font-bold text-slate-800">{submittedData.applicantNik}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-3">
                                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Jenis Layanan</span>
                                <span className="font-bold text-slate-800 text-right max-w-[200px] leading-tight">{submittedData.type}</span>
                            </div>
                        </div>

                        <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                            <div className="bg-slate-50 p-4 rounded-3xl inline-block border border-slate-100 shadow-inner">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${submittedData.ticketNumber}`} 
                                    className="w-32 h-32" 
                                    alt="QR Verifikasi" 
                                />
                                <p className="text-[10px] font-black text-slate-400 mt-3 tracking-widest uppercase">Verifikasi Sistem</p>
                            </div>
                        </div>

                        <div className="mt-8 text-center text-[10px] text-slate-400 italic leading-relaxed">
                            *Bawa resi ini saat pengambilan surat di kantor Kelurahan.<br/>
                            System Informasi Terpadu Kelurahan Grogol Selatan.
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 no-print shrink-0">
                    <button 
                        onClick={handlePrintResi}
                        className="flex-1 bg-white border border-slate-200 text-slate-700 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all shadow-sm"
                    >
                        <Printer size={18} /> Cetak Resi
                    </button>
                    <button 
                        onClick={handleFinalSave}
                        className="flex-1 bg-indigo-600 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all transform active:scale-95"
                    >
                        Selesai & Tutup
                    </button>
                </div>
            </div>
        </div>
      );
  }

  const getServiceDesc = (type: ServiceType) => {
    switch (type) {
        case ServiceType.NTCR: return "Surat pengantar ke KUA/Pengadilan Agama untuk Nikah, Talak, Cerai, Rujuk.";
        case ServiceType.SKTM: return "Diperlukan untuk beasiswa, keringanan biaya, atau bantuan sosial.";
        case ServiceType.PENGHASILAN: return "Untuk warga tanpa slip gaji resmi (wiraswasta/pekerja informal).";
        case ServiceType.SKU: return "Untuk memulai usaha kecil sebagai legalisasi awal.";
        case ServiceType.LEGALISASI: return "Legalisasi/stempel basah dokumen kelurahan/RT/RW.";
        case ServiceType.UMUM: return "Surat ket. belum menikah, duda/janda, domisili sementara, dll.";
        default: return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{editData ? 'Edit Permohonan' : 'Buat Surat Baru'}</h3>
            <p className="text-sm text-slate-500">Lengkapi data permohonan administrasi warga.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 max-h-[80vh] overflow-y-auto space-y-6 bg-slate-50/30 custom-scrollbar">
          <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-100 flex items-center justify-between">
             <div>
                <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Nomor Pendaftaran Otomatis</p>
                <p className="text-lg font-mono font-bold">{formData.ticketNumber}</p>
             </div>
             <FileText size={32} className="opacity-20" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 ml-1">NIK Pemohon (16 Digit) <span className="text-red-500">*</span></label>
            <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    value={formData.nik}
                    onChange={handleNikChange}
                    placeholder="Masukkan 16 Digit NIK"
                    className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-sm focus:ring-2 outline-none font-mono font-bold ${hasChecked && !foundCitizen ? 'border-red-300 ring-red-50' : 'border-slate-200 focus:ring-indigo-500'} ${(!!editData || !!currentUserNik) ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                    required
                    maxLength={16}
                    disabled={!!editData || !!currentUserNik}
                />
            </div>

            {hasChecked && foundCitizen && (
                <div className="bg-white p-5 rounded-2xl border border-teal-100 shadow-sm space-y-4 animate-in slide-in-from-top-2">
                    {/* Visual Badge for Auto-Login */}
                    {currentUserNik && (
                        <div className="flex items-center gap-2 text-teal-700 font-bold text-xs bg-teal-50 w-fit px-3 py-1 rounded-full border border-teal-200 mb-2">
                            <UserCheck size={14} /> Identitas Terverifikasi Otomatis
                        </div>
                    )}
                    
                    <div className="flex gap-4 items-start border-b border-slate-50 pb-4">
                        <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 shadow-inner">
                            {foundCitizen.fotoWajah ? <img src={foundCitizen.fotoWajah} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-300">N/A</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-0.5">Pemohon Terverifikasi</p>
                            <h4 className="font-bold text-slate-800 text-base truncate">{foundCitizen.namaLengkap}</h4>
                            <p className="text-xs text-slate-400 font-mono">{foundCitizen.nik}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0">
                                <Home size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data RT / RW</p>
                                <p className="text-sm font-bold text-slate-700">RT {foundCitizen.rt} / RW {foundCitizen.rw}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                                <MapPin size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alamat Domisili</p>
                                <p className="text-xs font-bold text-slate-700 leading-snug">{foundCitizen.alamat}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{foundCitizen.kelurahan}, {foundCitizen.kecamatan}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {hasChecked && !foundCitizen && formData.nik.length === 16 && (
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex flex-col items-center text-center gap-3 animate-in shake duration-300">
                    <AlertTriangle className="text-red-500" size={32} />
                    <div>
                        <p className="text-sm font-bold text-red-800">NIK Tidak Terdaftar</p>
                        <p className="text-xs text-red-600">Data warga dengan NIK ini belum ada di sistem.</p>
                    </div>
                    {/* Hide Registration Link if current user is logged in (shouldn't happen, but safe guard) */}
                    {!currentUserNik && (
                        <button 
                            type="button"
                            onClick={onNavigateToCitizen}
                            className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-red-50 transition-colors shadow-sm"
                        >
                            <UserPlus size={14} /> Daftarkan Warga Sekarang
                        </button>
                    )}
                </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1">Jenis Layanan Surat <span className="text-red-500">*</span></label>
                <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                        value={formData.type}
                        onChange={handleTypeChange}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none font-bold"
                        required
                    >
                        {Object.values(ServiceType).map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
             </div>

             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1 flex items-center justify-between">
                    <span>Nomor Surat Pengantar RT <span className="text-red-500">*</span></span>
                    <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-black uppercase">Huruf Besar</span>
                </label>
                <div className="relative">
                    <AlignLeft className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        value={formData.rtLetterNumber}
                        onChange={(e) => setFormData({...formData, rtLetterNumber: e.target.value.toUpperCase()})}
                        placeholder="CONTOH: 001/RT.01/01/2024"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800 uppercase tracking-wider"
                        required
                        style={{ textTransform: 'uppercase' }}
                    />
                </div>
             </div>
          </div>

          <div className="flex gap-2 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed font-medium"><b>Info Layanan:</b> {getServiceDesc(formData.type)}</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1">Keperluan / Keterangan <span className="text-red-500">*</span></label>
            <div className="relative">
                <AlignLeft className="absolute left-3 top-3 text-slate-400" size={18} />
                <textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Wajib diisi. Contoh: Persyaratan beasiswa kuliah angkatan 2024..."
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium"
                    required
                ></textarea>
            </div>
          </div>

          <div className="space-y-3">
             <label className="text-xs font-bold text-slate-500 ml-1">Lampiran Dokumen Pendukung (Opsional)</label>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {documents.map((doc, idx) => (
                    <div key={idx} className="relative aspect-square bg-white rounded-2xl border border-slate-200 overflow-hidden group shadow-sm">
                        <img src={doc} alt="" className="w-full h-full object-cover" />
                        <button 
                            type="button" 
                            onClick={() => removeDocument(idx)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}
                
                <label className="aspect-square bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group">
                   <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full group-hover:scale-110 transition-transform">
                      <Upload size={20} />
                   </div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase">Tambah File</span>
                   <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
             </div>
             <p className="text-[10px] text-slate-400 italic font-medium">*Unggah scan KTP asal, Surat Pengantar RT/RW, atau dokumen lainnya (Maks 5 File).</p>
          </div>

          <div className="pt-6 border-t border-slate-100 flex gap-3 sticky bottom-0 bg-white pb-2 z-10 mt-4">
            <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all"
            >
                Batalkan
            </button>
            <button 
                type="submit"
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]"
            >
                <Save size={18} /> {editData ? 'Update Permohonan' : 'Simpan & Buat Permohonan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddServiceModal;