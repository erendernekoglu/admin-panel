import type { EventAboutSection } from "./eventAbout";
const newId = () => crypto.randomUUID();
export function detailedEventTemplate(): EventAboutSection[] {
  return [
    { id: newId(), type: 'text', title: 'Yarışmaya nasıl katılırsın?', body: 'Kombinini etkinlikte paylaş. **En fazla 3 kombinle** katılabilirsin.' },
    { id: newId(), type: 'reward', icon: 'trophy', title: 'Kazananları bekleyen ödül', value: 'İlk 3', body: 'Ödülün içeriğini ve kazanma koşullarını buraya yaz.' },
    { id: newId(), type: 'reward', icon: 'runway', title: 'Özel gösterim', value: 'İlk 5', body: 'Seçilen kombinlerin nasıl sergileneceğini açıkla.' },
  ]
}
