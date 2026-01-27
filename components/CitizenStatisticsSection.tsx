
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Users, 
  Briefcase, 
  BookOpen, 
  Heart,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { MOCK_CITIZENS } from '../constants';

const CitizenStatisticsSection: React.FC = () => {
  
  // 1. Process Age Data with New Classifications
  const ageData = useMemo(() => {
    const today = new Date();
    // New Groups: 0-3, 4-5, 6-12, 13-19, 20-60, >60
    const groups = {
      'Balita (0-3)': 0, 
      'Batita (4-5)': 0, 
      'Anak (6-12)': 0, 
      'Remaja (13-19)': 0, 
      'Dewasa (20-60)': 0, 
      'Lansia (>60)': 0
    };

    MOCK_CITIZENS.forEach(c => {
      const birthDate = new Date(c.tanggalLahir);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age <= 3) groups['Balita (0-3)']++;
      else if (age <= 5) groups['Batita (4-5)']++;
      else if (age <= 12) groups['Anak (6-12)']++;
      else if (age <= 19) groups['Remaja (13-19)']++;
      else if (age <= 60) groups['Dewasa (20-60)']++;
      else groups['Lansia (>60)']++;
    });

    return Object.keys(groups).map(key => ({
      name: key,
      value: groups[key as keyof typeof groups]
    }));
  }, []);

  // 2. Process Jobs Data
  const jobData = useMemo(() => {
    const counts: Record<string, number> = {};
    MOCK_CITIZENS.forEach(c => {
      counts[c.pekerjaan] = (counts[c.pekerjaan] || 0) + 1;
    });
    return Object.keys(counts)
      .map(key => ({ name: key, value: counts[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 jobs
  }, []);

  // 3. Process Religion Data
  const religionData = useMemo(() => {
    const counts: Record<string, number> = {};
    MOCK_CITIZENS.forEach(c => {
      counts[c.agama] = (counts[c.agama] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, []);

  // 4. Process Marital Status Data
  const maritalData = useMemo(() => {
    const counts: Record<string, number> = {};
    MOCK_CITIZENS.forEach(c => {
      counts[c.statusPerkawinan] = (counts[c.statusPerkawinan] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, []);

  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Statistik Kependudukan</h2>
           <p className="text-slate-500 text-sm">Analisa visual data demografi warga secara terperinci.</p>
        </div>
      </div>

      {/* Row 1: Age Distribution */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
           <BarChart3 size={20} className="text-teal-500" />
           Distribusi Usia Penduduk
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="value" name="Jumlah Warga" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Grid of Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Jobs Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
             <Briefcase size={20} className="text-orange-500" />
             Pekerjaan Terbanyak
           </h3>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={jobData} layout="vertical" margin={{ left: 40 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#475569'}} />
                   <Tooltip cursor={{fill: 'transparent'}} />
                   <Bar dataKey="value" name="Jumlah" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Religion Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
             <PieChartIcon size={20} className="text-purple-500" />
             Komposisi Agama
           </h3>
           <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={religionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {religionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Marital Status Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
             <Heart size={20} className="text-pink-500" />
             Status Perkawinan
           </h3>
           <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={maritalData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {maritalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-sm border border-slate-700 text-white flex flex-col justify-center items-center text-center">
           <BookOpen size={48} className="text-slate-400 mb-4" />
           <h3 className="text-xl font-bold mb-2">Laporan Lengkap</h3>
           <p className="text-slate-400 text-sm mb-6 max-w-xs">
             Unduh data statistik lengkap dalam format PDF atau Excel untuk keperluan pelaporan resmi.
           </p>
           <div className="flex gap-3">
             <button className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors">
               Export PDF
             </button>
             <button className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/20 transition-colors">
               Export Excel
             </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default CitizenStatisticsSection;
