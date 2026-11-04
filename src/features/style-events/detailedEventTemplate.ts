import type { EventAboutSection } from "./eventAbout";
const newId = () => crypto.randomUUID();
export function detailedEventTemplate(): EventAboutSection[] {
  return [
    { id: newId(), type: 'text', title: 'Katılım koşulları', body: '' },
    { id: newId(), type: 'reward', icon: 'trophy', title: 'Ödül', value: '', body: '' },
    { id: newId(), type: 'reward', icon: 'runway', title: 'Özel gösterim', value: '', body: '' },
  ]
}
