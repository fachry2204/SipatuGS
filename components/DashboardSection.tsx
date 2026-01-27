
import React from 'react';
import { 
  Users, 
  Activity, 
  MapPin, 
  Sun, 
  CloudRain, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { DutyStatus, User, Staff } from '../types';

interface DashboardSectionProps {
  user: User;
  onNavigate: (menu: string) => void;
  staffList: Staff[];
}

const DashboardSection: React.FC<DashboardSectionProps> = ({ user, onNavigate, staffList }) => {
  const currentDate = new Date();
  
  // Calculate Stats using props
  const totalStaff = staffList.length;
  const onlineStaff = staffList.filter(s => s.status === DutyStatus.ONLINE).length;
  const onDutyStaff = staffList.filter(s => s.status === DutyStatus.BERTUGAS).length;
  const standbyStaff = staffList.filter(s => s.status === DutyStatus.STANDBY).length;

  // Mock Weather Data
  const weather = {
    temp: 32,
    condition: 'Cerah Berawan',
    location: 'Grogol Selatan',
    humidity: '70%'
  };

  // Mock Recent Activities
  const activities = [
    { id: 1, user: 'Budi Santoso', action: 'Check-in Absensi', time: '07:30 WIB', type: 'success' },
    { id: 2, user: 'Siti Aminah', action: 'Menyelesaikan Tugas: Kebersihan Taman', time: '08:15 WIB', type: 'info' },
    { id: 3, user: 'Joko Widodo', action: 'Melaporkan Pohon Tumbang', time: '08:45 WIB', type: 'warning' },
    { id: 4, user: 'Rudi Hermawan', action: 'Check-in Absensi', time: '09:00 WIB', type: 'success' },
  ];

  const onlineStaffList = staffList.filter(s => s.status === DutyStatus.ONLINE).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-slate-300 font-medium mb-1">{currentDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <h2 className="text-3xl font-bold mb-2">Selamat Datang, {user.username} 👋</h2>
            <p className="text-slate-400 max-w-lg">Sistem pemantauan real-time Pasukan Orange (PPSU). Pantau kinerja dan lokasi anggota secara langsung.</p>
            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => onNavigate('MAP_PPSU')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2"
              >
                <MapPin size={18} /> Lihat Peta Live
              </button>
              <button 
                onClick={() => onNavigate('MONITORING')}
                className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all backdrop-blur-sm flex items-center gap-2"
              >
                <Activity size={18} /> Monitoring Status
              </button>
            </div>
          </div>
          
          {/* Weather Widget */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 min-w-[200px]">
             <div className="flex items-center gap-3 mb-3">
                <Sun className="text-yellow-400 animate-pulse" size={32} />
                <div>
                   <h3 className="text-2xl font-bold">{weather.temp}°C</h3>
                   <p className="text-xs text-slate-300">{weather.condition}</p>
                </div>
             </div>
             <div className="text-xs text-slate-400 flex items-center gap-1">
               <MapPin size={12} /> {weather.location}
             </div>
          </div>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
            onClick={() => onNavigate('PPSU')}
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <Users size={20} />
            </div>
            <span className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
               <ArrowUpRight size={12} className="mr-1" /> +2 Baru
            </span>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mb-1">{totalStaff}</h3>
          <p className="text-sm text-slate-500 font-medium">Total Personil</p>
        </div>

        <div 
            onClick={() => onNavigate('MONITORING')}
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
              <Activity size={20} />
            </div>
            <div className="relative">
               <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mb-1">{onlineStaff}</h3>
          <p className="text-sm text-slate-500 font-medium">Personil Online</p>
        </div>

        <div 
            onClick={() => onNavigate('STATS')}
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400">Hari Ini</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mb-1">{onDutyStaff}</h3>
          <p className="text-sm text-slate-500 font-medium">Sedang Bertugas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-white transition-colors">
              <Clock size={20} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mb-1">{standbyStaff}</h3>
          <p className="text-sm text-slate-500 font-medium">Personil Standby</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Aktivitas Terkini</h3>
            <button className="text-sm text-orange-600 font-bold hover:underline">Lihat Semua</button>
          </div>
          
          <div className="space-y-6">
            {activities.map((activity, idx) => (
              <div key={activity.id} className="flex gap-4 relative">
                {idx !== activities.length - 1 && (
                  <div className="absolute left-5 top-10 bottom-[-24px] w-0.5 bg-slate-100"></div>
                )}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-4 border-white shadow-sm ${
                  activity.type === 'success' ? 'bg-green-100 text-green-600' : 
                  activity.type === 'warning' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {activity.type === 'success' ? <CheckCircle2 size={16} /> : 
                   activity.type === 'warning' ? <AlertTriangle size={16} /> : <MessageSquare size={16} />}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex justify-between items-start">
                     <h4 className="font-bold text-slate-800 text-sm">{activity.user}</h4>
                     <span className="text-xs text-slate-400 font-mono">{activity.time}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">{activity.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Online List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Petugas Online ({onlineStaff})</h3>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
            {onlineStaffList.map(staff => (
              <div key={staff.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer">
                <div className="relative">
                  <img src={staff.fotoProfile} alt={staff.namaLengkap} className="w-10 h-10 rounded-full object-cover" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-bold text-slate-800 text-sm truncate">{staff.namaLengkap}</h4>
                  <p className="text-xs text-slate-500 truncate">{staff.nomorAnggota}</p>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => onNavigate('MONITORING')}
            className="w-full mt-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-bold rounded-xl transition-colors border border-slate-200"
          >
            Lihat Semua Personil
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardSection;
