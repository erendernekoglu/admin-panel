import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { boutiqueRequest } from "../../lib/api/boutique";
import { useAuth } from "../auth/useAuth";
import { Badge } from "../../components/atoms/Badge/Badge";
import { Button } from "../../components/atoms/Button";
import { Input } from "../../components/atoms/Input";
import { Card } from "../../components/molecules/Card";
type Team = {
  revision: number;
  limit: number;
  used: number;
  available: number;
  members: { uid: string; email: string; role: string }[];
  invitations: { id: string; email: string; role: string; expiresAt: number }[];
};
const roles: Record<string, string> = {
  owner: "Butik sahibi",
  editor: "Editör",
  viewer: "Görüntüleyici",
};
export function TeamSettings({ id }: { id: string }) {
  const client = useQueryClient(),
    queryKey = ["boutique-team", id];
  const query = useQuery({
    queryKey,
    queryFn: () =>
      boutiqueRequest<Team>(`/boutiques/${encodeURIComponent(id)}/team`),
  });
  const [saved, setSaved] = useState(false);
  const canEditLimit = useAuth().can("system.manage");
  if (query.isPending) return <p role="status" className="text-sm text-muted">Ekip bilgileri yükleniyor…</p>;
  if (query.error)
    return (
      <div role="alert" className="flex animate-pop-in flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger">
        <p className="font-semibold">{query.error.message}</p>
        <Button size="sm" variant="secondary" onClick={() => void query.refetch()}>Yeniden dene</Button>
      </div>
    );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink">Ekip ve kullanıcı limiti</h2>
        <Button
          size="sm"
          variant="ghost"
          disabled={query.isFetching}
          onClick={() => {
            setSaved(false);
            void query.refetch();
          }}
        >
          Yenile
        </Button>
      </div>
      <p className="text-sm text-muted">
        Butik sahibi, ekip üyeleri ve süresi dolmamış davetler toplam limite
        dahildir. Her davet bir kişilik yer ayırır. Mevcut kullanımın altında
        bir limit kaydedilemez.
      </p>
      <Card className="flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-3xl font-extrabold leading-none tracking-tight tabular-nums text-ink">
            {query.data.used}
            <span className="text-muted"> / {query.data.limit}</span>
          </p>
          <p className="mt-2 text-sm text-muted">
            kullanıcı · <span className="tabular-nums">{query.data.available}</span> boş yer
          </p>
        </div>
        {canEditLimit ? (
          <LimitForm
            key={`${id}-${query.data.revision}`}
            id={id}
            data={query.data}
            onEdit={() => setSaved(false)}
            onSaved={(data) => {
              client.setQueryData(queryKey, data);
              setSaved(true);
            }}
          />
        ) : (
          <p className="text-sm text-muted">Limiti yalnızca bir admin değiştirebilir.</p>
        )}
      </Card>
      {saved && <p role="status" className="animate-pop-in rounded-xl bg-success-soft p-3 text-sm font-semibold text-success">Kullanıcı limiti kaydedildi.</p>}
      <h3 className="text-base font-bold text-ink">Üyeler ({query.data.members.length})</h3>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {query.data.members.map((m) => (
          <li key={m.uid} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm hover:bg-surface-2/60">
            <span className="break-all font-medium text-ink">
              {m.email || "E-posta bilgisi yok"}
            </span>
            <Badge tone={m.role === "owner" ? "ink" : "neutral"}>{roles[m.role] || m.role}</Badge>
          </li>
        ))}
      </ul>
      <h3 className="text-base font-bold text-ink">
        Bekleyen davetler ({query.data.invitations.length})
      </h3>
      {!query.data.invitations.length && <p className="rounded-2xl border border-dashed border-line-strong p-5 text-center text-sm text-muted">Bekleyen davet yok. Butik sahibi panelden davet gönderdiğinde burada görünür.</p>}
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {query.data.invitations.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm hover:bg-surface-2/60">
            <span className="break-all font-medium text-ink">{i.email}</span>
            <span className="text-xs text-muted">
              {roles[i.role]} · {new Date(i.expiresAt).toLocaleString("tr-TR")} tarihine kadar geçerli
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
function LimitForm({
  id,
  data,
  onSaved,
  onEdit,
}: {
  id: string;
  data: Team;
  onSaved: (data: Team) => void;
  onEdit: () => void;
}) {
  const [limit, setLimit] = useState(String(data.limit)),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          onSaved(
            await boutiqueRequest<Team>(
              `/boutiques/${encodeURIComponent(id)}/team-limit`,
              { limit: Number(limit), revision: data.revision },
            ),
          );
        } catch (e) {
          setError(e instanceof Error ? e.message : "Limit kaydedilemedi.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy} className="flex flex-wrap items-end gap-3">
        <label className="block text-sm font-semibold text-ink">
          Maksimum kullanıcı sayısı
          <Input
            className="mt-1.5 block w-40 tabular-nums"
            type="number"
            min={Math.max(1, data.used)}
            max={100}
            step={1}
            required
            value={limit}
            onChange={(e) => {
              setLimit(e.target.value);
              onEdit();
            }}
          />
        </label>
        <Button
          type="submit"
          disabled={Number(limit) === data.limit}
        >
          {busy ? "Kaydediliyor…" : "Limiti kaydet"}
        </Button>
      </fieldset>
      <p className="mt-2 text-xs text-muted">
        1–100 kişi. Yeni butiklerde varsayılan limit 3 kişidir.
      </p>
      {error && (
        <p role="alert" className="mt-3 animate-pop-in rounded-xl bg-danger-soft p-3 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
