-- COMNet Database Schema
-- Erstellt die grundlegenden Tabellen für die dezentrale Social-Media-Plattform

-- Erweiterungen aktivieren
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Netzwerk-Tabelle (COMs)
CREATE TABLE networks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    domain VARCHAR(255) NOT NULL UNIQUE,
    is_public BOOLEAN DEFAULT true,
    is_federated BOOLEAN DEFAULT true,
    admin_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Benutzer-Tabelle
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_guest BOOLEAN DEFAULT false,
    network_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(username, network_id),
    UNIQUE(email, network_id)
);

-- Communities-Tabelle
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    rules TEXT,
    icon_url VARCHAR(500),
    banner_url VARCHAR(500),
    theme_config JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT true,
    is_nsfw BOOLEAN DEFAULT false,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    network_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, network_id)
);

-- Community-Mitgliedschaften
CREATE TABLE community_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, community_id)
);

-- Posts-Tabelle
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(300) NOT NULL,
    content TEXT,
    content_type VARCHAR(20) DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'video', 'link')),
    media_urls JSONB DEFAULT '[]',
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    network_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    is_nsfw BOOLEAN DEFAULT false,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kommentare-Tabelle
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes-Tabelle (für Posts und Kommentare)
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    vote_type INTEGER NOT NULL CHECK (vote_type IN (-1, 1)), -- -1 = downvote, 1 = upvote
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id),
    UNIQUE(user_id, comment_id),
    CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

-- Föderations-Tabelle für ActivityPub
CREATE TABLE federation_actors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id VARCHAR(500) NOT NULL UNIQUE, -- ActivityPub Actor ID
    username VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    bio TEXT,
    avatar_url VARCHAR(500),
    inbox_url VARCHAR(500),
    outbox_url VARCHAR(500),
    public_key TEXT,
    network_domain VARCHAR(255) NOT NULL,
    is_local BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Föderierte Posts
CREATE TABLE federation_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    local_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    remote_actor_id VARCHAR(500) NOT NULL REFERENCES federation_actors(actor_id),
    remote_post_id VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(remote_actor_id, remote_post_id)
);

-- Sessions-Tabelle
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- News-Channels-Tabelle
CREATE TABLE news_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id VARCHAR(100) NOT NULL UNIQUE, -- ID aus der RSS-Konfiguration
    name VARCHAR(200) NOT NULL,
    description TEXT,
    profile_image VARCHAR(500),
    rss_url VARCHAR(500) NOT NULL,
    category VARCHAR(50) DEFAULT 'news',
    language VARCHAR(10) DEFAULT 'de',
    is_active BOOLEAN DEFAULT true,
    last_fetched TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- News-Abonnements
CREATE TABLE news_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES news_channels(id) ON DELETE CASCADE,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, channel_id)
);

-- News-Posts (automatisch erstellte Posts aus RSS-Feeds)
CREATE TABLE news_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES news_channels(id) ON DELETE CASCADE,
    original_guid VARCHAR(500) NOT NULL, -- GUID aus dem RSS-Feed
    title VARCHAR(500) NOT NULL,
    content TEXT,
    link_url VARCHAR(500),
    pub_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_processed BOOLEAN DEFAULT false, -- Ob bereits als Post erstellt
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(channel_id, original_guid)
);

-- Indizes für bessere Performance
CREATE INDEX idx_users_network_id ON users(network_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_communities_network_id ON communities(network_id);
CREATE INDEX idx_posts_community_id ON posts(community_id);
CREATE INDEX idx_posts_network_id ON posts(network_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_score ON posts(score DESC);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_votes_user_post ON votes(user_id, post_id);
CREATE INDEX idx_votes_user_comment ON votes(user_id, comment_id);
CREATE INDEX idx_federation_actors_domain ON federation_actors(network_domain);
CREATE INDEX idx_news_subscriptions_user_id ON news_subscriptions(user_id);
CREATE INDEX idx_news_subscriptions_channel_id ON news_subscriptions(channel_id);
CREATE INDEX idx_news_posts_channel_id ON news_posts(channel_id);
CREATE INDEX idx_news_posts_pub_date ON news_posts(pub_date DESC);
CREATE INDEX idx_news_posts_processed ON news_posts(is_processed);

-- Trigger für automatische Timestamp-Updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_networks_updated_at BEFORE UPDATE ON networks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_channels_updated_at BEFORE UPDATE ON news_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger für Score-Berechnung
CREATE OR REPLACE FUNCTION update_post_score()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts 
    SET score = upvotes - downvotes 
    WHERE id = COALESCE(NEW.post_id, OLD.post_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_post_score_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH ROW EXECUTE FUNCTION update_post_score();

-- Trigger für Kommentar-Zählung
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_comment_count_trigger 
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_comment_count();
