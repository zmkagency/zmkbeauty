"use client";

import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function KVKKPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-rose-600 mb-8">
          <ArrowLeft className="w-4 h-4" /> Ana Sayfa
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
            <Shield className="w-6 h-6 text-rose-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
            KVKK Aydınlatma Metni
          </h1>
        </div>

        <div className="prose prose-gray max-w-none">
          <p className="text-sm text-gray-500 mb-6">Son güncelleme: 9 Nisan 2026</p>

          <h2>1. Veri Sorumlusu</h2>
          <p>
            ZMK Beauty Platform ("Platform"), 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında
            veri sorumlusu sıfatıyla kişisel verilerinizi aşağıda açıklanan amaçlar doğrultusunda işlemektedir.
          </p>

          <h2>2. İşlenen Kişisel Veriler</h2>
          <p>Platform üzerinden aşağıdaki kişisel veriler toplanmakta ve işlenmektedir:</p>
          <ul>
            <li><strong>Kimlik Bilgileri:</strong> Ad, soyad</li>
            <li><strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası</li>
            <li><strong>Hesap Bilgileri:</strong> Şifrelenmiş parola, kullanıcı rolü</li>
            <li><strong>İşlem Bilgileri:</strong> Randevu geçmişi, ödeme bilgileri, hizmet tercihleri</li>
            <li><strong>Teknik Veriler:</strong> IP adresi, tarayıcı bilgisi, çerez verileri</li>
          </ul>

          <h2>3. Kişisel Verilerin İşlenme Amaçları</h2>
          <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
          <ul>
            <li>Randevu oluşturma ve yönetimi</li>
            <li>Ödeme işlemlerinin gerçekleştirilmesi</li>
            <li>Hizmet kalitesinin iyileştirilmesi</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            <li>Bildirim ve hatırlatma gönderimi (SMS, e-posta)</li>
            <li>İstatistiksel analizler ve raporlama</li>
          </ul>

          <h2>4. Kişisel Verilerin Aktarılması</h2>
          <p>Kişisel verileriniz, aşağıdaki taraflara ve amaçlarla aktarılabilir:</p>
          <ul>
            <li><strong>Ödeme Kuruluşları:</strong> PayTR — ödeme işlemlerinin güvenli şekilde gerçekleştirilmesi</li>
            <li><strong>SMS/E-posta Sağlayıcıları:</strong> Randevu bildirimlerinin iletilmesi</li>
            <li><strong>Güzellik İşletmeleri:</strong> Randevu aldığınız işletmeye randevu bilgileriniz aktarılır</li>
            <li><strong>Yetkili Kamu Kurumları:</strong> Yasal zorunluluk halinde</li>
          </ul>

          <h2>5. Veri Saklama Süresi</h2>
          <p>
            Kişisel verileriniz, işlenme amaçlarının gerektirdiği süre boyunca saklanır. 
            Hesabınızı sildiğinizde kişisel verileriniz 30 gün içinde anonimleştirilir veya silinir.
            Yasal yükümlülükler kapsamında bazı veriler 10 yıla kadar saklanabilir.
          </p>

          <h2>6. Veri Güvenliği</h2>
          <p>
            Kişisel verilerinizin güvenliği için aşağıdaki önlemler alınmaktadır:
          </p>
          <ul>
            <li>Şifreler bcrypt algoritması ile hash'lenerek saklanır</li>
            <li>Tüm iletişim SSL/TLS şifreleme ile korunur</li>
            <li>Veritabanı erişimi yetkilendirme ile sınırlıdır</li>
            <li>Düzenli güvenlik denetimleri yapılır</li>
          </ul>

          <h2>7. KVKK Kapsamındaki Haklarınız</h2>
          <p>KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
          <ul>
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
            <li>Eksik veya yanlış işlenmiş olması halinde düzeltilmesini isteme</li>
            <li>KVKK'nın 7. maddesi çerçevesinde silinmesini veya yok edilmesini isteme</li>
            <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
            <li>Kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
          </ul>

          <h2>8. Başvuru</h2>
          <p>
            Haklarınızı kullanmak için <strong>kvkk@zmkbeauty.com</strong> adresine e-posta gönderebilir 
            veya Kişisel Verileri Koruma Kurulu'na başvurabilirsiniz.
          </p>

          <div className="mt-8 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Veri Sorumlusu:</strong> ZMK Yazılım ve Teknoloji<br />
              <strong>Adres:</strong> Kırıkkale, Türkiye<br />
              <strong>E-posta:</strong> kvkk@zmkbeauty.com<br />
              <strong>Telefon:</strong> +90 541 381 2114
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
