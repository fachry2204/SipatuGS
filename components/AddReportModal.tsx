
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, MapPin, Save, Upload, Loader2, Search, ScanFace, Scan, LocateFixed, Image as ImageIcon, ZoomIn, Map, UserCheck } from 'lucide-react';
import L from 'leaflet';
import { GoogleGenAI } from "@google/genai";
import { Report, ReportStatus, Citizen } from '../types';

interface AddReportModalProps {
  onClose: () => void;
  onSave: (report: Report) => void;
  citizens: Citizen[]; 
  currentUserNik?: string; // New Prop for Auto-fill
}

const AddReportModal: React.FC<AddReportModalProps> = ({ onClose, onSave, citizens, currentUserNik }) => {
  const [formData, setFormData] = useState({
    nik: '',
    reporterName: '',
    reporterPhone: '',
    gender: '',
    rt: '',
    rw: '',
    address: '', 
    title: '',
    category: 'Infrastruktur',
    description: '',
    location: '',
    latitude: -6.2297,
    longitude: 106.7800,
    photoUrl: ''
  });

  const [citizenFound, setCitizenFound] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Auto-fill logic for Logged-in Citizen
  useEffect(() => {
    if (currentUserNik) {
        const found = citizens.find(c => c.nik === currentUserNik);
        if (found) {
            setFormData(prev => ({
                ...prev,
                nik: found.nik,
                reporterName: found.namaLengkap,
                reporterPhone: found.nomorWhatsapp,
                gender: found.jenisKelamin,
                rt: found.rt,
                rw: found.rw,
                address: found.alamat
            }));
            setCitizenFound(true);
        }
    }
  }, [currentUserNik, citizens]);

  // Get Current Location Logic
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current).setView([formData.latitude, formData.longitude], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Custom Red Icon for Map Pin
    const redIcon = L.divIcon({
      className: 'custom-red-pin',
      html: `
        <div class="relative w-8 h-8">
          <div class="absolute inset-0 rounded-full bg-red-600 opacity-40 animate-ping"></div>
          <div class="relative w-8 h-8 rounded-full border-2 border-white shadow-md bg-red-600 flex items-center justify-center">
             <div class="w-3 h-3 bg-white rounded-full"></div>
          </div>
          <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-3 bg-red-600"></div>
        </div>
      `,
      iconSize: [32, 40],
      iconAnchor: [16, 40]
    });

    const marker = L.marker([formData.latitude, formData.longitude], {
      draggable: true,
      icon: redIcon
    }).addTo(map);

    marker.on('dragend', (e) => {
      const position = e.target.getLatLng();
      setFormData(prev => ({ ...prev, latitude: position.lat, longitude: position.lng }));
    });

    markerRef.current = marker;
    mapInstanceRef.current = map;

    setTimeout(() => map.invalidateSize(), 500);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Auto detect location on mount
  useEffect(() => {
    handleGetLocation();
  }, []);

  // Sync Map with Coordinates State (Triggered by Geocoding or Manual Input)
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
        const newLatLng = new L.LatLng(formData.latitude, formData.longitude);
        markerRef.current.setLatLng(newLatLng);
        mapInstanceRef.current.panTo(newLatLng);
    }
  }, [formData.latitude, formData.longitude]);

  // Geocoding Function
  const performGeocoding = async () => {
    if (!formData.location || formData.location.length < 5) return;
    setIsGeocoding(true);
    try {
        const query = `${formData.location}, Grogol Selatan, Jakarta Selatan`;
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }));
        } else {
            alert("Lokasi tidak ditemukan di peta. Silakan geser pin secara manual.");
        }
    } catch (error) {
        console.error("Geocoding failed", error);
    } finally {
        setIsGeocoding(false);
    }
  };

  const handleNIKSearch = (nikValue: string) => {
    // Use passed prop 'citizens' instead of constant
    const found = citizens.find(c => c.nik === nikValue);
    if (found) {
        setFormData(prev => ({
            ...prev,
            reporterName: found.namaLengkap,
            gender: found.jenisKelamin,
            rt: found.rt,
            rw: found.rw,
            address: found.alamat, // Populate Address
            reporterPhone: found.nomorWhatsapp,
            nik: nikValue
        }));
        setCitizenFound(true);
    } else {
        setCitizenFound(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'nik' && value.length >= 16) {
        handleNIKSearch(value);
    }
  };

  const handleFileUploadOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    
    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            
            if (process.env.API_KEY) {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `Extract NIK from this KTP image. Return ONLY the numeric NIK string.`;
                try {
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: {
                            parts: [
                                { inlineData: { mimeType: file.type, data: base64Data } },
                                { text: prompt }
                            ]
                        }
                    });
                    const extractedNIK = response.text.trim().replace(/\D/g, '');
                    setFormData(prev => ({ ...prev, nik: extractedNIK }));
                    handleNIKSearch(extractedNIK);
                } catch (err) {
                    console.error("AI Error", err);
                    alert("Gagal scan AI, gunakan input manual.");
                }
            } else {
                // Fallback Simulation
                setTimeout(() => {
                    const mockNIK = "3174081234567890"; // Example
                    setFormData(prev => ({ ...prev, nik: mockNIK }));
                    handleNIKSearch(mockNIK);
                    alert("Simulasi Scan Berhasil (Mock NIK)");
                }, 1500);
            }
            setIsScanning(false);
        };
    } catch (e) {
        setIsScanning(false);
    }
  };

  const handleReportPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // VALIDATION: Check required fields
    if (!formData.photoUrl) {
        alert("Wajib menyertakan Foto Bukti Laporan!");
        return;
    }
    if (!formData.location || formData.location.trim() === "") {
        alert("Wajib mengisi Alamat / Lokasi Kejadian!");
        return;
    }

    // Generate Code
    const catCode = formData.category.substring(0, 3).toUpperCase();
    const ticketNumber = `TKT-${catCode}-${new Date().getFullYear()}-${Math.floor(Math.random()*10000)}`;
    const now = new Date();
    const timestampISO = now.toISOString();

    const newReport: Report = {
        id: `REP-${Date.now()}`,
        ticketNumber: ticketNumber,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        reporterName: formData.reporterName || 'Pelapor Tamu',
        reporterNik: formData.nik,
        reporterPhone: formData.reporterPhone,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        status: ReportStatus.NEW,
        timestamp: timestampISO,
        photoUrl: formData.photoUrl,
        priority: 'Medium',
        logs: [
            { status: ReportStatus.NEW, timestamp: timestampISO, actor: 'Warga' }
        ]
    };

    onSave(newReport);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl my-8 animate-in zoom-in-95 duration-200 relative">
        
        {/* Fullscreen Image Zoom Overlay */}
        {isZoomed && formData.photoUrl && (
            <div 
                className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4 cursor-pointer"
                onClick={() => setIsZoomed(false)}
            >
                <img src={formData.photoUrl} alt="Zoomed" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                <button className="absolute top-4 right-4 text-white hover:text-red-400 p-2"><X size={32} /></button>
                <p className="absolute bottom-4 text-white/70 text-sm">Klik dimanapun untuk menutup</p>
            </div>
        )}

        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Buat Laporan Baru</h3>
            <p className="text-sm text-slate-500">Sampaikan keluhan atau aspirasi Anda.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-8 max-h-[80vh] overflow-y-auto bg-slate-50/50">
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Identity Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Search size={16} /> Identitas Pelapor
                    </h4>
                    
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1 space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1">NIK</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    name="nik"
                                    value={formData.nik}
                                    onChange={handleInputChange}
                                    placeholder="Masukkan 16 Digit NIK"
                                    className={`w-full pl-3 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none font-mono ${currentUserNik ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                                    disabled={!!currentUserNik}
                                />
                                {citizenFound && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"><ScanFace size={20}/></span>}
                            </div>
                        </div>
                        
                        {/* Hide Scan Button if Warga Logged In */}
                        {!currentUserNik && (
                            <div className="flex items-end">
                                <button 
                                    type="button"
                                    onClick={() => document.getElementById('ktp-scan')?.click()}
                                    disabled={isScanning}
                                    className="px-4 py-3 bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-100 flex items-center gap-2 text-sm hover:bg-blue-100 transition-colors"
                                >
                                    {isScanning ? <Loader2 size={18} className="animate-spin"/> : <Scan size={18} />}
                                    Scan KTP (AI)
                                </button>
                                <input type="file" id="ktp-scan" accept="image/*" className="hidden" onChange={handleFileUploadOCR} />
                            </div>
                        )}
                    </div>

                    {citizenFound && (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100 animate-in slide-in-from-top-2">
                            {currentUserNik && (
                                <div className="mb-4 flex items-center gap-2 text-green-700 font-bold text-xs bg-white/50 w-fit px-3 py-1 rounded-full border border-green-200">
                                    <UserCheck size={14} /> Identitas Terverifikasi Otomatis
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-green-700">Nama Lengkap</label>
                                    <input type="text" value={formData.reporterName} readOnly className="w-full p-2 bg-white/50 border border-green-200 rounded-lg text-sm text-green-900 font-semibold" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-green-700">Jenis Kelamin</label>
                                    <input type="text" value={formData.gender} readOnly className="w-full p-2 bg-white/50 border border-green-200 rounded-lg text-sm text-green-900" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-green-700">Alamat Asli (KTP)</label>
                                    <input type="text" value={formData.address} readOnly className="w-full p-2 bg-white/50 border border-green-200 rounded-lg text-sm text-green-900" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs font-bold text-green-700">RT</label>
                                        <input type="text" value={formData.rt} readOnly className="w-full p-2 bg-white/50 border border-green-200 rounded-lg text-sm text-green-900" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-green-700">RW</label>
                                        <input type="text" value={formData.rw} readOnly className="w-full p-2 bg-white/50 border border-green-200 rounded-lg text-sm text-green-900" />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-green-700">Nomor WhatsApp (Bisa Diedit)</label>
                                    <input 
                                        type="text" 
                                        name="reporterPhone" 
                                        value={formData.reporterPhone} 
                                        onChange={handleInputChange}
                                        className="w-full p-2 bg-white border border-green-300 rounded-lg text-sm text-green-900 font-bold focus:ring-2 focus:ring-green-500 outline-none" 
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Report Details */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Detail Laporan</h4>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1">Judul Laporan</label>
                            <input 
                                type="text" 
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                                placeholder="Contoh: Jalan Berlubang di Depan Masjid"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 ml-1">Kategori</label>
                                <select 
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                                >
                                    <option>Infrastruktur</option>
                                    <option>Kebersihan</option>
                                    <option>Keamanan</option>
                                    <option>Kesehatan</option>
                                    <option>Sosial</option>
                                    <option>Administrasi</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 ml-1">Foto Bukti Laporan <span className="text-red-500">*</span></label>
                                <div className="flex gap-3 items-center">
                                    <div className="relative flex-1">
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            id="proof-upload"
                                            onChange={handleReportPhotoUpload}
                                            className="hidden"
                                        />
                                        <label htmlFor="proof-upload" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 cursor-pointer hover:bg-slate-100 flex items-center justify-between">
                                            <span className="flex items-center gap-2"><ImageIcon size={16} /> {formData.photoUrl ? 'Ganti Foto' : 'Pilih Foto'}</span>
                                            <span className="bg-slate-200 px-2 py-1 rounded text-xs font-bold">Browse</span>
                                        </label>
                                    </div>
                                    {/* SMALLER PREVIEW + ZOOM */}
                                    {formData.photoUrl && (
                                        <div 
                                            className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative group cursor-pointer shrink-0"
                                            onClick={() => setIsZoomed(true)}
                                            title="Klik untuk memperbesar"
                                        >
                                            <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ZoomIn size={20} className="text-white" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1">Deskripsi Lengkap</label>
                            <textarea 
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                                placeholder="Jelaskan detail permasalahan..."
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <MapPin size={16} /> Lokasi Kejadian
                    </h4>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1">Alamat Lengkap / Patokan <span className="text-red-500">*</span></label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    onBlur={performGeocoding}
                                    required
                                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                                    placeholder="Contoh: Jl. Kebon Nanas No. 12"
                                />
                                <button 
                                    type="button" 
                                    onClick={performGeocoding} 
                                    disabled={isGeocoding}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 font-bold text-xs flex items-center gap-2"
                                >
                                    {isGeocoding ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                    Cari
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-2">
                            <label className="text-xs font-bold text-slate-500 ml-1">Pin Point Lokasi</label>
                            <button 
                                type="button" 
                                onClick={handleGetLocation}
                                className="text-xs flex items-center gap-1 bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors font-bold border border-rose-100"
                            >
                                <LocateFixed size={14} /> Ambil Lokasi Saya
                            </button>
                        </div>

                        <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-slate-200 z-0">
                            <div ref={mapContainerRef} className="w-full h-full z-0" style={{ zIndex: 0 }} />
                            <div className="absolute top-2 left-2 z-[400] bg-white/90 backdrop-blur px-2 py-1 rounded border border-slate-200 shadow-sm text-[10px] font-mono font-bold text-slate-700">
                                Lat: {formData.latitude.toFixed(6)}, Lng: {formData.longitude.toFixed(6)}
                            </div>
                            <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs font-bold text-red-600 flex items-center gap-1">
                                <MapPin size={12} /> Pin Merah: Geser untuk presisi lokasi
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white pb-2 z-10">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all"
                    >
                        Batalkan
                    </button>
                    <button 
                        type="submit"
                        className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-100 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Save size={18} /> Kirim Laporan
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AddReportModal;
