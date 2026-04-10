INSERT INTO curated_collections (slug, title, description, type, categories, summary, active)
VALUES
  ('coding-starter-stack', 'Coding Starter Stack', 'A clean starting set for users exploring coding and automation tools.', 'starter', JSON_ARRAY('coding','automation'), 'Starter stack for coding-heavy onboarding.', 1),
  ('creator-video-stack', 'Creator Video Stack', 'Useful picks for video workflows, demos, and growth-oriented content.', 'starter', JSON_ARRAY('video','marketing'), 'Starter stack for creators and video experimentation.', 1),
  ('career-launch-stack', 'Career Launch Stack', 'A practical starter set for resume, interview, and career-focused workflows.', 'starter', JSON_ARRAY('career','writing'), 'Starter stack for users exploring career-related AI help.', 1),
  ('trending-builder-stack', 'Trending Builder Stack', 'A flexible collection showing admins how a trending set can be curated.', 'trending', JSON_ARRAY('coding','automation','marketing'), 'Example trending collection for admin review.', 1)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  type = VALUES(type),
  categories = VALUES(categories),
  summary = VALUES(summary),
  active = VALUES(active),
  updated_at = CURRENT_TIMESTAMP;

DELETE cct
FROM curated_collection_tools cct
INNER JOIN curated_collections cc ON cc.id = cct.collection_id
WHERE cc.slug IN ('coding-starter-stack','creator-video-stack','career-launch-stack','trending-builder-stack');

INSERT INTO curated_collection_tools (collection_id, tool_id, sort_order, note)
SELECT cc.id, t.id, seed.sort_order, seed.note
FROM (
  SELECT 'coding-starter-stack' AS collection_slug, 'defang' AS tool_slug, 0 AS sort_order, 'Useful for deployment and production workflows.' AS note
  UNION ALL SELECT 'coding-starter-stack', 'agentql', 1, 'Helps users explore agent-style automation early.'
  UNION ALL SELECT 'coding-starter-stack', 'mindsdb', 2, 'A recognizable automation and data workflow tool.'
  UNION ALL SELECT 'creator-video-stack', 'tavus', 0, 'Good example of an AI-led video workflow tool.'
  UNION ALL SELECT 'creator-video-stack', 'opus', 1, 'Useful for repurposing and short-form content workflows.'
  UNION ALL SELECT 'creator-video-stack', 'postiz', 2, 'Pairs well with distribution and marketing tasks.'
  UNION ALL SELECT 'career-launch-stack', 'resume-engine', 0, 'WhatsThatAI Original for resumes, ATS, JD matching, and career guidance.'
  UNION ALL SELECT 'career-launch-stack', 'postiz', 1, 'Helpful for personal branding and content outreach workflows.'
  UNION ALL SELECT 'career-launch-stack', 'tavus', 2, 'Useful for demo-style career outreach or async communication.'
  UNION ALL SELECT 'trending-builder-stack', 'agentql', 0, 'Example of a strong automation pick for a trending collection.'
  UNION ALL SELECT 'trending-builder-stack', 'postiz', 1, 'Shows how marketing tools can be mixed into a trend-based set.'
  UNION ALL SELECT 'trending-builder-stack', 'resume-engine', 2, 'Includes an in-house original to show mixed curation.'
) AS seed
INNER JOIN curated_collections cc ON cc.slug = seed.collection_slug
INNER JOIN tools t ON t.slug = seed.tool_slug;
