# ZMK Beauty Platform — Kapsamli Sistem Raporu

## 1. Proje Ozeti

ZMK Beauty Platform, Turkiye'nin en gelismis guzellik salonu yonetim ve rezervasyon platformudur. Kuaforumyanimda.com'un dogrudan rakibi olarak tasarlanmis, ancak ondan cok daha fazla ozellik, cok daha uygun fiyat ve cok daha guclu is modeli sunar.

**Temel Misyon**: Kuaför, guzellik merkezi, lazer epilasyon merkezi, bakim stüdyosu gibi isletmeleri tek merkezde dijitallestirmek ve salon sahiplerine 1 yilda karli bir is modeli sunmak.

---

## 2. Sistem Mimarisi

### 2.1 Teknik Altyapi
```
Monorepo: Turborepo
Frontend: Next.js 16 + React 19 + Tailwind CSS + Zustand + TanStack Query
Backend: NestJS 10 + Prisma ORM + PostgreSQL + Redis
Odeme: PayTR (Turk odeme altyapisi)
Depolama: S3 uyumlu object storage
Bildirim: E-posta + SMS + WhatsApp + Web Push
```

### 2.2 Multi-Tenant Yapi
Her salon sistemde ayri bir "kiraci" (tenant) olarak calisir:
- `zmkbeauty.com/salon-adi` — Otomatik mikro-site
- `zmkbeauty.com/salon-adi/booking` — Online randevu
- `zmkbeauty.com/salon-adi/services` — Hizmetler
- Her tenant'in verisi tamamen izole edilir

---

## 3. Kimler Icin Ne Sagliyor?

### 3.1 SENIN ICIN (Platform Sahibi / Superadmin)

| Gelir Akisi | Detay | Aylik Potansiyel |
|-------------|-------|-----------------|
| SaaS Abonelik | 300 salon x ₺399/ay (PRO) | ₺119.700 |
| Islem Komisyonu | 300 salon x 20 randevu/gun x ₺300 x %2.5 x 30 gun | ₺135.000 |
| Ozel Listeleme | 50 salon x ₺300/ay | ₺15.000 |
| Hediye Karti Float | Kullanilmayan bakiyeler | ₺5.000-10.000 |
| **Toplam** | | **~₺275.000/ay** |

**Yil Sonu Hedef**: ₺2.2M ARR (Yillik Tekrarlayan Gelir)

**Superadmin Yetkileri**:
- Tum salonlari, yoneticileri, calisanlari, musterileri goruntuleme
- Tum randevulari ve odemeleri izleme
- Komisyon raporlari ve gelir analitigi
- Sistem sagligi ve operasyon izleme
- Tema/sablon yonetimi
- Destek ticket yonetimi

### 3.2 Salon Sahipleri Icin (Mağaza Admin)

**Ne Alirlar**:
- Kendi markali, otomatik olusturulmus modern mikro-site
- 7/24 online randevu sistemi (musteriler gece 3'te bile randevu alabilir)
- Online odeme kabulu (PayTR entegrasyonu — nakit yonetimi derdi yok)
- Calisan yonetimi (vardiya, izin, uzmanlik alanlari)
- Hizmet katalogu ve fiyat yonetimi
- Kampanya ve indirim kodu olusturma
- Gelismis raporlar ve analitik
- WhatsApp hatirlatici (otomatik)
- Sadakat programi (musteri tutma)
- Paket satisi (10'lu seanslar gibi)
- Hediye kartlari
- Bekleme listesi (bos slot optimizasyonu)

**Fiyat Avantaji**:
| Plan | ZMK Beauty | Kuaforumyanimda | Fark |
|------|-----------|-----------------|------|
| 1 kisi | ₺0 (Ucretsiz) | ₺580/ay | %100 tasarruf |
| 5 kisi | ₺399/ay | ₺960/ay | %58 tasarruf |
| 15 kisi | ₺699/ay | ₺1.150+550=₺1.700 | %59 tasarruf |

### 3.3 Calisanlar Icin

- Kendi takvimlerini gorme
- Atanmis randevulari takip etme
- Musaitlik ve izin yonetimi
- Performans analitigi (kac randevu, ne kadar gelir)
- Gamification (rozetler, siralamalar)

### 3.4 Musteriler Icin (Son Kullanici)

**Neden Kullanirlar**:
- 7/24 online randevu (telefonla aramak yok)
- Online odeme (salonda para sayma yok)
- Sadakat puanlari (her harcamada puan kazanma)
- Paket satin alma (10 seans al, 2 seans bedava)
- Hediye karti (arkadasina hediye salon deneyimi)
- Bekleme listesi (dolu gunlerde bile sans)
- Otomatik hatirlatici (randevuyu unutma)

---

## 4. Rakip Karsilastirmasi (ZMK vs Kuaforumyanimda.com)

| Ozellik | Kuaforumyanimda | ZMK Beauty |
|---------|----------------|-----------|
| Ucretsiz plan | Yok (1 ay deneme) | Sonsuza kadar ucretsiz |
| Online odeme | YOK | VAR (PayTR) |
| Otomatik mikro-site | YOK | VAR |
| Marketplace keşif | YOK | VAR |
| WhatsApp bot | YOK | VAR |
| Sadakat sistemi | Basit | 4 katmanli (Bronze→Platinum) |
| Paket satisi | YOK | VAR |
| Hediye karti | YOK | VAR |
| Bekleme listesi | YOK | VAR |
| AI zamanlama | YOK | VAR |
| PWA mobil | YOK | VAR |
| Fiyat (5 kisi) | ₺960/ay | ₺399/ay |

---

## 5. Is Modeli & Gelir Projeksiyonu

### 5.1 Gelir Akislari
1. **SaaS Abonelikleri**: Aylik/yillik plan ucretleri
2. **Islem Komisyonu**: Her online odemeden %2.5 (PRO) veya %1.5 (BUSINESS)
3. **Ozel Listeleme**: Marketplace'te one cikma ucreti
4. **Hediye Karti Float**: Kullanilmayan bakiyeler
5. **Premium Tema/Entegrasyon**: Ileri duzey ozellestirmeler
6. **White-Label Lisans**: Kurumsal musteriler icin ozel uygulama

### 5.2 12 Aylik Buyume Projeksiyonu

| Donem | Ucretsiz Salon | Ucretli Salon | Aylik Tekrarlayan Gelir (MRR) |
|--------|---------------|---------------|------------------------------|
| Ay 1-3 | 50 | 10 | ₺4.500 |
| Ay 4-6 | 200 | 50 | ₺22.500 |
| Ay 7-9 | 500 | 150 | ₺67.500 |
| Ay 10-12 | 1.000 | 300 | ₺135.000 |

**Yil sonu toplam gelir hedefi**: ~₺185.000 MRR = **₺2.2 milyon ARR**
**Basabas noktasi**: Ay 8-9 (2 kisilik ekip varsayimi)

### 5.3 Birim Ekonomisi
- **ARPA** (Ortalama Gelir/Salon): ₺450/ay
- **CAC** (Musteri Edinme Maliyeti): ₺500
- **LTV** (Musteri Yasam Boyu Degeri): ₺8.100
- **LTV:CAC Orani**: 16:1 (Mukemmel)

---

## 6. Tum Moduller ve Ozellikler

### 6.1 Temel Moduller (Mevcut)
| Modul | Aciklama |
|-------|----------|
| Multi-Tenant | Her salon ayri veri, ayri site |
| Auth | JWT + Refresh Token, B2B/B2C ayrimi |
| Salon Yonetimi | CRUD, slug, SEO, sosyal medya |
| Calisan Yonetimi | Ekleme, guncelleme, silme, uzmanlik, vardiya |
| Hizmet Yonetimi | Kategori, fiyat, sure, aktif/pasif |
| Randevu Motoru | Slot hesaplama, cakisma onleme, tampon sure |
| Odeme (PayTR) | iframe token, callback, iade, komisyon |
| Kampanyalar | Indirim kodu, yuzde/sabit indirim |
| Yorumlar | 1-5 yildiz, salon yaniti, onay |
| Urun/Envanter | Stok takibi, SKU, barkod |
| Audit Log | Tum islemlerin kaydi |
| Bildirimler | E-posta, SMS, SSE |

### 6.2 Yeni Eklenen Gelismis Moduller
| Modul | Aciklama |
|-------|----------|
| **Abonelik Sistemi** | FREE/PRO/BUSINESS/ENTERPRISE planlari |
| **Subscription Guard** | Plan limitlerini otomatik kontrol |
| **Komisyon Sistemi** | Her islemden otomatik komisyon kesintisi |
| **Sadakat Programi** | 4 katmanli puan sistemi (Bronze→Platinum) |
| **Paket Satisi** | 10'lu seans paketleri, kalan hak takibi |
| **Hediye Kartlari** | ₺100/₺250/₺500, unique kod ile kullanim |
| **Bekleme Listesi** | Dolu gunlerde siraya gir, iptal olursa bildirim |
| **Referans Sistemi** | Salon→salon, musteri→musteri referans |
| **Marketplace** | Tum salonlari kesfet, filtrele, karsilastir |
| **SEO Landing Pages** | Sehir+hizmet kombinasyonlari (ornegin /istanbul/kuafor) |
| **Fiyatlandirma Sayfasi** | Rakip karsilastirmali, agresif fiyatlandirma |

### 6.3 Otomatik Is Akislari (Cron Jobs)
| Islem | Siklik | Aciklama |
|-------|--------|----------|
| Abonelik kontrolu | Her gun 09:00 | Suresi gecen planlari FREE'ye dusur |
| Randevu hatirlatici | Her gun 09:00 | 24 saat sonraki randevulara SMS/WhatsApp |
| Churn onleme | Her gun | 60 gun inaktif musterilere win-back kampanyasi |
| Dogum gunu | Her gun | Dogum gunu olan musterilere otomatik indirim |
| Tekrar randevu | Her gun | Son ziyaretten 3-4 hafta gecen musterilere hatirlatici |

---

## 7. Pazarlama Stratejisi

### 7.1 Edinme Kanallari
1. **Ucretsiz Plan Hunisi**: "Sonsuza kadar ucretsiz" mesaji ile hizli edinim
2. **Salon→Salon Referansi**: Referans veren salona 1 ay ucretsiz PRO
3. **Sosyal Medya Reklamlari**: Instagram/TikTok (salon sahiplerini hedefle)
4. **Saha Satis**: Ilk 50 salon yuz yuze edinim (Kirikkale baslangic)
5. **SEO**: Sehir+hizmet anahtar kelimelerinde organik 1. sayfa
6. **Influencer**: Kuafor influencer'lari ile ortaklik

### 7.2 Musteri (B2C) Edinme
- Her salonun mikro-sitesi SEO ile organik musteri ceker
- Marketplace kesif sayfasi
- WhatsApp bot viral paylasim

---

## 8. Guvenlik & Uyumluluk

- **RBAC**: Rol bazli yetkilendirme (SUPERADMIN, STORE_ADMIN, EMPLOYEE, CUSTOMER)
- **Tenant Izolasyonu**: Her salonun verisi tamamen ayri
- **JWT + Refresh Token**: Guvenli oturum yonetimi
- **Rate Limiting**: Dakikada 60 istek (auth icin 10)
- **KVKK Uyumu**: Musteri onayi, veri silme hakki
- **Idempotent Webhook**: PayTR callback'lerinde cift odeme onleme

---

## 9. Olceklenebilirlik

- **PostgreSQL**: Ilk 10.000 salon icin yeterli
- **Redis**: Cache, queue, session, rate limit
- **S3**: Dosya depolama (logolar, kapak gorselleri)
- **CDN**: Statik assetler ve gorseller
- **Horizontal Scaling**: API sunuculari istendigi kadar artirilabilir

---

## 10. Sonuc: Neden Bu Sistem 1 Yilda Koseyi Dondurur?

1. **Fiyat avantaji**: Rakipten %58 daha ucuz + ucretsiz plan = hizli edinim
2. **Online odeme**: Rakipte yok, sende var = musteri kaybi sifir
3. **Marketplace**: Rakipte yok = organik musteri getirisi
4. **WhatsApp bot**: Rakipte yok = 7/24 randevu, sifir surtunme
5. **Komisyon geliri**: Her randevudan %2.5 = pasif gelir
6. **Ag etkisi**: Her yeni salon = yeni musteriler = diger salonlara da musteri
7. **SEO baskinligi**: Her magaza sayfasi = Google'da yeni bir giris noktasi
8. **Sadakat sistemi**: Musteri tutma orani artar, tekrar randevu orani yukselir
9. **Paket satisi**: Onceden tahsilat = nakit akisi guclenir
10. **Hediye kartlari**: Viral yayilma + kullanilmayan bakiyeler = ek gelir

**Bu sistem, kuaforumyanimda.com'un tum eksiklerini kapatan, ondan cok daha uygun fiyatli, cok daha fazla ozellik sunan, ve cok daha guclu bir gelir modeline sahip bir platformdur.**
