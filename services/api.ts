import { Report, Citizen, Staff, ServiceRequest, User, PPSU, FKDM, KarangTaruna } from '../types';

// Konfigurasi URL Backend
// Gunakan environment variable VITE_API_URL jika ada (saat di hosting), jika tidak gunakan localhost
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';

// Helper untuk fetch
const fetchData = async (endpoint: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        return null;
    }
};

const postData = async (endpoint: string, data: any) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json().catch(() => null);

        if (!response.ok) {
            if (result && result.error) {
                return { error: result.error };
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return result;
    } catch (error) {
        console.error(`Error posting to ${endpoint}:`, error);
        throw error;
    }
};

const putData = async (endpoint: string, data: any) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json().catch(() => null);

        if (!response.ok) {
             if (result && result.error) {
                return { error: result.error };
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return result;
    } catch (error) {
        console.error(`Error updating ${endpoint}:`, error);
        throw error;
    }
};

const deleteData = async (endpoint: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE'
        });
        
        const result = await response.json().catch(() => null);

        if (!response.ok) {
             if (result && result.error) {
                return { error: result.error };
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return result;
    } catch (error) {
        console.error(`Error deleting ${endpoint}:`, error);
        throw error;
    }
};

export const apiService = {
    // --- REPORTS ---
    getReports: async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/reports`);
            return await res.json();
        } catch (e) {
            console.error(e);
            return null;
        }
    },

    // --- RTRW ---
    getRTRW: async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/rtrw`);
            return await res.json();
        } catch (e) {
            console.error(e);
            return null;
        }
    },
    createRW: async (data: any) => {
        try {
            await fetch(`${API_BASE_URL}/rw`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.error(e);
        }
    },
    createRT: async (data: any) => {
        try {
            await fetch(`${API_BASE_URL}/rt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.error(e);
        }
    },
    updateRW: async (id: string, data: any) => {
        try {
            await fetch(`${API_BASE_URL}/rw/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.error(e);
        }
    },
    deleteRW: async (id: string) => {
        try {
            await fetch(`${API_BASE_URL}/rw/${id}`, {
                method: 'DELETE'
            });
        } catch (e) {
            console.error(e);
        }
    },
    updateRT: async (id: string, data: any) => {
        try {
            await fetch(`${API_BASE_URL}/rt/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.error(e);
        }
    },
    deleteRT: async (id: string) => {
        try {
            await fetch(`${API_BASE_URL}/rt/${id}`, {
                method: 'DELETE'
            });
        } catch (e) {
            console.error(e);
        }
    },

    // --- LMK ---
    getLMK: async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/lmk`);
            return await res.json();
        } catch (e) {
            console.error(e);
            return null;
        }
    },
    createLMK: async (data: any) => {
        try {
            await fetch(`${API_BASE_URL}/lmk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.error(e);
        }
    },
    createReport: (report: Report) => postData('/reports', report),
    updateReport: (report: Report) => putData(`/reports/${report.id}`, report),

    // --- CITIZENS ---
    getCitizens: (): Promise<Citizen[]> => fetchData('/citizens'),
    createCitizen: (citizen: Citizen) => postData('/citizens', citizen),
    updateCitizen: (citizen: Citizen) => putData(`/citizens/${citizen.id}`, citizen),
    deleteCitizen: (id: string) => deleteData(`/citizens/${id}`),

    // --- STAFF ---
    getStaff: (): Promise<Staff[]> => fetchData('/staff'),
    createStaff: (staff: Staff) => postData('/staff', staff),
    updateStaff: (staff: Staff) => putData(`/staff/${staff.id}`, staff),
    deleteStaff: (id: string) => deleteData(`/staff/${id}`),

    // --- PPSU ---
    getPPSU: (): Promise<PPSU[]> => fetchData('/ppsu'),
    createPPSU: (ppsu: PPSU) => postData('/ppsu', ppsu),
    updatePPSU: (ppsu: PPSU) => putData(`/ppsu/${ppsu.id}`, ppsu),
    deletePPSU: (id: string) => deleteData(`/ppsu/${id}`),

    // --- FKDM ---
    getFKDM: (): Promise<FKDM[]> => fetchData('/fkdm'),
    createFKDM: (fkdm: FKDM) => postData('/fkdm', fkdm),

    // --- KARANG TARUNA ---
    getKarangTaruna: (): Promise<KarangTaruna[]> => fetchData('/karang-taruna'),
    createKarangTaruna: (kt: KarangTaruna) => postData('/karang-taruna', kt),

    // --- SERVICES ---
    getServices: (): Promise<ServiceRequest[]> => fetchData('/services'),
    createService: (request: ServiceRequest) => postData('/services', request),
    updateService: (request: ServiceRequest) => putData(`/services/${request.id}`, request),

    // --- USERS ---
    login: (identifier, password) => postData('/login', { identifier, password }),
    getUsers: (): Promise<User[]> => fetchData('/users'),
    createUser: (user: User) => postData('/users', user),
    updateUser: (user: User) => putData(`/users/${user.id}`, user),
    deleteUser: (id: string) => deleteData(`/users/${id}`),

    // --- RATINGS ---
    getRatings: (): Promise<any[]> => fetchData('/ratings'),
    createRating: (rating: any) => postData('/ratings', rating),

    // --- SETTINGS ---
    getSettings: (): Promise<any> => fetchData('/settings'),
    saveSettings: (settings: any) => postData('/settings', settings),
    resetDatabase: () => postData('/reset-database', {}),
};
