# ZMK Beauty Platform — Ürün ve Sistem Tanımı

## 1) Proje Özeti
ZMK Beauty Platform; kuaför, güzellik merkezi, lazer epilasyon merkezi, bakım stüdyosu ve benzeri hizmet işletmelerini tek merkezde dijitalleştiren; web, mobil ve yönetim panelleri üzerinden çalışan çok kiracılı (multi-tenant) bir randevu, ödeme, müşteri yönetimi ve mini-site üretim platformudur.

Sistem Kırıkkale merkezli başlayacak, ancak teknik mimari ve marka dili itibarıyla tüm Türkiye'ye ölçeklenebilir olarak tasarlanacaktır. Amaç yalnızca randevu oluşturmak değildir; her işletmeye otomatik mikro-site, kendi paneli, çalışan/uygunluk yönetimi, müşteri geçmişi, hizmet kurgusu, online tahsilat ve merkezi üst yönetim (God Mode Superadmin) sağlamaktır.

---

## 2) Ana Değer Önerisi
Bu proje üç seviyede değer üretir:

### A. Müşteri İçin
- Kendi kuaförünü / güzellik merkezini bulur veya doğrudan o merkezin özel sayfasına girer.
- Hizmet seçer.
- Uygun çalışanı seçer.
- Boş gün ve saatleri görür.
- Online ödeme ile randevu alır.
- Geçmiş ve yaklaşan randevularını takip eder.
- Sürekli oturum mantığı sayesinde tekrar tekrar giriş yapmak zorunda kalmaz.

### B. İşletme İçin
- Kendi mağaza panelinden hizmet, fiyat, çalışan, izin günü, kapalı gün, müşteri ve sipariş/randevu bilgilerini yönetir.
- Her çalışan için uygunluk ve izin tanımlar.
- Belirli günleri mağaza bazlı kapalı işaretler.
- Müşterilerini ve satın alma/randevu geçmişlerini görür.
- Kendi adına otomatik oluşturulmuş modern bir mikro-siteye sahip olur.

### C. Platform Sahibi (ZMK / Superadmin) İçin
- Tüm mağazaları, yöneticileri, çalışanları, müşterileri, ödemeleri, raporları ve sistem operasyonlarını tek merkezden yönetir.
- Yeni mağaza eklenince otomatik URL yapısı ve hazır site oluşur.
- Tüm sistemi franchise/SaaS mantığında yönetir.
- İleride abonelik, komisyon, reklam, ek modül ve premium tema satışı ile gelir büyütür.

---

## 3) İş Modeli
Sistem bir **Beauty SaaS + Marketplace Infrastructure** modelidir.

### Başlangıç Modeli
- Her mağazaya özel panel
- Her mağazaya otomatik oluşturulmuş mikro-site
- Online randevu ve ödeme
- Yönetim panelleri

### Gelir Modelleri
- Aylık abonelik (Starter / Pro / Enterprise)
- İşlem başı komisyon
- Kurulum ücreti
- Premium tema / özel tasarım paketi
- SMS/WhatsApp hatırlatma paketi
- Reklam / öne çıkarma / sponsorlu görünürlük
- Mobil uygulama white-label lisansı

---

## 4) Kullanıcı Rolleri

### 4.1 Superadmin (God Mode)
Sistemin en yetkili kullanıcısıdır.

**Yetkiler:**
- Tüm mağazaları görüntüleme, ekleme, güncelleme, pasife alma
- Tüm mağaza adminlerini yönetme
- Tüm çalışanları görme
- Tüm müşterileri görme
- Tüm randevuları ve ödemeleri görme
- Raporları ve sistem sağlığını izleme
- URL/slug yönetimi
- Şablon site üretim sistemini kontrol etme
- Tema / içerik blokları / genel ayarlar yönetimi
- Komisyon oranı ve paket yönetimi
- Destek / ticket / log / hata takibi

### 4.2 Mağaza Admini
Kendi işletmesinin yöneticisidir.

**Yetkiler:**
- Kendi mağaza bilgilerini düzenleme
- Hizmet ekleme / çıkarma / fiyat değiştirme
- Çalışan ekleme / çıkarma
- Çalışana hizmet atama
- Çalışan izin ve müsaitlik yönetimi
- Mağaza kapalı günlerini takvimden belirleme
- Müşterileri ve geçmiş randevuları görme
- Randevu durumlarını yönetme
- Ürün/hizmet kataloğu yönetimi
- Panelde özet ciro ve rezervasyon grafikleri görüntüleme

### 4.3 Çalışan
İşletmeye bağlı personeldir.

**Yetkiler:**
- Kendi çalışma takvimini görme
- Atanmış randevuları görme
- Müsaitlik ve izin günlerini mağaza kuralına bağlı yönetebilme (opsiyonel)

### 4.4 Müşteri
Son kullanıcıdır.

**Yetkiler:**
- Kayıt / giriş
- Profil yönetimi
- Randevu oluşturma
- Ödeme yapma
- Geçmiş ve yaklaşan randevuları görme
- İptal / yeniden planlama (işletme kuralına bağlı)

---

## 5) Çok Kiracılı Yapı (Multi-Tenant)
Her mağaza sistemde ayrı tenant gibi çalışmalıdır.

### URL Kurgusu
Örnek:
- `zmkbeauty.com/magaza-adi`
- `zmkbeauty.com/magaza-adi/profile`
- `zmkbeauty.com/magaza-adi/services`
- `zmkbeauty.com/magaza-adi/booking`
- `zmkbeauty.com/magaza-adi/login`

### Multi-Tenant Mantık
- Her tenantın kendi verisi izole edilir.
- Yetki kontrolü tenant bazlı yapılır.
- Superadmin tüm tenantları görür.
- Mağaza admini yalnızca kendi tenant verisini görür.

---

## 6) Otomatik Mikro-Site Üretimi
Superadmin panelinden yeni mağaza açıldığında sistem otomatik olarak mağazaya özel hazır site üretmelidir.

### Gerekli Girdiler
- Mağaza adı
- Slug
- Logo
- Kapak görseli
- Açıklama
- Adres
- Telefon
- Çalışma saatleri
- Hizmet listesi
- Sosyal medya linkleri
- Harita konumu

### Otomatik Üretilen Sayfalar
- Anasayfa
- Hizmetler
- Hakkımızda / Profil
- İletişim / Adres
- Giriş / Kayıt
- Randevu oluştur
- Kullanıcı profil sayfası

### Tasarım İlkesi
- Tek ana şablon
- Hızlı açılan sade arayüz
- Mobil öncelikli
- Güven veren premium ama yalın estetik
- Her mağazada aynı iskelet, farklı içerik

---

## 7) Randevu Akışı
Randevu oluşturma akışı sürtünmesiz ve çok hızlı olmalıdır.

### Kullanıcı Akışı
1. Kullanıcı mağazanın sayfasına girer.
2. Giriş yapar veya kayıt olur.
3. Ana CTA: **Randevu Oluştur**
4. Hizmet seçer.
5. Uygun çalışan seçer.
6. Tarih seçer.
7. Saat seçer.
8. Ödeme yapar.
9. Randevu oluşturulur.
10. Randevu aynı anda:
   - Müşteri profiline
   - Mağaza admin paneline
   - Superadmin paneline düşer.

### Kısıtlar
- Kapalı günlerde rezervasyon alınamaz.
- Çalışan izinliyse seçilemez.
- Çalışanın vermediği hizmetler seçilemez.
- Çakışan saatler bloke edilir.
- İşletme saatleri dışında slot üretilmez.
- Gerekirse tampon süre tanımlanabilir.

---

## 8) Ödeme Sistemi
Başlangıç için PayTR entegrasyonu kullanılacaktır.

### Temel Kurallar
- Rezervasyon ödeme onayı sonrası kesinleşir.
- Başarısız ödeme durumunda slot belirli süre tutulur veya serbest bırakılır.
- Ödeme kayıtları hem mağaza hem superadmin panelinde görünür.
- İade / başarısız / bekleyen / başarılı gibi durumlar tutulur.

---

## 9) Müşteri Deneyimi ve Oturum Mantığı
Bu sistem web ve mobil WebView içinde kullanılacağı için kullanıcı deneyimi kritik önemdedir.

### Beklentiler
- Kullanıcı bir kez giriş yaptıktan sonra sistem kolay kolay çıkış yaptırmamalı.
- Güvenli uzun ömürlü oturum kullanılmalı.
- Mobilde mümkün olduğunca uygulama hissi vermeli.
- Randevu butonu sürekli görünür ve ulaşılabilir olmalı.

---

## 10) Mağaza Admin Paneli
Mağaza yöneticisi için panel güçlü ama kullanımı kolay olmalıdır.

### Dashboard Modülleri
- Bugünkü randevular
- Yaklaşan randevular
- Toplam müşteri sayısı
- Günlük / haftalık / aylık ciro
- En çok satılan hizmetler
- Çalışan performansı
- Ödeme durumu özeti

### Yönetim Modülleri
- Hizmetler
- Ürünler
- Çalışanlar
- Çalışma takvimi
- Kapalı günler
- Kampanyalar (opsiyonel)
- Müşteriler
- Sipariş / ödeme geçmişi
- Site içeriği temel ayarları

---

## 11) Müşteri Paneli
Müşteri paneli minimum karmaşa ile tasarlanmalıdır.

### Gösterilecekler
- Profil bilgileri
- Yaklaşan randevular
- Geçmiş randevular
- Randevu detayları
- Ödeme özeti
- Favori hizmetler / tekrar rezervasyon (opsiyonel)

---

## 12) Süper Yönetim Paneli
Superadmin paneli sistemin beyin merkezi olacaktır.

### Temel Bölümler
- Mağazalar
- Mağaza başvuruları / onboarding
- Kullanıcılar
- Çalışanlar
- Ödemeler
- Randevular
- Sistem logları
- Raporlar
- Abonelik / paket yönetimi
- Tema / şablon yönetimi
- SEO / URL / yönlendirme ayarları
- Destek ve operasyon ekranı

### Superadmin Dashboard KPI
- Toplam mağaza sayısı
- Aktif mağaza sayısı
- Toplam aktif müşteri
- Günlük toplam randevu
- Aylık GMV / toplam tahsilat
- Başarılı / başarısız ödeme oranı
- En çok rezervasyon alan şehirler
- En çok tercih edilen hizmet kategorileri

---

## 13) Mobil Uygulama Stratejisi
İlk aşamada güçlü responsive web + WebView wrapper mantığı yeterlidir.

### Strateji
- Önce web platform tam oturtulur.
- Sonra aynı tenant yapısı mobil WebView ile paketlenir.
- Kullanıcı login kalıcılığı korunur.
- İlerleyen aşamada native özellikler eklenir.

---

## 14) SEO ve Yerel Büyüme
Her mağaza sayfası yerel SEO için optimize edilmelidir.

### Amaç
`şehir + kuaför`, `şehir + güzellik merkezi`, `şehir + lazer`, `bölge + bakım merkezi` gibi aramalarda mağaza mikro-siteleri indekslenebilsin.

### Gerekli SEO Alanları
- SEO title
- Meta description
- Açıklama blokları
- FAQ
- Schema markup
- Harita / adres / iletişim bilgisi
- Open Graph

---

## 15) Güvenlik
- Rol bazlı yetkilendirme (RBAC)
- Tenant izolasyonu
- Güvenli oturum yönetimi
- CSRF/XSS/SQL Injection önlemleri
- Audit log
- Admin işlemlerinde detaylı kayıt
- Güvenli ödeme callback yönetimi
- Dosya yükleme validasyonu

---

## 16) Teknik Mimari Önerisi
### Frontend
- Next.js
- Tailwind CSS
- TanStack Query
- Zustand veya Redux Toolkit

### Backend
- NestJS veya Laravel
- REST API veya gerektiğinde GraphQL
- JWT + Refresh Token
- Queue sistemi

### Veritabanı
- PostgreSQL
- Redis (cache / queue / session / rate limit)

### Depolama
- S3 uyumlu object storage

### Bildirim
- E-posta
- SMS
- WhatsApp entegrasyonu (ilerleyen faz)

### Ödeme
- PayTR

### Takvim / Slot Motoru
- Hizmet süresi
- Çalışan uygunluğu
- Çakışma önleme
- Mağaza kapalı günleri
- İzin yönetimi

---

## 17) Çekirdek Veri Modelleri
- Users
- Tenants (Stores)
- StoreAdmins
- Employees
- EmployeeSchedules
- EmployeeLeaves
- Services
- ServiceEmployeeAssignments
- Products
- Customers
- Appointments
- AppointmentItems
- Payments
- PaymentTransactions
- StoreClosures
- Reviews (opsiyonel)
- Notifications
- AuditLogs
- Subscriptions
- Themes / TemplateConfigs

---

## 18) Fazlandırılmış Yol Haritası
### Faz 1 — MVP
- Multi-tenant altyapı
- Mağaza oluşturma
- Otomatik mikro-site
- Müşteri kayıt / giriş
- Hizmet/çalışan/tarih/saat seçimi
- PayTR ödeme
- Müşteri paneli
- Mağaza admin paneli
- Superadmin paneli

### Faz 2 — Operasyonel Güçlendirme
- SMS/WhatsApp bildirimleri
- Kupon / kampanya modülü
- Yorum / puanlama
- Basit CRM ekranı
- Gelişmiş raporlar

### Faz 3 — Büyüme
- Çoklu şube desteği
- Franchise yapısı
- Native mobil uygulama
- Pazaryeri keşif akışı
- Reklam / sponsorlu listeleme

---

## 19) Başarı Metrikleri
- Aktif mağaza sayısı
- Aylık aktif müşteri
- Randevu dönüşüm oranı
- Tekrar rezervasyon oranı
- Ortalama sepet tutarı
- Ödeme başarı oranı
- Müşteri edinme maliyeti
- Mağaza başına aylık gelir
- Churn oranı

---

## 20) Kısa Vizyon Cümlesi
ZMK Beauty Platform, Türkiye'deki güzellik ve kişisel bakım işletmelerine birkaç dakikada dijital mağaza, online randevu, online ödeme ve müşteri yönetimi gücü veren; franchise mantığında büyüyebilen, SaaS tabanlı yeni nesil rezervasyon altyapısı olacaktır.
