
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
/* Fix: Added missing BarChart3 and Clock imports from lucide-react to resolve "Cannot find name" errors */
import { Star, Smile, Meh, Frown, Heart, Users, MessageSquareQuote, History, FileText, BarChart3, Clock } from 'lucide-react';
import { ServiceRating, ServiceRatingValue } from '../types';

interface ServiceRatingSectionProps {
  ratings: ServiceRating[];
}

const ServiceRatingSection: React.FC<ServiceRatingSectionProps> = ({ ratings }) => {
  
  const stats = useMemo(() => {
    const total = ratings.length;
    const counts = {
      'Sangat Baik': ratings.filter(r => r.rating === 'Sangat Baik').length,
      'Baik': ratings.filter(r => r.rating === 'Baik').length,
      'Biasa': ratings.filter(r => r.rating === 'Biasa').length,
      'Buruk': ratings.filter(r => r.rating === 'Buruk').length,
    };

    // Calculate Average Score (1-4 Scale)
    let scoreTotal = 0;
    ratings.forEach(r => {
        if (r.rating === 'Sangat Baik') scoreTotal += 4;
        else if (r.rating === 'Baik') scoreTotal += 3;
        else if (r.rating === 'Biasa') scoreTotal += 2;
        else if (r.rating === 'Buruk') scoreTotal += 1;
    });
    const avg = total > 0 ? (scoreTotal / total).toFixed(1) : "0.0";

    return { total, counts, avg };
  }, [ratings]);

  const chartData = [
    { name: 'Sangat Baik', value: stats.counts['Sangat Baik'], color: '#f97316', emote: '🤩' },
    { name: 'Baik', value: stats.counts['Baik'], color: '#10b981', emote: '😊' },
    { name: 'Biasa', value: stats.counts['Biasa'], color: '#64748b', emote: '😐' },
    { name: 'Buruk', value: stats.counts['Buruk'], color: '#ef4444', emote: '😠' },
  ];

  const recentFeedback = ratings.slice(0, 10).sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Evaluasi Kepuasan Warga</h2>
           <p className="text-slate-500 text-sm">Data penilaian realtime dari Anjungan Mandiri (Kiosk).</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-3xl flex items-center justify-center shrink-0">
               <Star size={32} fill="currentColor" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Indeks Kepuasan</p>
               <h3 className="text-4xl font-black text-slate-800">{stats.avg} <span className="text-sm font-bold text-slate-400">/ 4.0</span></h3>
            </div>
         </div>

         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center shrink-0">
               <Users size={32} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Penilaian</p>
               <h3 className="text-4xl font-black text-slate-800">{stats.total} <span className="text-sm font-bold text-slate-400">Responden</span></h3>
            </div>
         </div>

         <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center shrink-0">
               <Heart size={32} className="text-pink-400 animate-pulse" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Service Excellence</p>
               <h3 className="text-2xl font-black uppercase tracking-tight">Terus Tingkatkan!</h3>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Rating Distribution Chart */}
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-8 uppercase tracking-tighter flex items-center gap-2">
                {/* Fix: Added missing BarChart3 icon from lucide-react */}
                <BarChart3 size={20} className="text-indigo-500" /> Distribusi Penilaian
            </h3>
            <div className="h-80">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeights: 800, fill: '#64748b'}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} />
                     <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                     />
                     <Bar dataKey="value" name="Jumlah" radius={[12, 12, 0, 0]} barSize={60}>
                        {chartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Recent Ratings List */}
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
            <h3 className="text-lg font-black text-slate-800 mb-8 uppercase tracking-tighter flex items-center gap-2">
                <History size={20} className="text-orange-500" /> Masukan Terbaru
            </h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                {recentFeedback.map((item) => (
                    <div key={item.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:bg-white hover:border-indigo-200 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl">
                                {item.rating === 'Sangat Baik' ? '🤩' : item.rating === 'Baik' ? '😊' : item.rating === 'Biasa' ? '😐' : '😠'}
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-800 uppercase tracking-tighter">{item.rating}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{item.ticketNumber}</span>
                                    {/* Fix: Added missing Clock icon from lucide-react */}
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={10}/> {new Date(item.timestamp).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[9px] font-black text-indigo-500 uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{item.serviceType}</span>
                        </div>
                    </div>
                ))}
                {recentFeedback.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                        <MessageSquareQuote size={48} className="opacity-20 mb-4" />
                        <p className="font-bold text-sm uppercase tracking-widest">Belum ada penilaian masuk</p>
                    </div>
                )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default ServiceRatingSection;
