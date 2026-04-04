const axios = require('axios')

async function getDB() {
  const { db } = await import('../lib/db.js')
  return db
}

async function getToolIngestion() {
  return import('../lib/tool-ingestion.js')
}

async function fetchMockTools() {
  const fallbackTools = [
    {
      name: 'Gamma',
      description: 'AI-powered presentation and document creation workspace.',
      category: 'Productivity',
      pricing: 'freemium',
      website_url: 'https://gamma.app',
    },
    {
      name: 'Perplexity',
      description: 'Answer engine for research, browsing, and knowledge work.',
      category: 'Research',
      pricing: 'freemium',
      website_url: 'https://www.perplexity.ai',
    },
    {
      name: 'Synthesia',
      description: 'Create studio-style AI avatar videos from text.',
      category: 'Video',
      pricing: 'paid',
      website_url: 'https://www.synthesia.io',
    },
    {
      name: 'Leonardo AI',
      description: 'AI image generation platform for assets, concepts, and design.',
      category: 'Image',
      pricing: 'freemium',
      website_url: 'https://leonardo.ai',
    },
    {
      name: 'Pika',
      description: 'Generate and edit videos with lightweight AI workflows.',
      category: 'Video',
      pricing: 'freemium',
      website_url: 'https://pika.art',
    },
    {
      name: 'Runway',
      description: 'Creative suite for AI video editing, generation, and visual storytelling.',
      category: 'Video',
      pricing: 'freemium',
      website_url: 'https://runwayml.com',
    },
    {
      name: 'Midjourney',
      description: 'Generative image platform known for high-quality artistic image creation.',
      category: 'Image',
      pricing: 'paid',
      website_url: 'https://www.midjourney.com',
    },
    {
      name: 'Claude',
      description: 'AI assistant for writing, reasoning, analysis, and document understanding.',
      category: 'Writing',
      pricing: 'freemium',
      website_url: 'https://claude.ai',
    },
    {
      name: 'ChatGPT',
      description: 'Conversational AI assistant for writing, coding, research, and productivity.',
      category: 'Writing',
      pricing: 'freemium',
      website_url: 'https://chatgpt.com',
    },
    {
      name: 'Jasper',
      description: 'AI marketing copilot for content creation, campaigns, and brand workflows.',
      category: 'Marketing',
      pricing: 'paid',
      website_url: 'https://www.jasper.ai',
    },
    {
      name: 'Copy.ai',
      description: 'AI platform for marketing copy, outbound workflows, and content operations.',
      category: 'Marketing',
      pricing: 'freemium',
      website_url: 'https://www.copy.ai',
    },
    {
      name: 'Notion AI',
      description: 'AI writing and knowledge features built into the Notion workspace.',
      category: 'Productivity',
      pricing: 'paid',
      website_url: 'https://www.notion.so/product/ai',
    },
    {
      name: 'Fireflies AI',
      description: 'Meeting transcription and conversation intelligence assistant for teams.',
      category: 'Productivity',
      pricing: 'freemium',
      website_url: 'https://fireflies.ai',
    },
    {
      name: 'Otter AI',
      description: 'Meeting transcription and notes platform with AI summaries and collaboration.',
      category: 'Productivity',
      pricing: 'freemium',
      website_url: 'https://otter.ai',
    },
    {
      name: 'Descript',
      description: 'Edit audio and video like a document using AI transcription and overdub tools.',
      category: 'Audio',
      pricing: 'freemium',
      website_url: 'https://www.descript.com',
    },
    {
      name: 'ElevenLabs',
      description: 'AI voice synthesis and dubbing platform for creators and developers.',
      category: 'Audio',
      pricing: 'freemium',
      website_url: 'https://elevenlabs.io',
    },
    {
      name: 'Murf',
      description: 'AI voice generator for presentations, videos, and narration workflows.',
      category: 'Audio',
      pricing: 'freemium',
      website_url: 'https://murf.ai',
    },
    {
      name: 'Luma AI',
      description: 'Generative video and 3D content platform for creators and product teams.',
      category: 'Video',
      pricing: 'freemium',
      website_url: 'https://lumalabs.ai',
    },
    {
      name: 'Kaiber',
      description: 'AI video generation platform for music videos, visuals, and storytelling.',
      category: 'Video',
      pricing: 'paid',
      website_url: 'https://kaiber.ai',
    },
    {
      name: 'HeyGen',
      description: 'Create avatar videos, translated talking-head clips, and AI presentations.',
      category: 'Video',
      pricing: 'freemium',
      website_url: 'https://www.heygen.com',
    },
    {
      name: 'DeepL Write',
      description: 'Writing assistant focused on clearer phrasing, rewrites, and multilingual polish.',
      category: 'Writing',
      pricing: 'freemium',
      website_url: 'https://www.deepl.com/write',
    },
    {
      name: 'Grammarly',
      description: 'AI writing assistant for grammar, rewrites, tone, and workplace communication.',
      category: 'Writing',
      pricing: 'freemium',
      website_url: 'https://www.grammarly.com',
    },
    {
      name: 'Writesonic',
      description: 'AI writing and marketing platform for blog posts, ads, and landing pages.',
      category: 'Writing',
      pricing: 'freemium',
      website_url: 'https://writesonic.com',
    },
    {
      name: 'Canva Magic Studio',
      description: 'AI-powered design features inside Canva for visuals, copy, and editing.',
      category: 'Design',
      pricing: 'freemium',
      website_url: 'https://www.canva.com/magic-studio',
    },
    {
      name: 'Tome',
      description: 'AI storytelling and presentation builder for sales, briefs, and narratives.',
      category: 'Productivity',
      pricing: 'freemium',
      website_url: 'https://tome.app',
    },
    {
      name: 'Beautiful.ai',
      description: 'Presentation software with AI-assisted slide design and layout automation.',
      category: 'Productivity',
      pricing: 'paid',
      website_url: 'https://www.beautiful.ai',
    },
    {
      name: 'Replit AI',
      description: 'AI coding assistant built into Replit for generation, debugging, and iteration.',
      category: 'Coding',
      pricing: 'freemium',
      website_url: 'https://replit.com/ai',
    },
    {
      name: 'GitHub Copilot',
      description: 'AI coding assistant for code completion, chat, and developer productivity.',
      category: 'Coding',
      pricing: 'paid',
      website_url: 'https://github.com/features/copilot',
    },
    {
      name: 'Cursor',
      description: 'AI-first code editor with autocomplete, chat, and codebase understanding.',
      category: 'Coding',
      pricing: 'freemium',
      website_url: 'https://www.cursor.com',
    },
    {
      name: 'Codeium',
      description: 'AI coding assistant offering autocomplete, chat, and editor integrations.',
      category: 'Coding',
      pricing: 'freemium',
      website_url: 'https://codeium.com',
    },
    {
      name: 'Phind',
      description: 'Answer engine and coding search assistant for developers and technical teams.',
      category: 'Coding',
      pricing: 'freemium',
      website_url: 'https://www.phind.com',
    },
    {
      name: 'Zapier AI',
      description: 'AI workflow builder inside Zapier for automation, actions, and assistants.',
      category: 'Automation',
      pricing: 'freemium',
      website_url: 'https://zapier.com/ai',
    },
    {
      name: 'Bardeen',
      description: 'AI browser automation tool for repetitive work, outreach, and research tasks.',
      category: 'Automation',
      pricing: 'freemium',
      website_url: 'https://www.bardeen.ai',
    },
    {
      name: 'Browse AI',
      description: 'No-code AI web scraping and automation tool for extracting online data.',
      category: 'Automation',
      pricing: 'freemium',
      website_url: 'https://www.browse.ai',
    },
    {
      name: 'Harpa AI',
      description: 'Browser assistant for summarization, SEO workflows, scraping, and automation.',
      category: 'Automation',
      pricing: 'freemium',
      website_url: 'https://harpa.ai',
    },
    {
      name: 'Mem',
      description: 'AI note-taking app that organizes ideas and surfaces useful context automatically.',
      category: 'Productivity',
      pricing: 'paid',
      website_url: 'https://mem.ai',
    },
    {
      name: 'Elicit',
      description: 'AI research assistant for literature review, evidence gathering, and analysis.',
      category: 'Research',
      pricing: 'freemium',
      website_url: 'https://elicit.com',
    },
    {
      name: 'Consensus',
      description: 'AI research search engine focused on scientific papers and evidence-based answers.',
      category: 'Research',
      pricing: 'freemium',
      website_url: 'https://consensus.app',
    },
    {
      name: 'Scite',
      description: 'Research platform that shows how scientific articles are cited and discussed.',
      category: 'Research',
      pricing: 'paid',
      website_url: 'https://scite.ai',
    },
    {
      name: 'Adobe Firefly',
      description: 'Adobe generative AI suite for images, design assets, and creative workflows.',
      category: 'Image',
      pricing: 'freemium',
      website_url: 'https://firefly.adobe.com',
    },
    {
      name: 'Ideogram',
      description: 'AI image generation tool with strong text rendering and creative design output.',
      category: 'Image',
      pricing: 'freemium',
      website_url: 'https://ideogram.ai',
    },
    {
      name: 'Playground AI',
      description: 'AI image generation and editing workspace for creatives and marketers.',
      category: 'Image',
      pricing: 'freemium',
      website_url: 'https://playground.com',
    },
    {
      name: 'Clipdrop',
      description: 'AI image editing suite for cleanup, relighting, generation, and upscaling.',
      category: 'Image',
      pricing: 'freemium',
      website_url: 'https://clipdrop.co',
    },
    {
      name: 'Durable',
      description: 'AI website builder for small businesses with instant site generation.',
      category: 'Design',
      pricing: 'paid',
      website_url: 'https://durable.co',
    },
    {
      name: 'Framer AI',
      description: 'Website creation platform with AI-powered page generation and copy suggestions.',
      category: 'Design',
      pricing: 'freemium',
      website_url: 'https://www.framer.com/ai',
    },
    {
      name: 'Uizard',
      description: 'AI UI design tool for mockups, wireframes, and product ideation.',
      category: 'Design',
      pricing: 'freemium',
      website_url: 'https://uizard.io',
    },
  ]

  const sourceUrl = process.env.TOOLS_SOURCE_URL

  if (!sourceUrl) {
    return fallbackTools
  }

  const response = await axios.get(sourceUrl)
  const items = Array.isArray(response.data) ? response.data : []

  return items.map((item) => ({
    name: item.name || item.title || '',
    description: item.description || item.body || '',
    category: item.category || 'Other',
    pricing: item.pricing || 'freemium',
    website_url: item.website_url || item.websiteUrl || '',
  }))
}

async function main() {
  const db = await getDB()
  const {
    evaluateToolForInsertion,
    findExistingTool,
    normalizeName,
    normalizeTool,
    slugify,
  } = await getToolIngestion()
  const scrapedTools = await fetchMockTools()

  let inserted = 0
  let skipped = 0
  let autoApproved = 0

  for (const rawTool of scrapedTools) {
    const tool = normalizeTool(rawTool, {
      category: 'Other',
      pricing: 'freemium',
    })

    if (!tool.name || !tool.description || !tool.category || !tool.pricing || !tool.websiteUrl) {
      skipped += 1
      continue
    }

    const normalizedName = normalizeName(tool.name)
    const slug = slugify(tool.name)

    if (!slug) {
      skipped += 1
      continue
    }

    const existingTools = await findExistingTool(db, {
      normalizedName,
      slug,
      websiteUrl: tool.websiteUrl,
    })

    if (existingTools.length > 0) {
      skipped += 1
    } else {
      const evaluation = await evaluateToolForInsertion(tool)

      await db.tool.create({
        data: {
          name: tool.name,
          slug,
          description: evaluation.description,
          category: tool.category,
          pricing: tool.pricing,
          websiteUrl: tool.websiteUrl,
          status: evaluation.status,
          source: 'scraped',
          active: evaluation.active,
        },
      })

      inserted += 1

      if (evaluation.status === 'approved') {
        autoApproved += 1
      }
    }
  }

  console.log(`Scrape complete. Inserted: ${inserted}, Auto-approved: ${autoApproved}, Skipped: ${skipped}`)
}

main()
  .catch((error) => {
    console.error('Scrape failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    const db = await getDB()
    await db.$disconnect()
  })
