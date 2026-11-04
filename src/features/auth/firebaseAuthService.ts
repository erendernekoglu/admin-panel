// Compatibility re-export for older imports. The implementation is the plain
// same-origin auth service in ./authService.ts and no longer uses Firebase.
export {
  AUTH_OPERATIONS,
  createDemoSession,
  fetchSession,
  loginWithEmail,
  logout,
  parseAuthSession,
} from "./authService"
export type { AuthSession } from "./authService"
