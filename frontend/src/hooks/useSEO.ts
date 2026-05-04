import { useEffect } from 'react'

interface SEOProps {
  title?: string
  description?: string
  ogImage?: string
}

export function useSEO({ title, description, ogImage }: SEOProps) {
  useEffect(() => {
    const baseTitle = 'JobNova | AI-Powered Recruitment Platform'
    document.title = title ? `${title} | JobNova` : baseTitle

    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', description || 'Find your dream job or the perfect candidate with JobNova AI.')
    } else {
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = description || 'Find your dream job or the perfect candidate with JobNova AI.'
      document.head.appendChild(meta)
    }

    // OG Meta tags
    const updateOG = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`)
      if (meta) {
        meta.setAttribute('content', content)
      } else {
        meta = document.createElement('meta')
        meta.setAttribute('property', property)
        meta.setAttribute('content', content)
        document.head.appendChild(meta)
      }
    }

    updateOG('og:title', title ? `${title} | JobNova` : baseTitle)
    updateOG('og:description', description || 'AI-Powered Recruitment Platform')
    if (ogImage) updateOG('og:image', ogImage)

  }, [title, description, ogImage])
}
