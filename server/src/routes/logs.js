const express = require('express');
const { getDb } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection('users').doc(req.user.uid).collection('logs').orderBy('date', 'desc').get();
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json({ logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return res.status(500).json({ error: 'Failed to fetch attendance logs from database.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { id, subjectId, subjectName, lectureNumber, date, status, notes } = req.body;
    const db = getDb();
    const logId = id || `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const logData = {
      id: logId,
      subjectId,
      subjectName,
      lectureNumber,
      date: date || new Date().toISOString(),
      status: status || 'live',
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    await db.collection('users').doc(req.user.uid).collection('logs').doc(logId).set(logData);

    return res.status(201).json({ log: logData });
  } catch (error) {
    console.error('Error creating log:', error);
    return res.status(500).json({ error: 'Failed to save log to database.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.collection('users').doc(req.user.uid).collection('logs').doc(id).delete();
    return res.json({ success: true, message: 'Log deleted.' });
  } catch (error) {
    console.error('Error deleting log:', error);
    return res.status(500).json({ error: 'Failed to delete log.' });
  }
});

module.exports = router;
