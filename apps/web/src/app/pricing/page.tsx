"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X, Zap, Crown, Building2, Rocket, ArrowRight, Star } from "lucide-react";

const plans = [
  {
    tier: "FREE",
    name: "Başlangıç",
    description: "Dijitalleşmeye ilk adım",
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxEmployees: 1,
    highlight: false,
    icon: Zap,
    features: [
      { text: "1 Personel", included: true },
      { text: "50 Randevu/Ay", included: true },
      { text: "Otomatik Mikro-Site", included: true },
      { text: "Temel Takvim", included: true },
      { text: "Online Ödeme Kabul", included: true },
      { text: "Temel Raporlar", included: true },
      { text: "%5 İşlem Komisyonu", included: true },
      { text: "WhatsApp Hatırlatma", included: false },
      { text: "Kampanya & Kuponlar", included: false },
      { text: "Sadakat Programı", included: false },
      { text: "Gelişmiş Analitik", included: false },
    ],
  },
  {
    tier: "PRO",
    name: "Profesyonel",
    description: "Büyüyen salonlar için",
    monthlyPrice: 399,
    yearlyPrice: 319,
    maxEmployees: 5,
    highlight: true,
    badge: "En Popüler",
    icon: Star,
    features: [
      { text: "5 Personel", included: true },
      { text: "Sınırsız Randevu", included: true },
      { text: "Otomatik Mikro-Site", included: true },
      { text: "Gelişmiş Takvim", included: true },
      { text: "Online Ödeme Kabul", included: true },
      { text: "Gelişmiş Raporlar & Analitik", included: true },
      { text: "%2.5 İşlem Komisyonu", included: true },
      { text: "WhatsApp Hatırlatma", included: true },
      { text: "Kampanya & Kuponlar", included: true },
      { text: "Sadakat Programı", included: true },
      { text: "Paket Satışı (10'lu Seanslar)", included: true },
      { text: "Hediye Kartları", included: true },
      { text: "SMS Bildirimleri", included: true },
      { text: "Bekleme Listesi", included: true },
    ],
  },
  {
    tier: "BUSINESS",
    name: "İşletme",
    description: "Çoklu şube yönetimi",
    monthlyPrice: 699,
    yearlyPrice: 559,
    maxEmployees: 15,
    highlight: false,
    icon: Building2,
    features: [
      { text: "15 Personel", included: true },
      { text: "Sınırsız Randevu", included: true },
      { text: "PRO'daki Tüm Özellikler", included: true },
      { text: "%1.5 İşlem Komisyonu", included: true },
      { text: "Çoklu Şube Yönetimi", included: true },
      { text: "AI Zamanlama Optimizasyonu", included: true },
      { text: "API Erişimi", included: true },
      { text: "Özel Tema & Tasarım", included: true },
      { text: "Öncelikli Destek", included: true },
      { text: "Personel Performans Analizi", included: true },
    ],
  },
  {
    tier: "ENTERPRISE",
    name: "Kurumsal",
    description: "Franchise & zincir markalar",
    monthlyPrice: -1,
    yearlyPrice: -1,
    maxEmployees: -1,
    highlight: false,
    icon: Crown,
    features: [
      { text: "Sınırsız Personel", included: true },
      { text: "İŞLETME'deki Tüm Özellikler", included: true },
      { text: "%0 İşlem Komisyonu", included: true },
      { text: "White-Label Uygulama", included: true },
      { text: "Özel Hesap Yöneticisi", included: true },
      { text: "SLA Garantisi", included: true },
      { text: "Özel Entegrasyonlar", included: true },
      { text: "On-Premise Seçeneği", included: true },
    ],
  },
];

const faqs = [
  {
    q: "Ücretsiz plan gerçekten sonsuza kadar ücretsiz mi?",
    a: "Evet! Başlangıç planı herhangi bir süre sınırı olmadan tamamen ücretsizdir. 1 personel ve aylık 50 randevu ile dijital dönüşümünüze hemen başlayabilirsiniz.",
  },
  {
    q: "Yıllık ödeme yaparsam ne kadar tasarruf ederim?",
    a: "Yıllık ödeme tercihinde %20 indirim uygulanır. Örneğin PRO plan aylık ₺399 yerine ₺319/ay olur.",
  },
  {
    q: "Planımı istediğim zaman değiştirebilir miyim?",
    a: "Evet, planınızı istediğiniz zaman yükseltebilir veya düşürebilirsiniz. Yükseltme anında geçerli olur.",
  },
  {
    q: "İşlem komisyonu nedir?",
    a: "Müşterileriniz online ödeme yaptığında her işlemden alınan küçük bir yüzdelik paydır. Komisyon oranı planınıza göre değişir (FREE: %5, PRO: %2.5, BUSINESS: %1.5, ENTERPRISE: %0).",
  },
  {
    q: "Kredi kartı bilgim olmadan başlayabilir miyim?",
    a: "Evet! Ücretsiz plan için kredi kartı gerekmez. Sadece kayıt olun ve hemen kullanmaya başlayın.",
  },
  {
    q: "Rakiplerinizden farkınız ne?",
    a: "Otomatik mikro-site, online ödeme kabul, marketplace keşif, AI zamanlama, paket satışı, hediye kartları, WhatsApp bot randevu ve çok daha fazlası. Rakiplerin 3-5 kişilik planı ₺960/ay iken bizim PRO planımız 5 kişi ile sadece ₺399/ay.",
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-rose-50 to-white pt-20 pb-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Salonunuzu Dijitale Taşıyın
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto mb-8"
          >
            Türkiye'nin en uygun fiyatlı ve en kapsamlı güzellik salonu yönetim platformu.
            Rakiplerin yarı fiyatına, iki katı özellik.
          </motion.p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}
            >
              Aylık
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === "yearly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}
            >
              Yıllık <span className="text-green-600 font-bold ml-1">%20 İndirim</span>
            </button>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 -mt-4 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

            return (
              <motion.div
                key={plan.tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl border-2 p-6 flex flex-col ${
                  plan.highlight
                    ? "border-rose-500 shadow-xl shadow-rose-100 scale-[1.02]"
                    : "border-gray-200"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.highlight ? "bg-rose-100 text-rose-600" : "bg-gray-100 text-gray-600"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-xs text-gray-500">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  {price === 0 ? (
                    <div className="text-3xl font-bold text-gray-900">Ücretsiz</div>
                  ) : price === -1 ? (
                    <div className="text-2xl font-bold text-gray-900">İletişime Geçin</div>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold text-gray-900">₺{price}</span>
                      <span className="text-gray-500 text-sm">/ay</span>
                      {billingCycle === "yearly" && plan.monthlyPrice > 0 && (
                        <div className="text-xs text-green-600 mt-1">
                          ₺{plan.monthlyPrice - price}/ay tasarruf
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      {f.included ? (
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                      )}
                      <span className={f.included ? "text-gray-700" : "text-gray-400"}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={price === -1 ? "/contact" : "/register"}
                  className={`w-full py-2.5 px-4 rounded-xl text-center font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                    plan.highlight
                      ? "bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-200"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {price === 0 ? "Ücretsiz Başla" : price === -1 ? "Bize Ulaşın" : "Hemen Başla"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Comparison with competitor */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 bg-gradient-to-r from-rose-50 to-purple-50 rounded-3xl p-8 sm:p-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8" style={{ fontFamily: "var(--font-display)" }}>
            Neden ZMK Beauty?
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-rose-600 mb-2">%58</div>
              <p className="text-sm text-gray-600">Daha uygun fiyat<br /><span className="text-xs text-gray-400">(3-5 kişi plan karşılaştırma)</span></p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-rose-600 mb-2">2x</div>
              <p className="text-sm text-gray-600">Daha fazla özellik<br /><span className="text-xs text-gray-400">(Online ödeme, AI, paket satışı...)</span></p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-rose-600 mb-2">7/24</div>
              <p className="text-sm text-gray-600">Müşteri randevusu<br /><span className="text-xs text-gray-400">(WhatsApp bot + online booking)</span></p>
            </div>
          </div>
        </motion.div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8" style={{ fontFamily: "var(--font-display)" }}>
            Sıkça Sorulan Sorular
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group border border-gray-200 rounded-xl p-4 hover:border-rose-200 transition-colors">
                <summary className="font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-gray-400 group-open:rotate-45 transition-transform text-xl">+</span>
                </summary>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Hemen Ücretsiz Başlayın</h2>
          <p className="text-gray-600 mb-6">Kredi kartı gerekmez. 30 saniyede kayıt olun.</p>
          <Link href="/register" className="btn btn-primary btn-lg inline-flex items-center gap-2">
            <Rocket className="w-5 h-5" /> Ücretsiz Hesap Oluştur
          </Link>
        </div>
      </div>
    </div>
  );
}
