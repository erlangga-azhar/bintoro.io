# Bintoro.io 🕌

**Bintoro.io** adalah sebuah permainan *2D Multiplayer Role-Playing Game (RPG)* berbasis web yang membawa pemain ke dalam petualangan epik di Tanah Bintoro. Dalam game ini, pemain ditugaskan untuk mengumpulkan pusaka, memecahkan teka-teki sejarah, dan menjalankan *quest* dari berbagai tokoh legendaris guna membantu pembangunan **Masjid Agung Demak**.

Puncak dari petualangan ini adalah menemukan **Surya Majapahit**, artefak penting yang akan menyinari Tanah Bintoro.

---

## ✨ Fitur Utama

- **🌍 Eksplorasi 2D Interaktif:** Dunia Open-World bergaya retro pixel-art yang ditenagai oleh Kaboom.js.
- **👥 Real-Time Multiplayer:** Lihat pemain lain yang sedang menjelajahi Tanah Bintoro secara *real-time* berkat integrasi WebSockets (Socket.io).
- **📜 Sistem Quest & Dialog NPC:** Berinteraksi dengan NPC seperti Ki Jaga, Mbah Sunan, Arsitek, dan lainnya untuk mendapatkan misi sejarah dan hadiah (*Pusaka*).
- **🎣 Mini-Games Seru:** Mulai dari memancing di sungai hingga menjawab kuis wawasan sejarah.
- **🏆 Klasemen Pembangunan (Leaderboard):** Bersaing dengan pengembara lain dalam menyelesaikan misi tercepat dan mengumpulkan item terbanyak.
- **☁️ Cloud Save & Sinkronisasi:** Menggunakan Firebase untuk otentikasi login Google dan menyimpan progres inventaris, status quest, dan waktu bermain. 
- **🖥️ UI/UX Modern:** Dibangun menggunakan antarmuka modern berbasi React dan Tailwind CSS.

---

## 🛠️ Teknologi yang Digunakan

Proyek ini dibangun menggunakan *stack* teknologi modern:
- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide React (Icons)
- **Game Engine 2D:** Kaboom.js
- **Backend & Network:** Node.js, Express, Socket.io (Socket.io-client)
- **Database & Auth:** Firebase (Firestore, Google Authentication)

---

## 🚀 Cara Menjalankan Secara Lokal (Development)

Jika Anda ingin mencoba menjalankan game ini di komputer lokal:

1. **Clone repository ini** (atau unduh kodenya).
2. **Install dependensi** dengan perintah:
   ```bash
   npm install
   ```
3. **Konfigurasi Firebase**:
   Pastikan Anda menambahkan file konfigurasi Firebase `.env` atau `firebase-applet-config.json` yang sesuai jika diperlukan untuk menggunakan fitur autentikasi dan sinkronisasi database.
4. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```
5. Buka `http://localhost:3000` di peramban (browser) Anda.

---

## 👨‍💻 Pengembang

Dikembangkan dengan dedikasi oleh:

- **Erlangga Azhar**
- 🔗 **LinkedIn:** [https://id.linkedin.com/in/erlangga-azhar](https://id.linkedin.com/in/erlangga-azhar)

*Membangun masa lalu, merangkai masa depan.*
