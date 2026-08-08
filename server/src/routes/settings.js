const express = require('express');
const { getDb } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const docRef = db.collection('users').doc(req.user.uid).collection('settings').doc('config');
    const doc = await docRef.get();

    if (!doc.exists) {
      const defaultSettings = {
        branch: 'CS',
        dailyTargetLectures: 4,
        streakCount: 0,
        lastLoggedDate: null,
        targetExamDate: '2027-02-06',
        onboardingCompleted: false,
      };
      await docRef.set(defaultSettings);
      return res.json({ settings: defaultSettings });
    }

    return res.json({ settings: doc.data() });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

router.put('/', async (req, res) => {
  try {
    const db = getDb();
    const docRef = db.collection('users').doc(req.user.uid).collection('settings').doc('config');
    const updates = { ...req.body, updatedAt: new Date().toISOString() };

    await docRef.set(updates, { merge: true });
    const updatedDoc = await docRef.get();

    return res.json({ settings: updatedDoc.data() });
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ error: 'Failed to update settings.' });
  }
});

module.exports = router;
