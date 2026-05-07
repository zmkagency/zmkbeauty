"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Settings, Server, Shield, Mail, CreditCard, Database,
  Globe, BookOpen, CheckCircle2, AlertCircle, ExternalLink,
} from "lucide-react";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";

type StatusTone = "ok" | "warn" | "idle";

function StatusPill({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  const cls =
    tone === "ok"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : tone === "warn"
      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
      : "bg-gray-500/15 text-gray-400 border-gray-500/30";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${cls}`}>
      {tone === "ok" ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
      {children}
    </span>
  );
}

export default function SuperadminSettingsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/superadmin")
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  const webUrl = typeof window !== "undefined" ? window.location.origin : "";
  const env =
    apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1")
      ? "development"
      : "production";

  const kpis = stats?.kpis || {};

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Platform Ayarları</h1>
        <p className="text-gray-400 mt-1">Sistem durumu, yapılandırma ve entegrasyon bilgileri.</p>
      </div>

      {/* Health grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "API Bağlantısı", icon: Server, tone: "ok" as StatusTone, detail: apiUrl },
          { label: "Veritabanı", icon: Database, tone: stats ? "ok" : "warn" as StatusTone, detail: stats ? "Bağlı" : "Kontrol ediliyor" },
          { label: "Ortam", icon: Globe, tone: env === "production" ? "ok" : "idle" as StatusTone, detail: env.toUpperCase() },
          { label: "Auth", icon: Shield, tone: "ok" as StatusTone, detail: "JWT + Refresh" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl bg-gray-900 border border-gray-800 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <s.icon className="w-5 h-5 text-rose-400" />
              <StatusPill tone={s.tone}>{s.tone === "ok" ? "Aktif" : s.tone === "warn" ? "Uyarı" : "Bilgi"}</StatusPill>
            </div>
            <p className="text-sm text-gray-400">{s.label}</p>
            <p className="text-sm font-medium text-white mt-1 truncate">{s.detail}</p>
          </motion.div>
        ))}
      </div>

      {/* Platform summary */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6 mb-6">
        <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-rose-500" /> Platform Özeti
        </h2>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-rose-400 border-t-rose-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Toplam Mağaza" value={kpis.totalTenants ?? 0} />
            <Stat label="Aktif Mağaza" value={kpis.activeTenants ?? 0} />
            <Stat label="Toplam Müşteri" value={kpis.totalCustomers ?? 0} />
            <Stat label="Aylık Ciro" value={formatPrice(kpis.monthlyRevenue || 0)} />
          </div>
        )}
      </div>

      {/* Integration cards */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <IntegrationCard
          icon={CreditCard}
          title="Ödeme Sağlayıcı"
          status={<StatusPill tone="ok">PayTR</StatusPill>}
          lines={[
            "Mod: " + (process.env.NEXT_PUBLIC_PAYTR_MODE || "test"),
            "Para birimi: TRY",
            "Taksit: Mağazaya göre değişir",
          ]}
          hint="PayTR yapılandırması API ortam değişkenleri üzerinden yönetilir (PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY, PAYTR_MERCHANT_SALT)."
        />
        <IntegrationCard
          icon={Mail}
          title="E-posta Servisi"
          status={<StatusPill tone="ok">Resend</StatusPill>}
          lines={[
            "Karşılama / randevu / şifre sıfırlama şablonları aktif",
            "Gönderici: noreply@zmkbeauty.com",
          ]}
          hint="RESEND_API_KEY ortam değişkeni API tarafından okunur."
        />
      </div>

      {/* Quick links */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
        <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-rose-500" /> Hızlı Erişim
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickLink href="/superadmin/tenants" label="Mağaza Yönetimi" />
          <QuickLink href="/superadmin/users" label="Kullanıcılar" />
          <QuickLink href="/superadmin/appointments" label="Tüm Randevular" />
          <QuickLink href="/superadmin/payments" label="Ödemeler" />
          <QuickLink href="/superadmin/logs" label="Sistem Kayıtları" />
          <QuickLink external href={`${apiUrl.replace(/\/api$/, "")}/api/docs`} label="Swagger API Dokümanı" />
        </div>
        <p className="text-xs text-gray-500 mt-5">
          Web URL: <span className="text-gray-300">{webUrl || "—"}</span> · API: <span className="text-gray-300">{apiUrl}</span>
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-gray-950 border border-gray-800 px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-white mt-1">{value}</p>
    </div>
  );
}

function IntegrationCard({
  icon: Icon,
  title,
  status,
  lines,
  hint,
}: {
  icon: any;
  title: string;
  status: React.ReactNode;
  lines: string[];
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-rose-400" />
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        {status}
      </div>
      <ul className="space-y-1 text-sm text-gray-400">
        {lines.map((l, i) => (
          <li key={i}>• {l}</li>
        ))}
      </ul>
      {hint && <p className="text-xs text-gray-500 mt-3">{hint}</p>}
    </div>
  );
}

function QuickLink({ href, label, external }: { href: string; label: string; external?: boolean }) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800 hover:border-rose-500/40 transition"
      >
        <span className="text-sm text-gray-200">{label}</span>
        <ExternalLink className="w-4 h-4 text-gray-500" />
      </a>
    );
  }
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800 hover:border-rose-500/40 transition"
    >
      <span className="text-sm text-gray-200">{label}</span>
      <ExternalLink className="w-4 h-4 text-gray-500" />
    </Link>
  );
}
