"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Scissors, Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

function StoreRegisterInner() {
  const { storeSlug } = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get("redirect") || "";
  const { registerCustomer } = useAuthStore();

  const [store, setStore] = useState<any>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [kvkk, setKvkk] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/tenants/slug/${storeSlug}`).then((res) => setStore(res.data)).catch(() => {});
  }, [storeSlug]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!kvkk) return setError("Devam etmek için KVKK ve Kullanım Koşullarını kabul etmelisiniz.");
    if (!store?.id) return setError("Mağaza bilgileri yüklenemedi.");

    setLoading(true);
    try {
      await registerCustomer({ ...form, tenantId: store.id });
      router.push(redirect === "booking" ? `/${storeSlug}/booking` : `/${storeSlug}/account`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  const brandColor = store?.themeColor || "#e11d48";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link href={`/${storeSlug}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> {store?.name || "Mağazaya Dön"}
        </Link>

        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: brandColor }}>
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>Hesap Oluştur</h1>
              <p className="text-xs text-gray-500">{store?.name || "Mağaza"} müşteri kaydı</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className="input pl-11" placeholder="Ayşe" required />
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
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className="input pl-11 pr-11"
                  placeholder="En az 6 karakter"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={kvkk} onChange={(e) => setKvkk(e.target.checked)} className="mt-1 w-4 h-4 accent-rose-600 rounded" required />
              <span>
                <Link href="/kvkk" target="_blank" className="text-rose-600 hover:underline">KVKK Aydınlatma Metni</Link>'ni ve{" "}
                <Link href="/terms" target="_blank" className="text-rose-600 hover:underline">Kullanım Koşulları</Link>'nı okudum, kabul ediyorum.
              </span>
            </label>

            <button type="submit" disabled={loading || !kvkk} className="w-full btn btn-primary btn-lg mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Kayıt Ol <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Zaten hesabınız var mı?{" "}
            <Link href={`/${storeSlug}/login${redirect ? `?redirect=${redirect}` : ""}`} className="font-semibold text-rose-600 hover:text-rose-700">
              Giriş Yap
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function StoreRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" /></div>}>
      <StoreRegisterInner />
    </Suspense>
  );
}
