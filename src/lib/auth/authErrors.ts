const FALLBACK = "Giriş yapılamadı. Bilgileri kontrol edip tekrar deneyin."

// Stable auth codes → Turkish, user-facing text. Provider-specific raw error
// strings never reach the UI.
const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "E-posta veya şifre hatalı.",
  "auth/invalid-login-credentials": "E-posta veya şifre hatalı.",
  "auth/invalid-email": "Geçerli bir e-posta adresi girin.",
  "auth/missing-password": "Şifrenizi girin.",
  "auth/user-disabled": "Bu hesap devre dışı bırakılmış.",
  "auth/too-many-requests": "Çok fazla deneme yapıldı. Biraz bekleyip tekrar deneyin.",
  "auth/network-request-failed": "Bağlantı kurulamadı. İnternetinizi kontrol edip tekrar deneyin.",
  "auth/not-admin": "Bu hesabın yönetim paneline erişim yetkisi yok.",
  "auth/unknown-role": "Sunucu tanınmayan bir yönetim rolü döndürdü. Güvenlik için oturum açılmadı.",
  "auth/malformed-session": "Oturum yanıtı doğrulanamadı. Güvenlik için oturum açılmadı.",
  "auth/malformed-logout": "Sunucu çıkış işlemini doğrulamadı. Yerel oturum kapatıldı; sayfayı yenileyip tekrar deneyin.",
  "auth/demo-credentials": "Örnek veri modunda e-posta ve şifre ile giriş kapalıdır. Örnek erişimi kullanın.",
}

function codeOf(err: unknown): string | null {
  if (typeof err === "object" && err !== null && "code" in err && typeof err.code === "string") return err.code
  return null
}

function statusOf(err: unknown): number | null {
  if (typeof err === "object" && err !== null && "status" in err && typeof err.status === "number") return err.status
  return null
}

/** Turkish message for an auth failure, or null when nothing should be shown. */
export function authErrorMessage(err: unknown, fallback = FALLBACK): string | null {
  const code = codeOf(err)
  if (code && MESSAGES[code]) return MESSAGES[code]

  const status = statusOf(err)
  if (status === 401) return "Oturumunuz sona erdi. Yeniden giriş yapın."
  if (status === 403) return "Bu hesabın yönetim paneline erişim yetkisi yok."
  if (status === 429) return "Çok fazla deneme yapıldı. Biraz bekleyip tekrar deneyin."

  // Server messages are already intended for the operator; internal contract
  // errors are mapped above and never shown raw.
  if (err instanceof Error && err.message && !code) return err.message
  return fallback
}
