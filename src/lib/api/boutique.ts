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
/* Local in-memory preview.                                                  */
/* The panel starts empty: no boutiques, applications, products, screens,    */
/* team members, devices or activity entries are seeded. Records exist only  */
/* after the user adds them in this session; nothing leaves the browser.     */
/* ------------------------------------------------------------------------- */

const DEMO_ADMIN = "preview-admin";

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
  const service = (): AiService => ({
    enabled: false,
    provider: "",
    hasApiKey: false,
    endpoint: "",
  });
  return {
    revision: 1,
    services: {
      virtualTryOn: {
        ...service(),
        model: "",
        loraScale: 1,
        seed: -1,
        additionalPrompt: "",
      },
      garmentAutofill: service(),
      lookEngine: service(),
      backgroundRemoval: service(),
    },
  };
}

function defaultPromotion(): PromotionData {
  return {
    revision: 1,
    promotion: {
      mobileUrl: "",
      qrEnabled: false,
      qrTitle: "",
      ctaMessages: "",
      ctaAutoplay: false,
      ctaHoldSeconds: 6,
      ctaTransitionMs: 400,
      qrTimeoutSeconds: 0,
    },
  };
}

/** A new boutique starts without team members or invitations. */
function defaultTeam(): TeamData {
  const limit = 3;
  return {
    revision: 1,
    limit,
    used: 0,
    available: limit,
    members: [],
    invitations: [],
  };
}


/** A newly approved boutique starts unconfigured: no catalog, media, screens or activity. */
function boutiqueState(
  id: string,
  name: string,
  email: string,
): DemoBoutique["state"] {
  return {
    boutique: {
      id,
      name,
      email,
      phone: "",
      address: "",
      mobileUrl: "",
      logo: "",
      category: "",
      description: "",
      status: "draft",
    },
    products: [],
    outfits: [],
    media: [],
    screens: [],
    activity: [],
  };
}

const applications: BoutiqueApplication[] = [];
let boutiques: DemoBoutique[] = [];

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
      const boutiqueId = `b-local-${String(boutiques.length + 1).padStart(2, "0")}`;
      boutiques = [
        ...boutiques,
        {
          id: boutiqueId,
          createdAt: created,
          revision: 1,
          state: boutiqueState(
            boutiqueId,
            application.name,
            application.email,
          ),
          devices: [],
          ai: defaultAi(),
          promotion: defaultPromotion(),
          team: defaultTeam(),
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
  const to = Date.now();
  const from = to - days * 86400000;

  // Local preview analytics are measured data only. Nothing has been measured
  // for a boutique whose content the user has not added yet, so every counter
  // stays at zero instead of being derived from identifiers or fixtures.
  const totals: Record<string, number> = {};
  for (const type of eventTypes) totals[type] = 0;

  const daily: { date: string; count: number }[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    daily.push({
      date: new Date(to - offset * 86400000).toISOString().slice(0, 10),
      count: 0,
    });
  }

  const entities: BoutiqueAnalytics["entities"] = [
    ...item.state.products.map((entity) => ({
      id: entity.id,
      name: entity.name,
      kind: "product",
      source: "",
      clicks: 0,
      tries: 0,
      qr: 0,
    })),
    ...item.state.outfits.map((entity) => ({
      id: entity.id,
      name: entity.name,
      kind: "outfit",
      source: "",
      clicks: 0,
      tries: 0,
      qr: 0,
    })),
  ];

  const screens: BoutiqueAnalytics["screens"] = selectedScreens.map((entity) => ({
    id: entity.id,
    events: 0,
    scans: 0,
    storeClicks: 0,
    connections: 0,
    clicks: 0,
    tries: 0,
    qr: 0,
  }));

  return {
    qrVisitors: 0,
    totals,
    sessions: 0,
    events: 0,
    from,
    to,
    daily,
    entities,
    screens,
    recent: [],
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
      mobileUrl: typeof value.mobileUrl === "string" ? value.mobileUrl : "",
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
