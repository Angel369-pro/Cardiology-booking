const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

// Doctor creates a new open slot
router.post('/', requireAuth, requireRole('doctor'), async (req, res) => {
  const { start_time, end_time } = req.body;
  const doctor_id = req.user.id; // from token, not request body

  if (!start_time || !end_time) {
    return res.status(400).json({ error: 'start_time and end_time are required' });
  }
  if (new Date(end_time) <= new Date(start_time)) {
    return res.status(400).json({ error: 'end_time must be after start_time' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO availability_slots (doctor_id, start_time, end_time)
       VALUES ($1, $2, $3) RETURNING *`,
      [doctor_id, start_time, end_time]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23514') { // violates the CHECK constraint from the schema
      return res.status(400).json({ error: 'Invalid time range' });
    }
    res.status(500).json({ error: 'Could not create slot' });
  }
});

// Doctor's own full schedule (booked + unbooked)
router.get('/mine', requireAuth, requireRole('doctor'), async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM availability_slots WHERE doctor_id = $1 ORDER BY start_time`,
    [req.user.id]
  );
  res.json(result.rows);
});

// Doctor deletes an unbooked slot
router.delete('/:id', requireAuth, requireRole('doctor'), async (req, res) => {
  const result = await pool.query(
    `DELETE FROM availability_slots WHERE id = $1 AND doctor_id = $2 AND is_booked = FALSE RETURNING *`,
    [req.params.id, req.user.id]
  );
  if (!result.rows.length) {
    return res.status(404).json({ error: 'Slot not found, already booked, or not yours' });
  }
  res.json({ message: 'Slot deleted' });
});

module.exports = router;
