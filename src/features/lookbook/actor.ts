import { createContext, useContext } from "react";
export const ActorContext = createContext<string | null>(null);
export const PENDING_PREFIX = "admin-panel:pending:";
export function useAdminUid() {
  const uid = useContext(ActorContext);
  if (!uid) throw new Error("An authenticated editor session is required.");
  return uid;
}
