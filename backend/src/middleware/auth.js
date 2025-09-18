const jwt = require('jsonwebtoken');
const { cache } = require('../cache/redis');
const { query } = require('../database/connection');

// Middleware to authenticate JWT tokens
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Zugriff verweigert - Kein Token bereitgestellt' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if session exists in cache
    const session = await cache.get(`session:${decoded.userId}`);
    if (!session) {
      return res.status(401).json({ error: 'Ungültige Sitzung' });
    }

    // Get user details from database
    const result = await query(
      `SELECT u.id, u.username, u.email, u.display_name, u.avatar_url, u.is_active, u.network_id, n.name as network_name
       FROM users u 
       JOIN networks n ON u.network_id = n.id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Benutzer nicht gefunden' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Benutzerkonto ist deaktiviert' });
    }

    // Add user info to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      network_id: user.network_id,
      network_name: user.network_name
    };

    next();
  } catch (error) {
    console.error('Authentifizierungsfehler:', error);
    return res.status(403).json({ error: 'Ungültiger Token' });
  }
};

// Middleware to optionally authenticate (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const session = await cache.get(`session:${decoded.userId}`);
    
    if (!session) {
      req.user = null;
      return next();
    }

    const result = await query(
      `SELECT u.id, u.username, u.email, u.display_name, u.avatar_url, u.is_active, u.network_id, n.name as network_name
       FROM users u 
       JOIN networks n ON u.network_id = n.id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (result.rows.length > 0 && result.rows[0].is_active) {
      req.user = {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        display_name: result.rows[0].display_name,
        avatar_url: result.rows[0].avatar_url,
        network_id: result.rows[0].network_id,
        network_name: result.rows[0].network_name
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    req.user = null;
    next();
  }
};

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentifizierung erforderlich' });
    }

    const result = await query(
      'SELECT admin_user_id FROM networks WHERE id = $1',
      [req.user.network_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Netzwerk nicht gefunden' });
    }

    const network = result.rows[0];
    if (network.admin_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Administratorrechte erforderlich' });
    }

    next();
  } catch (error) {
    console.error('Admin-Check-Fehler:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Middleware to check community permissions
const checkCommunityPermission = (requiredRole = 'member') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentifizierung erforderlich' });
      }

      const communityId = req.params.communityId || req.body.community_id;
      if (!communityId) {
        return res.status(400).json({ error: 'Community-ID erforderlich' });
      }

      const result = await query(
        `SELECT role FROM community_members 
         WHERE user_id = $1 AND community_id = $2`,
        [req.user.id, communityId]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Keine Berechtigung für diese Community' });
      }

      const userRole = result.rows[0].role;
      const roleHierarchy = { member: 1, moderator: 2, admin: 3 };
      
      if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
        return res.status(403).json({ error: `Mindestens ${requiredRole}-Rolle erforderlich` });
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      console.error('Community-Berechtigungsfehler:', error);
      res.status(500).json({ error: 'Interner Serverfehler' });
    }
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  checkCommunityPermission
};
