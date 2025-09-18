const express = require('express');
const Joi = require('joi');
const { query } = require('../database/connection');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required(),
  parent_id: Joi.string().uuid().optional()
});

const updateCommentSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required()
});

// Get comments for a post
router.get('/posts/:postId/comments', optionalAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 50, sort = 'new' } = req.query;
    const offset = (page - 1) * limit;

    // Check if post exists
    const postResult = await query(
      'SELECT id FROM posts WHERE id = $1 AND network_id = $2',
      [postId, req.networkId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post nicht gefunden' });
    }

    let orderClause = 'ORDER BY c.created_at ASC';
    if (sort === 'new') {
      orderClause = 'ORDER BY c.created_at DESC';
    } else if (sort === 'top') {
      orderClause = 'ORDER BY c.score DESC, c.created_at ASC';
    }

    const result = await query(
      `SELECT c.id, c.content, c.parent_id, c.upvotes, c.downvotes, c.score,
              c.is_deleted, c.created_at, c.updated_at,
              u.username as author_username, u.display_name as author_display_name, u.avatar_url as author_avatar_url
       FROM comments c
       JOIN users u ON c.author_id = u.id
       WHERE c.post_id = $1
       ${orderClause}
       LIMIT $2 OFFSET $3`,
      [postId, limit, offset]
    );

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM comments WHERE post_id = $1',
      [postId]
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      comments: result.rows,
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
    console.error('Fehler beim Abrufen der Kommentare:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Create comment
router.post('/posts/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { error, value } = createCommentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { content, parent_id } = value;

    // Check if post exists
    const postResult = await query(
      'SELECT id, is_locked FROM posts WHERE id = $1 AND network_id = $2',
      [postId, req.networkId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post nicht gefunden' });
    }

    const post = postResult.rows[0];
    if (post.is_locked) {
      return res.status(403).json({ error: 'Post ist gesperrt' });
    }

    // If parent_id is provided, check if parent comment exists
    if (parent_id) {
      const parentResult = await query(
        'SELECT id FROM comments WHERE id = $1 AND post_id = $2',
        [parent_id, postId]
      );

      if (parentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Übergeordneter Kommentar nicht gefunden' });
      }
    }

    // Create comment
    const result = await query(
      `INSERT INTO comments (content, author_id, post_id, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, content, parent_id, created_at`,
      [content, req.user.id, postId, parent_id]
    );

    const comment = result.rows[0];

    res.status(201).json({
      message: 'Kommentar erfolgreich erstellt',
      comment
    });
  } catch (error) {
    console.error('Fehler beim Erstellen des Kommentars:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Update comment
router.put('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { error, value } = updateCommentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { content } = value;

    // Check if comment exists and user is author
    const commentResult = await query(
      'SELECT author_id FROM comments WHERE id = $1',
      [commentId]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Kommentar nicht gefunden' });
    }

    const comment = commentResult.rows[0];
    if (comment.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Keine Berechtigung zum Bearbeiten dieses Kommentars' });
    }

    // Update comment
    const result = await query(
      `UPDATE comments 
       SET content = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, content, updated_at`,
      [content, commentId]
    );

    res.json({
      message: 'Kommentar erfolgreich aktualisiert',
      comment: result.rows[0]
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Kommentars:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Delete comment
router.delete('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;

    // Check if comment exists and user is author
    const commentResult = await query(
      'SELECT author_id FROM comments WHERE id = $1',
      [commentId]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Kommentar nicht gefunden' });
    }

    const comment = commentResult.rows[0];
    if (comment.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Keine Berechtigung zum Löschen dieses Kommentars' });
    }

    // Soft delete comment
    await query(
      'UPDATE comments SET is_deleted = true, content = $1 WHERE id = $2',
      ['[Gelöscht]', commentId]
    );

    res.json({ message: 'Kommentar erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Kommentars:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Vote on comment
router.post('/:commentId/vote', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { vote_type } = req.body;

    if (![-1, 0, 1].includes(vote_type)) {
      return res.status(400).json({ error: 'Ungültiger Vote-Typ' });
    }

    // Check if comment exists
    const commentResult = await query(
      'SELECT id FROM comments WHERE id = $1',
      [commentId]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Kommentar nicht gefunden' });
    }

    // Remove existing vote
    await query(
      'DELETE FROM votes WHERE user_id = $1 AND comment_id = $2',
      [req.user.id, commentId]
    );

    // Add new vote if not 0
    if (vote_type !== 0) {
      await query(
        'INSERT INTO votes (user_id, comment_id, vote_type) VALUES ($1, $2, $3)',
        [req.user.id, commentId, vote_type]
      );
    }

    // Get updated comment stats
    const statsResult = await query(
      `SELECT 
         COUNT(CASE WHEN vote_type = 1 THEN 1 END) as upvotes,
         COUNT(CASE WHEN vote_type = -1 THEN 1 END) as downvotes,
         COALESCE(SUM(vote_type), 0) as score
       FROM votes WHERE comment_id = $1`,
      [commentId]
    );

    const stats = statsResult.rows[0];

    // Update comment stats
    await query(
      'UPDATE comments SET upvotes = $1, downvotes = $2, score = $3 WHERE id = $4',
      [stats.upvotes, stats.downvotes, stats.score, commentId]
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
