const COLLECTION_BOOKMARKS_PREFIX = 'whatsthatai-bookmarked-collections'

function getStorageKey(userIdentifier = 'guest') {
  return `${COLLECTION_BOOKMARKS_PREFIX}:${String(userIdentifier || 'guest').toLowerCase()}`
}

export function getBookmarkedCollections(userIdentifier) {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(getStorageKey(userIdentifier))
    const parsed = rawValue ? JSON.parse(rawValue) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveBookmarkedCollections(userIdentifier, collections) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    getStorageKey(userIdentifier),
    JSON.stringify(Array.isArray(collections) ? collections : [])
  )
}

export function toggleBookmarkedCollection(userIdentifier, collection) {
  const currentCollections = getBookmarkedCollections(userIdentifier)
  const collectionSlug = String(collection?.slug || '').trim().toLowerCase()

  if (!collectionSlug) {
    return currentCollections
  }

  const exists = currentCollections.some(
    (item) => String(item?.slug || '').trim().toLowerCase() === collectionSlug
  )

  const nextCollections = exists
    ? currentCollections.filter(
        (item) => String(item?.slug || '').trim().toLowerCase() !== collectionSlug
      )
    : [
        {
          slug: collection.slug,
          title: collection.title,
          description: collection.description || collection.summary || '',
          itemCount: Number(collection.itemCount) || 0,
          type: collection.type || 'custom',
        },
        ...currentCollections,
      ]

  saveBookmarkedCollections(userIdentifier, nextCollections)
  return nextCollections
}

export function isCollectionBookmarked(userIdentifier, slug) {
  const collectionSlug = String(slug || '').trim().toLowerCase()
  return getBookmarkedCollections(userIdentifier).some(
    (item) => String(item?.slug || '').trim().toLowerCase() === collectionSlug
  )
}
