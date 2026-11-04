import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router";

import { PageLoader } from "../components/molecules/PageLoader";
import { AdminLayout } from "../components/templates/AdminLayout";
import AdminRoute from "../features/auth/AdminRoute";
import PublicOnlyRoute from "../features/auth/PublicOnlyRoute";
import { RequirePermission } from "../features/auth/RequirePermission";
import type { Permission } from "../lib/auth/permissions";
import { pageModules } from "./routeModules";

const LookbookPage = lazy(pageModules.lookbook);
const StyleEventsPage = lazy(pageModules.styleEvents);
const AccessDeniedPage = lazy(pageModules.accessDenied);
const AnalyticsPage = lazy(pageModules.analytics);
const ApiKeyDetailPage = lazy(pageModules.apiKeyDetail);
const ApiKeysPage = lazy(pageModules.apiKeys);
const AppConfigPage = lazy(pageModules.appConfig);
const AuditLogsPage = lazy(pageModules.auditLogs);
const BoutiquePage = lazy(pageModules.boutique);
const CreditsPage = lazy(pageModules.credits);
const DashboardPage = lazy(pageModules.dashboard);
const LoginPage = lazy(pageModules.login);
const MediaPage = lazy(pageModules.media);
const NotFoundPage = lazy(pageModules.notFound);
const RedeemCodesPage = lazy(pageModules.redeemCodes);
const RouteErrorPage = lazy(pageModules.routeError);
const SettingsPage = lazy(pageModules.settings);
const SubscriptionsPage = lazy(pageModules.subscriptions);
const UserDetailPage = lazy(pageModules.userDetail);
const UsersPage = lazy(pageModules.users);
const WardrobePage = lazy(pageModules.wardrobe);
const WeatherPage = lazy(pageModules.weather);
const TeamPage = lazy(pageModules.team);

function withSuspense(page: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{page}</Suspense>;
}

function protectedPage(page: ReactNode, permission?: Permission) {
  return (
    <AdminRoute>
      <AdminLayout>
        <RequirePermission permission={permission}>{withSuspense(page)}</RequirePermission>
      </AdminLayout>
    </AdminRoute>
  );
}

export const router = createBrowserRouter([
  { path: "/lookbook", element: <Navigate replace to="/lookbook/looks" /> },
  { path: "/lookbook/login", element: protectedPage(<LookbookPage />, "content.write") },
  { path: "/lookbook/forbidden", element: protectedPage(<LookbookPage />, "content.write") },
  { path: "/lookbook/looks", element: protectedPage(<LookbookPage />, "content.write") },
  { path: "/lookbook/looks/new", element: protectedPage(<LookbookPage view="look" />, "content.write") },
  { path: "/lookbook/looks/:id", element: protectedPage(<LookbookPage view="look" />, "content.write") },
  { path: "/lookbook/collections", element: protectedPage(<LookbookPage view="collections" />, "content.write") },
  { path: "/lookbook/collections/new", element: protectedPage(<LookbookPage view="collection" />, "content.write") },
  { path: "/lookbook/collections/:id", element: protectedPage(<LookbookPage view="collection" />, "content.write") },
  { path: "/style-events", element: protectedPage(<StyleEventsPage />, "content.write") },
  { path: "/boutique", element: protectedPage(<BoutiquePage />, "boutiques.review") },
  {
    path: "/login",
    element: <PublicOnlyRoute>{withSuspense(<LoginPage />)}</PublicOnlyRoute>,
  },
  {
    path: "/access-denied",
    element: withSuspense(<AccessDeniedPage />),
  },
  {
    path: "/",
    element: protectedPage(<DashboardPage />, "reports.read"),
  },
  {
    path: "/dashboard",
    element: protectedPage(<DashboardPage />, "reports.read"),
  },
  {
    path: "/analytics",
    element: <Navigate replace to="/analytics/retention" />,
  },
  {
    path: "/analytics/acquisition",
    element: protectedPage(<AnalyticsPage section="acquisition" />, "reports.read"),
    errorElement: withSuspense(<RouteErrorPage />),
  },
  {
    path: "/analytics/activation",
    element: protectedPage(<AnalyticsPage section="activation" />, "reports.read"),
    errorElement: withSuspense(<RouteErrorPage />),
  },
  {
    path: "/analytics/retention",
    element: protectedPage(<AnalyticsPage section="retention" />, "reports.read"),
    errorElement: withSuspense(<RouteErrorPage />),
  },
  {
    path: "/analytics/engagement",
    element: protectedPage(<AnalyticsPage section="engagement" />, "reports.read"),
    errorElement: withSuspense(<RouteErrorPage />),
  },
  {
    path: "/analytics/reliability",
    element: protectedPage(<AnalyticsPage section="reliability" />, "reports.read"),
    errorElement: withSuspense(<RouteErrorPage />),
  },
  {
    path: "/users",
    element: protectedPage(<UsersPage />, "users.read"),
  },
  {
    path: "/users/:id",
    element: protectedPage(<UserDetailPage />, "users.read"),
  },
  {
    path: "/redeem-codes",
    element: protectedPage(<RedeemCodesPage />, "users.billing.write"),
  },
  {
    path: "/credits",
    element: protectedPage(<CreditsPage />, "revenue.read"),
  },
  {
    path: "/subscriptions",
    element: protectedPage(<SubscriptionsPage />, "revenue.read"),
  },
  {
    path: "/weather",
    element: protectedPage(<WeatherPage />, "system.manage"),
  },
  {
    path: "/media",
    element: protectedPage(<MediaPage />, "reports.read"),
  },
  {
    path: "/wardrobe",
    element: protectedPage(<WardrobePage />, "reports.read"),
  },
  {
    path: "/api-keys",
    element: protectedPage(<ApiKeysPage />, "system.manage"),
  },
  {
    path: "/api-keys/:keyId",
    element: protectedPage(<ApiKeyDetailPage />, "system.manage"),
  },
  {
    path: "/app-config",
    element: protectedPage(<AppConfigPage />, "system.manage"),
  },
  {
    path: "/audit-logs",
    element: protectedPage(<AuditLogsPage />, "audit.read"),
  },
  {
    path: "/team",
    element: protectedPage(<TeamPage />, "team.manage"),
  },
  {
    path: "/settings",
    element: protectedPage(<SettingsPage />),
  },
  {
    path: "*",
    element: withSuspense(<NotFoundPage />),
  },
]);
