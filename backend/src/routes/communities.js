const express = require('express');
const Joi = require('joi');
const { query } = require('../database/connection');
const { authenticateToken, optionalAuth, checkCommunityPermission } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createCommunitySchema = Joi.object({
  name: Joi.string().alphanum().min(3).max(50).required(),
  display_name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).optional(),
  rules: Joi.string().max(2000).optional(),
  is_public: Joi.boolean().default(true),
  is_nsfw: Joi.boolean().default(false)
});

const updateCommunitySchema = Joi.object({
  display_name: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  rules: Joi.string().max(2000).optional(),
  is_public: Joi.boolean().optional(),
  is_nsfw: Joi.boolean().optional()
});

// Get all communities (public)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE c.network_id = $1';
    let queryParams = [req.networkId];
    let paramCount = 1;

    if (search) {
      paramCount++;
      whereClause += ` AND (c.display_name ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    const result = await query(
      `SELECT c.id, c.name, c.display_name, c.description, c.icon_url, c.banner_url,
              c.is_public, c.is_nsfw, c.created_at,
              u.username as creator_username, u.display_name as creator_display_name,
              COUNT(cm.user_id) as member_count,
              COUNT(p.id) as post_count
       FROM communities c
       LEFT JOIN users u ON c.creator_id = u.id
       LEFT JOIN community_members cm ON c.id = cm.community_id
       LEFT JOIN posts p ON c.id = p.community_id
       ${whereClause}
       GROUP BY c.id, u.username, u.display_name
       ORDER BY c.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM communities c ${whereClause}`,
      queryParams
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      communities: result.rows,
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
    console.error('Fehler beim Abrufen der Communities:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Get single community
router.get('/:communityId', optionalAuth, async (req, res) => {
  try {
    const { communityId } = req.params;

    const result = await query(
      `SELECT c.id, c.name, c.display_name, c.description, c.rules, c.icon_url, c.banner_url,
              c.theme_config, c.is_public, c.is_nsfw, c.created_at,
              u.username as creator_username, u.display_name as creator_display_name,
              COUNT(DISTINCT cm.user_id) as member_count,
              COUNT(DISTINCT p.id) as post_count,
              CASE WHEN $2 IS NOT NULL THEN cm.role ELSE NULL END as user_role
       FROM communities c
       LEFT JOIN users u ON c.creator_id = u.id
       LEFT JOIN community_members cm ON c.id = cm.community_id
       LEFT JOIN posts p ON c.id = p.community_id
       LEFT JOIN community_members user_membership ON c.id = user_membership.community_id AND user_membership.user_id = $2
       WHERE c.id = $1 AND c.network_id = $3
       GROUP BY c.id, u.username, u.display_name, cm.role`,
      [communityId, req.user?.id, req.networkId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Community nicht gefunden' });
    }

    const community = result.rows[0];

    // Check if user is member
    const isMember = req.user ? await query(
      'SELECT role FROM community_members WHERE user_id = $1 AND community_id = $2',
      [req.user.id, communityId]
    ) : null;

    res.json({
      ...community,
      is_member: isMember && isMember.rows.length > 0,
      user_role: isMember && isMember.rows.length > 0 ? isMember.rows[0].role : null
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Community:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Create community
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = createCommunitySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, display_name, description, rules, is_public, is_nsfw } = value;

    // Check if community name already exists
    const existingCommunity = await query(
      'SELECT id FROM communities WHERE name = $1 AND network_id = $2',
      [name, req.networkId]
    );

    if (existingCommunity.rows.length > 0) {
      return res.status(409).json({ error: 'Community-Name bereits vergeben' });
    }

    // Create community
    const result = await query(
      `INSERT INTO communities (name, display_name, description, rules, is_public, is_nsfw, creator_id, network_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, display_name, description, rules, is_public, is_nsfw, created_at`,
      [name, display_name, description, rules, is_public, is_nsfw, req.user.id, req.networkId]
    );

    const community = result.rows[0];

    // Add creator as admin
    await query(
      'INSERT INTO community_members (user_id, community_id, role) VALUES ($1, $2, $3)',
      [req.user.id, community.id, 'admin']
    );

    res.status(201).json({
      message: 'Community erfolgreich erstellt',
      community
    });
  } catch (error) {
    console.error('Fehler beim Erstellen der Community:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Update community
router.put('/:communityId', authenticateToken, checkCommunityPermission('admin'), async (req, res) => {
  try {
    const { communityId } = req.params;
    const { error, value } = updateCommunitySchema.validate(req.body);
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

    updateValues.push(communityId);
    updateValues.push(req.networkId);

    const result = await query(
      `UPDATE communities 
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount + 1} AND network_id = $${paramCount + 2}
       RETURNING id, name, display_name, description, rules, is_public, is_nsfw, updated_at`,
      updateValues
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Community nicht gefunden' });
    }

    res.json({
      message: 'Community erfolgreich aktualisiert',
      community: result.rows[0]
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Community:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Join community
router.post('/:communityId/join', authenticateToken, async (req, res) => {
  try {
    const { communityId } = req.params;

    // Check if community exists and is public
    const community = await query(
      'SELECT is_public FROM communities WHERE id = $1 AND network_id = $2',
      [communityId, req.networkId]
    );

    if (community.rows.length === 0) {
      return res.status(404).json({ error: 'Community nicht gefunden' });
    }

    if (!community.rows[0].is_public) {
      return res.status(403).json({ error: 'Community ist privat' });
    }

    // Check if already member
    const existingMember = await query(
      'SELECT id FROM community_members WHERE user_id = $1 AND community_id = $2',
      [req.user.id, communityId]
    );

    if (existingMember.rows.length > 0) {
      return res.status(409).json({ error: 'Bereits Mitglied der Community' });
    }

    // Join community
    await query(
      'INSERT INTO community_members (user_id, community_id, role) VALUES ($1, $2, $3)',
      [req.user.id, communityId, 'member']
    );

    res.json({ message: 'Erfolgreich der Community beigetreten' });
  } catch (error) {
    console.error('Fehler beim Beitreten zur Community:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Leave community
router.post('/:communityId/leave', authenticateToken, async (req, res) => {
  try {
    const { communityId } = req.params;

    // Check if member
    const member = await query(
      'SELECT role FROM community_members WHERE user_id = $1 AND community_id = $2',
      [req.user.id, communityId]
    );

    if (member.rows.length === 0) {
      return res.status(404).json({ error: 'Nicht Mitglied der Community' });
    }

    // Don't allow admin to leave if they're the only admin
    if (member.rows[0].role === 'admin') {
      const adminCount = await query(
        'SELECT COUNT(*) as count FROM community_members WHERE community_id = $1 AND role = $2',
        [communityId, 'admin']
      );

      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({ error: 'Kann nicht die letzte Admin-Rolle verlassen' });
      }
    }

    // Leave community
    await query(
      'DELETE FROM community_members WHERE user_id = $1 AND community_id = $2',
      [req.user.id, communityId]
    );

    res.json({ message: 'Community erfolgreich verlassen' });
  } catch (error) {
    console.error('Fehler beim Verlassen der Community:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Get community members
router.get('/:communityId/members', optionalAuth, async (req, res) => {
  try {
    const { communityId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, u.is_verified,
              cm.role, cm.joined_at
       FROM community_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.community_id = $1
       ORDER BY 
         CASE cm.role 
           WHEN 'admin' THEN 1 
           WHEN 'moderator' THEN 2 
           WHEN 'member' THEN 3 
         END,
         cm.joined_at ASC
       LIMIT $2 OFFSET $3`,
      [communityId, limit, offset]
    );

    res.json({
      members: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Community-Mitglieder:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

module.exports = router;
