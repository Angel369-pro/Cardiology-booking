const express = require('express');
const router = express.Router();
const pool = require('../db');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');

router.post('/register/patient', async (req, res) => {
  const { full_name, email, password, phone, date_of_birth } = req.body;
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'full_name, email, and password are required' });
  }

  try {
    const password_hash = await hashPassword(password);
    const result = await pool.query(
      `INSERT INTO patients (full_name, email, password_hash, phone, date_of_birth)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email`,
      [full_name, email, password_hash, phone, date_of_birth]
    );
    const token = generateToken({ id: result.rows[0].id, role: 'patient' });
    res.status(201).json({ user: result.rows[0], token });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/register/doctor', async (req, res) => {
  const { full_name, email, password, specialty } = req.body;
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'full_name, email, and password are required' });
  }

  try {
    const password_hash = await hashPassword(password);
    const result = await pool.query(
      `INSERT INTO doctors (full_name, email, password_hash, specialty)
       VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, specialty`,
      [full_name, email, password_hash, specialty || 'Cardiology']
    );
    const token = generateToken({ id: result.rows[0].id, role: 'doctor' });
    res.status(201).json({ user: result.rows[0], token });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

module.exports = router;