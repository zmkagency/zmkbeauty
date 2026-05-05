# Master Prompt — Claude Opus 4.6 / Antigravity

Aşağıdaki görevi bir **kurucu CTO + principal product architect + senior SaaS systems designer + UX strategist + growth thinker** seviyesinde ele al.

Ben Türkiye pazarı için, Kırıkkale merkezli başlayıp zamanla tüm Türkiye’ye açılacak **çok kiracılı (multi-tenant) bir güzellik/kuaför/lazer randevu ve ödeme platformu** geliştiriyorum.

Bu projeyi sıradan bir randevu uygulaması gibi ele alma. Bunu; her işletmeye otomatik mini-site, yönetim paneli, çalışan/hizmet takvimi, online ödeme, müşteri geçmişi ve merkezi üst yönetim sunan, franchise/SaaS mantığında büyüyebilen bir altyapı olarak değerlendir.

## Ürün fikri
Sistemde farklı işletmeler olacak: kuaför, güzellik merkezi, lazer epilasyon merkezi, bakım stüdyosu vb.

Bir müşteri:
- mobil uygulama veya web sitesi üzerinden kendi tercih ettiği işletmeye girer,
- o işletmenin sunduğu hizmetleri görür,
- hizmeti veren çalışanı seçer,
- çalışan uygunluğu, mağaza açık/kapalı durumu ve takvime göre gün/saat seçer,
- online ödeme yapar,
- randevusunu oluşturur.

Randevu oluşturulduğunda bu kayıt aynı anda:
- müşterinin profilinde,
- ilgili mağaza admin panelinde,
- superadmin panelinde görünmelidir.

## Sistem vizyonu
Benim kafamdaki ana yapı şu:

### 1) Superadmin / God Mode
Sistemin en üst yöneticisi olacak.
Her şeyi görebilecek:
- mağazalar,
- mağaza adminleri,
- çalışanlar,
- müşteriler,
- randevular,
- ödemeler,
- raporlar,
- operasyonel loglar,
- sistem ayarları,
- paketler,
- şablonlar,
- tüm tenantlar.

### 2) Otomatik mağaza sitesi üretimi
Sistemde yeni mağaza açıldığında, girilen temel bilgilere göre sistem otomatik olarak hazır şablondan bir mini-site oluşturmalı.

Örnek:
- ana domain: `zmkbeauty.com`
- mağaza sayfası: `zmkbeauty.com/yeni-magaza`
- alt sayfalar:
  - `zmkbeauty.com/yeni-magaza/profile`
  - `zmkbeauty.com/yeni-magaza/services`
  - `zmkbeauty.com/yeni-magaza/booking`
  - `zmkbeauty.com/yeni-magaza/login`

Tüm siteler aynı temel şablonu kullanmalı ama içerikleri mağaza bilgilerine göre otomatik farklılaşmalı.

Bu mini-site sade, hızlı, güven veren, mobil öncelikli ve etkileyici olmalı.
Temel sayfalar:
- anasayfa,
- hizmetler,
- profil/hakkımızda,
- adres/iletişim,
- giriş/kayıt,
- randevu oluştur,
- kullanıcı profil alanı.

### 3) Müşteri deneyimi
Müşteri mağazanın sitesine girip kayıt olmalı / giriş yapmalı.
Giriş yaptıktan sonra sistem kullanıcıyı sürekli çıkış yaptırmamalı. Çünkü her işletmeyi ayrıca WebView ile mobil uygulama gibi de sunmak istiyoruz; login kalıcılığı önemli.

Müşteri için sistem çok basit olmalı:
- giriş yap,
- randevu oluştur butonuna bas,
- hizmet seç,
- çalışan seç,
- tarih/saat seç,
- öde,
- randevuyu gör.

Profil alanında yalnızca gerekli temel şeyler olmalı:
- profil bilgileri,
- yaklaşan randevular,
- geçmiş randevular,
- randevu detayları.

### 4) Mağaza admin paneli
Her mağaza kendi adına açılan güçlü bir panele sahip olmalı.
Burada mağaza admini şunları yapabilmeli:
- ürün ekle / çıkar,
- hizmet ekle / çıkar,
- fiyat değiştir,
- çalışan ekle / çıkar,
- çalışanlara hizmet ata,
- kapalı günleri takvimden belirle,
- çalışanı izinli işaretle,
- izinli çalışanı seçilemez hale getir,
- müşterileri görüntüle,
- müşteri iletişim bilgilerini gör,
- müşterilerin randevu / ödeme / alışveriş geçmişini gör,
- kendi mağazasının özet performansını dashboard’da takip et.

### 5) Temel ödeme mantığı
İlk aşamada PayTR entegrasyonu düşünüyorum.
Ödeme başarılı olunca randevu kesinleşmeli.
Ödeme ve randevu kayıtları hem ilgili mağazada hem superadmin tarafında görünmeli.

## Senden istediğim çıktı
Bu projeyi **aşırı profesyonel, yatırımcıya/ekibe/ajansa/CTO’ya sunulabilecek seviyede**, çok derin ama düzenli şekilde parçalayarak hazırla.

Çıktıyı aşağıdaki başlıklarda ver:

1. **Projenin profesyonel ürün tanımı**
2. **Sorun tanımı ve çözüm yaklaşımı**
3. **Hedef kullanıcılar ve roller**
4. **Çok kiracılı sistem mimarisi yaklaşımı**
5. **Superadmin paneli detayları**
6. **Mağaza admin paneli detayları**
7. **Müşteri paneli detayları**
8. **Otomatik mini-site üretim sistemi mantığı**
9. **Randevu motoru ve slot oluşturma kuralları**
10. **Çalışan uygunluğu, izin, kapalı gün ve çakışma mantığı**
11. **Ödeme mimarisi ve PayTR akışı**
12. **Önerilen teknik stack ve nedenleri**
13. **Veritabanı varlıkları / tablolar / ilişkiler**
14. **API modülleri ve endpoint grupları**
15. **MVP kapsamı**
16. **MVP sonrası fazlar**
17. **Monetizasyon modeli**
18. **Yerel SEO ve mağaza sayfalarının büyüme gücü**
19. **Güvenlik, tenant izolasyonu ve oturum yönetimi**
20. **Kritik riskler, edge-case’ler ve dikkat edilmesi gerekenler**
21. **Adım adım geliştirme yol haritası**
22. **Bu işin neden güçlü bir SaaS / franchise altyapısına dönüşebileceği**

## Beklentim
Yanıtın:
- yüzeysel olmasın,
- startup klişesi olmasın,
- gerçekten uygulanabilir olsun,
- teknik ve ticari açıdan güçlü olsun,
- modül modül net olsun,
- gerektiğinde tablo benzeri düzen kullansın,
- gerekiyorsa mimari kararlar arasında kıyas yapsın,
- zayıf fikir görürsen beni uyarıp daha iyi alternatif öner.

Ek olarak cevap sonunda şunları da üret:
- **önerilen modül listesi**,
- **önerilen veritabanı tablo listesi**,
- **ilk 90 günlük execution plan**,
- **yatırımcıya tek paragrafta anlatılacak pitch versiyonu**.

Bu görevi, gerçek hayatta bu projeyi teknik olarak kuracak ana mimar sensin gibi ele al ve mümkün olan en güçlü çıktıyı ver.
