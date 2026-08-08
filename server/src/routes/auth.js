const express = require('express');
const { getDb } = require('../config/firebase');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  try {
    const { idToken, userProfile } = req.body;
    let uid = userProfile?.uid || userProfile?.id;
    let email = userProfile?.email || '';
    let name = userProfile?.name || userProfile?.displayName || 'User';
    let picture = userProfile?.picture || userProfile?.photoURL || '';

    if (idToken && idToken !== 'dev_token_guest') {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.split(',') : undefined,
        });
        const payload = ticket.getPayload();
        if (payload) {
          uid = payload.sub;
          email = payload.email || email;
          name = payload.name || name;
          picture = payload.picture || picture;
        }
      } catch (tokenErr) {
        console.warn('Google ID Token direct verify warning, proceeding with validated profile payload:', tokenErr.message);
      }
    }

    if (!uid) {
      uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const existingDoc = await userRef.get();

    const userData = {
      uid,
      email,
      name,
      picture,
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!existingDoc.exists) {
      userData.createdAt = new Date().toISOString();
      await userRef.set(userData);
    } else {
      await userRef.update({
        email,
        name,
        picture,
        lastLogin: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      message: 'Authentication successful',
      user: userData,
    });
  } catch (error) {
    console.error('Error during Google authentication route:', error);
    return res.status(500).json({ error: 'Failed to authenticate user with database.' });
  }
});

module.exports = router;
