const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { query } = require('../database/connection');
const { cache } = require('../cache/redis');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  display_name: Joi.string().min(1).max(100).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { username, email, password, display_name } = value;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE (username = $1 OR email = $2) AND network_id = $3',
      [username, email, req.networkId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Benutzername oder E-Mail bereits vergeben' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await query(
      `INSERT INTO users (username, email, password_hash, display_name, network_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, email, display_name, created_at`,
      [username, email, passwordHash, display_name || username, req.networkId]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, networkId: req.networkId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Cache user session
    await cache.set(`session:${user.id}`, {
      userId: user.id,
      username: user.username,
      networkId: req.networkId
    }, 7 * 24 * 60 * 60); // 7 days

    res.status(201).json({
      message: 'Benutzer erfolgreich registriert',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        created_at: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Registrierungsfehler:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    // Find user
    const result = await query(
      `SELECT u.id, u.username, u.email, u.password_hash, u.display_name, u.is_active, n.name as network_name
       FROM users u 
       JOIN networks n ON u.network_id = n.id
       WHERE u.email = $1 AND u.network_id = $2`,
      [email, req.networkId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Benutzerkonto ist deaktiviert' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, networkId: req.networkId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Cache user session
    await cache.set(`session:${user.id}`, {
      userId: user.id,
      username: user.username,
      networkId: req.networkId
    }, 7 * 24 * 60 * 60); // 7 days

    res.json({
      message: 'Erfolgreich angemeldet',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        network_name: user.network_name
      },
      token
    });
  } catch (error) {
    console.error('Anmeldefehler:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Kein Token bereitgestellt' });
    }

    // Decode token to get user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Remove from cache
    await cache.del(`session:${decoded.userId}`);

    res.json({ message: 'Erfolgreich abgemeldet' });
  } catch (error) {
    console.error('Abmeldefehler:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Kein Token bereitgestellt' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if session exists in cache
    const session = await cache.get(`session:${decoded.userId}`);
    if (!session) {
      return res.status(401).json({ error: 'Ungültige Sitzung' });
    }

    // Get user details
    const result = await query(
      `SELECT u.id, u.username, u.email, u.display_name, u.avatar_url, u.is_verified, n.name as network_name
       FROM users u 
       JOIN networks n ON u.network_id = n.id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Benutzer nicht gefunden' });
    }

    const user = result.rows[0];

    res.json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        is_verified: user.is_verified,
        network_name: user.network_name
      }
    });
  } catch (error) {
    console.error('Token-Verifikationsfehler:', error);
    res.status(401).json({ error: 'Ungültiger Token' });
  }
});

module.exports = router;
