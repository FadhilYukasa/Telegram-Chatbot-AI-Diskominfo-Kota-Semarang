import { env } from '../config/env';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Variabel global untuk menyimpan data JSON di memori agar bisa diakses oleh bot/handler
export let datasetMemori: any = null;

export function loadDataset() {
  try {
    console.log(`📂 Mengecek dataset untuk target: ${env.DATASET_TARGET}...`);
    
    // Mencari file JSON di folder src/data/ (misal: src/data/toko_baju.json)
    const filePath = join(process.cwd(), 'src', 'db', 'data', `${env.DATASET_TARGET}.json`);
    
    // Validasi apakah file JSON-nya benar-benar ada
    if (!existsSync(filePath)) {
      console.error(`❌ File dataset tidak ditemukan di: ${filePath}`);
      console.error(`💡 Silakan buat file ${env.DATASET_TARGET}.json di dalam folder src/data/`);
      process.exit(1); // Matikan aplikasi jika dataset tidak ada, karena bot tidak akan bisa berpikir
    }

    // Membaca isi file JSON dan memasukkannya ke memori RAM
    const rawData = readFileSync(filePath, 'utf-8');
    datasetMemori = JSON.parse(rawData);
    
    console.log('✅ Dataset berhasil dimuat ke memori!');
  } catch (error: any) {
    console.error('❌ Gagal memuat dataset:', error.message);
    process.exit(1);
  }
}