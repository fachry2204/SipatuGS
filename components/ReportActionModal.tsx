
import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, UserPlus, Camera, Send, MapPin, Clock, PlayCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import { Report, Staff, ReportStatus, DutyStatus } from '../types';

interface ReportActionModalProps {
  report: Report;
  role: 'Admin' | 'PPSU';
  staffList: Staff[]; // Received from parent
  onClose: () => void;
  onUpdate: (updatedReport: Report, staffUpdates?: Staff[]) => void;
}

const ReportActionModal: React.FC<ReportActionModalProps> = ({ report, role, staffList, onClose, onUpdate }) => {
  // Define available actions based on Role and Status
  type ActionType = 
    | 'verify_accept' | 'verify_reject' | 'assign' // Admin actions
    | 'accept_job' | 'arrive' | 'start_work' | 'finish_work' | 'submit_revision'; // PPSU actions

  const [action, setAction] = useState<ActionType | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [proofPhoto, setProofPhoto] = useState('');
  const [note, setNote] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [gpsData, setGpsData] = useState<{lat: number, lng: number} | null>(null);

  // Filter Online Staff for Assignment
  const onlineStaff = staffList.filter(s => s.status === DutyStatus.ONLINE);

  const handleStaffToggle = (id: string) => {
    setSelectedStaffIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProofPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsData({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsGettingLocation(false);
        },
        (err) => {
          alert('Gagal mengambil lokasi GPS. Pastikan izin lokasi aktif.');
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert('Browser tidak mendukung Geolocation.');
      setIsGettingLocation(false);
    }
  };

  const calculateEstimationTime = (startTime: string, endTime: string): string => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const diffMs = end - start;
    const diffHrs = Math.floor((diffMs % 86400000) / 3600000); 
    const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); 
    return `${diffHrs > 0 ? diffHrs + ' Jam ' : ''}${diffMins} Menit`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- VALIDATION CHECK ---
    // Wajib memilih PPSU jika action adalah 'assign'
    if (action === 'assign' && selectedStaffIds.length === 0) {
        alert("PPSU Harus Di pilih Untuk Bertugas");
        return; // Hentikan proses jika validasi gagal
    }

    let nextStatus = report.status;
    let updates: Partial<Report> = {};
    let staffUpdates: PPSU[] = [];
    const now = new Date();
    const timestamp = now.toLocaleString('id-ID');

    // ---------------- WORKFLOW LOGIC ----------------

    // 1. Laporan Baru -> Diterima Admin (Menunggu Petugas)
    if (action === 'assign') {
        nextStatus = ReportStatus.PENDING_ACCEPTANCE;
        updates = { assignedStaffIds: selectedStaffIds };
    }
    // 1b. Laporan Baru -> Ditolak Admin
    else if (action === 'verify_reject' && report.status === ReportStatus.NEW) {
        nextStatus = ReportStatus.REJECTED;
        updates = { rejectionReason: rejectReason };
    }

    // 2. Menunggu Petugas -> Petugas Menuju Lokasi (PPSU Accept)
    else if (action === 'accept_job') {
        nextStatus = ReportStatus.ON_THE_WAY;
        // Staff status changes to BERTUGAS
        if (report.assignedStaffIds) {
            staffUpdates = staffList.filter(s => report.assignedStaffIds?.includes(s.id)).map(s => ({
                ...s,
                status: DutyStatus.BERTUGAS
            }));
        }
    }

    // 3. Petugas Menuju Lokasi -> Petugas Sampai Lokasi (PPSU Arrive + Photo + GPS)
    else if (action === 'arrive') {
        nextStatus = ReportStatus.ARRIVED;
        updates = { 
            photoArrival: proofPhoto,
            gpsArrival: gpsData || undefined
        };
    }

    // 4. Petugas Sampai Lokasi -> Mulai Mengerjakan (PPSU Start)
    else if (action === 'start_work') {
        nextStatus = ReportStatus.IN_PROGRESS;
    }

    // 5. Mulai Mengerjakan -> Menunggu Verifikasi (PPSU Finish + Photo Result)
    else if (action === 'finish_work') {
        nextStatus = ReportStatus.VERIFICATION;
        updates = { photoCompletion: proofPhoto };
    }

    // 6. Menunggu Verifikasi -> Laporan Selesai (Admin Accept)
    else if (action === 'verify_accept') {
        nextStatus = ReportStatus.COMPLETED;
        // Staff back to ONLINE
        if (report.assignedStaffIds) {
            staffUpdates = staffList.filter(s => report.assignedStaffIds?.includes(s.id)).map(s => ({
                ...s,
                status: DutyStatus.ONLINE,
                totalTugasBerhasil: s.totalTugasBerhasil + 1
            }));
        }
        const estimation = calculateEstimationTime(report.timestamp, now.toString());
        updates = { estimationTime: estimation };
    }

    // 7. Menunggu Verifikasi -> Revisi Laporan (Admin Reject Result)
    else if (action === 'verify_reject' && report.status === ReportStatus.VERIFICATION) {
        nextStatus = ReportStatus.REVISION;
        updates = { rejectionReason: rejectReason };
    }

    // 8. Revisi Laporan -> Menunggu Verifikasi (PPSU Re-submit)
    else if (action === 'submit_revision') {
        nextStatus = ReportStatus.VERIFICATION;
        updates = { photoRevision: proofPhoto }; // Ideally strictly separate, simplifed here
    }

    const newLog = {
        status: nextStatus,
        timestamp: timestamp,
        note: note || (action === 'verify_reject' ? rejectReason : ''),
        actor: role
    };

    const finalReport: Report = {
        ...report,
        status: nextStatus,
        logs: [...report.logs, newLog],
        ...updates
    };

    onUpdate(finalReport, staffUpdates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
            <h3 className="font-bold text-slate-800">Tindak Lanjut Laporan</h3>
            <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
        </div>
        
        <div className="p-6 overflow-y-auto">
            {!action ? (
                <div className="grid grid-cols-1 gap-3">
                    
                    {/* --- ADMIN FLOW --- */}
                    {role === 'Admin' && report.status === ReportStatus.NEW && (
                        <>
                            <button onClick={() => setAction('assign')} className="p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold flex items-center gap-3 transition-colors border border-blue-100">
                                <UserPlus size={24} /> Terima & Tugaskan Petugas
                            </button>
                            <button onClick={() => setAction('verify_reject')} className="p-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold flex items-center gap-3 transition-colors border border-red-100">
                                <XCircle size={24} /> Tolak Laporan
                            </button>
                        </>
                    )}
                    
                    {role === 'Admin' && report.status === ReportStatus.VERIFICATION && (
                        <>
                            <button onClick={() => setAction('verify_accept')} className="p-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl font-bold flex items-center gap-3 transition-colors border border-green-100">
                                <CheckCircle2 size={24} /> Verifikasi Diterima (Selesai)
                            </button>
                            <button onClick={() => setAction('verify_reject')} className="p-4 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl font-bold flex items-center gap-3 transition-colors border border-orange-100">
                                <RotateCcw size={24} /> Kembalikan untuk Revisi
                            </button>
                        </>
                    )}

                    {/* --- PPSU FLOW --- */}
                    
                    {/* 1. Menerima Kerjaan */}
                    {role === 'PPSU' && report.status === ReportStatus.PENDING_ACCEPTANCE && (
                        <button onClick={() => setAction('accept_job')} className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-3 transition-colors shadow-lg shadow-blue-200">
                            <CheckCircle2 size={24} /> Terima Pekerjaan Ini
                        </button>
                    )}

                    {/* 2. Menuju -> Sampai */}
                    {role === 'PPSU' && report.status === ReportStatus.ON_THE_WAY && (
                        <button onClick={() => setAction('arrive')} className="p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold flex items-center gap-3 transition-colors border border-blue-100">
                            <MapPin size={24} /> Saya Sudah Sampai Lokasi
                        </button>
                    )}

                    {/* 3. Sampai -> Mulai */}
                    {role === 'PPSU' && report.status === ReportStatus.ARRIVED && (
                        <button onClick={() => setAction('start_work')} className="p-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center gap-3 transition-colors shadow-lg shadow-green-200">
                            <PlayCircle size={24} /> Mulai Mengerjakan
                        </button>
                    )}

                    {/* 4. Mulai -> Selesai */}
                    {role === 'PPSU' && report.status === ReportStatus.IN_PROGRESS && (
                        <button onClick={() => setAction('finish_work')} className="p-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl font-bold flex items-center gap-3 transition-colors border border-green-100">
                            <CheckCircle2 size={24} /> Pekerjaan Selesai
                        </button>
                    )}

                    {/* 5. Revisi -> Verifikasi Ulang */}
                    {role === 'PPSU' && report.status === ReportStatus.REVISION && (
                        <div className="space-y-3">
                            <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-sm text-red-700">
                                <strong>Catatan Admin:</strong> {report.rejectionReason}
                            </div>
                            <button onClick={() => setAction('submit_revision')} className="w-full p-4 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl font-bold flex items-center gap-3 transition-colors border border-orange-100">
                                <Send size={24} /> Kirim Hasil Revisi
                            </button>
                        </div>
                    )}

                    {/* Fallback Message */}
                    {!action && (
                        <div className="text-center py-4">
                            <Clock size={40} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500 font-medium">Menunggu proses selanjutnya...</p>
                            <p className="text-xs text-slate-400 mt-1 px-3 py-1 bg-slate-100 rounded-full inline-block">Status: {report.status}</p>
                        </div>
                    )}
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* --- Action Specific Forms --- */}
                    
                    {/* ASSIGN FORM */}
                    {action === 'assign' && (
                        <div className="space-y-3">
                            <h4 className="font-bold text-sm text-slate-700">Pilih Petugas PPSU (Online)</h4>
                            <div className="max-h-48 overflow-y-auto space-y-2 border rounded-xl p-2 bg-slate-50">
                                {onlineStaff.map(staff => (
                                    <div key={staff.id} onClick={() => handleStaffToggle(staff.id)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all ${selectedStaffIds.includes(staff.id) ? 'bg-blue-50 border-blue-500 shadow-sm' : 'hover:bg-white border-transparent'}`}>
                                        <img src={staff.fotoProfile} className="w-8 h-8 rounded-full bg-slate-200 object-cover" alt="" />
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-800">{staff.namaLengkap}</p>
                                            <p className="text-[10px] text-slate-500">{staff.nomorAnggota}</p>
                                        </div>
                                        {selectedStaffIds.includes(staff.id) && <CheckCircle2 size={16} className="text-blue-500" />}
                                    </div>
                                ))}
                                {onlineStaff.length === 0 && (
                                    <div className="text-center py-4 text-slate-400 text-xs">
                                        Tidak ada petugas status <b>Online</b> saat ini.
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-500 italic">*Petugas yang dipilih akan menerima notifikasi tugas baru.</p>
                        </div>
                    )}

                    {/* REJECT/REVISION REASON FORM */}
                    {(action === 'verify_reject') && (
                        <div>
                            <label className="text-sm font-bold text-slate-700">{report.status === ReportStatus.NEW ? 'Alasan Penolakan' : 'Catatan Revisi'}</label>
                            <textarea required value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none" rows={3} placeholder="Jelaskan alasan..."></textarea>
                        </div>
                    )}

                    {/* PHOTO UPLOAD FORMS (Arrive, Finish, Revision) */}
                    {(action === 'arrive' || action === 'finish_work' || action === 'submit_revision') && (
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700">
                                {action === 'arrive' ? 'Foto Bukti Sampai Lokasi' : 'Foto Hasil Pekerjaan'}
                            </label>
                            
                            {/* GPS CHECK FOR ARRIVAL */}
                            {action === 'arrive' && (
                                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100 mb-2">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className={gpsData ? "text-green-600" : "text-slate-400"} />
                                        <span className="text-xs font-bold text-slate-700">
                                            {gpsData ? `GPS Terkunci: ${gpsData.lat.toFixed(5)}, ${gpsData.lng.toFixed(5)}` : "Tag Lokasi GPS Wajib"}
                                        </span>
                                    </div>
                                    {!gpsData && (
                                        <button type="button" onClick={handleGetLocation} disabled={isGettingLocation} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50">
                                            {isGettingLocation ? 'Mencari...' : 'Ambil Lokasi'}
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative group">
                                {proofPhoto ? (
                                    <img src={proofPhoto} alt="Proof" className="h-32 object-contain rounded-lg" />
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                            <Camera size={20} className="text-slate-400 group-hover:text-blue-600" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500">Klik untuk Upload Foto</span>
                                    </>
                                )}
                                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" required />
                            </div>
                        </div>
                    )}

                    {/* CONFIRMATION FOR SIMPLE ACTIONS */}
                    {(action === 'accept_job' || action === 'start_work') && (
                        <div className="p-4 bg-slate-50 rounded-xl text-center border border-slate-100">
                            <p className="text-sm text-slate-600 font-medium">
                                {action === 'accept_job' 
                                    ? "Apakah Anda yakin ingin menerima tugas ini? Status Anda akan berubah menjadi 'Bertugas'." 
                                    : "Mulai pengerjaan sekarang? Waktu pengerjaan akan dicatat."}
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-bold text-slate-700">Catatan Tambahan (Opsional)</label>
                        <input type="text" value={note} onChange={e => setNote(e.target.value)} className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Tulis catatan..." />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setAction(null)} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Kembali</button>
                        <button 
                            type="submit" 
                            disabled={action === 'arrive' && !gpsData} // Disable Arrive if no GPS
                            className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={16} /> Proses Status
                        </button>
                    </div>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};

export default ReportActionModal;
