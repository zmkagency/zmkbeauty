"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(form);
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="min-h-screen flex">
      {/* Left: Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-dark items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-pink-500/15 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative text-center px-12"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-rose mx-auto flex items-center justify-center mb-8 shadow-2xl shadow-rose-500/30 animate-pulse-glow">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Hemen Ücretsiz Başlayın
          </h2>
          <p className="text-rose-200 max-w-sm mx-auto">
            Birkaç dakikada hesabınızı oluşturun ve güzellik dünyasına adım atın.
          </p>
        </motion.div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-rose flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              ZMK<span className="text-rose-600">Beauty</span>
            </span>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "var(--font-display)" }}>
            Hesap Oluştur
          </h1>
          <p className="text-gray-500 mb-8">Güzellik platformuna hemen katılın.</p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className="input pl-11" placeholder="Ahmet" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Soyad</label>
                <input type="text" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className="input" placeholder="Yılmaz" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="input pl-11" placeholder="ornek@email.com" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="input pl-11" placeholder="05XX XXX XX XX" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} className="input pl-11 pr-11" placeholder="En az 6 karakter" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="kvkk"
                checked={kvkkAccepted}
                onChange={(e) => setKvkkAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 accent-rose-600 rounded"
                required
              />
              <label htmlFor="kvkk" className="text-sm text-gray-600">
                <Link href="/kvkk" target="_blank" className="text-rose-600 hover:underline">KVKK Aydınlatma Metni</Link>'ni ve{" "}
                <Link href="/terms" target="_blank" className="text-rose-600 hover:underline">Kullanım Koşulları</Link>'nı okudum, kabul ediyorum.
              </label>
            </div>

            <button type="submit" disabled={loading || !kvkkAccepted} className="w-full btn btn-primary btn-lg mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Kayıt Ol
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Zaten hesabınız var mı?{" "}
            <Link href="/login" className="font-semibold text-rose-600 hover:text-rose-700">
              Giriş Yap
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
