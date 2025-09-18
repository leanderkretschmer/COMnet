const { query } = require('../database/connection');
const Parser = require('rss-parser');
const fs = require('fs').promises;
const path = require('path');

// RSS Parser instance
const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'COMNet RSS Reader/1.0'
  }
});

// Load RSS sources configuration
async function loadRssSources() {
  try {
    const configPath = path.join(__dirname, '../../config/rss-sources.json');
    const configData = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Fehler beim Laden der RSS-Konfiguration:', error);
    return { sources: [], settings: {} };
  }
}

// Initialize news channels from config
async function initializeNewsChannels() {
  try {
    const config = await loadRssSources();
    
    for (const source of config.sources) {
      if (!source.enabled) continue;

      // Check if channel already exists
      const existingResult = await query(
        'SELECT id FROM news_channels WHERE source_id = $1',
        [source.id]
      );

      if (existingResult.rows.length === 0) {
        // Create news channel
        await query(
          `INSERT INTO news_channels (source_id, name, description, profile_image, rss_url, category, language)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            source.id,
            source.name,
            source.description || '',
            source.profileImage || '',
            source.rssUrl,
            source.category || 'news',
            source.language || 'de'
          ]
        );
        console.log(`News-Channel "${source.name}" erstellt`);
      }
    }
  } catch (error) {
    console.error('Fehler beim Initialisieren der News-Channels:', error);
  }
}

// Process RSS feed and create news posts
async function processRssFeed(channelId, sourceId) {
  try {
    // Get channel info
    const channelResult = await query(
      'SELECT * FROM news_channels WHERE id = $1',
      [channelId]
    );

    if (channelResult.rows.length === 0) {
      throw new Error('Channel nicht gefunden');
    }

    const channel = channelResult.rows[0];

    // Parse RSS feed
    const feed = await parser.parseURL(channel.rss_url);
    
    // Get existing news posts to avoid duplicates
    const existingResult = await query(
      'SELECT original_guid FROM news_posts WHERE channel_id = $1',
      [channelId]
    );
    
    const existingGuids = new Set(existingResult.rows.map(row => row.original_guid));

    // Process new items
    const newItems = feed.items.filter(item => {
      const guid = item.guid || item.link || '';
      return !existingGuids.has(guid);
    });

    for (const item of newItems.slice(0, 10)) { // Limit to 10 new items per run
      const guid = item.guid || item.link || '';
      const title = item.title || 'Kein Titel';
      const content = item.contentSnippet || item.content || item.description || '';
      const linkUrl = item.link || '';
      const pubDate = item.pubDate || item.isoDate || new Date().toISOString();

      // Insert news post
      await query(
        `INSERT INTO news_posts (channel_id, original_guid, title, content, link_url, pub_date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [channelId, guid, title, content, linkUrl, pubDate]
      );
    }

    // Update last fetched timestamp
    await query(
      'UPDATE news_channels SET last_fetched = NOW() WHERE id = $1',
      [channelId]
    );

    console.log(`Verarbeitet: ${newItems.length} neue Artikel für ${channel.name}`);
    return newItems.length;
  } catch (error) {
    console.error(`Fehler beim Verarbeiten des RSS-Feeds für Channel ${channelId}:`, error);
    return 0;
  }
}

// Convert news posts to regular posts for subscribed users
async function convertNewsToPosts() {
  try {
    // Get unprocessed news posts
    const newsResult = await query(
      `SELECT np.*, nc.name as channel_name, nc.profile_image as channel_image
       FROM news_posts np
       JOIN news_channels nc ON np.channel_id = nc.id
       WHERE np.is_processed = false
       ORDER BY np.pub_date DESC
       LIMIT 50`
    );

    for (const newsPost of newsResult.rows) {
      // Get all users subscribed to this channel
      const subscribersResult = await query(
        `SELECT u.id as user_id, u.network_id
         FROM news_subscriptions ns
         JOIN users u ON ns.user_id = u.id
         WHERE ns.channel_id = $1`,
        [newsPost.channel_id]
      );

      if (subscribersResult.rows.length === 0) {
        // No subscribers, mark as processed
        await query(
          'UPDATE news_posts SET is_processed = true WHERE id = $1',
          [newsPost.id]
        );
        continue;
      }

      // Create a community for news if it doesn't exist
      let newsCommunityId;
      const communityResult = await query(
        'SELECT id FROM communities WHERE name = $1 AND network_id = $2',
        ['news', subscribersResult.rows[0].network_id]
      );

      if (communityResult.rows.length === 0) {
        // Create news community
        const newCommunityResult = await query(
          `INSERT INTO communities (name, display_name, description, creator_id, network_id)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [
            'news',
            'News',
            'Automatisch generierte News-Posts',
            subscribersResult.rows[0].user_id,
            subscribersResult.rows[0].network_id
          ]
        );
        newsCommunityId = newCommunityResult.rows[0].id;
      } else {
        newsCommunityId = communityResult.rows[0].id;
      }

      // Create post for each subscriber's network
      const networks = [...new Set(subscribersResult.rows.map(row => row.network_id))];
      
      for (const networkId of networks) {
        // Get a user from this network to be the author
        const authorResult = await query(
          'SELECT id FROM users WHERE network_id = $1 LIMIT 1',
          [networkId]
        );

        if (authorResult.rows.length === 0) continue;

        const authorId = authorResult.rows[0].id;

        // Create the post
        const postResult = await query(
          `INSERT INTO posts (title, content, content_type, author_id, community_id, network_id, link_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            `📰 ${newsPost.title}`,
            newsPost.content,
            'link',
            authorId,
            newsCommunityId,
            networkId,
            newsPost.link_url
          ]
        );

        console.log(`News-Post erstellt: ${newsPost.title} für Network ${networkId}`);
      }

      // Mark news post as processed
      await query(
        'UPDATE news_posts SET is_processed = true WHERE id = $1',
        [newsPost.id]
      );
    }

    return newsResult.rows.length;
  } catch (error) {
    console.error('Fehler beim Konvertieren von News zu Posts:', error);
    return 0;
  }
}

// Main processing function
async function processAllNews() {
  try {
    console.log('Starte News-Verarbeitung...');
    
    // Initialize channels if needed
    await initializeNewsChannels();
    
    // Get all active channels
    const channelsResult = await query(
      'SELECT id, source_id FROM news_channels WHERE is_active = true'
    );

    let totalProcessed = 0;
    
    // Process each channel
    for (const channel of channelsResult.rows) {
      const processed = await processRssFeed(channel.id, channel.source_id);
      totalProcessed += processed;
    }

    // Convert news to posts
    const converted = await convertNewsToPosts();
    
    console.log(`News-Verarbeitung abgeschlossen: ${totalProcessed} neue Artikel, ${converted} Posts erstellt`);
    
    return { processed: totalProcessed, converted };
  } catch (error) {
    console.error('Fehler bei der News-Verarbeitung:', error);
    return { processed: 0, converted: 0 };
  }
}

module.exports = {
  initializeNewsChannels,
  processRssFeed,
  convertNewsToPosts,
  processAllNews
};
