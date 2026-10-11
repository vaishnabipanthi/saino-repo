require('dotenv').config();
const { Client, Pool } = require('pg');
const crypto = require('crypto');

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(pw, salt, 64).toString('hex');
}

async function setupAndSeed() {
  const dbUrl = process.env.DATABASE_URL;

  // 1. Pehle default 'postgres' database se connect karke check karenge
  const defaultUrl = dbUrl.replace(/\/saino(\?.*)?$/, '/postgres$1');
  console.log("⏳ Checking if 'saino' database exists...");
  
  const rootClient = new Client({ connectionString: defaultUrl });
  try {
    await rootClient.connect();
    const checkDb = await rootClient.query("SELECT 1 FROM pg_database WHERE datname='saino'");
    if (checkDb.rowCount === 0) {
      console.log("📦 Creating database 'saino'...");
      await rootClient.query('CREATE DATABASE saino');
      console.log("✅ Database 'saino' created successfully!");
    } else {
      console.log("ℹ️ Database 'saino' already exists.");
    }
  } catch (err) {
    console.error("⚠️ Root connection note:", err.message);
  } finally {
    await rootClient.end();
  }

  // 2. Ab 'saino' database se connect karke tables aur data daalenge
  console.log("⏳ Connecting to 'saino' database...");
  const pool = new Pool({ connectionString: dbUrl });
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log("🛠️ Creating Tables with High-Performance Indexes...");

    // Providers
    await client.query(`
      CREATE TABLE IF NOT EXISTS providers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        provider_type TEXT DEFAULT 'hospital',
        tier TEXT DEFAULT 'VIP Tier',
        city TEXT DEFAULT 'Kathmandu, Nepal',
        rating NUMERIC DEFAULT 4.7,
        reviews_count INT DEFAULT 328,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Staff
    await client.query(`
      CREATE TABLE IF NOT EXISTS provider_staff (
        id SERIAL PRIMARY KEY,
        provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'Provider Admin',
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Doctors
    await client.query(`
      CREATE TABLE IF NOT EXISTS provider_doctors (
        id SERIAL PRIMARY KEY,
        provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        nmc_no TEXT,
        department TEXT,
        room TEXT,
        experience_years INT DEFAULT 0,
        opd_fee INT DEFAULT 0,
        followup_fee INT DEFAULT 0,
        telemedicine BOOLEAN DEFAULT false,
        duty_days TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri',
        shift_start TEXT DEFAULT '09:00',
        shift_end TEXT DEFAULT '14:00',
        token_limit INT DEFAULT 50,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Services
    await client.query(`
      CREATE TABLE IF NOT EXISTS provider_services (
        id SERIAL PRIMARY KEY,
        provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        code TEXT,
        category TEXT DEFAULT 'Consultations',
        department TEXT,
        price INT DEFAULT 0,
        duration_min INT DEFAULT 15,
        marketplace_active BOOLEAN DEFAULT true,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Appointments (High Concurrency & Queue Engine)
    await client.query(`
      CREATE TABLE IF NOT EXISTS provider_appointments (
        id SERIAL PRIMARY KEY,
        provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        booking_ref TEXT NOT NULL,
        token_no INT NOT NULL,
        token TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        patient_phone TEXT,
        doctor_id INT REFERENCES provider_doctors(id) ON DELETE SET NULL,
        source TEXT NOT NULL DEFAULT 'walkin',
        slot_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Kathmandu')::date,
        slot_time TEXT,
        fee INT DEFAULT 0,
        reason TEXT,
        status TEXT NOT NULL DEFAULT 'waiting',
        queue_order BIGINT NOT NULL DEFAULT (extract(epoch from clock_timestamp())*1000)::bigint,
        checked_in_at TIMESTAMPTZ,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // High Rush Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_provider_appointments_today
        ON provider_appointments (provider_id, slot_date, status, queue_order);
      CREATE INDEX IF NOT EXISTS idx_provider_doctors_pid
        ON provider_doctors (provider_id, status);
      CREATE INDEX IF NOT EXISTS idx_provider_services_pid
        ON provider_services (provider_id, status);
    `);

    console.log("🌱 Seeding Norvic Hospital Data...");

    // Insert Hospital
    await client.query(`
      INSERT INTO providers (id, name, provider_type, tier, city, rating, reviews_count)
      VALUES ('norvic-01', 'Norvic International Hospital', 'hospital', 'VIP Tier', 'Kathmandu, Nepal', 4.7, 328)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Insert Admin
    await client.query(`
      INSERT INTO provider_staff (provider_id, name, email, password_hash, role)
      VALUES ('norvic-01', 'Dr. Aayush Shrestha', 'admin@norvic.com', $1, 'Provider Admin')
      ON CONFLICT (email) DO NOTHING;
    `, [hashPassword('admin123')]);

    // Insert Doctors
    await client.query(`
      INSERT INTO provider_doctors (provider_id, name, nmc_no, department, room, opd_fee, duty_days, shift_start, shift_end)
      VALUES 
        ('norvic-01', 'Dr. Aayush Shrestha', 'NMC-1245', 'General OPD', 'Room 201', 800, 'Mon,Tue,Wed,Thu,Fri', '09:00', '14:00'),
        ('norvic-01', 'Dr. Rekha Shrestha', 'NMC-5421', 'Cardiology', 'Room 102', 1000, 'Mon,Tue,Wed,Thu', '10:00', '15:00'),
        ('norvic-01', 'Dr. Anup Karki', 'NMC-8742', 'Orthopedics', 'Room 105', 900, 'Sun,Mon,Wed,Fri', '09:00', '13:00'),
        ('norvic-01', 'Dr. Sabina Pradhan', 'NMC-3319', 'Pediatrics', 'Room 108', 750, 'Mon,Tue,Wed,Fri,Sat', '11:00', '16:00')
      ON CONFLICT DO NOTHING;
    `);

    // Insert Services
    await client.query(`
      INSERT INTO provider_services (provider_id, name, code, category, department, price, duration_min)
      VALUES 
        ('norvic-01', 'General OPD Consultation', 'OPD-01', 'Consultations', 'General OPD', 800, 15),
        ('norvic-01', 'Cardiology Specialist OPD', 'CARD-01', 'Consultations', 'Cardiology', 1000, 20),
        ('norvic-01', 'Orthopedic Screening', 'ORTHO-01', 'Consultations', 'Orthopedics', 900, 20),
        ('norvic-01', 'Comprehensive Health Package', 'PKG-01', 'Packages', 'Preventive Care', 6500, 45)
      ON CONFLICT DO NOTHING;
    `);

    // In-Consultation Patient (A-023 Ram Thapa)
    const docRekha = (await client.query("SELECT id FROM provider_doctors WHERE name LIKE '%Rekha%' LIMIT 1")).rows[0];
    await client.query(`
      INSERT INTO provider_appointments (provider_id, booking_ref, token_no, token, patient_name, doctor_id, source, fee, status, started_at)
      VALUES ('norvic-01', 'SAINO-2026-9921-23', 23, 'A-023', 'Ram Thapa', $1, 'walkin', 1000, 'in_consultation', now())
      ON CONFLICT DO NOTHING;
    `, [docRekha ? docRekha.id : null]);

    // Waiting Patients (A-024, A-025, A-026, A-027)
    await client.query(`
      INSERT INTO provider_appointments (provider_id, booking_ref, token_no, token, patient_name, source, status)
      VALUES 
        ('norvic-01', 'SAINO-2026-9921-24', 24, 'A-024', 'Sita Rai', 'marketplace', 'waiting'),
        ('norvic-01', 'SAINO-2026-9921-25', 25, 'A-025', 'Bishal Karki', 'qr', 'waiting'),
        ('norvic-01', 'SAINO-2026-9921-26', 26, 'A-026', 'Sunita Lama', 'walkin', 'waiting'),
        ('norvic-01', 'SAINO-2026-9921-27', 27, 'A-027', 'Maya Gurung', 'phone', 'waiting')
      ON CONFLICT DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log("🎉 SUCCESS! PostgreSQL database 'saino' is fully created, tables ready & seeded!");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Error setting up database:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

setupAndSeed();