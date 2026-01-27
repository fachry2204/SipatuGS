
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { FileBarChart, PieChart as PieChartIcon } from 'lucide-react';
import { ServiceRequest } from '../types';

interface ServiceStatisticsSectionProps {
  requests: ServiceRequest[];
}

const ServiceStatisticsSection: React.FC<ServiceStatisticsSectionProps> = ({ requests }) => {
  
  const typeData = useMemo(() => {
     const counts: Record<string, number> = {};
     requests.forEach(r => {
        // Shorten label for chart
        let label: string = r.type;
        if (label.includes('NTCR')) label = 'NTCR';
        if (label.includes('SKTM')) label = 'SKTM';
        if (label.includes('Penghasilan')) label = 'Ket. Hasil';
        if (label.includes('SKU')) label = 'SKU';
        if (label.includes('Umum')) label = 'Umum';
        if (label.includes('Legalisasi')) label = 'Legalisasi';
        
        counts[label] = (counts[label] || 0) + 1;
     });
     return Object.keys(counts).map(key => ({ name: key, value: counts[key] })).sort((a,b) => b.value - a.value);
  }, [requests]);

  const statusData = useMemo(() => {
     const counts: Record<string, number> = {};
     requests.forEach(r => {
        counts[r.status] = (counts[r.status] || 0) + 1;
     });
     return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [requests]);

  const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Statistik Layanan Surat</h2>
           <p className="text-slate-500 text-sm">Analisa tren permohonan surat warga.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Type Chart */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <FileBarChart size={20} className="text-indigo-500" /> Jenis Surat Terpopuler
            </h3>
            <div className="h-80">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} />
                     <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                     />
                     <Bar dataKey="value" name="Jumlah" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Status Chart */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <PieChartIcon size={20} className="text-orange-500" /> Status Penyelesaian
            </h3>
            <div className="h-80">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {statusData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <Tooltip />
                     <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ServiceStatisticsSection;
