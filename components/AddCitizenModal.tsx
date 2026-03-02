
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Save, 
  ScanFace, 
  MapPin, 
  Upload, 
  AlertTriangle, 
  CheckCircle2,
  LocateFixed,
  Calendar,
  CreditCard,
  Camera,
  Loader2,
  Search,
  Scan,
  User,
  ImageIcon,
  Crop
} from 'lucide-react';
import L from 'leaflet';
import { GoogleGenAI } from "@google/genai";
import { Citizen, Gender, BloodType, ResidenceStatus, CitizenshipStatus, VitalStatus } from '../types';

interface AddCitizenModalProps {
  onClose: () => void;
  onSave: (citizen: Citizen) => void;
  citizen?: Citizen | null; // Optional prop for editing
}

const AddCitizenModal: React.FC<AddCitizenModalProps> = ({ onClose, onSave, citizen }) => {
  const isEditMode = !!citizen;

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Camera Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // AI Loading State
  const [isScanning, setIsScanning] = useState(false);
  const [scanSource, setScanSource] = useState<'upload' | 'rfid' | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  // Logic States
  const [age, setAge] = useState<number>(0);
  const [ktpEligible, setKtpEligible] = useState<string>('');
  const [ktpBase64, setKtpBase64] = useState<string | null>(null); 

  // Initial Form Data
  const [formData, setFormData] = useState<Partial<Citizen>>({
    nik: '',
    kk: '',
    namaLengkap: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: Gender.MALE,
    agama: 'Islam',
    statusPerkawinan: 'Belum Kawin',
    golonganDarah: BloodType.UNKNOWN,
    fotoWajah: '',
    alamat: '',
    rt: '',
    rw: '',
    kelurahan: 'Grogol Selatan',
    kecamatan: 'Kebayoran Lama',
    kota: 'Jakarta Selatan',
    provinsi: 'DKI Jakarta',
    pekerjaan: '',
    nomorWhatsapp: '',
    asalProvinsi: '',
    statusKtp: ResidenceStatus.KTP_DKI,
    kewarganegaraan: CitizenshipStatus.WNI,
    statusKematian: VitalStatus.ALIVE,
    latitude: -6.231984,
    longitude: 106.778875
  });

  // Populate data if editing
  useEffect(() => {
    if (citizen) {
      setFormData(prev => ({
          ...prev,
          ...citizen
      }));
    }
  }, [citizen]);

  // Calculate Age and KTP Eligibility whenever birth date changes
  useEffect(() => {
    if (formData.tanggalLahir) {
      const today = new Date();
      const birthDate = new Date(formData.tanggalLahir);
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge);

      if (calculatedAge < 17) {
        setKtpEligible('Tidak Bisa mempunyai KTP (Belum Cukup Umur)');
      } else {
        setKtpEligible('Berhak memiliki KTP');
      }
    }
  }, [formData.tanggalLahir]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Use default or citizen coordinates
    const defaultLat = citizen?.latitude || -6.231984;
    const defaultLng = citizen?.longitude || 106.778875;

    const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Draggable Marker
    const marker = L.marker([defaultLat, defaultLng], {
      draggable: true
    }).addTo(map);

    marker.on('dragend', (e) => {
      const marker = e.target;
      const position = marker.getLatLng();
      setFormData(prev => ({ ...prev, latitude: position.lat, longitude: position.lng }));
    });

    markerRef.current = marker;
    mapInstanceRef.current = map;

    // Fix map gray area issue
    setTimeout(() => {
      map.invalidateSize();
    }, 500);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync Map Marker when formData coords change
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current && formData.latitude && formData.longitude) {
      const newLatLng = new L.LatLng(formData.latitude, formData.longitude);
      markerRef.current.setLatLng(newLatLng);
      mapInstanceRef.current.panTo(newLatLng);
    }
  }, [formData.latitude, formData.longitude]);

  // Handle Inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Custom Validation Logic
    if (name === 'nik' || name === 'kk') {
        // Max 16 chars, numeric only
        const val = value.replace(/\D/g, '').slice(0, 16);
        setFormData(prev => ({ ...prev, [name]: val }));
        return;
    }

    if (name === 'rt' || name === 'rw') {
        // Max 2 chars, numeric only, no leading zeros
        let val = value.replace(/\D/g, '').slice(0, 2);
        if (val.length > 0 && val.startsWith('0')) {
            val = val.replace(/^0+/, '');
        }
        setFormData(prev => ({ ...prev, [name]: val }));
        return;
    }

    if (name === 'nomorWhatsapp') {
        // Numeric only, max 14 chars, auto-replace 0 prefix with 62
        let val = value.replace(/\D/g, '');
        if (val.startsWith('0')) {
            val = '62' + val.substring(1);
        }
        val = val.slice(0, 14);
        setFormData(prev => ({ ...prev, [name]: val }));
        return;
    }

    if (name === 'kewarganegaraan') {
        if (value === CitizenshipStatus.WNA) {
            setFormData(prev => ({ 
                ...prev, 
                [name]: value,
                statusKtp: ResidenceStatus.WNA
            }));
            return;
        } else if (value === CitizenshipStatus.WNI) {
             setFormData(prev => ({ 
                ...prev, 
                [name]: value,
                statusKtp: prev.statusKtp === ResidenceStatus.WNA ? ResidenceStatus.KTP_DKI : prev.statusKtp
            }));
            return;
        }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 📍 GPS Location Logic
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
          alert('Gagal mengambil lokasi. Pastikan GPS aktif.');
          console.error(error);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert('Geolocation tidak didukung browser ini.');
    }
  };

  // 🗺️ Reusable Geocoding Function
  const performGeocoding = async (query: string) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lon
        }));
        return true;
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
    } finally {
      setIsGeocoding(false);
    }
    return false;
  };

  // 🗺️ Auto-Geocoding from Address Blur
  const handleAddressBlur = async () => {
    if (!formData.alamat || formData.alamat.length < 5) return;
    const query = `${formData.alamat}, ${formData.kelurahan || ''}, ${formData.kecamatan || ''}, Jakarta Selatan`;
    await performGeocoding(query);
  };

  // Helper: Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // 📸 PROFILE PICTURE LOGIC
  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, fotoWajah: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Gagal mengakses kamera.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageSrc = canvas.toDataURL('image/jpeg');
        setFormData(prev => ({ ...prev, fotoWajah: imageSrc }));
        stopCamera();
      }
    }
  };


  // 🤖 AI OCR Implementation using Gemini
  const handleFileUploadOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanSource('upload');

    try {
      const base64Data = await fileToBase64(file);
      setKtpBase64(base64Data);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        Extract data from this Indonesian KTP (ID Card) image. 
        Return the result in strictly valid JSON format without markdown code blocks.
        The keys must be exactly:
        - nik (string)
        - namaLengkap (string)
        - tempatLahir (string)
        - tanggalLahir (string, format YYYY-MM-DD)
        - jenisKelamin (string, "Laki-Laki" or "Perempuan")
        - alamat (string, street name only)
        - rt (string, numeric only, remove leading zeros if desired or keep 3 digits)
        - rw (string, numeric only)
        - kelurahan (string)
        - kecamatan (string)
        - kota (string, Kota/Kabupaten)
        - provinsi (string, extract the province name at the top, e.g. "DKI JAKARTA", "JAWA BARAT")
        - agama (string)
        - statusPerkawinan (string)
        - pekerjaan (string)
        
        If a field is not clear, leave it as an empty string.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: file.type, data: base64Data } },
            { text: prompt }
          ]
        }
      });

      const responseText = String(response.text || '');
      const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const extractedData = JSON.parse(jsonString);

      let genderEnum = Gender.MALE;
      if (extractedData.jenisKelamin?.toLowerCase().includes('perempuan')) {
        genderEnum = Gender.FEMALE;
      }

      const extractedProv = extractedData.provinsi ? extractedData.provinsi.toUpperCase() : '';
      const isDKI = extractedProv.includes('DKI') || extractedProv.includes('JAKARTA');
      
      const determinedStatusKtp = isDKI ? ResidenceStatus.KTP_DKI : ResidenceStatus.PENDATANG;

      setFormData(prev => {
        const newData = {
            ...prev,
            nik: extractedData.nik,
            namaLengkap: extractedData.namaLengkap,
            tempatLahir: extractedData.tempatLahir,
            tanggalLahir: extractedData.tanggalLahir,
            jenisKelamin: genderEnum,
            agama: extractedData.agama,
            statusPerkawinan: extractedData.statusPerkawinan,
            pekerjaan: extractedData.pekerjaan,
            kewarganegaraan: CitizenshipStatus.WNI,
            statusKtp: determinedStatusKtp,
            golonganDarah: prev.golonganDarah || BloodType.UNKNOWN,
        };

        if (isDKI) {
            newData.alamat = extractedData.alamat;
            newData.rt = extractedData.rt;
            newData.rw = extractedData.rw;
            newData.kelurahan = extractedData.kelurahan || 'Grogol Selatan';
            newData.kecamatan = extractedData.kecamatan || 'Kebayoran Lama';
            newData.kota = extractedData.kota || 'Jakarta Selatan';
            newData.provinsi = extractedData.provinsi || 'DKI Jakarta';
            newData.asalProvinsi = 'DKI JAKARTA';
            newData.asalKota = '';
            newData.asalKecamatan = '';
            newData.asalKelurahan = '';
            newData.alamatAsli = '';
        } else {
            newData.asalProvinsi = extractedData.provinsi;
            newData.asalKota = extractedData.kota;
            newData.asalKecamatan = extractedData.kecamatan;
            newData.asalKelurahan = extractedData.kelurahan;
            newData.alamatAsli = `${extractedData.alamat}, RT ${extractedData.rt} / RW ${extractedData.rw}`;
            newData.alamat = ''; 
            newData.rt = '';
            newData.rw = '';
            newData.kelurahan = 'Grogol Selatan';
            newData.kecamatan = 'Kebayoran Lama';
            newData.kota = 'Jakarta Selatan';
            newData.provinsi = 'DKI Jakarta';
        }

        return newData;
      });

      if (isDKI && extractedData.alamat) {
          const query = `${extractedData.alamat}, ${extractedData.kelurahan || 'Grogol Selatan'}, ${extractedData.kecamatan || 'Kebayoran Lama'}, Jakarta Selatan`;
          await performGeocoding(query);
      }

      alert(`OCR Berhasil! Provinsi: ${extractedProv}. Status: ${determinedStatusKtp}.`);

    } catch (error) {
      console.error("OCR Error:", error);
      alert("Gagal memindai KTP. Pastikan gambar jelas atau gunakan input manual.");
    } finally {
      setIsScanning(false);
      setScanSource(null);
    }
  };

  const handleRFIDScan = () => {
    setIsScanning(true);
    setScanSource('rfid');
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        nik: '3174082205900001',
        namaLengkap: 'Warga RFID Scan',
        tempatLahir: 'Jakarta',
        tanggalLahir: '1995-08-17',
        jenisKelamin: Gender.FEMALE,
        alamat: '',
        rt: '',
        rw: '',
        kelurahan: 'Grogol Selatan',
        kecamatan: 'Kebayoran Lama',
        kota: 'Jakarta Selatan',
        provinsi: 'DKI Jakarta',
        agama: 'Islam',
        statusPerkawinan: 'Belum Kawin',
        pekerjaan: 'Pelajar/Mahasiswa',
        asalProvinsi: 'JAWA BARAT',
        asalKota: 'Bogor',
        asalKecamatan: 'Cibinong',
        asalKelurahan: 'Ciriung',
        alamatAsli: 'Jl. Mayor Oking No. 12',
        statusKtp: ResidenceStatus.PENDATANG
      }));
      setIsScanning(false);
      setScanSource(null);
      alert('Data RFID Berhasil Dibaca! Status KTP: Pendatang (Jawa Barat)');
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.nomorWhatsapp && formData.nomorWhatsapp.length < 9) {
        alert('Nomor WhatsApp minimal harus 9 angka.');
        return;
    }

    onSave({
      id: citizen?.id || `CIT-${Date.now()}`,
      ...formData
    } as Citizen);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl my-8 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{isEditMode ? 'Edit Data Warga' : 'Tambahkan Data Warga'}</h3>
            <p className="text-sm text-slate-500">{isEditMode ? 'Perbarui informasi data penduduk.' : 'Lengkapi formulir biodata penduduk.'}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-8 max-h-[80vh] overflow-y-auto bg-slate-50/50">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* 📸 PROFILE PICTURE SECTION */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 items-center">
               <div className="shrink-0 relative">
                  <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center group">
                    {formData.fotoWajah ? (
                      <img src={formData.fotoWajah} alt="Preview" className="w-full h-full object-cover bg-slate-50" />
                    ) : (
                      <User size={48} className="text-slate-300" />
                    )}
                  </div>
                  {formData.fotoWajah && (
                    <button 
                      type="button" 
                      onClick={() => setFormData(prev => ({...prev, fotoWajah: ''}))}
                      className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full shadow-sm hover:bg-red-600"
                    >
                      <X size={12} />
                    </button>
                  )}
               </div>
               
               <div className="flex-1 space-y-3 w-full">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <ImageIcon size={18} className="text-orange-500" /> Foto Profil Warga
                  </h4>
                  <p className="text-sm text-slate-500">
                    Pilih metode pengambilan foto profil. Wajah harus terlihat jelas.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                     {/* 1. UPLOAD */}
                     <button
                        type="button"
                        onClick={() => document.getElementById('profile-upload')?.click()}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 text-sm font-bold transition-all"
                     >
                        <Upload size={16} /> Upload Gambar
                     </button>
                     <input 
                       type="file" 
                       id="profile-upload" 
                       accept="image/*" 
                       className="hidden" 
                       onChange={handleProfileImageUpload} 
                     />

                     {/* 2. CAMERA */}
                     <button
                        type="button"
                        onClick={startCamera}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl hover:bg-blue-100 text-sm font-bold transition-all"
                     >
                        <Camera size={16} /> Dengan Camera
                     </button>
                     
                  </div>
               </div>
            </div>

            {/* Camera Overlay Modal */}
            {isCameraOpen && (
              <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4">
                <div className="relative w-full max-w-lg aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl mb-6 border-2 border-slate-700">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={stopCamera}
                    className="px-6 py-3 bg-slate-700 text-white font-bold rounded-full hover:bg-slate-600 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="button" 
                    onClick={takePhoto}
                    className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-slate-200 transition-colors flex items-center gap-2"
                  >
                    <Camera size={20} /> Ambil Foto
                  </button>
                </div>
              </div>
            )}
            
            {/* 1. AI Scan Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <ScanFace size={32} className="text-white" />
                 </div>
                 <div>
                    <h4 className="text-lg font-bold">Smart Scan KTP</h4>
                    <p className="text-blue-100 text-sm max-w-md">
                      Pilih metode scan untuk mengisi data otomatis menggunakan AI OCR atau RFID Reader.
                    </p>
                 </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  {/* UPLOAD BUTTON */}
                  <button 
                    type="button"
                    className="px-4 py-3 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    onClick={() => document.getElementById('ktp-upload')?.click()}
                    disabled={isScanning}
                  >
                    {isScanning && scanSource === 'upload' ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    Upload KTP
                  </button>
                  <input type="file" id="ktp-upload" accept="image/*" className="hidden" onChange={handleFileUploadOCR} />

                  {/* RFID BUTTON */}
                  <button 
                    type="button"
                    onClick={handleRFIDScan}
                    disabled={isScanning}
                    className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl border border-white/30 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-70 disabled:cursor-wait text-sm"
                  >
                    {isScanning && scanSource === 'rfid' ? (
                      <><Loader2 size={18} className="animate-spin" /> Reading...</>
                    ) : (
                      <><Scan size={18} /> Scan RFID</>
                    )}
                  </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT COLUMN: Personal Data */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <CreditCard size={16} /> Identitas Utama
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 ml-1">NIK</label>
                        <input type="text" name="nik" value={formData.nik} onChange={handleChange} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="16 Digit NIK" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 ml-1">No. KK</label>
                        <input type="text" name="kk" value={formData.kk} onChange={handleChange} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="16 Digit KK" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                       <div className="space-y-1 col-span-2">
                          <label className="text-xs font-bold text-slate-500 ml-1">Nama Lengkap</label>
                          <input type="text" name="namaLengkap" value={formData.namaLengkap} onChange={handleChange} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 ml-1">Asal Provinsi</label>
                          <input 
                            type="text" 
                            name="asalProvinsi" 
                            value={formData.asalProvinsi} 
                            onChange={handleChange} 
                            placeholder="OCR Result"
                            className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none" 
                          />
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 ml-1">Tempat Lahir</label>
                        <input type="text" name="tempatLahir" value={formData.tempatLahir} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 ml-1">Tanggal Lahir</label>
                        <input type="date" name="tanggalLahir" value={formData.tanggalLahir} onChange={handleChange} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                      </div>
                    </div>
                    
                    {/* Age Calculation & KTP Eligibility */}
                    {formData.tanggalLahir && (
                      <div className={`p-4 rounded-xl text-sm border ${age >= 17 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                         <div className="flex justify-between items-center mb-1">
                           <span className="font-bold">Usia: {age} Tahun</span>
                           <span className="text-xs font-mono px-2 py-0.5 bg-white/50 rounded">{ktpEligible}</span>
                         </div>
                         {age >= 17 && (
                           <div className="mt-2 flex items-center gap-2">
                             <span className="text-xs font-bold">Apakah sudah mempunyai KTP fisik?</span>
                             <div className="flex gap-2">
                               <label className="flex items-center gap-1 cursor-pointer">
                                 <input type="radio" name="sudahPunyaKtp" checked={formData.sudahPunyaKtp === true} onChange={() => setFormData(prev => ({...prev, sudahPunyaKtp: true}))} /> Ya
                               </label>
                               <label className="flex items-center gap-1 cursor-pointer">
                                 <input type="radio" name="sudahPunyaKtp" checked={formData.sudahPunyaKtp === false} onChange={() => setFormData(prev => ({...prev, sudahPunyaKtp: false}))} /> Belum
                               </label>
                             </div>
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                </div>

                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Calendar size={16} /> Biodata Tambahan
                  </h4>
                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 ml-1">Jenis Kelamin</label>
                          <select name="jenisKelamin" value={formData.jenisKelamin} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                            <option value={Gender.MALE}>Laki-Laki</option>
                            <option value={Gender.FEMALE}>Perempuan</option>
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 ml-1">Golongan Darah</label>
                          <select name="golonganDarah" value={formData.golonganDarah} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                            <option value={BloodType.UNKNOWN}>-</option>
                            <option value={BloodType.A}>A</option>
                            <option value={BloodType.B}>B</option>
                            <option value={BloodType.AB}>AB</option>
                            <option value={BloodType.O}>O</option>
                          </select>
                       </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 ml-1">Agama</label>
                          <select name="agama" value={formData.agama} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                            <option value="Islam">Islam</option>
                            <option value="Kristen">Kristen</option>
                            <option value="Katolik">Katolik</option>
                            <option value="Hindu">Hindu</option>
                            <option value="Buddha">Buddha</option>
                            <option value="Konghucu">Konghucu</option>
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 ml-1">Status Perkawinan</label>
                          <select name="statusPerkawinan" value={formData.statusPerkawinan} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                            <option value="Belum Kawin">Belum Kawin</option>
                            <option value="Kawin">Kawin</option>
                            <option value="Cerai Hidup">Cerai Hidup</option>
                            <option value="Cerai Mati">Cerai Mati</option>
                          </select>
                       </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 ml-1">Pekerjaan</label>
                        <input type="text" name="pekerjaan" value={formData.pekerjaan} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 ml-1">No. WhatsApp</label>
                        <input type="text" name="nomorWhatsapp" value={formData.nomorWhatsapp} onChange={handleChange} placeholder="628xxxxxxx" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                     </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Address & Logic */}
              <div className="space-y-6">
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                   <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <AlertTriangle size={16} /> Status Kependudukan
                   </h4>
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1">Kewarganegaraan</label>
                            <select name="kewarganegaraan" value={formData.kewarganegaraan} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                               <option value={CitizenshipStatus.WNI}>WNI</option>
                               <option value={CitizenshipStatus.WNA}>WNA</option>
                            </select>
                         </div>
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1">Status KTP</label>
                            <select 
                                name="statusKtp" 
                                value={formData.statusKtp} 
                                onChange={handleChange} 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            >
                               <option value={ResidenceStatus.KTP_DKI} disabled={formData.kewarganegaraan === CitizenshipStatus.WNA}>KTP DKI</option>
                               <option value={ResidenceStatus.PENDATANG} disabled={formData.kewarganegaraan === CitizenshipStatus.WNA}>Pendatang</option>
                               <option value={ResidenceStatus.WNA} disabled={formData.kewarganegaraan === CitizenshipStatus.WNI}>WNA</option>
                            </select>
                         </div>
                      </div>
                      
                      {formData.statusKtp === ResidenceStatus.PENDATANG && formData.kewarganegaraan !== CitizenshipStatus.WNA && (
                         <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-3 animate-in fade-in">
                           <h5 className="text-xs font-bold text-orange-800 uppercase border-b border-orange-200 pb-2 mb-2">Alamat Asal (Sesuai KTP)</h5>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500">Provinsi Asal</label>
                                <input type="text" name="asalProvinsi" value={formData.asalProvinsi} onChange={handleChange} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm" placeholder="Jawa Barat" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500">Kota/Kabupaten</label>
                                <input type="text" name="asalKota" value={formData.asalKota} onChange={handleChange} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm" placeholder="Nama Kota" />
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500">Kecamatan Asal</label>
                                <input type="text" name="asalKecamatan" value={formData.asalKecamatan} onChange={handleChange} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm" placeholder="Kecamatan" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500">Kelurahan Asal</label>
                                <input type="text" name="asalKelurahan" value={formData.asalKelurahan} onChange={handleChange} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm" placeholder="Kelurahan" />
                              </div>
                           </div>
                           <div className="space-y-1">
                             <label className="text-xs font-bold text-slate-500">Alamat Lengkap Asal</label>
                             <textarea name="alamatAsli" rows={2} value={formData.alamatAsli} onChange={handleChange} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm resize-none"></textarea>
                           </div>
                         </div>
                      )}

                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 ml-1">Status Kematian</label>
                          <select name="statusKematian" value={formData.statusKematian} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                            <option value={VitalStatus.ALIVE}>Hidup</option>
                            <option value={VitalStatus.DECEASED}>Meninggal</option>
                          </select>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                     <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <MapPin size={16} /> Domisili & Koordinat
                     </h4>
                     <div className="flex items-center gap-2 bg-red-50 text-red-600 px-2 py-1 rounded-lg text-[10px] font-bold animate-pulse border border-red-100">
                       <div className="w-2 h-2 rounded-full bg-red-600"></div> Mode Tagging
                     </div>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="space-y-1 relative">
                        <label className="text-xs font-bold text-slate-500 ml-1">Alamat Lengkap Domisili</label>
                        <textarea 
                          name="alamat" 
                          value={formData.alamat} 
                          onChange={handleChange} 
                          onBlur={handleAddressBlur}
                          required 
                          placeholder="Nama Jalan, Gg, No. Rumah" 
                          rows={2} 
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                        ></textarea>
                        {isGeocoding && (
                           <div className="absolute top-8 right-3">
                              <Loader2 size={16} className="animate-spin text-teal-600" />
                           </div>
                        )}
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 ml-1">RT</label>
                          <input type="text" name="rt" value={formData.rt} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 ml-1">RW</label>
                          <input type="text" name="rw" value={formData.rw} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 ml-1">Kelurahan</label>
                          <input type="text" name="kelurahan" value={formData.kelurahan} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 ml-1">Kecamatan</label>
                          <input type="text" name="kecamatan" value={formData.kecamatan} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                        </div>
                     </div>

                     {/* MAP */}
                     <div className="space-y-2">
                       <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-500 ml-1">Tagging Lokasi Rumah</label>
                          <button 
                            type="button" 
                            onClick={handleGetLocation}
                            className="text-xs flex items-center gap-1 bg-teal-50 text-teal-700 px-2 py-1 rounded hover:bg-teal-100 transition-colors font-bold"
                          >
                             <LocateFixed size={12} /> Ambil Lokasi Saat Ini
                          </button>
                       </div>
                       
                       {/* Map Container */}
                       <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-slate-200 z-0">
                          <div ref={mapContainerRef} className="w-full h-full z-0" style={{ zIndex: 0 }} />
                          <div className="absolute top-2 left-2 z-[400] bg-white/90 backdrop-blur px-2 py-1 rounded border border-slate-200 shadow-sm text-[10px] font-mono font-bold text-slate-700">
                             Lat: {typeof formData.latitude === 'number' ? formData.latitude.toFixed(6) : '-'}, Lng: {typeof formData.longitude === 'number' ? formData.longitude.toFixed(6) : '-'}
                          </div>
                       </div>
                       <p className="text-[10px] text-slate-400 italic">*Geser pin untuk menyesuaikan lokasi presisi.</p>
                     </div>
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
                className="px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-100 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Save size={18} /> {isEditMode ? 'Simpan Perubahan' : 'Simpan Data Warga'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCitizenModal;
