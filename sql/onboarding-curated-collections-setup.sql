CREATE TABLE IF NOT EXISTS user_onboarding_preferences (
  user_id INT NOT NULL,
  categories JSON NOT NULL,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_onboarding_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS curated_collections (
  id INT NOT NULL AUTO_INCREMENT,
  slug VARCHAR(191) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  type ENUM('starter','trending','custom') NOT NULL DEFAULT 'custom',
  categories JSON NULL,
  summary TEXT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_by_admin_id INT NULL,
  updated_by_admin_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY curated_collections_slug_key (slug),
  KEY curated_collections_type_idx (type),
  KEY curated_collections_active_idx (active),
  CONSTRAINT fk_curated_collections_created_by FOREIGN KEY (created_by_admin_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_curated_collections_updated_by FOREIGN KEY (updated_by_admin_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS curated_collection_tools (
  id INT NOT NULL AUTO_INCREMENT,
  collection_id INT NOT NULL,
  tool_id INT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  note VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY curated_collection_tool_unique (collection_id, tool_id),
  KEY curated_collection_tools_collection_sort_idx (collection_id, sort_order),
  KEY curated_collection_tools_tool_idx (tool_id),
  CONSTRAINT fk_curated_collection_tools_collection FOREIGN KEY (collection_id) REFERENCES curated_collections(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_curated_collection_tools_tool FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE ON UPDATE CASCADE
);
