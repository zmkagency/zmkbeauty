"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Calendar,
  Store,
  CreditCard,
  ArrowRight,
  Star,
  Users,
  MapPin,
  Clock,
  Shield,
  Smartphone,
  TrendingUp,
  ChevronRight,
  Scissors,
  Heart,
  Zap,
  Menu,
  X,
} from "lucide-react";

const features = [
  {
    icon: Store,
    title: "Otomatik Mikro-Site",
    desc: "Her işletmeye birkaç dakikada kendi web sitesi. Logo, hizmetler, adres — tümü hazır.",
  },
  {
    icon: Calendar,
    title: "Akıllı Randevu Motoru",
    desc: "Çalışan uygunluğu, izin günleri, çakışma kontrolü — tek tıkla randevu.",
  },
  {
    icon: CreditCard,
    title: "Online Ödeme",
    desc: "PayTR ile güvenli online ödeme. Randevu onayından sonra kesinleşir.",
  },
  {
    icon: Users,
    title: "Müşteri Yönetimi",
    desc: "Müşteri geçmişi, tekrar randevu, iletişim bilgileri — hepsi elinizin altında.",
  },
  {
    icon: TrendingUp,
    title: "Akıllı Raporlama",
    desc: "Günlük ciro, çalışan performansı, en çok satan hizmetler — veriye dayalı karar.",
  },
  {
    icon: Shield,
    title: "Güvenli Altyapı",
    desc: "Tenant izolasyonu, rol bazlı yetki, güvenli oturumlar — kurumsal düzeyde güvenlik.",
  },
];

const stats = [
  { value: "500+", label: "Güzellik İşletmesi" },
  { value: "50K+", label: "Randevu" },
  { value: "4.9", label: "Müşteri Puanı", icon: Star },
  { value: "30sn", label: "Randevu Süresi" },
];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen">
      {/* ============ NAVBAR ============ */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-rose flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                ZMK<span className="text-rose-600">Beauty</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-rose-600 transition-colors">
                Özellikler
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-rose-600 transition-colors">
                Nasıl Çalışır
              </a>
              <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-rose-600 transition-colors">
                Fiyatlar
              </a>
              <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-rose-600 transition-colors">
                Giriş Yap
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Ücretsiz Başla
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
              {mobileMenu ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden overflow-hidden border-t border-gray-100"
              >
                <div className="py-4 flex flex-col gap-2">
                  <a href="#features" onClick={() => setMobileMenu(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors">Özellikler</a>
                  <a href="#how-it-works" onClick={() => setMobileMenu(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors">Nasıl Çalışır</a>
                  <Link href="/login" onClick={() => setMobileMenu(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors">Giriş Yap</Link>
                  <Link href="/register" onClick={() => setMobileMenu(false)} className="mx-4 btn btn-primary btn-sm text-center">Ücretsiz Başla</Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-mesh">
        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-rose-200/30 blur-3xl animate-float" />
        <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-rose-100/20 blur-3xl" style={{ animationDelay: "2s" }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-200 mb-6">
                <Zap className="w-4 h-4 text-rose-600" />
                <span className="text-sm font-semibold text-rose-700">Türkiye&apos;nin Güzellik Platformu</span>
              </div>

              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-gray-900"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Güzellik
                <br />
                İşletmenizi
                <br />
                <span className="bg-gradient-to-r from-rose-600 to-pink-500 bg-clip-text text-transparent">
                  Dijitalleştirin
                </span>
              </h1>

              <p className="mt-6 text-lg text-gray-600 max-w-lg leading-relaxed">
                Kuaför, güzellik merkezi, lazer kliniği — hepsi tek platformda. Otomatik web sitesi, online randevu, online ödeme ve güçlü yönetim paneli.
              </p>

              {/* B2C Advanced Search Bar */}
              <div className="mt-8 bg-white p-2 rounded-2xl shadow-xl border border-gray-100 flex items-center max-w-lg relative z-10">
                <div className="flex-1 px-4 py-2 border-r border-gray-100 flex items-center gap-3">
                  <Store className="w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Salon veya hizmet ara..." 
                    className="w-full bg-transparent border-none focus:ring-0 text-gray-700 placeholder-gray-400"
                    onChange={(e) => {
                      // We will implement search navigation later, just UI for now
                    }}
                  />
                </div>
                <div className="hidden sm:flex flex-1 px-4 py-2 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Konum (İl/İlçe)" 
                    className="w-full bg-transparent border-none focus:ring-0 text-gray-700 placeholder-gray-400"
                  />
                </div>
                <button className="bg-rose-600 hover:bg-rose-700 text-white p-4 rounded-xl transition-colors shadow-md shadow-rose-200">
                  <Sparkles className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-4 mt-8">
                <Link href="/register" className="btn btn-primary btn-lg btn-shine">
                  Hemen Ücretsiz Başla
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/zmk-guzellik-merkezi" className="btn btn-outline btn-lg">
                  Demo Mağazayı İncele
                </Link>
              </div>

              <div className="flex items-center gap-6 mt-10">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-rose border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                      {["AY", "FD", "EK", "MC"][i - 1]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">500+ işletme güveniyor</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/50">
                <div className="bg-gradient-dark p-8 pb-0">
                  <div className="bg-white rounded-t-2xl p-6 shadow-inner">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                        <Scissors className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">ZMK Güzellik Merkezi</p>
                        <p className="text-xs text-gray-500">Kırıkkale — Açık</p>
                      </div>
                    </div>

                    {/* Mini booking preview */}
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Heart className="w-4 h-4 text-rose-500" />
                          <span className="text-sm font-medium">Saç Kesimi</span>
                        </div>
                        <span className="text-sm font-bold text-rose-600">₺350</span>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-4 h-4 text-rose-500" />
                          <span className="text-sm font-medium">Cilt Bakımı</span>
                        </div>
                        <span className="text-sm font-bold text-rose-600">₺500</span>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Zap className="w-4 h-4 text-rose-500" />
                          <span className="text-sm font-medium">Lazer Epilasyon</span>
                        </div>
                        <span className="text-sm font-bold text-rose-600">₺400</span>
                      </div>
                    </div>

                    <button className="w-full mt-4 btn btn-primary">
                      <Calendar className="w-4 h-4" />
                      Randevu Oluştur
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <motion.div
                className="absolute -bottom-4 -left-4 glass rounded-2xl p-4 shadow-lg"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">30 saniyede</p>
                    <p className="text-xs text-gray-500">randevu oluştur</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="py-16 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
                  {stat.icon && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold text-rose-600 uppercase tracking-wider mb-2">Özellikler</p>
            <h2 className="text-4xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
              İşletmeniz İçin Her Şey Tek Platformda
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Güzellik işletmenizi dijitalleştirmek için ihtiyacınız olan tüm araçlar — kurulum gerektirmeden.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors mb-4">
                  <feature.icon className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold text-rose-600 uppercase tracking-wider mb-2">Nasıl Çalışır</p>
            <h2 className="text-4xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
              3 Adımda Randevu
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Hizmet Seç", desc: "İstediğiniz hizmeti ve çalışanı seçin", icon: Sparkles },
              { step: "02", title: "Gün & Saat Belirle", desc: "Uygun tarih ve saati seçin", icon: Calendar },
              { step: "03", title: "Öde & Onayla", desc: "Online ödeme yapın, randevunuz hazır", icon: CreditCard },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-rose mx-auto flex items-center justify-center mb-6 shadow-lg shadow-rose-200">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-2">Adım {item.step}</p>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
                {i < 2 && (
                  <ChevronRight className="hidden md:block absolute top-10 -right-4 w-8 h-8 text-rose-200" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-dark rounded-3xl p-12 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-rose-500/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-pink-500/10 blur-3xl" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
                İşletmenizi Bugün Dijitalleştirin
              </h2>
              <p className="text-rose-100 mb-8 max-w-lg mx-auto">
                Dakikalar içinde kendi web sitenize ve online randevu altyapınıza sahip olun. Kredi kartı gerekmez.
              </p>
              <Link href="/register" className="btn btn-primary btn-lg btn-shine">
                Ücretsiz Başla
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* Logo & Adres */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-rose flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold" style={{ fontFamily: "var(--font-display)" }}>
                  ZMK<span className="text-rose-600">Beauty</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>Kırıkkale, Türkiye</span>
              </div>
            </div>

            {/* Hızlı Linkler */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Hızlı Linkler</h4>
              <div className="flex flex-col gap-2 text-sm text-gray-500">
                <a href="#features" className="hover:text-rose-600 transition-colors">Özellikler</a>
                <a href="#how-it-works" className="hover:text-rose-600 transition-colors">Nasıl Çalışır</a>
                <Link href="/login" className="hover:text-rose-600 transition-colors">Giriş Yap</Link>
                <Link href="/register" className="hover:text-rose-600 transition-colors">Ücretsiz Başla</Link>
              </div>
            </div>

            {/* Yasal */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Yasal</h4>
              <div className="flex flex-col gap-2 text-sm text-gray-500">
                <Link href="/kvkk" className="hover:text-rose-600 transition-colors">KVKK Aydınlatma Metni</Link>
                <Link href="/privacy" className="hover:text-rose-600 transition-colors">Gizlilik Politikası</Link>
                <Link href="/terms" className="hover:text-rose-600 transition-colors">Kullanım Koşulları</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400">
              © 2026 ZMK Beauty Platform. Tüm hakları saklıdır.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <Link href="/kvkk" className="hover:text-rose-600 transition-colors">KVKK</Link>
              <Link href="/privacy" className="hover:text-rose-600 transition-colors">Gizlilik</Link>
              <Link href="/terms" className="hover:text-rose-600 transition-colors">Koşullar</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
