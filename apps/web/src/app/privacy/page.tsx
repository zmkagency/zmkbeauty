"use client";

import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-rose-600 mb-8">
          <ArrowLeft className="w-4 h-4" /> Ana Sayfa
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
            <Lock className="w-6 h-6 text-rose-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
            Gizlilik Politikası
          </h1>
        </div>

        <div className="prose prose-gray max-w-none">
          <p className="text-sm text-gray-500 mb-6">Son güncelleme: 9 Nisan 2026</p>

          <h2>1. Genel Bakış</h2>
          <p>
            ZMK Beauty Platform ("biz", "bizim"), güzellik işletmeleri ve müşterileri için online randevu 
            ve yönetim hizmeti sunan bir SaaS platformudur. Bu Gizlilik Politikası, platformumuzu 
            kullandığınızda kişisel bilgilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.
          </p>

          <h2>2. Topladığımız Bilgiler</h2>
          <h3>Kayıt Bilgileri</h3>
          <p>Hesap oluşturduğunuzda ad, soyad, e-posta ve telefon numaranızı toplarız.</p>
          
          <h3>Randevu Bilgileri</h3>
          <p>Oluşturduğunuz randevuların tarihi, saati, seçtiğiniz hizmet ve çalışan bilgileri kaydedilir.</p>
          
          <h3>Ödeme Bilgileri</h3>
          <p>
            Ödeme işlemleri PayTR altyapısı üzerinden gerçekleştirilir. Kredi kartı bilgileriniz 
            sunucularımızda saklanmaz; doğrudan PayTR'nin güvenli sunucularında işlenir.
          </p>

          <h3>Otomatik Toplanan Veriler</h3>
          <p>IP adresi, tarayıcı türü, ziyaret edilen sayfalar ve çerez verileri otomatik olarak toplanır.</p>

          <h2>3. Bilgilerin Kullanımı</h2>
          <ul>
            <li>Randevu oluşturma ve yönetimi</li>
            <li>Randevu onay ve hatırlatma bildirimleri</li>
            <li>Güvenli ödeme işlemleri</li>
            <li>Müşteri desteği sağlama</li>
            <li>Platform iyileştirme ve analitik</li>
          </ul>

          <h2>4. Bilgi Paylaşımı</h2>
          <p>Kişisel bilgilerinizi üçüncü taraflara satmayız. Bilgileriniz yalnızca şu durumlarda paylaşılır:</p>
          <ul>
            <li>Randevu aldığınız güzellik işletmesiyle (randevu detayları)</li>
            <li>Ödeme işlemcisi PayTR ile (ödeme bilgileri)</li>
            <li>Yasal zorunluluk halinde yetkili kurumlarla</li>
          </ul>

          <h2>5. Çerezler (Cookies)</h2>
          <p>
            Platformumuz, oturum yönetimi ve kullanıcı deneyimini iyileştirmek için çerezler kullanır. 
            Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz; ancak bazı çerezlerin devre dışı 
            bırakılması platformun düzgün çalışmasını engelleyebilir.
          </p>

          <h2>6. Veri Güvenliği</h2>
          <p>
            Verilerinizi korumak için endüstri standardı güvenlik önlemleri kullanıyoruz: 
            SSL/TLS şifreleme, bcrypt parola hash'leme, yetkilendirme kontrolleri ve düzenli güvenlik güncellemeleri.
          </p>

          <h2>7. Haklarınız</h2>
          <p>
            KVKK kapsamındaki haklarınız hakkında detaylı bilgi için{" "}
            <Link href="/kvkk" className="text-rose-600 hover:underline">KVKK Aydınlatma Metni</Link> sayfamızı ziyaret edin.
          </p>

          <h2>8. İletişim</h2>
          <p>
            Gizlilik ile ilgili sorularınız için <strong>info@zmkbeauty.com</strong> adresinden veya <strong>+90 541 381 2114</strong> numaralı telefondan bizimle iletişime geçebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
