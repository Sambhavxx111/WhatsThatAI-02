CREATE TABLE IF NOT EXISTS tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tool_tags (
  tool_id INT NOT NULL,
  tag_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tool_id, tag_id),
  INDEX tool_tags_tag_id_idx (tag_id),
  CONSTRAINT fk_tool_tags_tool FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE,
  CONSTRAINT fk_tool_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

INSERT INTO tags (name)
SELECT DISTINCT TRIM(category)
FROM tools
WHERE category IS NOT NULL
  AND TRIM(category) <> ''
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO tool_tags (tool_id, tag_id)
SELECT t.id, tg.id
FROM tools t
INNER JOIN tags tg
  ON tg.name = TRIM(t.category)
WHERE t.category IS NOT NULL
  AND TRIM(t.category) <> ''
ON DUPLICATE KEY UPDATE tag_id = VALUES(tag_id);
