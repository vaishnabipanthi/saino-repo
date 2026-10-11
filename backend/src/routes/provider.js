const express = require('express');
const crypto = require('crypto');
const pool = require('../config/db');
const router = express.Router();

const TODAY = "(now() AT TIME ZONE 'Asia/Kathmandu')::date";

// 3 Subscription Plans & Limitations
const PLAN_LIMITS = {
  clinic: { name: 'Clinic Plan', fee: 3999, doctor_limit: 3, service_limit: 3, staff_limit: 3 },
  hospital: { name: 'Hospital Plan', fee: 5999, doctor_limit: 5, service_limit: 5, staff_limit: 8 },
  big_hospital: { name: 'Big Hospital Plan', fee: 9999, doctor_limit: 15, service_limit: 15, staff_limit: 25 }
};

// Auto Table Init: Payments table
let tablesInitialized = false;
async function ensureExtraTables() {
  if (tablesInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS provider_payments (
        id SERIAL PRIMARY KEY,
        provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        receipt_no TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        uhid TEXT,
        service_name TEXT NOT NULL,
        doctor_name TEXT,
        amount INT NOT NULL,
        payment_method TEXT NOT NULL,
        account_mask TEXT,
        status TEXT NOT NULL DEFAULT 'Settled',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    tablesInitialized = true;
  } catch (e) {
    console.error("Extra tables init error:", e.message);
  }
}

// Helper: Calculate Real Queue State
async function getQueueState(pid, doctorId) {
  const params = [pid];
  let doctorFilter = '';
  if (doctorId) {
    params.push(doctorId);
    doctorFilter = ' AND a.doctor_id = $2';
  }

  const baseQuery = `
    FROM provider_appointments a 
    LEFT JOIN provider_doctors d ON d.id = a.doctor_id
    WHERE a.provider_id = $1 AND a.slot_date = ${TODAY}${doctorFilter}
  `;

  const cols = `a.id, a.token, a.patient_name, a.patient_phone, a.source, a.slot_time, a.status, a.queue_order, d.name AS doctor, d.room`;

  const serving = (await pool.query(`SELECT ${cols} ${baseQuery} AND a.status = 'in_consultation' ORDER BY a.started_at LIMIT 1`, params)).rows[0] || null;
  const waiting = (await pool.query(`SELECT ${cols} ${baseQuery} AND a.status = 'waiting' ORDER BY a.queue_order, a.id`, params)).rows;
  const statsRow = (await pool.query(`SELECT count(*) FILTER (WHERE a.status = 'completed')::int AS completed, count(*)::int AS issued ${baseQuery}`, params)).rows[0];

  return {
    serving: serving ? { ...serving, wait_in_hall: waiting.length, est_wait: 12 } : null,
    waiting: waiting.map(w => ({ ...w, wait: '8m' })),
    stats: {
      waiting: waiting.length,
      completed: statsRow.completed || 0,
      issued: statsRow.issued || 0,
      avg_consult: 14
    }
  };
}

// 1. DASHBOARD & PROVIDER INFO
router.get('/dashboard', async (req, res) => {
  try {
    await ensureExtraTables();
    const pid = 'norvic-01';

    const providerRes = await pool.query('SELECT * FROM providers WHERE id = $1', [pid]);
    const provider = providerRes.rows[0] || { id: pid, name: 'Norvic International Hospital', tier: 'VIP Tier', city: 'Kathmandu, Nepal' };

    const planKey = (provider.tier && provider.tier.toLowerCase().includes('clinic')) ? 'clinic' : (provider.tier && provider.tier.toLowerCase().includes('big')) ? 'big_hospital' : 'hospital';
    const planInfo = PLAN_LIMITS[planKey];

    const docCount = (await pool.query("SELECT count(*)::int AS n FROM provider_doctors WHERE provider_id = $1 AND status != 'deleted'", [pid])).rows[0].n;
    const srvCount = (await pool.query("SELECT count(*)::int AS n FROM provider_services WHERE provider_id = $1 AND status != 'deleted'", [pid])).rows[0].n;

    const counts = (await pool.query(`
      SELECT count(*)::int AS total,
             count(*) FILTER (WHERE source = 'marketplace')::int AS marketplace,
             count(*) FILTER (WHERE source = 'walkin')::int AS walkin,
             count(*) FILTER (WHERE source = 'qr')::int AS qr,
             count(*) FILTER (WHERE source = 'telemedicine')::int AS telemedicine,
             count(*) FILTER (WHERE status = 'waiting')::int AS waiting
      FROM provider_appointments WHERE provider_id = $1 AND slot_date = ${TODAY}
    `, [pid])).rows[0];

    const staffRes = await pool.query('SELECT name, role FROM provider_staff WHERE provider_id = $1 LIMIT 1', [pid]);
    const staff = staffRes.rows[0] || { name: 'Dr. Aayush Shrestha', role: 'Provider Admin' };

    const queue = await getQueueState(pid);

    res.json({
      success: true,
      provider: {
        ...provider,
        plan: planKey,
        plan_name: planInfo.name,
        plan_fee: planInfo.fee,
        doctor_limit: planInfo.doctor_limit,
        service_limit: planInfo.service_limit,
        doctors_used: docCount,
        services_used: srvCount
      },
      user: staff,
      stats: {
        total: counts.total || 0,
        marketplace: counts.marketplace || 0,
        walkin: counts.walkin || 0,
        qr: counts.qr || 0,
        telemedicine: counts.telemedicine || 0,
        waiting: counts.waiting || 0
      },
      queue
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update Profile & Settings in Database
router.put('/settings', async (req, res) => {
  try {
    const pid = 'norvic-01';
    const { name, city, tier, admin_name } = req.body || {};

    if (name || city || tier) {
      await pool.query(
        'UPDATE providers SET name = COALESCE($1, name), city = COALESCE($2, city), tier = COALESCE($3, tier) WHERE id = $4',
        [name, city, tier, pid]
      );
    }

    if (admin_name) {
      await pool.query(
        'UPDATE provider_staff SET name = $1 WHERE provider_id = $2',
        [admin_name, pid]
      );
    }

    res.json({ success: true, message: 'Settings updated successfully in database!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. APPOINTMENTS & MANUAL TOKEN ISSUANCE (With Rush Concurrency Lock)
router.get('/appointments', async (req, res) => {
  try {
    const pid = 'norvic-01';
    const rows = (await pool.query(`
      SELECT a.*, d.name AS doctor, d.department, d.room 
      FROM provider_appointments a
      LEFT JOIN provider_doctors d ON d.id = a.doctor_id
      WHERE a.provider_id = $1 AND a.slot_date = ${TODAY}
      ORDER BY a.token_no DESC
    `, [pid])).rows;
    res.json({ success: true, rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/appointments', async (req, res) => {
  const pid = 'norvic-01';
  const b = req.body || {};
  if (!b.patient_name || !String(b.patient_name).trim()) {
    return res.status(400).json({ success: false, message: 'Patient name is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [pid]);

    const maxTokenRes = await client.query(
      `SELECT COALESCE(MAX(token_no), 0) + 1 AS next_no FROM provider_appointments WHERE provider_id = $1 AND slot_date = ${TODAY}`,
      [pid]
    );
    const nextNo = maxTokenRes.rows[0].next_no;
    const token = 'A-' + String(nextNo).padStart(3, '0');
    const bookingRef = 'SAINO-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000) + '-' + nextNo;
    const source = b.source || 'walkin';

    const insertRes = await client.query(`
      INSERT INTO provider_appointments (
        provider_id, booking_ref, token_no, token, patient_name, patient_phone,
        doctor_id, source, fee, reason, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'waiting')
      RETURNING *
    `, [
      pid, bookingRef, nextNo, token, String(b.patient_name).trim(), b.patient_phone || null,
      b.doctor_id ? parseInt(b.doctor_id, 10) : null, source, parseInt(b.fee, 10) || 800, b.reason || null
    ]);

    await client.query('COMMIT');
    res.json({ success: true, appointment: insertRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// 3. QUEUE ACTIONS (Call Next, Skip, Done)
router.post('/queue/:action', async (req, res) => {
  const { action } = req.params;
  const pid = 'norvic-01';
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [pid]);
    const dayFilter = `provider_id = $1 AND slot_date = ${TODAY}`;

    if (action === 'skip') {
      await client.query(`UPDATE provider_appointments SET status = 'waiting', queue_order = (extract(epoch from clock_timestamp())*1000)::bigint WHERE ${dayFilter} AND status = 'in_consultation'`, [pid]);
    } else {
      await client.query(`UPDATE provider_appointments SET status = 'completed', completed_at = now() WHERE ${dayFilter} AND status = 'in_consultation'`, [pid]);
    }

    if (action === 'call-next') {
      const nextP = (await client.query(`SELECT id FROM provider_appointments WHERE ${dayFilter} AND status = 'waiting' ORDER BY queue_order, id LIMIT 1 FOR UPDATE SKIP LOCKED`, [pid])).rows[0];
      if (nextP) await client.query(`UPDATE provider_appointments SET status = 'in_consultation', started_at = now() WHERE id = $1`, [nextP.id]);
    }

    await client.query('COMMIT');
    res.json({ success: true, ...(await getQueueState(pid)) });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// 4. DOCTORS (With Plan Limit Guard)
router.get('/doctors', async (req, res) => {
  try {
    const pid = 'norvic-01';
    const rows = (await pool.query("SELECT * FROM provider_doctors WHERE provider_id = $1 AND status != 'deleted' ORDER BY id ASC", [pid])).rows;
    res.json({ success: true, rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/doctors', async (req, res) => {
  try {
    const pid = 'norvic-01';
    const currentDocs = (await pool.query("SELECT count(*)::int AS n FROM provider_doctors WHERE provider_id = $1 AND status != 'deleted'", [pid])).rows[0].n;

    const providerRes = await pool.query('SELECT tier FROM providers WHERE id = $1', [pid]);
    const tier = (providerRes.rows[0]?.tier || '').toLowerCase();
    const planKey = tier.includes('clinic') ? 'clinic' : tier.includes('big') ? 'big_hospital' : 'hospital';
    const maxLimit = PLAN_LIMITS[planKey].doctor_limit;

    if (currentDocs >= maxLimit) {
      return res.status(403).json({
        success: false,
        message: `Plan limit reached! Your plan allows maximum ${maxLimit} doctors. Please upgrade to Big Hospital plan to add more.`
      });
    }

    const b = req.body || {};
    if (!b.name) return res.status(400).json({ success: false, message: 'Doctor name is required' });

    const result = await pool.query(`
      INSERT INTO provider_doctors (provider_id, name, nmc_no, department, room, opd_fee, duty_days, shift_start, shift_end)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `, [pid, b.name, b.nmc_no || 'NMC-Reg', b.department || 'General OPD', b.room || 'Room 101', parseInt(b.opd_fee, 10) || 800, b.duty_days || 'Mon-Fri', b.shift_start || '09:00', b.shift_end || '14:00']);

    res.json({ success: true, doctor: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. SERVICES (With Plan Limit Guard)
router.get('/services', async (req, res) => {
  try {
    const pid = 'norvic-01';
    const rows = (await pool.query("SELECT * FROM provider_services WHERE provider_id = $1 AND status != 'deleted' ORDER BY id ASC", [pid])).rows;
    res.json({ success: true, rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/services', async (req, res) => {
  try {
    const pid = 'norvic-01';
    const currentSrv = (await pool.query("SELECT count(*)::int AS n FROM provider_services WHERE provider_id = $1 AND status != 'deleted'", [pid])).rows[0].n;

    const providerRes = await pool.query('SELECT tier FROM providers WHERE id = $1', [pid]);
    const tier = (providerRes.rows[0]?.tier || '').toLowerCase();
    const planKey = tier.includes('clinic') ? 'clinic' : tier.includes('big') ? 'big_hospital' : 'hospital';
    const maxLimit = PLAN_LIMITS[planKey].service_limit;

    if (currentSrv >= maxLimit) {
      return res.status(403).json({
        success: false,
        message: `Plan limit reached! Your plan allows maximum ${maxLimit} services. Please upgrade your plan.`
      });
    }

    const b = req.body || {};
    if (!b.name) return res.status(400).json({ success: false, message: 'Service name is required' });

    const result = await pool.query(`
      INSERT INTO provider_services (provider_id, name, code, category, department, price, duration_min)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [pid, b.name, b.code || 'SVC-001', b.category || 'Consultations', b.department || 'General OPD', parseInt(b.price, 10) || 800, parseInt(b.duration_min, 10) || 15]);

    res.json({ success: true, service: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. STAFF MANAGEMENT (Real DB)
router.get('/staff', async (req, res) => {
  try {
    const pid = 'norvic-01';
    const rows = (await pool.query("SELECT id, name, email, role, status, created_at FROM provider_staff WHERE provider_id = $1 ORDER BY id ASC", [pid])).rows;
    res.json({ success: true, rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/staff', async (req, res) => {
  try {
    const pid = 'norvic-01';
    const b = req.body || {};
    if (!b.name || !b.email) return res.status(400).json({ success: false, message: 'Staff name and email are required' });

    const dummyHash = 'salt:' + crypto.randomBytes(32).toString('hex');
    const result = await pool.query(`
      INSERT INTO provider_staff (provider_id, name, email, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, role, status
    `, [pid, b.name, b.email.toLowerCase().trim(), dummyHash, b.role || 'Receptionist']);

    res.json({ success: true, staff: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. PAYMENTS LEDGER (Real DB)
router.get('/payments', async (req, res) => {
  try {
    await ensureExtraTables();
    const pid = 'norvic-01';
    const rows = (await pool.query("SELECT * FROM provider_payments WHERE provider_id = $1 ORDER BY id DESC LIMIT 50", [pid])).rows;
    const totals = (await pool.query(`
      SELECT COALESCE(SUM(amount), 0)::int AS total,
             COALESCE(SUM(amount) FILTER (WHERE payment_method ILIKE '%cash%'), 0)::int AS cash,
             COALESCE(SUM(amount) FILTER (WHERE payment_method NOT ILIKE '%cash%'), 0)::int AS digital
      FROM provider_payments WHERE provider_id = $1
    `, [pid])).rows[0];

    res.json({ success: true, rows, totals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/payments', async (req, res) => {
  try {
    await ensureExtraTables();
    const pid = 'norvic-01';
    const b = req.body || {};
    const receiptNo = 'TXN-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    const result = await pool.query(`
      INSERT INTO provider_payments (
        provider_id, receipt_no, patient_name, uhid, service_name, doctor_name,
        amount, payment_method, account_mask
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      pid, receiptNo, b.patient_name || 'Patient', b.uhid || 'NOR-OPD',
      b.service_name || 'OPD Consultation', b.doctor_name || 'Dr. Rekha Shrestha',
      parseInt(b.amount, 10) || 850, b.payment_method || 'Fonepay QR', b.account_mask || '****@upi'
    ]);

    res.json({ success: true, payment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. REAL CSV EXPORT (Direct Browser Download)
router.get('/reports/export-csv', async (req, res) => {
  try {
    const pid = 'norvic-01';
    const rows = (await pool.query(`
      SELECT a.token, a.booking_ref, a.patient_name, a.patient_phone, d.name AS doctor, a.source, a.slot_date, a.fee, a.status
      FROM provider_appointments a
      LEFT JOIN provider_doctors d ON d.id = a.doctor_id
      WHERE a.provider_id = $1
      ORDER BY a.id DESC
    `, [pid])).rows;

    let csv = "Token,Booking Reference,Patient Name,Phone,Doctor,Source,Date,Fee (NPR),Status\n";
    rows.forEach(r => {
      csv += `"${r.token}","${r.booking_ref}","${r.patient_name}","${r.patient_phone || ''}","${r.doctor || ''}","${r.source}","${r.slot_date}","${r.fee}","${r.status}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="saino_appointments_report.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).send("Error exporting CSV: " + err.message);
  }
});

module.exports = router;