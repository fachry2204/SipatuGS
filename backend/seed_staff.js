const db = require('./db');

const staffData = [
    {
        nama: "Budi Santoso",
        gender: "Laki-Laki",
        status: "Online",
        lat: -6.2297,
        lng: 106.7850
    },
    {
        nama: "Siti Aminah",
        gender: "Perempuan",
        status: "Bertugas",
        lat: -6.2310,
        lng: 106.7820
    },
    {
        nama: "Agus Setiawan",
        gender: "Laki-Laki",
        status: "Online",
        lat: -6.2285,
        lng: 106.7880
    },
    {
        nama: "Dewi Lestari",
        gender: "Perempuan",
        status: "Offline",
        lat: -6.2250,
        lng: 106.7810
    },
    {
        nama: "Rudi Hartono",
        gender: "Laki-Laki",
        status: "Standby",
        lat: -6.2330,
        lng: 106.7860
    },
    {
        nama: "Rina Wati",
        gender: "Perempuan",
        status: "Bertugas",
        lat: -6.2270,
        lng: 106.7890
    },
    {
        nama: "Joko Susilo",
        gender: "Laki-Laki",
        status: "Online",
        lat: -6.2260,
        lng: 106.7840
    },
    {
        nama: "Sri Wahyuni",
        gender: "Perempuan",
        status: "Offline",
        lat: -6.2320,
        lng: 106.7830
    },
    {
        nama: "Eko Prasetyo",
        gender: "Laki-Laki",
        status: "Bertugas",
        lat: -6.2300,
        lng: 106.7870
    },
    {
        nama: "Nur Hayati",
        gender: "Perempuan",
        status: "Standby",
        lat: -6.2280,
        lng: 106.7800
    }
];

const generateRandomPhone = () => {
    return '08' + Math.floor(Math.random() * 10000000000);
};

const generateRandomNIK = () => {
    return '317' + Math.floor(Math.random() * 1000000000000);
};

async function seedStaff() {
    console.log('Starting seed process...');
    
    for (let i = 0; i < staffData.length; i++) {
        const s = staffData[i];
        // Using Date.now() + i ensures unique ID
        const id = `STF-${Date.now()}-${i}`;
        const nik = generateRandomNIK();
        const nomorAnggota = `PPSU-00${i + 1}`;
        const alamat = `Jl. Kebayoran Lama No. ${i + 1}, Grogol Selatan`;
        const wa = generateRandomPhone();
        const foto = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.nama)}&background=random&color=fff&size=128`;
        const tugas = Math.floor(Math.random() * 50);
        const tanggal = new Date().toISOString().split('T')[0];
        
        const sql = `
            INSERT INTO staff (id, nik, nomor_anggota, nama_lengkap, jenis_kelamin, alamat_lengkap, nomor_whatsapp, foto_profile, status, total_tugas_berhasil, latitude, longitude, tanggal_masuk)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        try {
            await db.query(sql, [
                id, nik, nomorAnggota, s.nama, s.gender, alamat, wa, foto, s.status, tugas, s.lat, s.lng, tanggal
            ]);
            console.log(`Created staff: ${s.nama}`);
        } catch (err) {
            console.error(`Failed to create ${s.nama}:`, err.message);
        }
    }
    
    console.log('Seeding completed.');
    process.exit();
}

seedStaff();
