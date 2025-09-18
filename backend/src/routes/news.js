const express = require('express');
const Parser = require('rss-parser');
const fs = require('fs').promises;
const path = require('path');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// RSS Parser instance
const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'COMNet RSS Reader/1.0'
  }
});

// Cache for RSS feeds
const feedCache = new Map();
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

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

// Parse RSS feed
async function parseFeed(url, maxItems = 20) {
  try {
    const feed = await parser.parseURL(url);
    
    const items = feed.items.slice(0, maxItems).map(item => ({
      title: item.title || 'Kein Titel',
      description: item.contentSnippet || item.content || item.description || '',
      link: item.link || '',
      pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
      guid: item.guid || item.link || '',
      categories: item.categories || [],
      creator: item.creator || item['dc:creator'] || '',
      enclosure: item.enclosure || null
    }));

    return {
      title: feed.title || 'Unbekannter Feed',
      description: feed.description || '',
      link: feed.link || '',
      lastBuildDate: feed.lastBuildDate || new Date().toISOString(),
      items
    };
  } catch (error) {
    console.error(`Fehler beim Parsen des RSS-Feeds ${url}:`, error);
    throw new Error(`RSS-Feed konnte nicht geladen werden: ${error.message}`);
  }
}

// Get cached feed or fetch new one
async function getFeed(source) {
  const cacheKey = `${source.id}_${source.rssUrl}`;
  const cached = feedCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TIMEOUT) {
    return cached.data;
  }

  try {
    const feedData = await parseFeed(source.rssUrl, source.maxItems || 20);
    const result = {
      ...source,
      feed: feedData,
      lastUpdated: new Date().toISOString(),
      error: null
    };

    feedCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    const result = {
      ...source,
      feed: null,
      lastUpdated: new Date().toISOString(),
      error: error.message
    };

    feedCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  }
}

// Get all news sources
router.get('/sources', async (req, res) => {
  try {
    const config = await loadRssSources();
    const enabledSources = config.sources.filter(source => source.enabled);
    
    res.json({
      sources: enabledSources.map(source => ({
        id: source.id,
        name: source.name,
        description: source.description,
        profileImage: source.profileImage,
        category: source.category,
        language: source.language,
        maxItems: source.maxItems,
        refreshInterval: source.refreshInterval
      }))
    });
  } catch (error) {
    console.error('Fehler beim Laden der News-Quellen:', error);
    res.status(500).json({ error: 'Fehler beim Laden der News-Quellen' });
  }
});

// Get news from all sources
router.get('/feed', async (req, res) => {
  try {
    const config = await loadRssSources();
    const enabledSources = config.sources.filter(source => source.enabled);
    
    const promises = enabledSources.map(source => getFeed(source));
    const results = await Promise.allSettled(promises);
    
    const newsData = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(source => source.feed && !source.error);

    // Sort all items by publication date
    const allItems = [];
    newsData.forEach(source => {
      if (source.feed && source.feed.items) {
        source.feed.items.forEach(item => {
          allItems.push({
            ...item,
            source: {
              id: source.id,
              name: source.name,
              profileImage: source.profileImage,
              category: source.category
            }
          });
        });
      }
    });

    // Sort by publication date (newest first)
    allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // Limit total items
    const maxTotalItems = config.settings?.maxItemsPerSource || 100;
    const limitedItems = allItems.slice(0, maxTotalItems);

    res.json({
      items: limitedItems,
      totalSources: newsData.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fehler beim Laden der News:', error);
    res.status(500).json({ error: 'Fehler beim Laden der News' });
  }
});

// Get news from specific source
router.get('/source/:sourceId', async (req, res) => {
  try {
    const { sourceId } = req.params;
    const config = await loadRssSources();
    
    const source = config.sources.find(s => s.id === sourceId && s.enabled);
    if (!source) {
      return res.status(404).json({ error: 'News-Quelle nicht gefunden' });
    }

    const result = await getFeed(source);
    res.json(result);
  } catch (error) {
    console.error('Fehler beim Laden der News-Quelle:', error);
    res.status(500).json({ error: 'Fehler beim Laden der News-Quelle' });
  }
});

// Refresh cache for all sources
router.post('/refresh', async (req, res) => {
  try {
    const config = await loadRssSources();
    const enabledSources = config.sources.filter(source => source.enabled);
    
    // Clear cache
    feedCache.clear();
    
    // Fetch all feeds
    const promises = enabledSources.map(source => getFeed(source));
    await Promise.allSettled(promises);
    
    res.json({ 
      message: 'Cache erfolgreich aktualisiert',
      sourcesRefreshed: enabledSources.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Caches:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Caches' });
  }
});

// Add new RSS source (admin only - for future implementation)
router.post('/sources', async (req, res) => {
  try {
    const { name, description, profileImage, rssUrl, category, language } = req.body;
    
    if (!name || !rssUrl) {
      return res.status(400).json({ error: 'Name und RSS-URL sind erforderlich' });
    }

    // Test the RSS feed
    try {
      await parser.parseURL(rssUrl);
    } catch (error) {
      return res.status(400).json({ error: 'Ungültige RSS-URL' });
    }

    const config = await loadRssSources();
    const newSource = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      description: description || '',
      profileImage: profileImage || '',
      rssUrl,
      category: category || 'news',
      language: language || 'de',
      enabled: true,
      maxItems: 20,
      refreshInterval: 30
    };

    config.sources.push(newSource);
    
    const configPath = path.join(__dirname, '../../config/rss-sources.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    res.status(201).json({
      message: 'RSS-Quelle erfolgreich hinzugefügt',
      source: newSource
    });
  } catch (error) {
    console.error('Fehler beim Hinzufügen der RSS-Quelle:', error);
    res.status(500).json({ error: 'Fehler beim Hinzufügen der RSS-Quelle' });
  }
});

module.exports = router;
