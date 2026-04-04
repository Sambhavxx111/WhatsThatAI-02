CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  tool_id INT,
  action VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX user_activity_user_id_idx (user_id),
  INDEX user_activity_tool_id_idx (tool_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  tool_id INT,
  rating INT,
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY user_tool_review_unique (user_id, tool_id),
  INDEX reviews_tool_id_idx (tool_id)
);

CREATE TABLE IF NOT EXISTS user_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  tool_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY user_tool_like_unique (user_id, tool_id),
  INDEX user_likes_user_id_idx (user_id),
  INDEX user_likes_tool_id_idx (tool_id)
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action ENUM('admin_login', 'tool_approval', 'tool_rejection', 'tool_deletion') NOT NULL,
  ip_address VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX admin_audit_logs_admin_id_idx (admin_id),
  INDEX admin_audit_logs_action_idx (action)
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role ENUM('user', 'admin') NOT NULL DEFAULT 'user';
