const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

router.get('/:id', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT id, full_name, email, phone, date_of_birth FROM patients WHERE id = $1',
    [req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

module.exports = router;
