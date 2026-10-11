/* Tables banata hai + ek demo provider login + thoda demo data daalta hai.
   Chalane ka tareeka (backend folder se):   node scripts/seed-provider.js
   Kisi khaas provider ke liye:              node scripts/seed-provider.js <provider_id>        */
const fs = require('fs');
const path = require('path');
const pool = require('../db');
const { hashPassword } = require('../routes/provider');

(async () => {
  await pool.query(fs.readFileSync(path.join(__dirname, '../sql/provider_schema.sql'), 'utf8'));

  const arg = process.argv[2];
  const pr = arg ? { id: arg, name: arg }
    : (await pool.query('SELECT id::text AS id, name FROM providers ORDER BY id LIMIT 1')).rows[0];
  if (!pr) throw new Error('providers table khali hai. Pehle ek provider daaliye ya id argument dijiye.');
  const pid = String(pr.id);

  const email = 'admin@saino.test', password = 'Saino@123';
  await pool.query(
    `INSERT INTO provider_staff (provider_id, name, email, password_hash, role) VALUES ($1,$2,$3,$4,'admin')
     ON CONFLICT (email) DO UPDATE SET provider_id=EXCLUDED.provider_id, password_hash=EXCLUDED.password_hash`,
    [pid, 'Dr. Aayush Shrestha', email, hashPassword(password)]);

  const has = (await pool.query('SELECT count(*)::int AS n FROM provider_doctors WHERE provider_id=$1', [pid])).rows[0].n;
  if (!has) {
    const docs = [
      ['Dr. Aayush Shrestha', 'NMC-11042', 'Cardiology', 'Room 201', 12, 1200, 800, true, 'Mon,Tue,Wed,Thu,Fri', '10:00', '14:00'],
      ['Dr. Rekha Shrestha', 'NMC-8924', 'General OPD', 'Room 102', 15, 800, 500, true, 'Mon,Tue,Wed,Thu,Fri,Sat', '09:00', '13:00'],
      ['Dr. Anup Karki', 'NMC-14521', 'General OPD', 'Room 105', 8, 1000, 600, false, 'Mon,Tue,Wed,Thu,Fri', '11:00', '16:00'],
    ];
    const ids = [];
    for (const d of docs) {
      ids.push((await pool.query(
        `INSERT INTO provider_doctors (provider_id,name,nmc_no,department,room,experience_years,opd_fee,followup_fee,telemedicine,duty_days,shift_start,shift_end)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`, [pid, ...d])).rows[0].id);
    }
    const svc = [
      ['General OPD Consultation', 'CON-01', 'Consultations', 'General OPD', 800, 15],
      ['Cardiology Consultation', 'CON-02', 'Consultations', 'Cardiology', 1200, 20],
      ['12-Lead ECG', 'DIAG-CARD-01', 'Diagnostics', 'Cardiology', 650, 15],
      ['Complete Blood Count (CBC)', 'LAB-HEM-12', 'Diagnostics', 'Pathology', 450, 30],
      ['Digital Chest X-Ray', 'RAD-XRAY-02', 'Diagnostics', 'Radiology', 850, 20],
      ['Full Body Health Checkup', 'PKG-01', 'Packages', 'Wellness', 4500, 120],
    ];
    for (const s of svc) await pool.query('INSERT INTO provider_services (provider_id,name,code,category,department,price,duration_min) VALUES ($1,$2,$3,$4,$5,$6,$7)', [pid, ...s]);

    // [naam, phone, doctor index, source, time, fee, status]
    const appts = [
      ['Ram Thapa', '9841234567', 1, 'marketplace', '10:15 AM', 800, 'in_consultation'],
      ['Sita Rai', '9851098765', 1, 'marketplace', '10:30 AM', 800, 'waiting'],
      ['Bishal Karki', '9812345678', 2, 'qr', '10:45 AM', 1000, 'waiting'],
      ['Sunita Lama', '9801234567', 0, 'walkin', '11:00 AM', 1200, 'waiting'],
      ['Maya Gurung', '9867890123', 1, 'phone', '11:15 AM', 800, 'booked'],
      ['Dawa Sherpa', '9849876543', 1, 'telemedicine', '11:30 AM', 800, 'booked'],
      ['Kamal Bhattarai', '9803456789', 0, 'walkin', '09:45 AM', 1200, 'completed'],
      ['Pooja Pandey', '9861122334', 2, 'phone', '09:30 AM', 0, 'cancelled'],
    ];
    const now = Date.now();
    for (let i = 0; i < appts.length; i++) {
      const [name, phone, di, source, time, fee, status] = appts[i];
      await pool.query(
        `INSERT INTO provider_appointments (provider_id,booking_ref,token_no,token,patient_name,patient_phone,doctor_id,source,slot_time,fee,status,queue_order,checked_in_at,started_at,completed_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
           CASE WHEN $11 IN ('waiting','in_consultation','completed') THEN now() END,
           CASE WHEN $11 IN ('in_consultation','completed') THEN now() - interval '9 minutes' END,
           CASE WHEN $11='completed' THEN now() - interval '1 minute' END)`,
        [pid, 'SAINO-DEMO-' + (9800 + i), i + 1, 'A-' + String(i + 1).padStart(3, '0'), name, phone, ids[di], source, time, fee, status, now + i]);
    }
  }
  console.log(`\nDone. Provider "${pr.name}" (id ${pid})\nLogin:  ${email}\nPassword: ${password}\n`);
  await pool.end();
})().catch(e => { console.error('Seed failed:', e.message); process.exit(1); });