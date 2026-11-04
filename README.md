# Admin Panel

Bağımsız, frontend-only bir yönetim paneli. Mevcut tüm ekranlar ve menü
girişleri korunmuştur; marka, görsel ve ortam bilgileri nötrleştirilmiştir.
Depoda gerçek bir backend, üretim anahtarı veya canlı servis entegrasyonu yoktur.

## Veri modları

`VITE_DATA_MODE` iki değer alır:

| Değer | Davranış |
| --- | --- |
| `demo` (varsayılan) | Boş, yalnızca bellekte tutulan yerel önizleme. Tüm ekranlar kayıtsız başlar; girilen kayıtlar sayfa yenilenince silinir ve hiçbir ağ isteği gönderilmez. |
| `api` | Aynı kaynaklı `/api/admin/operations/*` adaptörü kullanılır. |

Değişken boş veya tanımsızsa `demo` kullanılır. `demo` ya da `api` dışındaki
her değer yapılandırma hatasıdır ve uygulama başlamaz; yazım hatası sessizce
demo moduna düşmez. `VITE_APP_ENV` yalnızca üst çubuktaki ortam etiketini
belirler (`staging` veya `production`). `VITE_PUBLIC_SITE_URL` isteğe bağlıdır;
tanımlanmazsa Lookbook ekranındaki genel canlı site bağlantısı "yapılandırılmadı"
olarak görünür ve arka uçta canlı bir site olduğu varsayılmaz.

Demo modunda oturum başlangıçta yoktur ve hiçbir örnek kayıt yüklenmez.
Giriş ekranındaki **Boş paneli aç** düğmesi sabit bir yerel yönetici oturumu
açar. Bu oturum gerçek kimlik doğrulama değildir, arka uçta bir kayıt
oluşturmaz, hiçbir istek göndermez ve sayfa yenilenince kaybolur. Panelin üst
çubuğunda şu uyarı sürekli görünür:

> Yerel önizleme • Sunucuya bağlı değil • Panel boş başlar • Yenilemede girilen kayıtlar silinir

Yerel önizlemede lookbook, butikler, stil etkinlikleri ve diğer ekranlar boş
listelerle açılır. Kayıtlar yalnızca kullanıcı oluşturma/düzenleme işlemleriyle
eklenir; bunlar bellekte tutulur, sayfa yenilenince temizlenir ve hiçbir
zaman bir API hatasından sonra örnek veriye düşülmez.

API modunda demo oturumu kabul edilmez; kullanıcı ve rol bilgisi yalnızca
sunucunun doğrulanmış yanıtından okunur.

## API sözleşmesi

API modu, mevcut aynı kaynaklı işlem sözleşmesini kullanır. Bu depo bir arka
uç içermez; sözleşme gelecekte eklenecek kayıtlar ve butik/stil etkinliği
işlemleri için korunur. Yerel önizleme modunda bu uçlara istek gönderilmez.

Her işlem aynı kaynakta şu adrese `POST` edilir:

```text
/api/admin/operations/<işlem adı>
```

- `Content-Type: application/json`, gövde JSON'dur.
- `credentials: "same-origin"` kullanılır; kimlik yalnızca oturum çerezidir.
- Yönlendirmeler hata sayılır (`redirect: "error"`).
- Varsayılan zaman aşımı 60 saniyedir.
- Başarılı yanıt gövdesi **düz JSON** sonuçtur; `{ "data": ... }` zarfı yoktur.
- Boş gövde, geçersiz JSON, 2xx dışı durum, ağ hatası veya zaman aşımı hata
  olarak döner. API hatasından sonra **asla** yerel önizleme verisine düşülmez.
- İşlem adı `/^[A-Za-z][A-Za-z0-9._-]*$/` ile sınırlıdır; yol geçişi reddedilir.
- Hata gövdesi güvenli biçimde okunur: `{ "error": { "code", "field", "message" } }`
  veya üst düzey `code`/`field`/`message`. Rastgele alanlar istemciye taşınmaz.

### Kimlik doğrulama işlemleri

```text
auth.session  gövde: {}                  -> { user: User | null, consoleRole: Role | null }
auth.login    gövde: { email, password } -> { user: User, consoleRole: Role }
auth.logout   gövde: {}                  -> { ok: true }
```

`User`: `{ uid, email, displayName, photoURL? }`. `Role`: `viewer`, `editor`,
`support` veya `admin`.

Sunucu:

- Oturumu HttpOnly, Secure ve uygun SameSite çereziyle yönetmelidir.
- Her istekte `Origin`/CSRF doğrulaması yapmalıdır.
- Konsol rolünü çerez oturumundan türetmeli ve her işlemde yetkiyi kendisi
  uygulamalıdır. İstemcideki rol kontrolü yalnızca arayüz içindir.
- Bilinmeyen rol veya bozuk oturum yanıtı istemci tarafından reddedilir.
- Demo kimliği, istemcinin gönderdiği rol veya tarayıcıda üretilmiş kullanıcı
  kabul edilmemelidir.

Diğer işlem adları: `users.delete`, `config.update`, `weather.triggerUpdate`,
`weather.syncLocations`.

## Ekranlar

Genel bakış, analitik, lookbook, etkinlikler, butikler, kullanıcılar, dijital
gardırop, medya ve blog, hava durumu, abonelikler, krediler, hediye kodları,
API anahtarları, uygulama ayarları, ekip ve roller, işlem kayıtları ve ayarlar
ekranlarının tamamı korunmuştur.

## Kurulum ve komutlar

```bash
npm ci
npm run dev
npm run build
npm run preview
npm run lint
npm test
```

`npm test`, `tests/*.test.mjs` altındaki testleri Node'un yerleşik test
çalıştırıcısıyla çalıştırır.

Demo modunda hiçbir harici veri servisine istek gönderilmez. Yalnızca aynı
kaynaklı statik varlıklar ve fontlar normal sayfa yüklemesi sırasında yüklenir.
Yerel önizleme verisi yalnızca bellekte tutulur; tarayıcı yenilendiğinde girilen
tüm kayıtlar silinir ve panel tekrar boş başlar.

## Kapsam dışı

- Gerçek backend, veritabanı veya kimlik sağlayıcı yoktur.
- Bramwick entegrasyonu henüz yoktur.
- Canlı ödeme, e-posta, hava durumu veya medya servisi bağlantısı yoktur.
- Gerçek müşteri verisi, üretim sırrı veya dağıtım bilgisi depoda tutulmaz.

## Lisans

Kaynak kod GNU Affero General Public License, sürüm 3 (yalnızca) altında
lisanslanmıştır. Ayrıntılar için `LICENSE` ve `NOTICE` dosyalarına bakın.
