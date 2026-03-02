
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Users, 
  User as UserIcon,
  Download, 
  Printer, 
  ChevronLeft, 
  ChevronRight,
  MapPin,
  Briefcase,
  Eye,
  UserPlus,
  Pencil,
  Trash2
} from 'lucide-react';
import { Citizen, Gender, ResidenceStatus, User } from '../types';
import { apiService } from '../services/api';
import AddCitizenModal from './AddCitizenModal';
import DeleteCitizenModal from './DeleteCitizenModal';
import CitizenProfileModal from './CitizenProfileModal';

// Update Interface Props to accept citizens state
interface CitizenSectionProps {
  users?: User[]; 
  setUsers?: React.Dispatch<React.SetStateAction<User[]>>;
  citizens: Citizen[];
  setCitizens: React.Dispatch<React.SetStateAction<Citizen[]>>;
}

const CitizenSection: React.FC<CitizenSectionProps> = ({ users = [], setUsers, citizens, setCitizens }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null); // For View
  const [editingCitizen, setEditingCitizen] = useState<Citizen | null>(null); // For Edit
  const [citizenToDelete, setCitizenToDelete] = useState<Citizen | null>(null); // For Delete

  // Success Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{name: string, username: string, nik: string} | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredCitizens = useMemo(() => {
    return citizens.filter(c => 
      c.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nik.includes(searchTerm) ||
      c.kk.includes(searchTerm) || // Added KK search support
      c.alamat.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, citizens]);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCitizens = filteredCitizens.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCitizens.length / itemsPerPage);

  const stats = {
    total: citizens.length,
    male: citizens.filter(c => c.jenisKelamin === Gender.MALE).length,
    female: citizens.filter(c => c.jenisKelamin === Gender.FEMALE).length,
    kk: new Set(citizens.map(c => c.kk)).size
  };



  const handleSaveCitizen = async (citizenData: Citizen) => {
    try {
      if (editingCitizen) {
        await apiService.updateCitizen(citizenData);
        // Refresh users to reflect changes (e.g. Name/NIK update)
        if (setUsers) {
            const freshUsers = await apiService.getUsers();
            if (freshUsers) setUsers(freshUsers);
        }
      } else {
        await apiService.createCitizen(citizenData);
        if (setUsers && users) {
          // Logic Update: Warga Username is NIK
          const newUsername = citizenData.nik;
          const newUser: User = {
            id: `USR-${citizenData.id}`,
            username: newUsername,
            name: citizenData.namaLengkap,
            nik: citizenData.nik,
            password: citizenData.nik,
            role: 'Warga',
            avatar: citizenData.fotoWajah || `https://ui-avatars.com/api/?name=${encodeURIComponent(citizenData.namaLengkap)}&background=random`
          };
          setUsers(prevUsers => [...prevUsers, newUser]);
          try {
            await apiService.createUser(newUser);
            // Re-fetch users to keep UI in sync
            const freshUsers = await apiService.getUsers();
            if (freshUsers && setUsers) setUsers(freshUsers);
          } catch {}
          
          setSuccessModalData({
            name: citizenData.namaLengkap,
            username: newUsername,
            nik: citizenData.nik
          });
          setIsSuccessModalOpen(true);
        }
      }
      const fresh = await apiService.getCitizens();
      if (fresh) setCitizens(fresh);
      setIsAddModalOpen(false);
      setEditingCitizen(null);
    } catch (e) {
      alert('Gagal menyimpan data warga ke server.');
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      await apiService.deleteCitizen(id);
      setCitizens(prev => prev.filter(c => c.id !== id));
      
      // Sync Users state
      if (setUsers) {
          const freshUsers = await apiService.getUsers();
          if (freshUsers) setUsers(freshUsers);
      }

      setCitizenToDelete(null);
      if (selectedCitizen?.id === id) {
          setSelectedCitizen(null);
      }
    } catch (e) {
      alert('Gagal menghapus data warga dari server.');
    }
  };

  const openAddModal = () => {
    setEditingCitizen(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (citizen: Citizen) => {
    setEditingCitizen(citizen);
    setIsAddModalOpen(true);
    // If viewing profile, close it or keep it open? Let's close it to focus on editing
    if(selectedCitizen) setSelectedCitizen(null); 
  };

  const openDeleteModal = (citizen: Citizen) => {
    setCitizenToDelete(citizen);
    // If viewing profile, close it
    if(selectedCitizen) setSelectedCitizen(null);
  };

  const openViewModal = (citizen: Citizen) => {
    setSelectedCitizen(citizen);
  };

  const handleSearchByKK = (kk: string) => {
    setSearchTerm(kk);
    setSelectedCitizen(null);
  };

  // Advanced Pagination Button Logic
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) endPage = Math.min(totalPages - 1, 4);
      if (currentPage >= totalPages - 2) startPage = Math.max(2, totalPages - 3);

      if (startPage > 2) pages.push('...');
      for (let i = startPage; i <= endPage; i++) pages.push(i);
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
             <p className="text-xs font-bold text-slate-400 uppercase">Total Warga</p>
             <h3 className="text-2xl font-bold text-slate-800">{stats.total}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <UserIcon size={24} />
          </div>
          <div>
             <p className="text-xs font-bold text-slate-400 uppercase">Laki-Laki</p>
             <h3 className="text-2xl font-bold text-slate-800">{stats.male}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center">
            <UserIcon size={24} />
          </div>
          <div>
             <p className="text-xs font-bold text-slate-400 uppercase">Perempuan</p>
             <h3 className="text-2xl font-bold text-slate-800">{stats.female}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
             <p className="text-xs font-bold text-slate-400 uppercase">Total KK</p>
             <h3 className="text-2xl font-bold text-slate-800">{stats.kk}</h3>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari berdasarkan Nama, NIK, KK, atau Alamat..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 w-full outline-none"
            />
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap"
          >
            <UserPlus size={18} /> Tambahkan Warga
          </button>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
             <span className="text-xs font-bold text-slate-500">Show:</span>
             <select 
               value={itemsPerPage}
               onChange={(e) => setItemsPerPage(Number(e.target.value))}
               className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
             >
               <option value={10}>10</option>
               <option value={20}>20</option>
               <option value={30}>30</option>
               <option value={50}>50</option>
               <option value={100}>100</option>
             </select>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <button className="flex items-center gap-2 text-slate-600 hover:text-teal-600 px-2 py-1">
             <Download size={18} /> <span className="text-sm font-bold hidden sm:inline">Export</span>
          </button>
          <button className="flex items-center gap-2 text-slate-600 hover:text-teal-600 px-2 py-1">
             <Printer size={18} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {/* 1. New Column: No KK First */}
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">No KK</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Identitas (NIK & Nama)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">L/P</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Alamat (RT/RW)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pekerjaan</th>
                {/* 2. New Column: Status */}
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentCitizens.map((citizen) => (
                <tr key={citizen.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* No KK Data */}
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {citizen.kk}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{citizen.namaLengkap}</p>
                      <p className="text-xs text-slate-500 font-mono tracking-wide">{citizen.nik}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      citizen.jenisKelamin === Gender.MALE ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                    }`}>
                      {citizen.jenisKelamin === Gender.MALE ? 'L' : 'P'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                       <span className="text-sm text-slate-700 line-clamp-1">{citizen.alamat}</span>
                       <div className="flex items-center gap-1 text-xs text-slate-500 font-medium bg-slate-100 w-fit px-1.5 py-0.5 rounded">
                          <MapPin size={10} /> RT {citizen.rt} / RW {citizen.rw}
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <Briefcase size={14} className="text-slate-400" />
                       <span className="text-sm text-slate-600">{citizen.pekerjaan}</span>
                    </div>
                  </td>
                  {/* Status Data */}
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        citizen.statusKtp === ResidenceStatus.PENDATANG ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                        citizen.statusKtp === ResidenceStatus.WNA ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                        'bg-teal-50 text-teal-600 border border-teal-100'
                    }`}>
                        {citizen.statusKtp}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                     <div className="flex items-center justify-end gap-1">
                       <button 
                         onClick={() => openViewModal(citizen)}
                         className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                         title="Lihat Data"
                       >
                          <Eye size={18} />
                       </button>
                       <button 
                         onClick={() => openEditModal(citizen)}
                         className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                         title="Edit Data"
                       >
                          <Pencil size={18} />
                       </button>
                       <button 
                         onClick={() => openDeleteModal(citizen)}
                         className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                         title="Hapus Data"
                       >
                          <Trash2 size={18} />
                       </button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCitizens.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            Data warga tidak ditemukan.
          </div>
        )}

        {/* Pagination Footer */}
        {filteredCitizens.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
             <span className="text-sm text-slate-500 order-2 sm:order-1">
                Menampilkan <span className="font-bold text-slate-800">{indexOfFirstItem + 1}</span> - <span className="font-bold text-slate-800">{Math.min(indexOfLastItem, filteredCitizens.length)}</span> dari <span className="font-bold text-slate-800">{filteredCitizens.length}</span> data
             </span>
             <div className="flex gap-1 order-1 sm:order-2">
               <button 
                 onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                 disabled={currentPage === 1}
                 className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <ChevronLeft size={16} />
               </button>
               
               {getPageNumbers().map((page, index) => (
                 page === '...' ? (
                   <span key={`dots-${index}`} className="w-8 h-8 flex items-center justify-center text-slate-400">...</span>
                 ) : (
                   <button
                     key={page}
                     onClick={() => setCurrentPage(page as number)}
                     className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                       currentPage === page 
                         ? 'bg-teal-500 text-white shadow-sm' 
                         : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                     }`}
                   >
                     {page}
                   </button>
                 )
               ))}

               <button 
                 onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                 disabled={currentPage === totalPages}
                 className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <ChevronRight size={16} />
               </button>
             </div>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <AddCitizenModal 
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveCitizen}
          citizen={editingCitizen}
        />
      )}

      {selectedCitizen && (
         <CitizenProfileModal 
            citizen={selectedCitizen}
            onClose={() => setSelectedCitizen(null)}
            onEdit={() => openEditModal(selectedCitizen)}
            onDelete={() => openDeleteModal(selectedCitizen)}
            onSearchKK={handleSearchByKK}
         />
      )}

      {citizenToDelete && (
        <DeleteCitizenModal
          citizen={citizenToDelete}
          users={users}
          onClose={() => setCitizenToDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && successModalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-800 text-white w-full max-w-md rounded-2xl shadow-2xl p-8 animate-in zoom-in-95 border border-slate-700 relative overflow-hidden">
             {/* Decorative Element */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

             <div className="relative z-10">
                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-2xl flex items-center justify-center mb-6 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
                </div>

                <h3 className="text-xl font-black mb-2 tracking-tight">Data Berhasil Disimpan!</h3>
                <p className="text-slate-400 mb-6 text-sm leading-relaxed font-medium">
                  Data warga telah tersimpan aman di server. Akun pengguna otomatis dibuat dengan detail kredensial berikut:
                </p>
                
                <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-700/50 space-y-3 mb-8 font-mono text-xs shadow-inner">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <span className="text-slate-500 font-bold uppercase tracking-wider">Nama Lengkap</span>
                      <span className="font-bold text-white text-right">{successModalData.name}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <span className="text-slate-500 font-bold uppercase tracking-wider">Username / NIK</span>
                      <span className="font-bold text-green-400 text-right tracking-wider">{successModalData.username}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-bold uppercase tracking-wider">Password</span>
                      <span className="font-bold text-green-400 text-right tracking-wider">{successModalData.nik}</span>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button 
                      onClick={() => setIsSuccessModalOpen(false)}
                      className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white py-3.5 rounded-xl font-black transition-all shadow-lg shadow-green-900/40 hover:shadow-green-500/20 transform hover:-translate-y-0.5 active:translate-y-0 text-sm uppercase tracking-wider"
                    >
                      OK, MENGERTI
                    </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenSection;
