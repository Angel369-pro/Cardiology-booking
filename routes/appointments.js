const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

// POST /appointments — booking logic, the heart of the app. Only logged-in patients can book.
router.post('/', requireAuth, requireRole('patient'), async (req, res) => {
  const patient_id = req.user.id; // trust the token, not the request body
  const { slot_id, reason } = req.body;

  if (!slot_id) {
    return res.status(400).json({ error: 'slot_id is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the slot row so two simultaneous bookings can't both succeed
    const slotResult = await client.query(
      'SELECT * FROM availability_slots WHERE id = $1 FOR UPDATE',
      [slot_id]
    );

    if (slotResult.rows.length === 0) {
      throw { status: 404, message: 'Slot not found' };
    }
    const slot = slotResult.rows[0];

    if (slot.is_booked) {
      throw { status: 409, message: 'This slot is already booked' };
    }

    await client.query(
      'UPDATE availability_slots SET is_booked = TRUE WHERE id = $1',
      [slot_id]
    );

    const appt = await client.query(
      `INSERT INTO appointments (patient_id, doctor_id, slot_id, reason)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [patient_id, slot.doctor_id, slot_id, reason]
    );

    await client.query('COMMIT');
    res.status(201).json(appt.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(err.status || 500).json({ error: err.message || 'Booking failed' });
  } finally {
    client.release();
  }
});

// GET /appointments/mine — a doctor's appointments for today
router.get('/mine', requireAuth, requireRole('doctor'), async (req, res) => {
  const result = await pool.query(
    `SELECT a.*, s.start_time, s.end_time
     FROM appointments a
     JOIN availability_slots s ON a.slot_id = s.id
     WHERE a.doctor_id = $1 AND s.start_time::date = CURRENT_DATE
     ORDER BY s.start_time`,
    [req.user.id]
  );
  res.json(result.rows);
});

// PATCH /appointments/:id — change status (cancel, complete, no-show). Doctor-only.
router.patch('/:id', requireAuth, requireRole('doctor'), async (req, res) => {
  const { status } = req.body;
  const valid = ['scheduled', 'completed', 'cancelled', 'no_show'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const result = await pool.query(
    'UPDATE appointments SET status = $1 WHERE id = $2 AND doctor_id = $3 RETURNING *',
    [status, req.params.id, req.user.id]
  );

  if (!result.rows.length) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  // If cancelling, free up the slot again so someone else can book it
  if (status === 'cancelled') {
    await pool.query(
      'UPDATE availability_slots SET is_booked = FALSE WHERE id = $1',
      [result.rows[0].slot_id]
    );
  }

  res.json(result.rows[0]);
});

module.exports = router;
