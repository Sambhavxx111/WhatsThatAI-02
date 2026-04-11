import { notFound } from 'next/navigation'
import { getPublicCuratedCollectionBySlug } from '@/lib/onboarding'
import CollectionDetailClient from './CollectionDetailClient'

export default async function CollectionDetailPage({ params }) {
  const collection = await getPublicCuratedCollectionBySlug(params?.slug)

  if (!collection) {
    notFound()
  }

  return <CollectionDetailClient collection={collection} />
}
