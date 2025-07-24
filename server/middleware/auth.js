import jwt from 'jsonwebtoken';
import { userDb } from '../database/db.js';
import { securityConfig } from '../config/security.js';

// Get JWT configuration from security config
const { jwt: jwtConfig } = securityConfig;

// Optional API key middleware
const validateApiKey = (req, res, next) => {
  const { apiKey: apiKeyConfig } = securityConfig;
  
  // Skip API key validation if not configured
  if (!apiKeyConfig.enabled) {
    return next();
  }
  
  const apiKey = req.headers[apiKeyConfig.headerName.toLowerCase()];
  if (apiKey !== apiKeyConfig.key) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

// JWT authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm]
    });
    
    // Verify user still exists and is active
    const user = userDb.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username 
    },
    jwtConfig.secret,
    {
      expiresIn: jwtConfig.expiresIn,
      algorithm: jwtConfig.algorithm
    }
  );
};

// WebSocket authentication function
const authenticateWebSocket = (token) => {
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm]
    });
    return decoded;
  } catch (error) {
    console.error('WebSocket token verification error:', error);
    return null;
  }
};

export {
  validateApiKey,
  authenticateToken,
  generateToken,
  authenticateWebSocket
};