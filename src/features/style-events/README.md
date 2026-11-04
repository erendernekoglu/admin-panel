# Detailed event pages

Use **Detaylı etkinlik oluştur** for a starter page, or select an existing event
and choose **Yeni etkinlik için kopyala**. Copies start as drafts with new dates;
results, participant state and delivery state are not copied. Review copied dates
inside prose before publishing.

Under **Hakkında bölümleri**, add text, image, reward card, badge gallery, or
profile theme preview. Sections can be reordered, duplicated and removed. Reward
cards support Aura, trophy, heart, runway, gift and calendar symbols, with a
prominent value. Text supports `**bold**` and line breaks, not executable HTML.
Images can be uploaded (up to 4 MB) or provided as HTTPS URLs. Set aspect ratio
and alternative text. Badge galleries support up to three labeled images.

The phone preview mirrors the mobile light theme at 360 CSS pixels: Manrope fonts,
lucide-react symbols, Aura rays, spacing, typography, and generic local SVG badge and
profile artwork. It includes the cover, description, sections, dates and rules.
Account-specific actions are omitted; device font scaling can change wrapping.
Assets in public/event-preview are original generic artwork for this demo panel, not
campaign imagery. Keep those assets and eventAboutPreview.css aligned when the shared
tokens change.

Save as **Taslak** first. Up to 20 sections / 60 KB are validated by the server.
Started event terms and about content remain locked. Make a new draft copy for a
new contest. Keep ordinary prize description/rules complete for older app builds.
The new mobile renderer requires an app update once; later events using these
section types do not require new app code.

## Delivery vs presentation

Adding a section does not create or grant an entitlement. The prize type governs
automatic delivery: Aura awards the eligible winner; the existing digital Autumn
preset grants its top-three badges and conditional participation theme. Custom
badge images, theme previews, AI runway videos, and per-outfit Aura bonus copy do
not automatically deliver rewards. They require a separate delivery workflow.
