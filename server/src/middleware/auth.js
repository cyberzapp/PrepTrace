const { OAuth2Client } = require('google-auth-library');
const { admin } = require('../config/firebase');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized. No authorization token provided.' });
    }

    const token = authHeader.split('Bearer ')[1];

    if (process.env.NODE_ENV === 'development' && token === 'dev_token_guest') {
      req.user = {
        uid: 'dev_user_123',
        email: 'developer@example.com',
        name: 'Demo Student',
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      };
      return next();
    }

    try {
      const decodedFirebaseToken = await admin.auth().verifyIdToken(token);
      req.user = {
        uid: decodedFirebaseToken.uid,
        email: decodedFirebaseToken.email || '',
        name: decodedFirebaseToken.name || decodedFirebaseToken.email || 'User',
        picture: decodedFirebaseToken.picture || '',
      };
      return next();
    } catch (firebaseErr) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.split(',') : undefined,
        });
        const payload = ticket.getPayload();
        if (payload) {
          req.user = {
            uid: payload.sub,
            email: payload.email || '',
            name: payload.name || payload.email || 'User',
            picture: payload.picture || '',
          };
          return next();
        }
      } catch (googleErr) {
        const errorType = googleErr.message.split(',')[0];
        console.warn(`Token verification failed: ${errorType}`);
      }
    }

    return res.status(401).json({ error: 'Invalid or expired authorization token.' });
  } catch (error) {
    console.error('Authentication Error:', error);
    return res.status(401).json({ error: 'Authentication failed.' });
  }
};

module.exports = {
  verifyToken,
};
