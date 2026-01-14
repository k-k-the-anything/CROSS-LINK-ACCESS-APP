-- ============================================
-- CROSS LINK ACCESS Database Schema
-- ============================================

-- アカウント管理テーブル
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,                          -- UUID
    platform TEXT NOT NULL,                       -- 'bluesky', 'youtube', 'instagram', 'threads', 'tiktok'
    platform_user_id TEXT,                        -- プラットフォーム側のユーザーID
    username TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    credentials TEXT NOT NULL,                    -- 暗号化された認証情報（JSON）
    token_expires_at DATETIME,                    -- トークン有効期限
    is_active BOOLEAN DEFAULT 1,
    last_sync_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform, platform_user_id)
);

-- 投稿テーブル
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,                          -- UUID
    title TEXT,                                   -- 投稿タイトル（YouTube用等）
    content TEXT NOT NULL,                        -- 投稿本文
    content_type TEXT DEFAULT 'text',             -- 'text', 'image', 'video', 'carousel'
    media_paths TEXT,                             -- JSON配列: ローカルメディアパス
    hashtags TEXT,                                -- JSON配列: ハッシュタグ
    status TEXT DEFAULT 'draft',                  -- 'draft', 'scheduled', 'posting', 'posted', 'partial', 'failed'
    scheduled_at DATETIME,                        -- 予約投稿日時
    posted_at DATETIME,                           -- 実際の投稿日時
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- クロスポストマッピングテーブル
CREATE TABLE IF NOT EXISTS cross_post_targets (
    id TEXT PRIMARY KEY,                          -- UUID
    post_id TEXT NOT NULL,                        -- posts.id
    account_id TEXT NOT NULL,                     -- accounts.id
    platform_post_id TEXT,                        -- 投稿後のプラットフォーム側投稿ID
    platform_post_url TEXT,                       -- 投稿後のURL
    status TEXT DEFAULT 'pending',                -- 'pending', 'posting', 'success', 'failed', 'skipped'
    error_code TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    posted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- メディアファイルテーブル
CREATE TABLE IF NOT EXISTS media_files (
    id TEXT PRIMARY KEY,                          -- UUID
    post_id TEXT NOT NULL,                        -- posts.id
    file_path TEXT NOT NULL,                      -- ローカルファイルパス
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,                      -- 'image/jpeg', 'video/mp4' 等
    file_size INTEGER,                            -- バイト数
    width INTEGER,
    height INTEGER,
    duration INTEGER,                             -- 動画の場合（秒）
    thumbnail_path TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- 投稿テンプレートテーブル
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,                          -- UUID
    name TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    hashtags TEXT,                                -- JSON配列
    target_platforms TEXT,                        -- JSON配列: デフォルト投稿先
    is_favorite BOOLEAN DEFAULT 0,
    use_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 予約ルールテーブル（繰り返し投稿用）
CREATE TABLE IF NOT EXISTS schedule_rules (
    id TEXT PRIMARY KEY,                          -- UUID
    name TEXT NOT NULL,
    description TEXT,
    cron_expression TEXT NOT NULL,                -- '0 9 * * 1-5' など
    target_accounts TEXT NOT NULL,                -- JSON配列: 対象アカウントID
    is_active BOOLEAN DEFAULT 1,
    last_executed_at DATETIME,
    next_execution_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 投稿履歴・ログテーブル
CREATE TABLE IF NOT EXISTS post_logs (
    id TEXT PRIMARY KEY,                          -- UUID
    post_id TEXT,
    cross_post_target_id TEXT,
    level TEXT NOT NULL,                          -- 'info', 'warn', 'error'
    message TEXT NOT NULL,
    details TEXT,                                 -- JSON: 詳細情報
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL,
    FOREIGN KEY (cross_post_target_id) REFERENCES cross_post_targets(id) ON DELETE SET NULL
);

-- アプリ設定テーブル
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_accounts_platform ON accounts(platform);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_cross_post_targets_post_id ON cross_post_targets(post_id);
CREATE INDEX IF NOT EXISTS idx_cross_post_targets_status ON cross_post_targets(status);
CREATE INDEX IF NOT EXISTS idx_post_logs_created_at ON post_logs(created_at);

-- 初期設定の挿入
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('theme', 'system');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('language', 'ja');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('version', '0.1.0');
