/** Ordered, data-driven sections for event detail pages. Body supports **bold** text. */
export interface EventAboutSection {
  id: string;
  type: 'text' | 'image' | 'reward' | 'badge-gallery' | 'profile-theme';
  title: string;
  body: string;
  icon?: 'aura' | 'trophy' | 'heart' | 'runway' | 'gift' | 'calendar';
  value?: string;
  imageUrl?: string;
  imageAspectRatio?: number;
  imageAlt?: string;
  images?: { url: string; label: string }[];
  designId?: 'autumn-2026-tr';
}
