require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const authRouter = require('./routes/auth');
const doctorsRouter = require('./routes/doctors');
const patientsRouter = require('./routes/patients');
const appointmentsRouter = require('./routes/appointments');
const availabilityRouter = require('./routes/availability');

app.use('/auth', authRouter);
app.use('/doctors', doctorsRouter);
app.use('/patients', patientsRouter);
app.use('/appointments', appointmentsRouter);
app.use('/availability', availabilityRouter);

// Basic error handler — catches anything that slips past route-level try/catch
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
