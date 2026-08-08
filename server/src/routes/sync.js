const express = require('express');
const { getDb } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.post('/', async (req, res) => {
  try {
    const { subjects, logs, focusLogs, settings, reset } = req.body;
    const db = getDb();
    const userUid = req.user.uid;
    const userRef = db.collection('users').doc(userUid);

    const batch = db.batch();

    // If reset flag is true, forcefully delete all existing user data
    if (reset) {
      const subSnap = await userRef.collection('subjects').get();
      subSnap.forEach(doc => batch.delete(doc.ref));

      const logSnap = await userRef.collection('logs').get();
      logSnap.forEach(doc => batch.delete(doc.ref));

      const focusSnap = await userRef.collection('focus_logs').get();
      focusSnap.forEach(doc => batch.delete(doc.ref));

      batch.delete(userRef.collection('settings').doc('config'));

      await batch.commit();

      return res.json({
        message: 'All data reset successfully on cloud.',
        subjects: [],
        logs: [],
        focusLogs: [],
        settings: {},
        syncedAt: new Date().toISOString(),
      });
    }

    if (Array.isArray(subjects) && subjects.length > 0) {
      subjects.forEach((sub) => {
        const subId = sub.id || `subj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const subRef = userRef.collection('subjects').doc(subId);
        batch.set(subRef, { ...sub, id: subId, updatedAt: new Date().toISOString() }, { merge: true });
      });
    }

    if (Array.isArray(logs) && logs.length > 0) {
      logs.forEach((log) => {
        const logId = log.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const logRef = userRef.collection('logs').doc(logId);
        batch.set(logRef, { ...log, id: logId, createdAt: log.date || new Date().toISOString() }, { merge: true });
      });
    }

    if (Array.isArray(focusLogs) && focusLogs.length > 0) {
      focusLogs.forEach((flog) => {
        const flogId = flog.id || `flog_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const flogRef = userRef.collection('focus_logs').doc(flogId);
        batch.set(flogRef, { ...flog, id: flogId, createdAt: flog.date || new Date().toISOString() }, { merge: true });
      });
    }

    if (settings && Object.keys(settings).length > 0) {
      const settingsRef = userRef.collection('settings').doc('config');
      batch.set(settingsRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
    }

    await batch.commit();

    const [subSnap, logSnap, focusLogSnap, settingsSnap] = await Promise.all([
      userRef.collection('subjects').get(),
      userRef.collection('logs').orderBy('date', 'desc').get(),
      userRef.collection('focus_logs').orderBy('date', 'desc').get(),
      userRef.collection('settings').doc('config').get(),
    ]);

    const refreshedSubjects = subSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const refreshedLogs = logSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const refreshedFocusLogs = focusLogSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const refreshedSettings = settingsSnap.exists ? settingsSnap.data() : (settings || {});

    return res.json({
      message: 'Sync completed successfully.',
      subjects: refreshedSubjects,
      logs: refreshedLogs,
      focusLogs: refreshedFocusLogs,
      settings: refreshedSettings,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error during data sync:', error);
    return res.status(500).json({ error: 'Data synchronization failed.' });
  }
});

module.exports = router;
