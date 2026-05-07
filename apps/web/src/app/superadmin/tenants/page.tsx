"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Plus, MapPin, Users, Calendar, ExternalLink, ToggleLeft, ToggleRight,
  Pencil, Trash2, X, Check, AlertTriangle, Loader2, Wand2,
} from "lucide-react";
import api from "@/lib/api";
import OnboardingWizard from "@/components/admin/OnboardingWizard";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
  district?: string | null;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  address?: string | null;
  themeColor?: string | null;
  isActive: boolean;
  _count?: { employees?: number; appointments?: number; services?: number };
};

type SlugState = "idle" | "checking" | "available" | "taken" | "invalid";

const emptyForm = {
  name: "",
  slug: "",
  city: "",
  district: "",
  phone: "",
  email: "",
  address: "",
  shortDescription: "",
  description: "",
  themeColor: "#e11d48",
};

export default function SuperadminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; tenant?: Tenant } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/tenants").then((res) => setTenants(res.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (id: string) => {
    await api.patch(`/tenants/${id}/toggle-active`);
    load();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
          Mağazalar
        </h1>
        <div className="flex gap-2">
          <button onClick={() => setShowWizard(true)} className="btn btn-primary btn-sm">
            <Wand2 className="w-4 h-4" /> Hızlı Onboarding
          </button>
          <button onClick={() => setModal({ mode: "create" })} className="btn btn-outline btn-sm">
            <Plus className="w-4 h-4" /> Manuel Ekle
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-rose-400 border-t-rose-600 rounded-full animate-spin" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="col-span-full rounded-2xl bg-gray-900 border border-gray-800 p-10 text-center">
            <p className="text-gray-400">Henüz mağaza bulunmamaktadır.</p>
          </div>
        ) : (
          tenants.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-gray-900 border border-gray-800 p-5 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ background: `linear-gradient(135deg, ${t.themeColor || "#e11d48"}, #9f1239)` }}
                  >
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-gray-500 font-mono">/{t.slug}</p>
                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {t.city || "—"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(t.id)}
                  className={`p-1 ${t.isActive ? "text-emerald-400" : "text-gray-600"}`}
                  title={t.isActive ? "Pasife al" : "Aktifleştir"}
                >
                  {t.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {t._count?.employees || 0}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {t._count?.appointments || 0}</span>
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    onClick={() => setModal({ mode: "edit", tenant: t })}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Düzenle"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(t)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/${t.slug}`}
                    target="_blank"
                    className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Görüntüle
                  </Link>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <TenantFormModal
            mode={modal.mode}
            tenant={modal.tenant}
            onClose={() => setModal(null)}
            onSaved={() => { setModal(null); load(); }}
          />
        )}
        {deleteTarget && (
          <DeleteConfirmModal
            tenant={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onDeleted={() => { setDeleteTarget(null); load(); }}
          />
        )}
        {showWizard && (
          <OnboardingWizard
            onClose={() => setShowWizard(false)}
            onCompleted={() => { setShowWizard(false); load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TenantFormModal({
  mode,
  tenant,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  tenant?: Tenant;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(() => {
    if (mode === "edit" && tenant) {
      return {
        name: tenant.name || "",
        slug: tenant.slug || "",
        city: tenant.city || "",
        district: tenant.district || "",
        phone: tenant.phone || "",
        email: tenant.email || "",
        address: tenant.address || "",
        shortDescription: tenant.shortDescription || "",
        description: tenant.description || "",
        themeColor: tenant.themeColor || "#e11d48",
      };
    }
    return { ...emptyForm };
  });
  const [saving, setSaving] = useState(false);
  const [slugState, setSlugState] = useState<SlugState>("idle");
  const [error, setError] = useState<string | null>(null);
  const originalSlug = useRef(mode === "edit" ? tenant?.slug || "" : "");
  const slugTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (slugTimeout.current) clearTimeout(slugTimeout.current);
    const slug = form.slug.trim();
    if (!slug) { setSlugState("idle"); return; }
    if (!/^[a-z0-9-]+$/.test(slug)) { setSlugState("invalid"); return; }
    if (mode === "edit" && slug === originalSlug.current) { setSlugState("idle"); return; }
    setSlugState("checking");
    slugTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get(`/tenants/check-slug/${slug}`, {
          params: mode === "edit" && tenant ? { excludeId: tenant.id } : {},
        });
        if (res.data.available) setSlugState("available");
        else setSlugState(res.data.reason === "invalid" ? "invalid" : "taken");
      } catch {
        setSlugState("idle");
      }
    }, 400);
    return () => { if (slugTimeout.current) clearTimeout(slugTimeout.current); };
  }, [form.slug, mode, tenant]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (slugState === "taken" || slugState === "invalid") return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        slug: form.slug,
        city: form.city || undefined,
        district: form.district || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        shortDescription: form.shortDescription || undefined,
        description: form.description || undefined,
        themeColor: form.themeColor || undefined,
      };
      if (mode === "create") {
        await api.post("/tenants", payload);
      } else if (tenant) {
        await api.put(`/tenants/${tenant.id}`, payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || "Hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const slugHint = () => {
    switch (slugState) {
      case "checking": return <span className="text-gray-400 flex items-center gap-1 text-xs"><Loader2 className="w-3 h-3 animate-spin" /> Kontrol ediliyor…</span>;
      case "available": return <span className="text-emerald-400 flex items-center gap-1 text-xs"><Check className="w-3 h-3" /> Kullanılabilir</span>;
      case "taken": return <span className="text-red-400 flex items-center gap-1 text-xs"><X className="w-3 h-3" /> Bu URL kullanılıyor</span>;
      case "invalid": return <span className="text-amber-400 flex items-center gap-1 text-xs"><AlertTriangle className="w-3 h-3" /> Sadece küçük harf, rakam ve tire</span>;
      default: return null;
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-40"
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none overflow-y-auto"
      >
        <form
          onSubmit={submit}
          className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-xl pointer-events-auto max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900">
            <h3 className="font-semibold text-white">
              {mode === "create" ? "Yeni Mağaza Oluştur" : "Mağazayı Düzenle"}
            </h3>
            <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Mağaza Adı *</label>
                <input
                  className="input bg-gray-800 border-gray-700 text-white"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Slug (URL) *</label>
                <input
                  className="input bg-gray-800 border-gray-700 text-white font-mono text-sm"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                  required
                  placeholder="magaza-adi"
                />
                <div className="mt-1 min-h-[1.25rem]">{slugHint()}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Şehir</label>
                <input className="input bg-gray-800 border-gray-700 text-white" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">İlçe</label>
                <input className="input bg-gray-800 border-gray-700 text-white" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Telefon</label>
                <input className="input bg-gray-800 border-gray-700 text-white" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">E-posta</label>
                <input type="email" className="input bg-gray-800 border-gray-700 text-white" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Adres</label>
              <input className="input bg-gray-800 border-gray-700 text-white" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Kısa Açıklama</label>
              <input
                className="input bg-gray-800 border-gray-700 text-white"
                value={form.shortDescription}
                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                maxLength={160}
                placeholder="Hero altında görünür"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Açıklama</label>
              <textarea
                className="input bg-gray-800 border-gray-700 text-white"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Tema Rengi</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  className="h-10 w-16 rounded cursor-pointer bg-gray-800 border border-gray-700"
                  value={form.themeColor}
                  onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                />
                <input
                  className="input bg-gray-800 border-gray-700 text-white font-mono text-sm"
                  value={form.themeColor}
                  onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-3 sticky bottom-0">
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm text-gray-400">
              İptal
            </button>
            <button
              type="submit"
              disabled={saving || slugState === "checking" || slugState === "taken" || slugState === "invalid"}
              className="btn btn-primary btn-sm"
            >
              {saving ? "Kaydediliyor…" : mode === "create" ? "Oluştur" : "Kaydet"}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

function DeleteConfirmModal({
  tenant,
  onClose,
  onDeleted,
}: {
  tenant: Tenant;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText === tenant.slug;
  const hasActivity = (tenant._count?.appointments || 0) > 0;

  const doDelete = async () => {
    setError(null);
    setBusy(true);
    try {
      await api.delete(`/tenants/${tenant.id}`);
      onDeleted();
    } catch (err: any) {
      setError(err.response?.data?.message || "Silme işlemi başarısız");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-40"
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-gray-900 border border-red-500/30 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Mağazayı Sil</h3>
                <p className="text-xs text-gray-400">{tenant.name}</p>
              </div>
            </div>

            {hasActivity ? (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 mb-4">
                <p className="text-sm text-amber-300">
                  Bu mağazada <b>{tenant._count?.appointments}</b> randevu kaydı bulunmaktadır.
                  Silme işlemi sunucu tarafında reddedilecektir. Bunun yerine mağazayı pasife alın.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-300 mb-4">
                Bu işlem geri alınamaz. Devam etmek için mağaza URL&apos;sini (<span className="font-mono text-rose-400">{tenant.slug}</span>) aşağıya yazın.
              </p>
            )}

            <input
              className="input bg-gray-800 border-gray-700 text-white font-mono text-sm w-full"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={tenant.slug}
              disabled={hasActivity}
            />

            {error && (
              <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
            <button onClick={onClose} className="btn btn-ghost btn-sm text-gray-400">Vazgeç</button>
            <button
              onClick={doDelete}
              disabled={!canDelete || busy || hasActivity}
              className="btn btn-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              {busy ? "Siliniyor…" : "Kalıcı Olarak Sil"}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
