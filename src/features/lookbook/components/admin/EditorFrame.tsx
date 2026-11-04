

import type { ReactNode } from "react";
import type { EditorialLookContent, LookCollectionContent, Resource } from "../../lib/admin/client";
import { useAuth } from "../../../auth/useAuth";
import type { EditorState } from "./useEditor";
import { AdminLink, Button, ErrorNotice, Field, inputClass, linkClass, PublicationBadge } from "./ui";

type EditorFrameProps<T extends EditorialLookContent | LookCollectionContent> = {
  editor: EditorState<T>;
  resource: Resource;
  title: string;
  children: ReactNode;
  publicationPanel?: ReactNode;
  onSave: () => void;
  preview?: boolean;
  onPreview?: () => void;
};

export function EditorFrame<T extends EditorialLookContent | LookCollectionContent>({
  editor, resource, title, children, publicationPanel, onSave, preview, onPreview,
}: EditorFrameProps<T>) {
  const { record, busy, dirty, uncertain, conflict } = editor;
  // UI only: the independent Lookbook API must enforce the same permission server-side.
  const canPublish = useAuth().can("lookbook.publish");
  return (
    <div className="space-y-6">
      <div className="min-w-0 space-y-3">
        <AdminLink href={`/lookbook/${resource}`} className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-accent">
          ← {resource === "looks" ? "Kombinler" : "Koleksiyonlar"}
        </AdminLink>
        <h2 className="break-words text-2xl font-bold text-ink sm:text-3xl">{title}</h2>
        {record && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-soft">
            <PublicationBadge publication={record.webPublication} />
            <span>Sürüm {record.revision}</span>
            <span className="break-all text-muted">ID: {record.id}</span>
            {"code" in record && <span>Kod: {String(record.code)}</span>}
            {record.webPublication.publishedAt && (
              <span>Yayın: <time dateTime={record.webPublication.publishedAt}>
                {new Date(record.webPublication.publishedAt).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}
              </time></span>
            )}
            <AdminLink href={`/lookbook/${resource}/${encodeURIComponent(record.id)}`} className={linkClass}>
              Kayıt bağlantısı
            </AdminLink>
          </div>
        )}
      </div>
      <ErrorNotice error={editor.error} onReload={() => void editor.reload()} />
      <div role="status" aria-live="polite" className="text-sm text-muted">
        {busy ?? (editor.notice || (dirty ? "Kaydedilmemiş değişiklikler var." : editor.ready ? "Değişiklik yok." : "Yükleniyor…"))}
      </div>
      {uncertain && (
        <p className="animate-pop-in rounded-xl border border-warning/25 bg-warning-soft p-4 text-sm text-warning">
          Son işlemin sonucu henüz kesin değil. Aynı isteği tekrar deneyene veya sunucudan yeniden yükleyene kadar alanlar kilitli.
          Oturum hatasında aynı hesapla giriş yaptıktan sonra buradan devam edebilirsiniz.
        </p>
      )}
      {(conflict || uncertain) && (
        <details className="rounded-xl border border-line bg-surface p-4">
          <summary className="cursor-pointer text-sm font-semibold text-ink">Yeniden yüklemeden önce yerel taslağı kopyala</summary>
          <div className="mt-4">
            <Field label="Yerel taslak (salt okunur JSON)" hint="Alanı seçip tümünü kopyalayabilirsiniz. Bu veri oturum anahtarı içermez; yalnızca mevcut editör girdileridir.">
              {(id, hint) => <textarea id={id} aria-describedby={hint} readOnly rows={8} className={`${inputClass} font-mono text-xs`} value={JSON.stringify(editor.content, null, 2)} />}
            </Field>
          </div>
        </details>
      )}
      {!editor.ready ? (
        <Button secondary onClick={() => window.location.reload()}>Yüklemeyi tekrar dene</Button>
      ) : (
        <form onSubmit={(event) => { event.preventDefault(); onSave(); }} aria-busy={Boolean(busy)} className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button accent
              type="submit"
              disabled={Boolean(busy) || conflict || (Boolean(record) && !dirty && !uncertain) || (Boolean(uncertain) && uncertain !== "save")}
            >
              {busy === "Kaydediliyor…" ? busy : uncertain === "save" ? "Kaydet / Tekrar dene" : "Taslağı kaydet"}
            </Button>
            {canPublish && (
              <>
              <Button
                secondary
                disabled={!record || dirty || Boolean(busy) || conflict || (Boolean(uncertain) && uncertain !== "publish")}
                onClick={() => void editor.act("publish")}
              >
                {uncertain === "publish" ? "Yayımlamayı tekrar dene" : record?.webPublication.status === "published" ? "Kaydedilmiş sürümü yeniden yayımla" : "Yayımla"}
              </Button>
              <Button
                secondary
                disabled={!record || dirty || Boolean(busy) || conflict || record.webPublication.status === "archived" || (Boolean(uncertain) && uncertain !== "archive")}
                onClick={() => void editor.act("archive")}
              >
                {uncertain === "archive" ? "Arşivlemeyi tekrar dene" : "Arşivle"}
              </Button>
              </>
            )}
            {onPreview && (
              <Button secondary aria-pressed={preview} onClick={onPreview}>
                {preview ? "Düzenlemeye dön" : "Taslağı önizle"}
              </Button>
            )}
            <Button secondary disabled={Boolean(busy)} onClick={() => void editor.reload()}>Sunucudan yeniden yükle</Button>
          </div>
          <p className="text-xs leading-relaxed text-muted">
            {canPublish
              ? "Yayımla ve Arşivle yalnızca kaydedilmiş sürüm üzerinde çalışır. Önce değişiklikleri kaydedin."
              : "Yayımlama ve arşivleme admin'e açıktır; taslağı kaydedip bir admin'den yayımlamasını isteyin."}{" "}
            Taslağı kaydetmek yayındaki sürümü değiştirmez.
          </p>
          {publicationPanel}
          <fieldset disabled={Boolean(busy) || Boolean(uncertain) || conflict} className="min-w-0 space-y-6">
            {children}
          </fieldset>
        </form>
      )}
    </div>
  );
}
