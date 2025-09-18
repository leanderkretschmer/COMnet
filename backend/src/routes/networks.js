const express = require('express');
const { query } = require('../database/connection');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all networks
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE is_public = true';
    let queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (display_name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    const result = await query(
      `SELECT n.id, n.name, n.display_name, n.description, n.domain, 
              n.is_public, n.is_federated, n.created_at,
              u.username as admin_username, u.display_name as admin_display_name,
              COUNT(DISTINCT u2.id) as user_count,
              COUNT(DISTINCT c.id) as community_count
       FROM networks n
       LEFT JOIN users u ON n.admin_user_id = u.id
       LEFT JOIN users u2 ON n.id = u2.network_id
       LEFT JOIN communities c ON n.id = c.network_id
       ${whereClause}
       GROUP BY n.id, u.username, u.display_name
       ORDER BY n.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM networks ${whereClause}`,
      queryParams
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      networks: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Netzwerke:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Get single network
router.get('/:networkId', optionalAuth, async (req, res) => {
  try {
    const { networkId } = req.params;

    const result = await query(
      `SELECT n.id, n.name, n.display_name, n.description, n.domain, 
              n.is_public, n.is_federated, n.created_at,
              u.username as admin_username, u.display_name as admin_display_name,
              COUNT(DISTINCT u2.id) as user_count,
              COUNT(DISTINCT c.id) as community_count
       FROM networks n
       LEFT JOIN users u ON n.admin_user_id = u.id
       LEFT JOIN users u2 ON n.id = u2.network_id
       LEFT JOIN communities c ON n.id = c.network_id
       WHERE n.id = $1
       GROUP BY n.id, u.username, u.display_name`,
      [networkId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Netzwerk nicht gefunden' });
    }

    const network = result.rows[0];

    // Get recent communities
    const communitiesResult = await query(
      `SELECT c.id, c.name, c.display_name, c.description, c.icon_url, c.created_at
       FROM communities c
       WHERE c.network_id = $1 AND c.is_public = true
       ORDER BY c.created_at DESC
       LIMIT 10`,
      [networkId]
    );

    res.json({
      ...network,
      recent_communities: communitiesResult.rows
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Netzwerks:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

module.exports = router;
