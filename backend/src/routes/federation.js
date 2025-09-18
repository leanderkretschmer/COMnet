const express = require('express');
const { query } = require('../database/connection');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get federation actors
router.get('/actors', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, domain } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let queryParams = [];
    let paramCount = 0;

    if (domain) {
      paramCount++;
      whereClause += ` AND network_domain = $${paramCount}`;
      queryParams.push(domain);
    }

    const result = await query(
      `SELECT actor_id, username, display_name, bio, avatar_url, 
              network_domain, is_local, created_at, updated_at
       FROM federation_actors
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM federation_actors ${whereClause}`,
      queryParams
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      actors: result.rows,
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
    console.error('Fehler beim Abrufen der Föderations-Aktoren:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Get federated posts
router.get('/posts', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, actor_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let queryParams = [];
    let paramCount = 0;

    if (actor_id) {
      paramCount++;
      whereClause += ` AND remote_actor_id = $${paramCount}`;
      queryParams.push(actor_id);
    }

    const result = await query(
      `SELECT fp.id, fp.local_post_id, fp.remote_actor_id, fp.remote_post_id, 
              fp.content, fp.created_at,
              fa.username as actor_username, fa.display_name as actor_display_name,
              fa.avatar_url as actor_avatar_url, fa.network_domain
       FROM federation_posts fp
       JOIN federation_actors fa ON fp.remote_actor_id = fa.actor_id
       ${whereClause}
       ORDER BY fp.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM federation_posts fp ${whereClause}`,
      queryParams
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      posts: result.rows,
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
    console.error('Fehler beim Abrufen der föderierten Posts:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// ActivityPub endpoints (basic implementation)
router.get('/.well-known/nodeinfo', (req, res) => {
  res.json({
    links: [
      {
        rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
        href: `${req.protocol}://${req.get('host')}/api/federation/nodeinfo/2.0`
      }
    ]
  });
});

router.get('/nodeinfo/2.0', (req, res) => {
  res.json({
    version: '2.0',
    software: {
      name: 'comnet',
      version: '1.0.0'
    },
    protocols: ['activitypub'],
    services: {
      inbound: [],
      outbound: []
    },
    openRegistrations: true,
    usage: {
      users: {
        total: 0,
        activeMonth: 0,
        activeHalfyear: 0
      },
      localPosts: 0,
      localComments: 0
    },
    metadata: {
      nodeName: 'COMNet',
      nodeDescription: 'Dezentrale Social-Media-Plattform'
    }
  });
});

module.exports = router;
