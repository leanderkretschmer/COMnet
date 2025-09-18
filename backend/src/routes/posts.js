const express = require('express');
const Joi = require('joi');
const { query } = require('../database/connection');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createPostSchema = Joi.object({
  title: Joi.string().min(1).max(300).required(),
  content: Joi.string().max(10000).optional(),
  content_type: Joi.string().valid('text', 'image', 'video', 'link').default('text'),
  media_urls: Joi.array().items(Joi.string().uri()).default([]),
  community_id: Joi.string().uuid().required(),
  is_nsfw: Joi.boolean().default(false)
});

const updatePostSchema = Joi.object({
  title: Joi.string().min(1).max(300).optional(),
  content: Joi.string().max(10000).optional(),
  is_nsfw: Joi.boolean().optional()
});

// Get posts
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, community_id, sort = 'new' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE p.network_id = $1';
    let queryParams = [req.networkId];
    let paramCount = 1;

    if (community_id) {
      paramCount++;
      whereClause += ` AND p.community_id = $${paramCount}`;
      queryParams.push(community_id);
    }

    let orderClause = 'ORDER BY p.created_at DESC';
    if (sort === 'hot') {
      orderClause = 'ORDER BY p.score DESC, p.created_at DESC';
    } else if (sort === 'top') {
      orderClause = 'ORDER BY p.score DESC';
    }

    const result = await query(
      `SELECT p.id, p.title, p.content, p.content_type, p.media_urls,
              p.is_pinned, p.is_locked, p.is_nsfw, p.upvotes, p.downvotes, p.score,
              p.comment_count, p.created_at, p.updated_at,
              u.username as author_username, u.display_name as author_display_name, u.avatar_url as author_avatar_url,
              c.name as community_name, c.display_name as community_display_name, c.icon_url as community_icon_url
       FROM posts p
       JOIN users u ON p.author_id = u.id
       JOIN communities c ON p.community_id = c.id
       ${whereClause}
       ${orderClause}
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM posts p ${whereClause}`,
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
    console.error('Fehler beim Abrufen der Posts:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Get single post
router.get('/:postId', optionalAuth, async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await query(
      `SELECT p.id, p.title, p.content, p.content_type, p.media_urls,
              p.is_pinned, p.is_locked, p.is_nsfw, p.upvotes, p.downvotes, p.score,
              p.comment_count, p.created_at, p.updated_at,
              u.username as author_username, u.display_name as author_display_name, u.avatar_url as author_avatar_url,
              c.name as community_name, c.display_name as community_display_name, c.icon_url as community_icon_url
       FROM posts p
       JOIN users u ON p.author_id = u.id
       JOIN communities c ON p.community_id = c.id
       WHERE p.id = $1 AND p.network_id = $2`,
      [postId, req.networkId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post nicht gefunden' });
    }

    const post = result.rows[0];

    // Get user's vote if authenticated
    let userVote = 0;
    if (req.user) {
      const voteResult = await query(
        'SELECT vote_type FROM votes WHERE user_id = $1 AND post_id = $2',
        [req.user.id, postId]
      );
      if (voteResult.rows.length > 0) {
        userVote = voteResult.rows[0].vote_type;
      }
    }

    res.json({
      ...post,
      user_vote: userVote
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Posts:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Create post
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = createPostSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { title, content, content_type, media_urls, community_id, is_nsfw } = value;

    // Check if community exists and user is member
    const communityResult = await query(
      `SELECT c.id, c.name, cm.role 
       FROM communities c
       LEFT JOIN community_members cm ON c.id = cm.community_id AND cm.user_id = $1
       WHERE c.id = $2 AND c.network_id = $3`,
      [req.user.id, community_id, req.networkId]
    );

    if (communityResult.rows.length === 0) {
      return res.status(404).json({ error: 'Community nicht gefunden' });
    }

    const community = communityResult.rows[0];
    if (!community.role) {
      return res.status(403).json({ error: 'Sie sind kein Mitglied dieser Community' });
    }

    // Create post
    const result = await query(
      `INSERT INTO posts (title, content, content_type, media_urls, author_id, community_id, network_id, is_nsfw)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, content, content_type, media_urls, is_nsfw, created_at`,
      [title, content, content_type, JSON.stringify(media_urls), req.user.id, community_id, req.networkId, is_nsfw]
    );

    const post = result.rows[0];

    res.status(201).json({
      message: 'Post erfolgreich erstellt',
      post
    });
  } catch (error) {
    console.error('Fehler beim Erstellen des Posts:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Vote on post
router.post('/:postId/vote', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { vote_type } = req.body;

    if (![-1, 0, 1].includes(vote_type)) {
      return res.status(400).json({ error: 'Ungültiger Vote-Typ' });
    }

    // Check if post exists
    const postResult = await query(
      'SELECT id FROM posts WHERE id = $1 AND network_id = $2',
      [postId, req.networkId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post nicht gefunden' });
    }

    // Remove existing vote
    await query(
      'DELETE FROM votes WHERE user_id = $1 AND post_id = $2',
      [req.user.id, postId]
    );

    // Add new vote if not 0
    if (vote_type !== 0) {
      await query(
        'INSERT INTO votes (user_id, post_id, vote_type) VALUES ($1, $2, $3)',
        [req.user.id, postId, vote_type]
      );
    }

    // Get updated post stats
    const statsResult = await query(
      `SELECT 
         COUNT(CASE WHEN vote_type = 1 THEN 1 END) as upvotes,
         COUNT(CASE WHEN vote_type = -1 THEN 1 END) as downvotes,
         COALESCE(SUM(vote_type), 0) as score
       FROM votes WHERE post_id = $1`,
      [postId]
    );

    const stats = statsResult.rows[0];

    // Update post stats
    await query(
      'UPDATE posts SET upvotes = $1, downvotes = $2, score = $3 WHERE id = $4',
      [stats.upvotes, stats.downvotes, stats.score, postId]
    );

    res.json({
      message: 'Vote erfolgreich gespeichert',
      score: stats.score,
      upvotes: stats.upvotes,
      downvotes: stats.downvotes,
      user_vote: vote_type
    });
  } catch (error) {
    console.error('Fehler beim Abstimmen:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

module.exports = router;