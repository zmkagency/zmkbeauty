"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Scissors, Check } from "lucide-react";
import api from "@/lib/api";

export default function StoreForgotPasswordPage() {
  const { storeSlug } = useParams();
  const [store, setStore] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/tenants/slug/${storeSlug}`).then((res) => setStore(res.data)).catch(() => {});
  }, [storeSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", { email, storeSlug });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const brandColor = store?.themeColor || "#e11d48";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link href={`/${storeSlug}/login`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Girişe Dön
        </Link>

        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: brandColor }}>
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>Şifremi Unuttum</h1>
              <p className="text-xs text-gray-500">Sıfırlama bağlantısı e-postanıza gönderilecek</p>
            </div>
          </div>

          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 mx-auto flex items-center justify-center mb-4">
                <Check className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">E-posta Gönderildi</h2>
              <p className="text-gray-500 text-sm mb-6">
                E-posta adresiniz sistemde kayıtlıysa, şifrenizi sıfırlamak için bir bağlantı içeren bir e-posta alacaksınız.
                Bağlantı 60 dakika boyunca geçerlidir.
              </p>
              <Link href={`/${storeSlug}/login`} className="btn btn-primary">
                Girişe Dön
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-posta Adresiniz</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-11" placeholder="ornek@email.com" required />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full btn btn-primary btn-lg">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Sıfırlama Bağlantısı Gönder"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
