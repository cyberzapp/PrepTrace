const express = require('express');
const { getDb } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection('users').doc(req.user.uid).collection('subjects').get();
    const subjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json({ subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return res.status(500).json({ error: 'Failed to fetch subjects from database.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { id, name, code, totalLectures, completedLectures, category, teacher, color, isActive } = req.body;
    const db = getDb();
    const subjectId = id || `subj_${Date.now()}`;

    const subjectData = {
      id: subjectId,
      name: name || 'Untitled Subject',
      code: code || 'CODE',
      totalLectures: totalLectures || 40,
      completedLectures: completedLectures || 0,
      category: category || 'Core Technical',
      teacher: teacher || '',
      color: color || '#3b82f6',
      isActive: isActive !== undefined ? isActive : true,
      updatedAt: new Date().toISOString(),
    };

    await db.collection('users').doc(req.user.uid).collection('subjects').doc(subjectId).set(subjectData, { merge: true });
    return res.status(201).json({ subject: subjectData });
  } catch (error) {
    console.error('Error saving subject:', error);
    return res.status(500).json({ error: 'Failed to save subject to database.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    delete updates.id;

    await db.collection('users').doc(req.user.uid).collection('subjects').doc(id).update(updates);
    return res.json({ success: true, id, updates });
  } catch (error) {
    console.error('Error updating subject:', error);
    return res.status(500).json({ error: 'Failed to update subject.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.collection('users').doc(req.user.uid).collection('subjects').doc(id).delete();
    return res.json({ success: true, message: 'Subject deleted successfully.' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return res.status(500).json({ error: 'Failed to delete subject.' });
  }
});

module.exports = router;
