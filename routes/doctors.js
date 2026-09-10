const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all doctors
router.get('/', async (req, res) => {
  const result = await pool.query('SELECT id, full_name, specialty FROM doctors');
  res.json(result.rows);
});

// GET a doctor's open (unbooked) slots — this is what the patient sees when booking
router.get('/:id/availability', async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    `SELECT id, start_time, end_time
     FROM availability_slots
     WHERE doctor_id = $1 AND is_booked = FALSE AND start_time > NOW()
     ORDER BY start_time`,
    [id]
  );
  res.json(result.rows);
});

module.exports = router;
