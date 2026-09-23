-- ============================================================
-- PFE Hunter - Schéma SQL Server
-- Pour votre base "basepfe" sur DESKTOP-H7B9HA5
-- ============================================================
-- Exécutez ce script dans SQL Server Management Studio (SSMS)
-- ou Azure Data Studio sur votre base "basepfe"
-- ============================================================

-- 1. PROFILS
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'profiles')
CREATE TABLE profiles (
  id INT IDENTITY(1,1) PRIMARY KEY,
  full_name NVARCHAR(200) NOT NULL DEFAULT '',
  email NVARCHAR(200) NOT NULL DEFAULT '',
  phone NVARCHAR(50) NULL,
  linkedin_url NVARCHAR(500) NULL,
  location NVARCHAR(200) NULL,
  target_countries NVARCHAR(MAX) NULL,    -- JSON array
  skills NVARCHAR(MAX) NULL,              -- JSON array
  languages NVARCHAR(MAX) NULL,            -- JSON array
  education_level NVARCHAR(100) NULL,
  field_of_study NVARCHAR(200) NULL,
  available_from NVARCHAR(50) NULL,
  duration_months INT NULL DEFAULT 6,
  cv_content NVARCHAR(MAX) NULL,
  cv_file_name NVARCHAR(200) NULL,
  keywords NVARCHAR(MAX) NULL,             -- JSON array
  exclude_keywords NVARCHAR(MAX) NULL,      -- JSON array
  min_match_score INT NULL DEFAULT 60,
  created_at DATETIME2 NULL DEFAULT GETDATE(),
  updated_at DATETIME2 NULL DEFAULT GETDATE()
);

-- 2. SESSIONS DE RECHERCHE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'search_sessions')
CREATE TABLE search_sessions (
  id INT IDENTITY(1,1) PRIMARY KEY,
  status NVARCHAR(20) NULL DEFAULT 'idle',
  offers_found INT NULL DEFAULT 0,
  offers_analyzed INT NULL DEFAULT 0,
  sources NVARCHAR(MAX) NULL,
  log NVARCHAR(MAX) NULL,
  started_at DATETIME2 NULL DEFAULT GETDATE(),
  finished_at DATETIME2 NULL
);

-- 3. OFFRES
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'offers')
CREATE TABLE offers (
  id INT IDENTITY(1,1) PRIMARY KEY,
  session_id INT NULL FOREIGN KEY REFERENCES search_sessions(id),
  title NVARCHAR(500) NOT NULL,
  company NVARCHAR(200) NOT NULL,
  location NVARCHAR(200) NULL,
  country NVARCHAR(100) NULL,
  source NVARCHAR(100) NULL,
  source_url NVARCHAR(1000) NULL,
  description NVARCHAR(MAX) NULL,
  requirements NVARCHAR(MAX) NULL,         -- JSON array
  match_score INT NULL DEFAULT 0,
  match_reason NVARCHAR(MAX) NULL,
  status NVARCHAR(30) NULL DEFAULT 'pending_review',
  adapted_cv NVARCHAR(MAX) NULL,
  cover_letter NVARCHAR(MAX) NULL,
  linkedin_message NVARCHAR(MAX) NULL,
  ai_analysis NVARCHAR(MAX) NULL,
  posted_at NVARCHAR(50) NULL,
  deadline NVARCHAR(50) NULL,
  created_at DATETIME2 NULL DEFAULT GETDATE(),
  updated_at DATETIME2 NULL DEFAULT GETDATE()
);

-- 4. CANDIDATURES
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'applications')
CREATE TABLE applications (
  id INT IDENTITY(1,1) PRIMARY KEY,
  offer_id INT NULL FOREIGN KEY REFERENCES offers(id),
  status NVARCHAR(30) NULL DEFAULT 'sent',
  sent_at DATETIME2 NULL DEFAULT GETDATE(),
  follow_up_at DATETIME2 NULL,
  notes NVARCHAR(MAX) NULL,
  response NVARCHAR(MAX) NULL,
  created_at DATETIME2 NULL DEFAULT GETDATE(),
  updated_at DATETIME2 NULL DEFAULT GETDATE()
);

-- 5. IDENTIFIANTS LINKEDIN
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'linkedin_credentials')
CREATE TABLE linkedin_credentials (
  id INT IDENTITY(1,1) PRIMARY KEY,
  email NVARCHAR(200) NOT NULL DEFAULT '',
  password_hint NVARCHAR(200) NULL,
  session_cookies NVARCHAR(MAX) NULL,
  last_connected DATETIME2 NULL,
  is_active BIT NULL DEFAULT 0,
  created_at DATETIME2 NULL DEFAULT GETDATE()
);

-- ============================================================
-- Index pour les performances
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_offers_status')
  CREATE INDEX idx_offers_status ON offers(status);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_offers_score')
  CREATE INDEX idx_offers_score ON offers(match_score DESC);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_offers_session')
  CREATE INDEX idx_offers_session ON offers(session_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_applications_offer')
  CREATE INDEX idx_applications_offer ON applications(offer_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_applications_status')
  CREATE INDEX idx_applications_status ON applications(status);

PRINT '✅ Schéma PFE Hunter créé avec succès dans la base basepfe';
