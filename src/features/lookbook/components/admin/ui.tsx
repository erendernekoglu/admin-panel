import { useEffect, useId, useState, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link } from "react-router";
import { Badge, type BadgeTone } from "../../../../components/atoms/Badge/Badge";
import { Button as BaseButton } from "../../../../components/atoms/Button";
import { cn } from "../../../../lib/utils";
import { isDemoMode } from "../../../../lib/config";
import { AdminClientError, isConcurrencyConflict, isUnsupportedOperationError, readLookMedia, type PublicationDto } from "../../lib/admin/client";
import { demoMediaSrc } from "../../lib/admin/demoMedia";
import { assetIdFromPath } from "../../lib/looks/media";

/** Mirrors the shared Input atom so selects, textareas and file inputs match it. */
export const inputClass = "w-full min-h-10 rounded-xl border border-line-input bg-surface px-3.5 py-2 text-sm text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted hover:border-ink/30 focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60 aria-[invalid=true]:border-danger";
export const panelClass = "rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-6";
export const linkClass = "font-semibold text-accent underline-offset-4 hover:underline";
/** Anchors styled like the shared Button (used for full-document navigation). */
export const linkButtonAccentClass = "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold transition-[background-color,color,border-color] duration-150 ease-out bg-accent text-on-accent hover:bg-accent-strong";
export const linkButtonSecondaryClass = "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold transition-[background-color,color,border-color] duration-150 ease-out border border-line-strong bg-surface text-ink hover:border-ink/40 hover:bg-surface-2";
export const sectionTitleClass = "text-lg font-bold text-ink";
export const hintClass = "text-sm leading-relaxed text-muted";

/** Client-side router link so in-app navigation keeps the in-memory demo store alive. */
export function AdminLink({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <Link to={href} {...props} />;
}

type LookbookButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean; accent?: boolean; size?: "sm" | "md" };

export function Button({ secondary = false, accent = false, size = "md", className, ...props }: LookbookButtonProps) {
  return <BaseButton variant={accent ? "accent" : secondary ? "secondary" : "primary"} size={size} className={className} {...props} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: (id: string, hintId: string | undefined) => ReactNode }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return <div className="space-y-1.5"><label className="block text-sm font-semibold text-ink" htmlFor={id}>{label}</label>{children(id, hintId)}{hint && <p id={hintId} className="text-xs leading-relaxed text-muted">{hint}</p>}</div>;
}

export function ErrorNotice({ error, onReload }: { error: unknown; onReload?: () => void }) {
  if (!error) return null;
  const status = error instanceof AdminClientError ? error.status : undefined;
  return <div role="alert" className="animate-pop-in space-y-3 rounded-xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger">
    <p className="font-semibold">{error instanceof Error ? error.message : "İşlem tamamlanamadı. Lütfen tekrar deneyin."}</p>
    {error instanceof AdminClientError && error.field && <p>Kontrol edilecek alan: <code className="rounded bg-surface/60 px-1">{error.field}</code></p>}
    {status === 401 && <p><Link className="font-semibold underline underline-offset-4" to="/lookbook/login" target="_blank" rel="noopener noreferrer">Yeni sekmede giriş yap</Link> · Girişten sonra buraya dönüp tekrar deneyin. Girdileri korumak için bu sekmeyi kapatmayın.</p>}
    {status === 403 && <Link className="font-semibold underline underline-offset-4" to="/lookbook/forbidden" target="_blank" rel="noopener noreferrer">Yetki bilgisi</Link>}
    {isConcurrencyConflict(error) && onReload && <Button secondary size="sm" onClick={onReload}>Sunucudan yeniden yükle (yerel değişiklikleri bırak)</Button>}
  </div>;
}

const publicationTone: Record<PublicationDto["status"], BadgeTone> = { draft: "warning", published: "success", archived: "neutral" };
const publicationLabel: Record<PublicationDto["status"], string> = { draft: "Taslak", published: "Yayında", archived: "Arşivde" };

export function PublicationBadge({ publication }: { publication: PublicationDto }) {
  return <Badge tone={publicationTone[publication.status]}>{publicationLabel[publication.status]}</Badge>;
}

/**
 * Render a private gallery image.
 *
 * Demo mode resolves registered local uploads or a synthetic inline SVG, so a
 * demo page never requests an image. API mode calls the media-read operation
 * through the shared adapter; a missing operation is reported as unsupported
 * instead of falling back to an unauthenticated image URL.
 */
export function PrivateImage({ lookId, storagePath, alt, className = "" }: { lookId: string; storagePath?: string; alt: string; className?: string }) {
  const [src, setSrc] = useState<string>();
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);

  let assetId: string | undefined;
  try {
    if (storagePath) assetId = assetIdFromPath(lookId, storagePath);
  } catch {
    // Invalid ownership paths must never fall back to public media URLs.
  }

  useEffect(() => {
    if (!assetId || !storagePath) {
      setSrc(undefined);
      setError("Görsel seçilmedi veya yolu bu kombine ait değil.");
      return;
    }
    if (isDemoMode) {
      setError(undefined);
      setSrc(demoMediaSrc(storagePath, alt || "Demo görsel"));
      return;
    }
    let alive = true;
    setSrc(undefined);
    setError(undefined);
    readLookMedia(lookId, assetId)
      .then((result) => {
        if (!alive) return;
        if (!result?.dataUrl) {
          setError("Görsel okuma yanıtı boş. Yeniden deneyin veya yöneticiyle iletişime geçin.");
          return;
        }
        setSrc(result.dataUrl);
      })
      .catch((caught: unknown) => {
        if (!alive) return;
        if (caught instanceof AdminClientError && isUnsupportedOperationError(caught)) {
          setError("Bu yönetim API'si görsel okuma işlemini uygulamıyor. Görsel gösterilemiyor; sunucuda medya okuma uç noktası etkinleştirilmeli.");
          return;
        }
        setError(caught instanceof AdminClientError ? caught.message : "Görsel yüklenemedi. Oturumunuzu ve görsel erişimini kontrol edin.");
      });
    return () => {
      alive = false;
    };
  }, [assetId, attempt, alt, lookId, storagePath]);

  if (!src || error) {
    return (
      <div className={cn("flex min-h-24 flex-col items-center justify-center gap-3 rounded-2xl bg-surface-2 p-4 text-center text-sm text-muted", className)}>
        <p>{error ?? "Görsel yükleniyor…"}</p>
        {error && assetId && <Button secondary size="sm" onClick={() => setAttempt((value) => value + 1)}>Görseli tekrar yükle</Button>}
      </div>
    );
  }
  return <img src={src} alt={alt} className={cn("rounded-2xl bg-surface-2 object-cover", className)} loading="lazy" onError={() => setError("Görsel çözülemedi. Dosya bozuk olabilir; yeniden yükleyin.")} />;
}

export function OrderButtons({ index, length, onMove, onRemove, label }: { index: number; length: number; onMove: (to: number) => void; onRemove: () => void; label: string }) {
  return <div className="flex flex-wrap gap-2"><Button secondary size="sm" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={`${label}: yukarı taşı`}>↑</Button><Button secondary size="sm" disabled={index === length - 1} onClick={() => onMove(index + 1)} aria-label={`${label}: aşağı taşı`}>↓</Button><Button secondary size="sm" onClick={onRemove} aria-label={`${label}: kaldır`}>Kaldır</Button></div>;
}
