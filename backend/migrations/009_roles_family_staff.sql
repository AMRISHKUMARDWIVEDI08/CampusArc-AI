-- CampusArc AI - Migration 009: parent and teacher accounts
PRAGMA foreign_keys=OFF;
CREATE TABLE users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student','parent','teacher','admin','staff')),
  is_active INTEGER NOT NULL DEFAULT 1,
  school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  wallet_address TEXT,
  last_login TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO users_new(id,username,email,password_hash,role,is_active,school_id,wallet_address,last_login,created_at,updated_at)
SELECT id,username,email,password_hash,role,is_active,school_id,wallet_address,last_login,created_at,updated_at FROM users;
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_school_role ON users(school_id,role);

CREATE TABLE IF NOT EXISTS parent_student_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'guardian',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(parent_user_id,student_id)
);
CREATE INDEX IF NOT EXISTS idx_parent_links_parent ON parent_student_links(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_parent_links_student ON parent_student_links(student_id);

CREATE TABLE IF NOT EXISTS teacher_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  subject TEXT,
  class_name TEXT,
  section TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON teacher_assignments(teacher_user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_school ON teacher_assignments(school_id);
PRAGMA foreign_keys=ON;
