Siap, dicatat! Menambahkan grafik di Modul C itu keputusan yang tepat. Jadi, sebelum user masuk ke halaman komparasi yang ribet (membandingkan 3 daerah sekaligus di Modul D), mereka bisa melihat visualisasi tren yang jelas dan fokus untuk **satu daerah saja** terlebih dahulu di Modul C.

Berikut adalah draf **PRD Versi 1.4** yang sudah diperbarui. Fitur grafik untuk single region sudah dimasukkan ke dalam Modul C.

---

# PRD — RicePrice Predictor (Aplikasi Prediksi & Analisis Harga Beras)

> Versi: 1.4 | Tanggal: 25/06/2026 | Status: Active / In-Discussion

---

## 1. Overview

* **Product**: Web App Prediksi & Komparasi Harga Beras Tingkat Provinsi di Indonesia.
* **Target user**: Distributor beras, pelaku usaha kuliner, analis ketahanan pangan, dan masyarakat umum.
* **Problem**: Fluktuasi harga beras yang dinamis antar wilayah menyulitkan pelaku usaha untuk membandingkan harga pasaran dan memprediksi anggaran secara akurat.
* **Value prop**: Menyediakan platform analisis satu-pintu untuk melihat tren historis, membandingkan harga antar wilayah, dan memprediksi harga beras bulanan dengan indikator fluktuasi *real-time*.

---

## 2. Tech Stack

* **Backend Utama**: Laravel 12 (Mengelola auth, database, logika bisnis, dan interaksi API).
* **Frontend**: Inertia.js + React.js + TypeScript (Terintegrasi di dalam ekosistem Laravel).
* **AI Microservice**: Python FastAPI (Hosted on Hugging Face Spaces khusus untuk *serving* 31 model `.pkl` via `joblib`).


* **Database**: MySQL 


* **Storage**: GitHub / Hugging Face Repository (Git LFS untuk menyimpan file model `.pkl`).


* **Hosting**:
* locall aja dulu semua nya 
* 



---

## 3. Features

> ★ = MVP (Wajib ada di Phase 1–2) | ☆ = Nice-to-have (Phase 3+)

### Modul A: Auth & User

* ★ User dapat register dengan nama, email, dan password.
* ★ User dapat login dan logout dari sistem.
* ★ User dapat melihat ucapan selamat datang personal (*"Selamat Datang, [Nama User]!"*) di halaman Dashboard.

### Modul B: Dashboard Informasi

* ★ User dapat melihat informasi ringkas mengenai kondisi harga beras nasional saat ini.
* ★ User dapat melihat card prediksi harga beras untuk **bulan berjalan (live mengikuti tanggal hari ini)** di beberapa daerah utama.
* ★ User dapat melihat **persentase akurasi model saja** pada card tersebut (Metrik MAPE, MAE, RMSE, dan R2 disembunyikan agar UI tetap bersih).



### Modul C: Prediksi Harga (Single Region)

* ★ **Sistem Filter**: User dapat memfilter data berdasarkan **Bulan**, **Tahun**, dan **Daerah/Provinsi**.


* ★ **Logika Data Hybrid**:
* Menarik data asli dari database jika user memilih Bulan & Tahun **di masa lalu**.

* Memicu prediksi dari FastAPI jika user memilih Bulan & Tahun **di masa depan**.
* ★ **Visualisasi Single-Line Chart**: User dapat melihat grafik tren harga satu daerah yang dipilih, menampilkan riwayat harga bulanan ke belakang beserta titik target prediksinya.


* ★ User dapat melihat indikator persentase kenaikan atau penurunan harga secara *real-time* dibanding dengan bulan sebelumnya (Contoh: ▲ 2.3% atau ▼ 1.5%).

### Modul D: Analisis Komparasi (Multi Region)

* ★ User dapat memilih **maksimal 3 daerah** sekaligus untuk dilakukan analisis berbarengan.


* ★ User dapat melihat **Grafik Multi-Line** yang menggabungkan dan membandingkan tren harga dari maksimal 3 daerah yang dipilih.


* ★ User dapat melihat perbandingan persentase kenaikan atau penurunan harga antar daerah tersebut secara *real-time*.

### Modul E: Laporan & Export

* ☆ User dapat mengunduh hasil grafik analisis komparasi atau tabel prediksi ke dalam format PDF / Excel.



### Modul D: Data Management (Khusus Admin) — BARU
★ semua yang d lakukan user

★ Admin dapat menginput data harga beras riil baru setiap bulannya ke database melalui form input.

★ Admin dapat mengunduh format template CSV untuk melakukan bulk import data harga beras historis.

★ Admin dapat mengedit atau menghapus data harga beras yang salah input di database.

★admin bisa masukin csv baru, lalu nanti ada tombol untuk training ulang buat memperbarui data terbaru

---

## 4. Data Model

| Table | Kolom Kunci | Relasi & Deskripsi |
| --- | --- | --- |
| **users** | id, name, email, password | Menyimpan data akun untuk auth dan teks selamat datang. |
| **provinces** | id, province_name | Menyimpan daftar 31 daerah hasil deteksi tren dari notebook.

 |
| **rice_prices** | id, province_id, month, year, price | Menyimpan seluruh data historis beras untuk kebutuhan filter masa lalu dan pembentukan grafik.

 |

---

## 5. Phases

**Phase 1 — Foundation & Data Ingestion**
Setup project Laravel 12 + Inertia React. Migrasikan seluruh data historis dari file `dataset_lengkap.csv` ke database agar siap di-query berdasarkan filter bulan dan tahun.

**Phase 2 — AI Deployment (Hugging Face)**
Eksport 31 model .pkl menggunakan joblib ke dalam folder project FastAPI. Jalankan FastAPI di lokal dan pastikan endpoint prediksi menerima request dari Laravel dengan lancar.

**Phase 3 — Core Features (Modul C & D)**
Implementasi grafik di Modul C (Single Line) dan Modul D (Multi Line) menggunakan library seperti Recharts atau Chart.js di React. Integrasikan logika *hybrid* tanggal dan perhitungan fluktuasi persentase.

**Phase 4 — Polish & Deploy**
Batasi input pilihan daerah di halaman Analisis maksimal 3 daerah. Sembunyikan metrik evaluasi yang rumit di Dashboard, sisakan persentase akurasi saja. Deploy aplikasi secara penuh.

---
## Catatan Tambahan
**design** buat se kreatif dan interaktif mungkin, user friendly dan kekinian, jangan kaku design UI nya, gunakan warna warna cerah dan fresh
