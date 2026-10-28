import { useEffect } from 'react';
import { useCmsStore } from '../store/cmsStore';

export function useSEO() {
  const { contents } = useCmsStore();

  useEffect(() => {
    const seo = contents.seo_metadata;
    if (!seo) return;

    if (seo.metaTitle) {
      document.title = seo.metaTitle;
    }

    const updateMetaTag = (selector: string, attribute: string, value: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, selector.includes('property') ? selector.split('"')[1] : selector.split('"')[1]);
        document.head.appendChild(element);
      }
      element.setAttribute('content', value);
    };

    if (seo.metaDescription) {
      updateMetaTag('meta[name="description"]', 'name', seo.metaDescription);
    }
    if (seo.ogTitle) {
      updateMetaTag('meta[property="og:title"]', 'property', seo.ogTitle);
    }
    if (seo.ogDescription) {
      updateMetaTag('meta[property="og:description"]', 'property', seo.ogDescription);
    }
    if (seo.ogImage) {
      updateMetaTag('meta[property="og:image"]', 'property', seo.ogImage);
    }
    if (seo.ogUrl) {
      updateMetaTag('meta[property="og:url"]', 'property', seo.ogUrl);
    }
  }, [contents.seo_metadata]);
}
