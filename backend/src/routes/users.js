const express = require('express');
const Joi = require('joi');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  display_name: Joi.string().min(1).max(100).optional(),
  bio: Joi.string().max(500).optional(),
  avatar_url: Joi.string().uri().optional()
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.username, u.email, u.display_name, u.bio, u.avatar_url, 
              u.is_verified, u.created_at, n.name as network_name
       FROM users u
       JOIN networks n ON u.network_id = n.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const user = result.rows[0];

    // Get user's communities
    const communitiesResult = await query(
      `SELECT c.id, c.name, c.display_name, c.icon_url, cm.role, cm.joined_at
       FROM community_members cm
       JOIN communities c ON cm.community_id = c.id
       WHERE cm.user_id = $1
       ORDER BY cm.joined_at DESC`,
      [req.user.id]
    );

    // Get user's posts count
    const postsResult = await query(
      'SELECT COUNT(*) as post_count FROM posts WHERE author_id = $1',
      [req.user.id]
    );

    // Get user's comments count
    const commentsResult = await query(
      'SELECT COUNT(*) as comment_count FROM comments WHERE author_id = $1',
      [req.user.id]
    );

    res.json({
      user: {
        ...user,
        communities: communitiesResult.rows,
        post_count: parseInt(postsResult.rows[0].post_count),
        comment_count: parseInt(commentsResult.rows[0].comment_count)
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Profils:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(value[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Keine Felder zum Aktualisieren bereitgestellt' });
    }

    updateValues.push(req.user.id);

    const result = await query(
      `UPDATE users 
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount + 1}
       RETURNING id, username, email, display_name, bio, avatar_url, updated_at`,
      updateValues
    );

    res.json({
      message: 'Profil erfolgreich aktualisiert',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Profils:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Get user by username
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const result = await query(
      `SELECT u.id, u.username, u.display_name, u.bio, u.avatar_url, 
              u.is_verified, u.created_at, n.name as network_name
       FROM users u
       JOIN networks n ON u.network_id = n.id
       WHERE u.username = $1 AND u.network_id = $2`,
      [username, req.networkId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const user = result.rows[0];

    // Get user's communities (public only)
    const communitiesResult = await query(
      `SELECT c.id, c.name, c.display_name, c.icon_url, cm.role, cm.joined_at
       FROM community_members cm
       JOIN communities c ON cm.community_id = c.id
       WHERE cm.user_id = $1 AND c.is_public = true
       ORDER BY cm.joined_at DESC`,
      [user.id]
    );

    // Get user's posts count
    const postsResult = await query(
      'SELECT COUNT(*) as post_count FROM posts WHERE author_id = $1',
      [user.id]
    );

    // Get user's comments count
    const commentsResult = await query(
      'SELECT COUNT(*) as comment_count FROM comments WHERE author_id = $1',
      [user.id]
    );

    res.json({
      user: {
        ...user,
        communities: communitiesResult.rows,
        post_count: parseInt(postsResult.rows[0].post_count),
        comment_count: parseInt(commentsResult.rows[0].comment_count)
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Benutzers:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Get user's posts
router.get('/:username/posts', async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get user ID
    const userResult = await query(
      'SELECT id FROM users WHERE username = $1 AND network_id = $2',
      [username, req.networkId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const userId = userResult.rows[0].id;

    const result = await query(
      `SELECT p.id, p.title, p.content, p.content_type, p.media_urls,
              p.is_pinned, p.is_locked, p.is_nsfw, p.upvotes, p.downvotes, p.score,
              p.comment_count, p.created_at, p.updated_at,
              c.name as community_name, c.display_name as community_display_name, c.icon_url as community_icon_url
       FROM posts p
       JOIN communities c ON p.community_id = c.id
       WHERE p.author_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM posts WHERE author_id = $1',
      [userId]
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
    console.error('Fehler beim Abrufen der Benutzer-Posts:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

module.exports = router;
