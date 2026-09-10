const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 10;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function generateToken(payload) {
  // payload = { id, role: 'patient' | 'doctor' }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
}

module.exports = { hashPassword, comparePassword, generateToken };
