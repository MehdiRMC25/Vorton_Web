import type { Article } from './types'

// Products are loaded from API (MongoDB + Cloudinary). See src/api/products.ts and ProductsContext.

export const articles: Article[] = [
  {
    id: '1',
    title: 'Spring 2024 Lookbook',
    excerpt: 'Explore our latest seasonal collection and styling tips.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop',
    slug: 'spring-2024-lookbook',
    date: 'March 1, 2024',
  },
  {
    id: '2',
    title: 'Sustainable Fashion at Vorton',
    excerpt: 'How we are reducing our footprint and choosing better materials.',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea3c2f2e?w=600&h=400&fit=crop',
    slug: 'sustainable-fashion',
    date: 'February 15, 2024',
  },
]
