
import React from 'react';
import { 
  Users, 
  Building2, 
  Activity, 
  Map, 
  Calendar,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { MOCK_STAFF, MOCK_CITIZENS } from '../constants';
import { User } from '../types';

interface MainDashboardSectionProps {
  user: User;
  onNavigate: (menu: string) => void;
}

const MainDashboardSection: React.FC<MainDashboardSectionProps> = ({ user, onNavigate }) => {
  const currentDate = new Date();
  
  const stats = {
    totalWarga: MOCK_CITIZENS.length,
    totalKK: new Set(MOCK_CITIZENS.map(c => c.kk)).size,
    totalPPSU: MOCK_STAFF.length,
    totalOnline: MOCK_STAFF.filter(s => s.status === 'Online' || s.status === 'Bertugas').length
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-slate-500 font-medium text-sm mb-2">
            <Calendar size={16} />
            <span>{currentDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Sistem Informasi Terpadu Kelurahan</h1>
          <p className="text-slate-500 max-w-2xl">
            Selamat datang di panel kontrol utama. Pantau data kependudukan, kinerja Pasukan Orange (PPSU), dan status wilayah dalam satu tampilan terintegrasi.
          </p>
        </div>
        
        {/* Decorative Background */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none"></div>
        <div className="absolute -right-10 -bottom-10 opacity-5">
           <Building2 size={300} />
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kependudukan Card */}
        <div 
          onClick={() => onNavigate('DATA_WARGA')}
          className="bg-teal-500 text-white p-6 rounded-2xl shadow-lg shadow-teal-100 cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden group"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Users size={24} />
              </div>
              <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
            </div>
            <h3 className="text-4xl font-bold mb-1">{stats.totalWarga}</h3>
            <p className="text-teal-100 font-medium text-sm">Total Data Warga</p>
            <div className="mt-4 pt-4 border-t border-white/20 text-xs font-medium text-teal-50 flex items-center gap-2">
              <FileText size={12} /> {stats.totalKK} Kartu Keluarga Terdaftar
            </div>
          </div>
          <Users size={120} className="absolute -right-6 -bottom-6 text-teal-600 opacity-20" />
        </div>

        {/* PPSU Card */}
        <div 
          onClick={() => onNavigate('DASHBOARD')} 
          className="bg-orange-500 text-white p-6 rounded-2xl shadow-lg shadow-orange-100 cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden group"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <ShieldCheck size={24} />
              </div>
              <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
            </div>
            <h3 className="text-4xl font-bold mb-1">{stats.totalPPSU}</h3>
            <p className="text-orange-100 font-medium text-sm">Personil PPSU</p>
            <div className="mt-4 pt-4 border-t border-white/20 text-xs font-medium text-orange-50 flex items-center gap-2">
              <Activity size={12} /> {stats.totalOnline} Personil Aktif Sekarang
            </div>
          </div>
          <ShieldCheck size={120} className="absolute -right-6 -bottom-6 text-orange-600 opacity-20" />
        </div>

        {/* Quick Access 1 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Map size={20} />
            </div>
            <h4 className="font-bold text-slate-800 text-lg">Peta Wilayah</h4>
            <p className="text-slate-500 text-sm mt-1">Pantau sebaran personil dan laporan lokasi secara real-time.</p>
          </div>
          <button 
            onClick={() => onNavigate('MAP_PPSU')}
            className="mt-4 text-blue-600 text-sm font-bold flex items-center gap-2 hover:gap-3 transition-all"
          >
            Buka Peta <ArrowRight size={16} />
          </button>
        </div>

        {/* System Info */}
        <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 bg-slate-700 text-slate-300 rounded-xl flex items-center justify-center mb-4">
              <Activity size={20} />
            </div>
            <h4 className="font-bold text-white text-lg">Status Sistem</h4>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Server</span>
                <span className="text-green-400 font-bold flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Online</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Database</span>
                <span className="text-green-400 font-bold flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Shortcuts / Modules */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Akses Cepat Modul</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <button onClick={() => onNavigate('DATA_WARGA')} className="p-4 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 hover:border-slate-200 transition-colors text-left group">
              <Users className="text-teal-500 mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-slate-700 text-sm">Data Warga</div>
              <div className="text-xs text-slate-400">Manajemen Kependudukan</div>
           </button>
           <button onClick={() => onNavigate('PPSU')} className="p-4 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 hover:border-slate-200 transition-colors text-left group">
              <ShieldCheck className="text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-slate-700 text-sm">Anggota PPSU</div>
              <div className="text-xs text-slate-400">Manajemen Personil</div>
           </button>
           <button onClick={() => onNavigate('MONITORING')} className="p-4 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 hover:border-slate-200 transition-colors text-left group">
              <Activity className="text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-slate-700 text-sm">Monitoring</div>
              <div className="text-xs text-slate-400">Status Tugas & Absensi</div>
           </button>
           <button onClick={() => onNavigate('STATS')} className="p-4 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 hover:border-slate-200 transition-colors text-left group">
              <FileText className="text-green-500 mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-slate-700 text-sm">Laporan</div>
              <div className="text-xs text-slate-400">Statistik & Analisa</div>
           </button>
        </div>
      </div>
    </div>
  );
};

export default MainDashboardSection;
