import postgres from 'postgres';
import { env } from '../config/env';

// 1. Membuat koneksi ke PostgreSQL menggunakan URL dari .env
export const sql = postgres(env.DATABASE_URL, {
  max: 10, // Maksimal koneksi simultan (Connection pool)
  idle_timeout: 20, // Tutup koneksi jika tidak ada aktivitas selama 20 detik
});

// 2. Fungsi inisialisasi yang dipanggil di index.ts
export async function initDatabase() {
  try {
    console.log('⏳ Sedang mencoba terhubung ke database...');
    // Coba eksekusi query sederhana
    await sql`SELECT 1`; 
    console.log('✅ Berhasil terhubung ke PostgreSQL!');

    // Otomatis mengecek dan membuat tabel jika belum ada
    await setupTables();
    
  } catch (error: any) {
    console.error('❌ Gagal terhubung ke database!');
    console.error('Alasan:', error.message);
    console.error('Pastikan password di .env benar dan PostgreSQL sedang berjalan.');
    process.exit(1); // Matikan aplikasi jika database gagal terhubung
  }
}

// 3. Fungsi untuk membuat Struktur Tabel (Hanya tereksekusi jika tabel belum ada)
async function setupTables() {
  try {
    // Tabel Users
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT PRIMARY KEY, -- Menggunakan BIGINT karena ID Telegram sangat panjang
        username VARCHAR(255),
        first_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Tabel Sessions (Menggunakan UUID)
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id_session UUID PRIMARY KEY,
        user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'active', -- 'active' atau 'finished'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Tabel Messages
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        session_id UUID REFERENCES sessions(id_session) ON DELETE CASCADE,
        sender VARCHAR(50), -- 'user' atau 'bot'
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Tabel Ratings (Relasi 1 to 1 dengan Session)
    await sql`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        session_id UUID UNIQUE REFERENCES sessions(id_session) ON DELETE CASCADE,
        score INT CHECK (score >= 1 AND score <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('✅ Struktur Tabel PostgreSQL sudah siap dan tervalidasi.');
  } catch (error: any) {
    console.error('❌ Gagal membuat tabel:', error.message);
    process.exit(1);
  }
}