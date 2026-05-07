"use client";

import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-rose-600 mb-8">
          <ArrowLeft className="w-4 h-4" /> Ana Sayfa
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
            <FileText className="w-6 h-6 text-rose-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
            Kullanım Koşulları
          </h1>
        </div>

        <div className="prose prose-gray max-w-none">
          <p className="text-sm text-gray-500 mb-6">Son güncelleme: 9 Nisan 2026</p>

          <h2>1. Hizmet Tanımı</h2>
          <p>
            ZMK Beauty Platform, güzellik işletmelerine online randevu yönetimi, ödeme altyapısı ve 
            dijital vitrin hizmeti sunan bir SaaS (Software as a Service) platformudur.
          </p>

          <h2>2. Hesap Oluşturma</h2>
          <ul>
            <li>Platformu kullanmak için geçerli bir e-posta adresi ile hesap oluşturmanız gerekmektedir.</li>
            <li>Hesap bilgilerinizin doğruluğundan siz sorumlusunuz.</li>
            <li>Hesabınızın güvenliğini sağlamakla yükümlüsünüz.</li>
            <li>18 yaşından küçük kişiler ebeveyn/vasi onayı olmadan hesap oluşturamaz.</li>
          </ul>

          <h2>3. Randevu Kuralları</h2>
          <ul>
            <li>Oluşturulan randevular, ödeme tamamlandığında kesinleşir.</li>
            <li>Randevu iptali, işletmenin belirlediği iptal politikasına tabidir.</li>
            <li>No-show (gelmeme) durumunda ücret iadesi yapılmayabilir.</li>
            <li>Platform, randevu saatlerinde meydana gelebilecek çakışmalardan sorumlu değildir.</li>
          </ul>

          <h2>4. Ödeme Koşulları</h2>
          <ul>
            <li>Ödemeler PayTR güvenli ödeme altyapısı üzerinden gerçekleştirilir.</li>
            <li>Fiyatlar, güzellik işletmeleri tarafından belirlenir.</li>
            <li>İade talepleri işletme politikasına göre değerlendirilir.</li>
            <li>Platform, ödeme işlemlerinde aracı konumundadır.</li>
          </ul>

          <h2>5. İşletme Sorumlulukları</h2>
          <p>Platformu kullanan güzellik işletmeleri:</p>
          <ul>
            <li>Sundukları hizmetlerin doğruluğundan ve kalitesinden sorumludur.</li>
            <li>Fiyatları güncel ve doğru tutmakla yükümlüdür.</li>
            <li>Müşteri verilerini KVKK kapsamında korumakla yükümlüdür.</li>
            <li>Çalışma saatlerini ve kapalı günleri güncel tutmalıdır.</li>
          </ul>

          <h2>6. Yasaklanan Davranışlar</h2>
          <ul>
            <li>Platformu yasa dışı amaçlarla kullanmak</li>
            <li>Sahte randevu oluşturmak</li>
            <li>Diğer kullanıcıların hesaplarına yetkisiz erişim</li>
            <li>Platformun teknik altyapısına zarar vermeye çalışmak</li>
            <li>Spam veya istenmeyen iletişim göndermek</li>
          </ul>

          <h2>7. Sorumluluk Sınırlaması</h2>
          <p>
            ZMK Beauty Platform, güzellik işletmeleri ile müşteriler arasındaki işlemlerde aracı
            konumundadır. Hizmet kalitesi, randevu saatlerine uyum ve ödeme iadeleri konusunda
            nihai sorumluluk ilgili güzellik işletmesine aittir.
          </p>

          <h2>8. Değişiklikler</h2>
          <p>
            Bu kullanım koşullarını önceden haber vermeksizin güncelleme hakkını saklı tutarız. 
            Güncellemeler bu sayfada yayımlandığı tarihten itibaren geçerli olur.
          </p>

          <h2>9. İletişim</h2>
          <p>
            Kullanım koşulları hakkında sorularınız için <strong>info@zmkbeauty.com</strong> adresinden iletişime geçebilirsiniz.
          </p>

          <div className="mt-8 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-sm text-gray-600">
              Bu platformu kullanarak yukarıdaki koşulları kabul etmiş sayılırsınız.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
