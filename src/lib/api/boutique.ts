import { queryOptions } from "@tanstack/react-query";

import { adminRequest } from "./client";

export interface BoutiqueApplication {
  id: string;
  name: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}
export interface Boutique {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  products: number;
  outfits: number;
  screens: number;
}
export interface BoutiqueEntity {
  id: string;
  name: string;
  [key: string]: unknown;
}
export interface BoutiqueDetailData {
  id: string;
  createdAt: string;
  revision: number;
  state: {
    boutique: Record<string, unknown>;
    products: BoutiqueEntity[];
    outfits: BoutiqueEntity[];
    media: BoutiqueEntity[];
    screens: BoutiqueEntity[];
    activity: { id: string; text: string; time: string }[];
  };
  devices: {
    id: string;
    lastSeen: string | null;
    appState?: "active" | "background" | null;
    appStateAt?: string | null;
    deviceReport?: {screenOn:boolean;locked:boolean;deviceOwner:boolean;kioskEnabled:boolean;kioskLocked:boolean;maintenance:boolean;androidVersion:string;model:string;uptimeSeconds:number;versionCode:number}|null;
    deviceReportAt?:string|null;
    publishedAt: string | null;
  }[];
}
export interface BoutiqueAnalytics {
  qrVisitors: number;
  totals: Record<string, number>;
  sessions: number;
  events: number;
  from: number;
  to: number;
  daily: { date: string; count: number }[];
  entities: {
    id: string;
    name: string;
    kind: string;
    source: string;
    clicks: number;
    tries: number;
    qr: number;
  }[];
  screens: {
    id: string;
    events: number;
    scans: number;
    storeClicks: number;
    connections: number;
    clicks: number;
    tries: number;
    qr: number;
  }[];
  recent: {
    id: string;
    type: string;
    screen: string;
    at: number;
    source: string;
    entities: { id: string; kind: string; name: string }[];
  }[];
}

/* ------------------------------------------------------------------------- */
/* Demo fixtures and a small typed in-memory store.                          */
/* Everything below is local fiction: no network calls and no real people.   */
/* ------------------------------------------------------------------------- */

const DEMO_ADMIN = "demo-user-01";

const svg = (label: string, from: string, to: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)"/><circle cx="480" cy="140" r="180" fill="#ffffff" opacity=".12"/><circle cx="90" cy="700" r="220" fill="#ffffff" opacity=".08"/><text x="48" y="400" fill="#ffffff" font-family="Georgia, serif" font-size="46" font-weight="700">${label}</text><text x="48" y="450" fill="#ffffff" opacity=".75" font-family="Helvetica, sans-serif" font-size="22">demo katalog görseli</text></svg>`,
  )}`;

const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

interface AiService {
  enabled: boolean;
  provider: string;
  hasApiKey: boolean;
  endpoint?: string;
  model?: string;
  loraScale?: number;
  seed?: number;
  additionalPrompt?: string;
}
interface AiSettingsData {
  revision: number;
  services: Record<
    "virtualTryOn" | "garmentAutofill" | "lookEngine" | "backgroundRemoval",
    AiService
  >;
}
interface PromotionData {
  revision: number;
  promotion: {
    mobileUrl: string;
    qrEnabled: boolean;
    qrTitle: string;
    ctaMessages: string;
    ctaAutoplay: boolean;
    ctaHoldSeconds: number;
    ctaTransitionMs: number;
    qrTimeoutSeconds: number;
  };
}
interface TeamData {
  revision: number;
  limit: number;
  used: number;
  available: number;
  members: { uid: string; email: string; role: string }[];
  invitations: { id: string; email: string; role: string; expiresAt: number }[];
}
interface DemoBoutique {
  id: string;
  createdAt: string;
  revision: number;
  state: BoutiqueDetailData["state"];
  devices: BoutiqueDetailData["devices"];
  ai: AiSettingsData;
  promotion: PromotionData;
  team: TeamData;
}

function defaultAi(): AiSettingsData {
  const service = (provider: string): AiService => ({
    enabled: false,
    provider,
    hasApiKey: false,
    endpoint: "",
  });
  return {
    revision: 1,
    services: {
      virtualTryOn: {
        ...service("demo-tryon"),
        model: "demo-tryon/standard",
        loraScale: 1,
        seed: -1,
        additionalPrompt: "",
      },
      garmentAutofill: service("demo-taxonomy"),
      lookEngine: service("demo-look"),
      backgroundRemoval: service("demo-cutout"),
    },
  };
}

function defaultPromotion(): PromotionData {
  return {
    revision: 1,
    promotion: {
      mobileUrl: "demo://butik",
      qrEnabled: true,
      qrTitle: "Koleksiyonu telefonunda aç",
      ctaMessages:
        "Kombinleri kaydet ve dene.\nFavorilerini telefonunda sakla.",
      ctaAutoplay: true,
      ctaHoldSeconds: 6,
      ctaTransitionMs: 400,
      qrTimeoutSeconds: 0,
    },
  };
}

function defaultTeam(used: number, emails: string[]): TeamData {
  return {
    revision: 1,
    limit: 3,
    used,
    available: Math.max(0, 3 - used),
    members: emails.map((email, index) => ({
      uid: index === 0 ? DEMO_ADMIN : `demo-user-0${index + 1}`,
      email,
      role: index === 0 ? "owner" : "editor",
    })),
    invitations: [],
  };
}

function boutiqueState(
  id: string,
  name: string,
  email: string,
  createdAt: string,
  options: {
    products: BoutiqueEntity[];
    outfits: BoutiqueEntity[];
    media: BoutiqueEntity[];
    screens: BoutiqueEntity[];
    address: string;
    phone: string;
    category: string;
  },
): DemoBoutique["state"] {
  return {
    boutique: {
      id,
      name,
      email,
      phone: options.phone,
      address: options.address,
      mobileUrl: "demo://butik",
      logo: svg(name, "#8a6f57", "#d8c3a5"),
      category: options.category,
      description:
        "Yerel demo butiği. Bütün kayıtlar tarayıcı belleğinde tutulur ve sayfa yenilendiğinde sıfırlanır.",
      status: "active",
    },
    products: options.products,
    outfits: options.outfits,
    media: options.media,
    screens: options.screens,
    activity: [
      { id: "act-1", text: "Butik oluşturuldu", time: createdAt },
      {
        id: "act-2",
        text: "Demo kataloğu yüklendi",
        time: iso(-45 * 60000),
      },
      {
        id: "act-3",
        text: "Vitrin ekranı yayınlandı",
        time: iso(-12 * 60000),
      },
    ],
  };
}

function product(
  id: string,
  name: string,
  price: number,
  stock: number,
  color: string,
  material: string,
  description: string,
  image: string,
): BoutiqueEntity {
  return {
    id,
    name,
    sku: id.toUpperCase(),
    price,
    stock,
    status: "active",
    color,
    material,
    sizes: "XS, S, M, L",
    fit: "Regular",
    season: "Sonbahar / Kış",
    care: "30°C hassas yıkama",
    description,
    image,
  };
}

function screen(
  id: string,
  name: string,
  location: string,
  headline: string,
  enabled: boolean,
): BoutiqueEntity {
  return {
    id,
    name,
    location,
    orientation: "portrait",
    enabled,
    theme: "light",
    behavior: "catalog",
    accent: "#8a6f57",
    background: "#faf7f0",
    text: "#2e2218",
    showPrices: true,
    headline,
    subtitle: "Yeni sezon seçkisi",
    cta: "Dokun ve keşfet",
    idleSeconds: 45,
  };
}

function device(
  id: string,
  online: boolean,
  appState: "active" | "background",
): BoutiqueDetailData["devices"][number] {
  const seen = online ? iso(-2 * 60000) : iso(-9 * 60000);
  return {
    id,
    lastSeen: seen,
    appState: online ? appState : null,
    appStateAt: seen,
    deviceReport: online
      ? {
          screenOn: true,
          locked: false,
          deviceOwner: true,
          kioskEnabled: true,
          kioskLocked: true,
          maintenance: false,
          androidVersion: "14",
          model: "Demo Tablet 10",
          uptimeSeconds: 182340,
          versionCode: 5,
        }
      : null,
    deviceReportAt: online ? seen : null,
    publishedAt: iso(-60 * 60000),
  };
}

function createBoutiqueFixtures(): DemoBoutique[] {
  const atelier: DemoBoutique = {
    id: "b-demo-01",
    createdAt: iso(-90 * 86400000),
    revision: 4,
    state: boutiqueState(
      "b-demo-01",
      "Atelier Keten",
      "atelier@example.com",
      iso(-90 * 86400000),
      {
        address: "Moda Caddesi 12, Kadıköy, İstanbul",
        phone: "+90 555 000 00 01",
        category: "Kadın giyim",
        products: [
          product(
            "p-keten-gomlek",
            "Keten Gömlek",
            1450,
            18,
            "Kırık beyaz",
            "%100 keten",
            "Günlük kullanım için gevşek kesim keten gömlek.",
            svg("Keten Gömlek", "#c8b8a4", "#8a7563"),
          ),
          product(
            "p-yun-ceket",
            "Yün Ceket",
            3200,
            6,
            "Hardal",
            "%70 yün, %30 polyester",
            "Yapılandırılmış omuzlu, astarlı yün ceket.",
            svg("Yün Ceket", "#c08a3e", "#7c4f1d"),
          ),
          product(
            "p-midi-etek",
            "Midi Etek",
            1890,
            11,
            "Zeytin",
            "%55 viskon, %45 keten",
            "Pileli midi etek, gizli yan fermuar.",
            svg("Midi Etek", "#7f8a5e", "#4b5334"),
          ),
        ],
        outfits: [
          {
            id: "o-keten-ofis",
            name: "Keten ofis kombini",
            description: "Gömlek, pantolon ve ince kemer.",
            productIds: ["p-keten-gomlek", "p-midi-etek"],
            image: svg("Ofis Kombini", "#a99a86", "#5f5548"),
          },
          {
            id: "o-hardal-akşam",
            name: "Hardal akşam kombini",
            description: "Yün ceket ve koyu tonlarda alt parça.",
            productIds: ["p-yun-ceket", "p-midi-etek"],
            image: svg("Akşam Kombini", "#b5803a", "#57351a"),
          },
        ],
        media: [
          {
            id: "m-sezon-filmi",
            name: "Sezon tanıtımı",
            type: "image",
            url: svg("Sezon Tanıtımı", "#7d6a58", "#3f362d"),
            seconds: 8,
            description: "Vitrin ekranı için sezon görseli.",
          },
          {
            id: "m-kumas-detay",
            name: "Kumaş detayı",
            type: "image",
            url: svg("Kumaş Detayı", "#cbb99f", "#8f7c66"),
            seconds: 6,
            description: "Keten dokusunun yakın çekimi.",
          },
        ],
        screens: [
          screen(
            "s-giris",
            "Giriş Ekranı",
            "Mağaza girişi",
            "Sonbahar seçkisi",
            true,
          ),
          screen(
            "s-deneme",
            "Deneme Odası",
            "Deneme kabini koridoru",
            "Sana uygun kombini bul",
            true,
          ),
        ],
      },
    ),
    devices: [device("s-giris", true, "active"), device("s-deneme", false, "background")],
    ai: defaultAi(),
    promotion: defaultPromotion(),
    team: defaultTeam(2, ["atelier@example.com", "editor@example.com"]),
  };

  const mono: DemoBoutique = {
    id: "b-demo-02",
    createdAt: iso(-40 * 86400000),
    revision: 2,
    state: boutiqueState(
      "b-demo-02",
      "Mono Studio",
      "mono@example.com",
      iso(-40 * 86400000),
      {
        address: "Cumhuriyet Caddesi 88, Şişli, İstanbul",
        phone: "+90 555 000 00 02",
        category: "Unisex giyim",
        products: [
          product(
            "p-basic-tisort",
            "Basic Tişört",
            420,
            40,
            "Antrasit",
            "%100 organik pamuk",
            "Ağır gramajlı, düşük omuz basic tişört.",
            svg("Basic Tişört", "#6b6b6b", "#2f2f2f"),
          ),
          product(
            "p-genis-pantolon",
            "Geniş Paça Pantolon",
            1690,
            14,
            "Siyah",
            "%98 pamuk, %2 elastan",
            "Yüksek bel, geniş paça günlük pantolon.",
            svg("Geniş Pantolon", "#4a4a4a", "#1c1c1c"),
          ),
        ],
        outfits: [
          {
            id: "o-mono-gunluk",
            name: "Mono günlük",
            description: "Tişört ve geniş paça pantolon.",
            productIds: ["p-basic-tisort", "p-genis-pantolon"],
            image: svg("Mono Günlük", "#8c8c8c", "#3a3a3a"),
          },
        ],
        media: [
          {
            id: "m-mono-look",
            name: "Mono look",
            type: "image",
            url: svg("Mono Look", "#9a9a9a", "#4d4d4d"),
            seconds: 7,
            description: "Tek renk kombin görseli.",
          },
        ],
        screens: [
          screen("s-vitrin", "Vitrin Ekranı", "Mağaza vitrini", "Tek renk, tek duruş", true),
        ],
      },
    ),
    devices: [device("s-vitrin", true, "active")],
    ai: defaultAi(),
    promotion: {
      ...defaultPromotion(),
      promotion: {
        ...defaultPromotion().promotion,
        qrTitle: "Koleksiyonu telefonuna taşı",
      },
    },
    team: defaultTeam(1, ["mono@example.com"]),
  };

  const sahil: DemoBoutique = {
    id: "b-demo-03",
    createdAt: iso(-8 * 86400000),
    revision: 1,
    state: boutiqueState(
      "b-demo-03",
      "Sahil Denim",
      "sahil@example.com",
      iso(-8 * 86400000),
      {
        address: "Sahil Yolu 4, Çeşme, İzmir",
        phone: "+90 555 000 00 03",
        category: "Denim",
        products: [
          product(
            "p-sahil-jean",
            "Sahil Jean",
            2100,
            9,
            "Açık mavi",
            "%100 pamuk denim",
            "Yüksek bel, düz kesim denim pantolon.",
            svg("Sahil Jean", "#7aa2c4", "#345b7d"),
          ),
        ],
        outfits: [],
        media: [],
        screens: [
          screen("s-sahil-vitrin", "Sahil Vitrini", "Giriş", "Denim sezonu", false),
        ],
      },
    ),
    devices: [],
    ai: defaultAi(),
    promotion: defaultPromotion(),
    team: defaultTeam(1, ["sahil@example.com"]),
  };

  return [atelier, mono, sahil];
}

const applications: BoutiqueApplication[] = [
  {
    id: "app-demo-01",
    name: "Nilüfer Örme",
    email: "nilufer@example.com",
    status: "pending",
    createdAt: iso(-3 * 86400000),
  },
  {
    id: "app-demo-02",
    name: "Kuzey Deri",
    email: "kuzey@example.com",
    status: "pending",
    createdAt: iso(-2 * 86400000),
  },
  {
    id: "app-demo-03",
    name: "Lale Vitrin",
    email: "lale@example.com",
    status: "pending",
    createdAt: iso(-20 * 3600000),
  },
  {
    id: "app-demo-04",
    name: "Mono Studio",
    email: "mono@example.com",
    status: "approved",
    createdAt: iso(-45 * 86400000),
    reviewedAt: iso(-40 * 86400000),
    reviewedBy: DEMO_ADMIN,
  },
  {
    id: "app-demo-05",
    name: "Eski Sandık",
    email: "sandik@example.com",
    status: "rejected",
    createdAt: iso(-60 * 86400000),
    reviewedAt: iso(-58 * 86400000),
    reviewedBy: DEMO_ADMIN,
  },
];

let boutiques = createBoutiqueFixtures();

function boutiqueOrThrow(id: string): DemoBoutique {
  const found = boutiques.find((item) => item.id === id);
  if (!found) throw new Error(`Boutique ${id} was not found.`);
  return found;
}

function listBoutiques(): Boutique[] {
  return boutiques.map((item) => ({
    id: item.id,
    name: String(item.state.boutique.name),
    email: String(item.state.boutique.email),
    createdAt: item.createdAt,
    products: item.state.products.length,
    outfits: item.state.outfits.length,
    screens: item.state.screens.length,
  }));
}

function detailOf(item: DemoBoutique): BoutiqueDetailData {
  return {
    id: item.id,
    createdAt: item.createdAt,
    revision: item.revision,
    state: item.state,
    devices: item.devices,
  };
}

function decideApplication(id: string, status: "approved" | "rejected"): BoutiqueApplication {
  const application = applications.find((item) => item.id === id);
  if (!application) throw new Error(`Application ${id} was not found.`);
  if (application.status !== "pending") {
    throw new Error("Only pending applications can be reviewed.");
  }
  application.status = status;
  application.reviewedAt = iso(0);
  application.reviewedBy = DEMO_ADMIN;
  if (status === "approved") {
    const exists = boutiques.some(
      (item) => String(item.state.boutique.email) === application.email,
    );
    if (!exists) {
      const created = iso(0);
      boutiques = [
        ...boutiques,
        {
          id: `b-demo-${String(boutiques.length + 1).padStart(2, "0")}`,
          createdAt: created,
          revision: 1,
          state: boutiqueState(
            `b-demo-${String(boutiques.length + 1).padStart(2, "0")}`,
            application.name,
            application.email,
            created,
            {
              address: "Adres henüz girilmedi",
              phone: "",
              category: "Yeni butik",
              products: [],
              outfits: [],
              media: [],
              screens: [],
            },
          ),
          devices: [],
          ai: defaultAi(),
          promotion: defaultPromotion(),
          team: defaultTeam(1, [application.email]),
        },
      ];
    }
  }
  return { ...application };
}

const eventTypes = [
  "session_start",
  "collection_open",
  "product_click",
  "outfit_click",
  "try_start",
  "photo_capture",
  "demo_result",
  "qr_open",
  "qr_landing_open",
  "qr_app_open",
  "qr_app_store_click",
  "qr_play_store_click",
  "qr_connected",
  "filter_change",
] as const;

function analyticsOf(
  item: DemoBoutique,
  params: { days: number; screen: string; source: string },
): BoutiqueAnalytics {
  const days = [1, 7, 30, 90].includes(params.days) ? params.days : 7;
  const selectedScreens = params.screen
    ? item.state.screens.filter((screen) => screen.id === params.screen)
    : item.state.screens;
  if (params.screen && !selectedScreens.length) {
    throw new Error(`Screen ${params.screen} was not found for this boutique.`);
  }
  const knownSource = ["native", "qr-mobile", "web", "native-demo"].includes(
    params.source,
  );
  if (params.source && !knownSource) {
    throw new Error(`Source ${params.source} is not a known analytics source.`);
  }
  const source = params.source || "native";
  const screenWeight = Math.max(1, selectedScreens.length);
  const seed = item.id
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const to = Date.now();
  const from = to - days * 86400000;

  const totals: Record<string, number> = {};
  eventTypes.forEach((type, index) => {
    const base = Math.round(
      (seed % 17) * screenWeight + (index + 3) * screenWeight * (days >= 30 ? 4 : 2),
    );
    const sourceFactor =
      source === "qr-mobile" ? (type.startsWith("qr_") ? 2 : 0.3) : source === "web" ? 0.6 : 1;
    totals[type] = Math.max(0, Math.round(base * sourceFactor));
  });
  const events = Object.values(totals).reduce((sum, count) => sum + count, 0);
  const sessions = Math.max(1, Math.round(events / 5));
  const qrVisitors = Math.max(0, Math.round(totals.qr_landing_open * 0.8));

  const daily: { date: string; count: number }[] = [];
  let remaining = events;
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(to - offset * 86400000).toISOString().slice(0, 10);
    const share =
      offset === 0
        ? remaining
        : Math.round((remaining / (offset + 1)) * (0.7 + ((seed + offset) % 5) / 10));
    const count = Math.max(0, Math.min(remaining, share));
    daily.push({ date, count });
    remaining -= count;
  }

  const entities: BoutiqueAnalytics["entities"] = [
    ...item.state.products.map((entity, index) => ({
      id: entity.id,
      name: entity.name,
      kind: "product",
      source,
      clicks: Math.max(1, Math.round(totals.product_click / (index + 2))),
      tries: Math.max(0, Math.round(totals.try_start / (index + 3))),
      qr: Math.max(0, Math.round(totals.qr_landing_open / (index + 3))),
    })),
    ...item.state.outfits.map((entity, index) => ({
      id: entity.id,
      name: entity.name,
      kind: "outfit",
      source,
      clicks: Math.max(1, Math.round(totals.outfit_click / (index + 2))),
      tries: Math.max(0, Math.round(totals.try_start / (index + 4))),
      qr: Math.max(0, Math.round(totals.qr_landing_open / (index + 4))),
    })),
  ].sort((a, b) => b.tries - a.tries || b.clicks - a.clicks);

  const screens: BoutiqueAnalytics["screens"] = selectedScreens.map((entity, index) => ({
    id: entity.id,
    events: Math.max(0, Math.round(events / (index + 1.5))),
    scans: Math.max(0, Math.round(totals.qr_landing_open / (index + 2))),
    storeClicks: Math.max(
      0,
      Math.round(
        (totals.qr_app_store_click + totals.qr_play_store_click) / (index + 2),
      ),
    ),
    connections: Math.max(0, Math.round(totals.qr_connected / (index + 2))),
    clicks: Math.max(
      0,
      Math.round((totals.product_click + totals.outfit_click) / (index + 2)),
    ),
    tries: Math.max(0, Math.round(totals.try_start / (index + 2))),
    qr: Math.max(0, Math.round(totals.qr_open / (index + 2))),
  }));

  const recent: BoutiqueAnalytics["recent"] = Array.from({ length: 30 }, (_, index) => {
    const type = eventTypes[(seed + index) % eventTypes.length];
    const target = selectedScreens[index % Math.max(1, selectedScreens.length)];
    const product =
      index % 3 === 0 && item.state.products.length
        ? item.state.products[index % item.state.products.length]
        : undefined;
    const outfit =
      index % 3 === 1 && item.state.outfits.length
        ? item.state.outfits[index % item.state.outfits.length]
        : undefined;
    return {
      id: `evt-${item.id}-${index}`,
      type,
      screen: target?.id ?? "",
      at: to - index * 37 * 60000,
      source,
      entities: product
        ? [{ id: product.id, kind: "product", name: product.name }]
        : outfit
          ? [{ id: outfit.id, kind: "outfit", name: outfit.name }]
          : [],
    };
  });

  return {
    qrVisitors,
    totals,
    sessions,
    events,
    from,
    to,
    daily,
    entities,
    screens,
    recent,
  };
}

function saveAiSettings(item: DemoBoutique, body: Record<string, unknown>): AiSettingsData {
  if (Number(body.revision) !== item.ai.revision) {
    throw new Error("AI settings changed since they were loaded. Reload and try again.");
  }
  const incoming = body.services;
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    throw new Error("AI settings payload is missing services.");
  }
  const next: AiSettingsData = {
    revision: item.ai.revision + 1,
    services: { ...item.ai.services },
  };
  for (const name of Object.keys(item.ai.services) as (keyof AiSettingsData["services"])[]) {
    const patch = (incoming as Record<string, unknown>)[name];
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) continue;
    const value = patch as Record<string, unknown>;
    const previous = next.services[name];
    const clearApiKey = value.clearApiKey === true;
    const apiKey = typeof value.apiKey === "string" ? value.apiKey.trim() : "";
    next.services[name] = {
      ...previous,
      enabled: value.enabled === true,
      provider:
        typeof value.provider === "string" && value.provider.trim()
          ? value.provider.trim()
          : previous.provider,
      endpoint: typeof value.endpoint === "string" ? value.endpoint.trim() : previous.endpoint,
      hasApiKey: clearApiKey ? false : apiKey ? true : previous.hasApiKey,
      ...(typeof value.model === "string" ? { model: value.model } : {}),
      ...(typeof value.loraScale === "number" ? { loraScale: value.loraScale } : {}),
      ...(typeof value.seed === "number" ? { seed: value.seed } : {}),
      ...(typeof value.additionalPrompt === "string"
        ? { additionalPrompt: value.additionalPrompt }
        : {}),
    };
  }
  item.ai = next;
  item.revision += 1;
  return next;
}

function savePromotion(item: DemoBoutique, body: Record<string, unknown>): PromotionData {
  if (Number(body.revision) !== item.promotion.revision) {
    throw new Error("Promotion settings changed since they were loaded. Reload and try again.");
  }
  const promotion = body.promotion;
  if (!promotion || typeof promotion !== "object" || Array.isArray(promotion)) {
    throw new Error("Promotion settings payload is missing promotion.");
  }
  const value = promotion as Record<string, unknown>;
  const title = typeof value.qrTitle === "string" ? value.qrTitle.trim() : "";
  const messages = typeof value.ctaMessages === "string" ? value.ctaMessages.trim() : "";
  if (!title || title.length > 80) {
    throw new Error("QR title must be between 1 and 80 characters.");
  }
  if (!messages || messages.length > 2000) {
    throw new Error("Promotion messages must be between 1 and 2000 characters.");
  }
  const hold = Number(value.ctaHoldSeconds);
  const transition = Number(value.ctaTransitionMs);
  const timeout = Number(value.qrTimeoutSeconds);
  if (!Number.isInteger(hold) || hold < 1 || hold > 120) {
    throw new Error("Message hold seconds must be an integer between 1 and 120.");
  }
  if (!Number.isInteger(transition) || transition < 0 || transition > 3000) {
    throw new Error("Message transition must be an integer between 0 and 3000 ms.");
  }
  if (!Number.isInteger(timeout) || (timeout !== 0 && (timeout < 10 || timeout > 1800))) {
    throw new Error("QR timeout must be 0 or an integer between 10 and 1800 seconds.");
  }
  item.promotion = {
    revision: item.promotion.revision + 1,
    promotion: {
      mobileUrl: typeof value.mobileUrl === "string" ? value.mobileUrl : "demo://butik",
      qrEnabled: value.qrEnabled === true,
      qrTitle: title,
      ctaMessages: messages,
      ctaAutoplay: value.ctaAutoplay === true,
      ctaHoldSeconds: hold,
      ctaTransitionMs: transition,
      qrTimeoutSeconds: timeout,
    },
  };
  item.revision += 1;
  return item.promotion;
}

function saveTeamLimit(item: DemoBoutique, body: Record<string, unknown>): TeamData {
  if (Number(body.revision) !== item.team.revision) {
    throw new Error("Team settings changed since they were loaded. Reload and try again.");
  }
  const limit = Number(body.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("User limit must be an integer between 1 and 100.");
  }
  if (limit < item.team.used) {
    throw new Error("User limit cannot be lower than the current number of users.");
  }
  item.team = {
    ...item.team,
    revision: item.team.revision + 1,
    limit,
    available: limit - item.team.used,
  };
  item.revision += 1;
  return item.team;
}

function demoBoutiqueCall<T>(path: string, status?: unknown): T {
  const url = new URL(path, "http://demo.local");
  const parts = url.pathname.split("/").filter(Boolean);
  const [root, id, action] = parts;
  const body =
    status && typeof status === "object" ? (status as Record<string, unknown>) : undefined;

  if (root === "applications" && !id) return applications.map((item) => ({ ...item })) as T;
  if (root === "applications" && id && action === "decision") {
    if (status !== "approved" && status !== "rejected") {
      throw new Error("Application decision must be approved or rejected.");
    }
    return decideApplication(decodeURIComponent(id), status) as T;
  }
  if (root === "boutiques" && !id) return listBoutiques() as T;
  if (root === "boutiques" && id) {
    const item = boutiqueOrThrow(decodeURIComponent(id));
    if (!action) return detailOf(item) as T;
    if (action === "analytics") {
      return analyticsOf(item, {
        days: Number(url.searchParams.get("days") ?? 7),
        screen: url.searchParams.get("screen") ?? "",
        source: url.searchParams.get("source") ?? "",
      }) as T;
    }
    if (action === "ai-settings") {
      if (!status) return { ...item.ai, services: { ...item.ai.services } } as T;
      if (!body) throw new Error("AI settings save requires a JSON body.");
      return saveAiSettings(item, body) as T;
    }
    if (action === "promotion") {
      if (!status) return { ...item.promotion } as T;
      if (!body) throw new Error("Promotion save requires a JSON body.");
      return savePromotion(item, body) as T;
    }
    if (action === "team") return { ...item.team } as T;
    if (action === "team-limit") {
      if (!body) throw new Error("Team limit save requires a JSON body.");
      return saveTeamLimit(item, body) as T;
    }
  }
  throw new Error(`Unsupported boutique operation: ${path}`);
}

function operationFor(path: string, status?: unknown): { operation: string; payload: unknown } {
  const url = new URL(path, "http://demo.local");
  const parts = url.pathname.split("/").filter(Boolean);
  const [root, id, action] = parts;
  if (root === "applications" && !id) {
    return { operation: "boutique.listApplications", payload: {} };
  }
  if (root === "applications" && id && action === "decision") {
    return {
      operation: "boutique.decideApplication",
      payload: { id: decodeURIComponent(id), status },
    };
  }
  if (root === "boutiques" && !id) {
    return { operation: "boutique.list", payload: {} };
  }
  if (root === "boutiques" && id && !action) {
    return { operation: "boutique.get", payload: { id: decodeURIComponent(id) } };
  }
  if (root === "boutiques" && id && action === "analytics") {
    return {
      operation: "boutique.analytics",
      payload: {
        id: decodeURIComponent(id),
        days: Number(url.searchParams.get("days") ?? 7),
        screen: url.searchParams.get("screen") ?? "",
        source: url.searchParams.get("source") ?? "",
      },
    };
  }
  if (root === "boutiques" && id && action === "ai-settings") {
    return {
      operation: status ? "boutique.saveAiSettings" : "boutique.getAiSettings",
      payload: { id: decodeURIComponent(id), ...(status ? { settings: status } : {}) },
    };
  }
  if (root === "boutiques" && id && action === "promotion") {
    return {
      operation: status ? "boutique.savePromotion" : "boutique.getPromotion",
      payload: { id: decodeURIComponent(id), ...(status ? { settings: status } : {}) },
    };
  }
  if (root === "boutiques" && id && action === "team") {
    return { operation: "boutique.getTeam", payload: { id: decodeURIComponent(id) } };
  }
  if (root === "boutiques" && id && action === "team-limit") {
    return {
      operation: "boutique.saveTeamLimit",
      payload: { id: decodeURIComponent(id), limit: status },
    };
  }
  throw new Error(`Unsupported boutique operation: ${path}`);
}

export async function boutiqueRequest<T>(
  path: string,
  status?: "approved" | "rejected" | Record<string, unknown>,
): Promise<T> {
  const { operation, payload } = operationFor(path, status);
  return adminRequest<T>(operation, payload, () => demoBoutiqueCall<T>(path, status));
}

/** Boutique list shared by the Boutiques page and the command palette. */
export const boutiquesQueryOptions = queryOptions({
  queryKey: ["boutique", "boutiques"],
  queryFn: () => boutiqueRequest<Boutique[]>("/boutiques"),
  staleTime: 60000,
});
