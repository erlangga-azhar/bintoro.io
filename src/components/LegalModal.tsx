import React from 'react';
import ReactMarkdown from 'react-markdown';

interface LegalModalProps {
  onClose: () => void;
}

const markdownContent = `
# Legal & Kebijakan Bintoro.io 📜

Selamat datang di pengembaraan Bintoro.io! Sebelum Anda melangkah lebih jauh menyusuri sejarah interaktif Kesultanan Demak, mohon luangkan waktu untuk membaca dokumen legal ini. Dengan mengakses dan bermain di Bintoro.io, Anda dianggap telah menyetujui seluruh ketentuan di bawah ini.

---

### 1. SYARAT DAN KETENTUAN (Terms of Service) 📋

Ketentuan ini merupakan kesepakatan antara Anda (Pemain) dan Erlangga Azhar (Developer).

* **Aturan Main:** Bintoro.io dirancang sebagai ruang bermain yang aman dan menyenangkan. Pemain diwajibkan menjunjung tinggi sportivitas dan rasa hormat terhadap sesama (jika berlaku fitur interaksi antar pemain).
* **Larangan Keras Manipulasi & Kecurangan:** Dilarang keras melakukan manipulasi sistem, *cheating*, memodifikasi aset *client-side*, menyuntikkan skrip pihak ketiga, atau mencoba mendapatkan keuntungan tidak adil dalam permainan (seperti mengubah state barang, avatar, atau koordinat lokasi secara ilegal).
* **Sanksi Pelanggaran:** Developer memiliki hak prerogatif penuh untuk memblokir akses pengguna (banned), menghapus progres, atau menolak layanan kapan saja jika terbukti ada percobaan peretasan atau pelanggaran syarat dan ketentuan.

### 2. KEBIJAKAN PRIVASI (Privacy Policy) 🔒

Kami sangat memahami betapa berharganya privasi Anda. Berikut ini adalah komitmen perlindungan data kami:

* **Data yang Dikumpulkan:** Kami mensyaratkan login (autentikasi) semata-mata untuk menyimpan progres petualangan Anda agar tidak hilang, dan sebagai bentuk apresiasi dengan mencantumkan nama Anda di dalam Leaderboard (Klasemen Pembangunan). Kami tidak menyalahgunakan email atau identitas Anda.
* **Penyimpanan Lokal & Cloud:** Progres Anda disimpan secara aman di cloud (Firebase) dan disinkronkan. Kami juga mungkin menggunakan *Local Storage*/*Cookies* murni agar pengalaman bermain Anda tetap mulus.
* **Tidak Ada Komersialisasi Data:** Erlangga Azhar selaku Developer menjamin bahwa **TIDAK ADA pencurian, pendistribusian, apalagi penjualan data** Anda kepada pihak ketiga (seperti pengiklan atau pialang data).

### 3. HAK CIPTA & KEKAYAAN INTELEKTUAL (Copyright & IP) ©️

Keseluruhan jagat Bintoro.io, baik secara estetika maupun kode sumber, adalah hasil karya dan dilindungi undang-undang:

* **Kepemilikan Penuh:** Seluruh karakter, aset visual (termasuk *pixel art* dan antarmuka), tata letak, aset audio (musik latar dan efek suara), serta baris kode penyusun Bintoro.io, sepenuhnya merupakan **hak milik Erlangga Azhar**.
* **Larangan Penggunaan Tanpa Izin:** Siapa pun **DILARANG KERAS** untuk secara sengaja meniru, menyalin, mereproduksi sebagian atau keseluruhan proyek, mendistribusikan ulang, atau mengkomersilkan aset-aset Bintoro.io tanpa izin tertulis dari pihak Developer. 

### 4. PENAFIAN (Disclaimer Sejarah & Edukasi) 🏛️

Bintoro.io dibangun dengan kebanggaan tinggi terhadap kekayaan budaya Nusantara, namun kami perlu menegaskan beberapa hal:

* **Tujuan Hiburan Edukatif:** Game ini terinspirasi dari latar belakang sejarah Kesultanan Demak pada abad ke-15. Kami mencampurkan unsur literasi sejarah dengan elemen imajinasi untuk menciptakan pengalaman yang menyenangkan.
* **Adaptasi Cerita:** Beberapa tokoh, peristiwa, *lore*, dialog, hingga desain lingkungan, mungkin telah mengalami penyesuaian (adaptasi) dramatis, reduksi, atau dibumbui lelucon segar (*easter egg komedi*). 
* **Bukan Rujukan Akademis Mutlak:** Walaupun membawa nafas sejarah, Bintoro.io **TIDAK BOLEH** dijadikan sebagai sumber sejarah definitif atau kutipan referensi akademis mutlak untuk penulisan karya ilmiah maupun keperluan forensik sejarah.

---
**Diperbarui pada:** Mei 2026
**Bintoro.io** | *Dikembangkan dengan 💖 oleh Erlangga Azhar*

`;

export default function LegalModal({ onClose }: LegalModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer transition-opacity" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/50 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700/50 bg-slate-800/80 backdrop-blur-xl">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-500">gavel</span>
            Legal & Kebijakan
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-b from-slate-900 to-[#0f172a]">
          <div className="prose prose-invert prose-slate max-w-none prose-headings:text-orange-500 prose-a:text-emerald-400 prose-hr:border-slate-700/50 leading-relaxed text-slate-300">
             <ReactMarkdown>{markdownContent}</ReactMarkdown>
          </div>
        </div>
        
        <div className="p-4 sm:p-6 border-t border-slate-700/50 bg-slate-800/80 backdrop-blur-xl flex justify-end">
           <button 
             onClick={onClose}
             className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-lg uppercase tracking-wider text-sm"
           >
             Saya Mengerti
           </button>
        </div>
      </div>
    </div>
  );
}
