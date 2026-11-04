import { BoutiqueDetail } from "../features/boutique/BoutiqueDetail";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, RefreshCw, Search } from "lucide-react";
import { Button } from "../components/atoms/Button";
import { Badge, type BadgeTone } from "../components/atoms/Badge/Badge";
import { Input } from "../components/atoms/Input";
import { Card } from "../components/molecules/Card";
import {
  Dialog,
  DialogBody,
  DialogError,
  DialogFooter,
  DialogHeader,
} from "../components/molecules/Dialog";
import { PageHeader } from "../components/molecules/PageHeader";
import { cn } from "../lib/utils";
import {
  boutiqueRequest,
  boutiquesQueryOptions,
  type BoutiqueApplication,
} from "../lib/api/boutique";
import { Select } from "../components/molecules/Select";

const labels = {
  pending: "Bekleyen",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};
const tones: Record<BoutiqueApplication["status"], BadgeTone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};
const date = (value?: string) =>
  value ? new Date(value).toLocaleString("tr-TR") : "—";
const th = "px-4 py-3 text-xs font-semibold text-muted";
const td = "px-4 py-3.5 align-top";

export default function BoutiquePage() {
  const client = useQueryClient();
  const [tab, setTab] = useState<"applications" | "boutiques">("boutiques");
  // The open boutique lives in the URL (?shop=) so it can be linked to,
  // e.g. from the command palette.
  const [searchParams, setSearchParams] = useSearchParams();
  const selected = searchParams.get("shop") ?? "";
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("pending");
  const [decision, setDecision] = useState<{
    item: BoutiqueApplication;
    status: "approved" | "rejected";
  } | null>(null);
  const applications = useQuery({
    queryKey: ["boutique", "applications"],
    queryFn: () => boutiqueRequest<BoutiqueApplication[]>("/applications"),
    staleTime: 60000,
    retry: 1,
  });
  const boutiques = useQuery({ ...boutiquesQueryOptions, retry: 1 });
  const mutation = useMutation({
    mutationFn: ({ item, status }: NonNullable<typeof decision>) =>
      boutiqueRequest(
        `/applications/${encodeURIComponent(item.id)}/decision`,
        status,
      ),
    onSuccess: async () => {
      setDecision(null);
      await client.invalidateQueries({ queryKey: ["boutique"] });
    },
  });
  const matches = (item: { name: string; email: string }) =>
    (item.name + " " + item.email)
      .toLocaleLowerCase("tr-TR")
      .includes(search.toLocaleLowerCase("tr-TR"));
  const rows =
    applications.data?.filter(
      (item) => matches(item) && (filter === "all" || item.status === filter),
    ) ?? [];
  const shops = boutiques.data?.filter(matches) ?? [];
  const current = tab === "applications" ? applications : boutiques;
  const pendingCount = applications.data?.filter((r) => r.status === "pending").length;
  const summary: [string, number | undefined][] = [
    ["Bekleyen başvuru", pendingCount],
    ["Onaylanan başvuru", applications.data?.filter((r) => r.status === "approved").length],
    ["Aktif butik", boutiques.data?.length],
  ];
  const segments = [
    { key: "applications" as const, label: "Başvurular", count: pendingCount },
    { key: "boutiques" as const, label: "Butikler", count: undefined },
  ];
  const openShop = (id: string) => {
    setTab("boutiques");
    setSearchParams({ shop: id }, { replace: true });
  };
  useEffect(() => {
    if (!selected) return;
    setTab("boutiques");
    requestAnimationFrame(() =>
      document.getElementById("boutique-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }, [selected]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Butikler"
        description="Butik başvurularını değerlendirin ve açılan çalışma alanlarını takip edin."
        actions={
          <Button
            variant="secondary"
            disabled={current.isFetching}
            onClick={() =>
              void client.invalidateQueries({ queryKey: ["boutique"] })
            }
          >
            <RefreshCw aria-hidden="true" className={cn("size-4", current.isFetching && "animate-spin")} />
            Yenile
          </Button>
        }
      />

      <Card className="grid grid-cols-3 divide-x divide-line overflow-hidden">
        {summary.map(([label, count]) => (
          <div key={label} className="min-w-0 px-4 py-4 sm:px-6 sm:py-5">
            <p className="text-[clamp(1.6rem,4vw,2.4rem)] font-extrabold leading-none tracking-tight tabular-nums text-ink">
              {count ?? "—"}
            </p>
            <p className="mt-2 truncate text-xs font-medium text-muted sm:text-sm">{label}</p>
          </div>
        ))}
      </Card>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div
          role="tablist"
          aria-label="Butik görünümü"
          className="relative grid w-full grid-cols-2 rounded-full border border-line bg-surface-2 p-1 sm:w-80"
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-surface shadow-card transition-transform duration-300 ease-[var(--ease-panel)]",
              tab === "boutiques" && "translate-x-full",
            )}
          />
          {segments.map((segment) => (
            <button
              key={segment.key}
              type="button"
              role="tab"
              aria-selected={tab === segment.key}
              onClick={() => setTab(segment.key)}
              className={cn(
                "relative z-10 inline-flex h-9 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors duration-200",
                tab === segment.key ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              {segment.label}
              {!!segment.count && (
                <span className="rounded-full bg-accent px-1.5 text-[11px] font-bold leading-[18px] tabular-nums text-on-accent">
                  {segment.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              aria-label="Butik veya e-posta ara"
              placeholder="Butik veya e-posta ara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 sm:w-72"
            />
          </div>
          {tab === "applications" && (
            <Select
              aria-label="Başvuru durumu"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Tüm durumlar</option>
              {Object.entries(labels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>

      {current.isPending ? (
        <p role="status" className="text-sm text-muted">Yükleniyor…</p>
      ) : current.error ? (
        <div role="alert" className="flex animate-pop-in flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger">
          <p><strong className="font-semibold">{current.error.message}</strong> Bağlantınızı kontrol edip yeniden deneyin.</p>
          <Button size="sm" variant="secondary" onClick={() => void current.refetch()}>Yeniden dene</Button>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line bg-surface-2">
                <tr>
                  <th className={th}>Butik / iletişim</th>
                  <th className={th}>Tarih</th>
                  <th className={th}>
                    {tab === "applications" ? "Durum" : "İçerik"}
                  </th>
                  <th className={cn(th, tab === "boutiques" && "text-right")}>
                    {tab === "applications" ? "İşlem" : "Ekranlar"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tab === "applications"
                  ? rows.map((item) => (
                      <tr key={item.id} className="border-b border-line last:border-0 hover:bg-surface-2/60">
                        <td className={td}>
                          <p className="font-semibold text-ink">{item.name}</p>
                          <a
                            className="text-xs text-accent underline-offset-4 hover:underline"
                            href={`mailto:${item.email}`}
                          >
                            {item.email}
                          </a>
                        </td>
                        <td className={cn(td, "whitespace-nowrap text-ink-soft")}>{date(item.createdAt)}</td>
                        <td className={td}>
                          <Badge tone={tones[item.status]}>{labels[item.status]}</Badge>
                          {item.reviewedAt && (
                            <p className="mt-1.5 text-xs text-muted">
                              {date(item.reviewedAt)}
                            </p>
                          )}
                        </td>
                        <td className={td}>
                          {item.status === "pending" ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  mutation.reset();
                                  setDecision({ item, status: "approved" });
                                }}
                              >
                                Onayla
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  mutation.reset();
                                  setDecision({ item, status: "rejected" });
                                }}
                              >
                                Reddet
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  : shops.map((item) => {
                      const isSelected = selected === item.id;
                      return (
                        <tr
                          key={item.id}
                          className={cn(
                            "border-b border-line last:border-0",
                            isSelected ? "bg-surface-3" : "hover:bg-surface-2/60",
                          )}
                        >
                          <td className={td}>
                            <button
                              type="button"
                              aria-pressed={isSelected}
                              className="group inline-flex items-center gap-1 text-left font-semibold text-ink hover:text-accent"
                              onClick={() => openShop(item.id)}
                            >
                              {item.name}
                              <ChevronRight aria-hidden="true" className="size-4 text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent" />
                              <span className="sr-only">· Detayları gör</span>
                            </button>
                            <p className="text-xs text-muted">{item.email}</p>
                          </td>
                          <td className={cn(td, "whitespace-nowrap text-ink-soft")}>{date(item.createdAt)}</td>
                          <td className={cn(td, "text-ink-soft tabular-nums")}>
                            {item.products} ürün · {item.outfits} kombin
                          </td>
                          <td className={cn(td, "text-right tabular-nums text-ink-soft")}>{item.screens}</td>
                        </tr>
                      );
                    })}
                {!(tab === "applications" ? rows.length : shops.length) && (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-sm text-muted">
                      {search || (tab === "applications" && filter !== "all")
                        ? "Bu aramaya uyan kayıt yok. Arama metnini veya durum filtresini değiştirin."
                        : tab === "applications"
                          ? "Henüz başvuru yok. Yeni başvurular geldiğinde burada listelenir."
                          : "Henüz açılmış butik yok. Bir başvuruyu onayladığınızda butik burada görünür."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <p className="text-xs text-muted">
        En fazla 500 kayıt gösterilir. Başvurular en yeniden eskiye sıralanır.
      </p>

      {tab === "boutiques" && (
        <div id="boutique-detail" className="scroll-mt-6 space-y-5">
          {selected ? (
            <BoutiqueDetail key={selected} id={selected} />
          ) : (
            <p className="rounded-2xl border border-dashed border-line-strong p-8 text-center text-sm text-muted">
              Analizlerini ve verilerini incelemek için listeden bir butik seçin.
            </p>
          )}
        </div>
      )}

      {decision && (
        <Dialog
          labelledBy="boutique-decision-title"
          onClose={mutation.isPending ? undefined : () => setDecision(null)}
          size="sm"
        >
          <DialogHeader
            description={
              <>
                <strong className="text-ink">{decision.item.name}</strong> · {decision.item.email}
              </>
            }
            id="boutique-decision-title"
          >
            {decision.status === "approved" ? "Butiği aç" : "Başvuruyu reddet"}
          </DialogHeader>
          <DialogBody>
            <p className="text-sm leading-relaxed text-ink-soft">
              {decision.status === "approved"
                ? "Görüşmenizi tamamladıysanız onaylayın. Kullanıcı için boş bir butik oluşturulacak ve panel erişimi açılacak."
                : "Kullanıcı butik paneline erişemeyecek ve başvurusunun onaylanmadığını görecek."}
            </p>
            {mutation.error && <DialogError>{mutation.error.message}</DialogError>}
          </DialogBody>
          <DialogFooter>
            <Button
              variant="secondary"
              disabled={mutation.isPending}
              onClick={() => setDecision(null)}
            >
              Vazgeç
            </Button>
            <Button
              variant={decision.status === "approved" ? "accent" : "danger"}
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(decision)}
            >
              {mutation.isPending
                ? "İşleniyor…"
                : decision.status === "approved"
                  ? "Onayla ve butiği aç"
                  : "Başvuruyu reddet"}
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </section>
  );
}
