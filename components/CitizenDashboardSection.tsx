
import React from 'react';
import { 
  Users, 
  User, 
  Home, 
  Briefcase, 
  Activity, 
  MapPin, 
  ArrowUpRight,
  UserPlus,
  Baby,
  Smile,
  BookOpen
} from 'lucide-react';
import { Citizen, Gender } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface CitizenDashboardSectionProps {
  citizens: Citizen[];
}

const CitizenDashboardSection: React.FC<CitizenDashboardSectionProps> = ({ citizens }) => {
  const totalCitizens = citizens.length;
  const totalKK = new Set(citizens.map(c => c.kk)).size;
  const maleCount = citizens.filter(c => c.jenisKelamin === Gender.MALE).length;
  const femaleCount = citizens.filter(c => c.jenisKelamin === Gender.FEMALE).length;

  // New Age Grouping based on request
  // Balita: 0-3
  // Batita: 4-5
  // Anak-anak: 6-12
  // Remaja: 13-19
  // Dewasa: 20-60
  // Lansia: >60
  const getAge = (dateString: string) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const ageGroups = {
    balita: citizens.filter(c => getAge(c.tanggalLahir) <= 3).length,
    batita: citizens.filter(c => { const a = getAge(c.tanggalLahir); return a > 3 && a <= 5 }).length,
    anak: citizens.filter(c => { const a = getAge(c.tanggalLahir); return a > 5 && a <= 12 }).length,
    remaja: citizens.filter(c => { const a = getAge(c.tanggalLahir); return a > 12 && a <= 19 }).length,
    dewasa: citizens.filter(c => { const a = getAge(c.tanggalLahir); return a > 19 && a <= 60 }).length,
    lansia: citizens.filter(c => getAge(c.tanggalLahir) > 60).length,
  };

  const dataGender = [
    { name: 'Laki-Laki', value: maleCount, color: '#3b82f6' },
    { name: 'Perempuan', value: femaleCount, color: '#ec4899' },
  ];

  const recentCitizens = citizens.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard Kependudukan</h2>
          <p className="text-slate-500 text-sm">Ringkasan data warga dan demografi wilayah.</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm shadow-teal-200">
             <UserPlus size={18} /> Input Warga Baru
           </button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
             <Users size={64} className="text-teal-600" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase">Total Penduduk</p>
          <h3 className="text-4xl font-bold text-slate-800 mt-2">{totalCitizens}</h3>
          <div className="flex items-center gap-1 mt-4 text-xs font-bold text-teal-600 bg-teal-50 w-fit px-2 py-1 rounded">
            <ArrowUpRight size={14} /> +12 Bulan Ini
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
             <Home size={64} className="text-orange-600" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase">Kepala Keluarga</p>
          <h3 className="text-4xl font-bold text-slate-800 mt-2">{totalKK}</h3>
          <div className="flex items-center gap-1 mt-4 text-xs font-bold text-orange-600 bg-orange-50 w-fit px-2 py-1 rounded">
            <Activity size={14} /> {totalKK} Kartu Keluarga
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
             <User size={64} className="text-blue-600" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase">Laki-Laki</p>
          <h3 className="text-4xl font-bold text-slate-800 mt-2">{maleCount}</h3>
          <div className="flex items-center gap-1 mt-4 text-xs font-bold text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded">
            {((maleCount / totalCitizens) * 100).toFixed(1)}% dari Total
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
             <User size={64} className="text-pink-600" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase">Perempuan</p>
          <h3 className="text-4xl font-bold text-slate-800 mt-2">{femaleCount}</h3>
          <div className="flex items-center gap-1 mt-4 text-xs font-bold text-pink-600 bg-pink-50 w-fit px-2 py-1 rounded">
            {((femaleCount / totalCitizens) * 100).toFixed(1)}% dari Total
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Demographics */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Sebaran Usia Penduduk</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <div className="w-10 h-10 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                   <Baby size={20} />
                </div>
                <h4 className="text-xl font-bold text-slate-800">{ageGroups.balita}</h4>
                <p className="text-xs text-slate-500 font-bold uppercase">Balita (0-3 Thn)</p>
             </div>
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <div className="w-10 h-10 mx-auto bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-2">
                   <Smile size={20} />
                </div>
                <h4 className="text-xl font-bold text-slate-800">{ageGroups.batita}</h4>
                <p className="text-xs text-slate-500 font-bold uppercase">Batita (4-5 Thn)</p>
             </div>
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <div className="w-10 h-10 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                   <User size={20} />
                </div>
                <h4 className="text-xl font-bold text-slate-800">{ageGroups.anak}</h4>
                <p className="text-xs text-slate-500 font-bold uppercase">Anak (6-12 Thn)</p>
             </div>
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <div className="w-10 h-10 mx-auto bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-2">
                   <BookOpen size={20} />
                </div>
                <h4 className="text-xl font-bold text-slate-800">{ageGroups.remaja}</h4>
                <p className="text-xs text-slate-500 font-bold uppercase">Remaja (13-19 Thn)</p>
             </div>
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <div className="w-10 h-10 mx-auto bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-2">
                   <Briefcase size={20} />
                </div>
                <h4 className="text-xl font-bold text-slate-800">{ageGroups.dewasa}</h4>
                <p className="text-xs text-slate-500 font-bold uppercase">Dewasa (20-60 Thn)</p>
             </div>
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <div className="w-10 h-10 mx-auto bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-2">
                   <Users size={20} />
                </div>
                <h4 className="text-xl font-bold text-slate-800">{ageGroups.lansia}</h4>
                <p className="text-xs text-slate-500 font-bold uppercase">Lansia ({'>'}60 Thn)</p>
             </div>
          </div>
          
          <div className="mt-8">
            <h4 className="text-sm font-bold text-slate-700 mb-4">Warga Terbaru Ditambahkan</h4>
            <div className="space-y-3">
               {recentCitizens.map(c => (
                 <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${c.jenisKelamin === Gender.MALE ? 'bg-blue-500' : 'bg-pink-500'}`}>
                          {c.namaLengkap.substring(0,2).toUpperCase()}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-800">{c.namaLengkap}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10} /> RT {c.rt} / RW {c.rw}</p>
                       </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">{c.nik}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Gender Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
           <h3 className="text-lg font-bold text-slate-800 mb-2">Komposisi Gender</h3>
           <div className="flex-1 min-h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataGender}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dataGender.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                 <p className="text-xs text-slate-400 font-bold">Total</p>
                 <p className="text-2xl font-bold text-slate-800">{totalCitizens}</p>
              </div>
           </div>
           <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-slate-600">Laki-Laki</span>
                 </div>
                 <span className="text-sm font-bold text-slate-800">{maleCount}</span>
              </div>
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                    <span className="text-sm text-slate-600">Perempuan</span>
                 </div>
                 <span className="text-sm font-bold text-slate-800">{femaleCount}</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboardSection;
