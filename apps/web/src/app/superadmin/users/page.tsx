"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  Search, Plus, KeyRound, Trash2, ToggleLeft, ToggleRight, X, AlertTriangle, Check,
} from "lucide-react";

type UserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
  tenantId?: string | null;
  tenant?: { name: string; slug: string } | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
};

type Tenant = { id: string; name: string; slug: string };

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Süper Yönetici",
  STORE_ADMIN: "Mağaza Yöneticisi",
  EMPLOYEE: "Çalışan",
  CUSTOMER: "Müşteri",
};
const ROLE_COLORS: Record<string, string> = {
  SUPERADMIN: "bg-red-100 text-red-700",
  STORE_ADMIN: "bg-blue-100 text-blue-700",
  EMPLOYEE: "bg-amber-100 text-amber-700",
  CUSTOMER: "bg-emerald-100 text-emerald-700",
};

export default function SuperadminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (roleFilter) params.role = roleFilter;
    if (search) params.search = search;
    api
      .get("/users", { params })
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false));
  }, [roleFilter, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get("/tenants").then((res) => setTenants(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const toggleActive = async (id: string) => {
    await api.patch(`/users/${id}/toggle-active`);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
          Kullanıcılar
        </h1>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Yeni Kullanıcı
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            className="input bg-gray-800 border-gray-700 text-white pl-11"
            placeholder="Kullanıcı ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input bg-gray-800 border-gray-700 text-white max-w-[220px]"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">Tüm Roller</option>
          <option value="SUPERADMIN">Süper Yönetici</option>
          <option value="STORE_ADMIN">Mağaza Yöneticisi</option>
          <option value="EMPLOYEE">Çalışan</option>
          <option value="CUSTOMER">Müşteri</option>
        </select>
      </div>

      <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800">
              <tr>
                <th className="text-left p-4 font-medium text-gray-400">Kullanıcı</th>
                <th className="text-left p-4 font-medium text-gray-400">E-posta</th>
                <th className="text-left p-4 font-medium text-gray-400">Rol</th>
                <th className="text-left p-4 font-medium text-gray-400">Mağaza</th>
                <th className="text-left p-4 font-medium text-gray-400">Durum</th>
                <th className="text-left p-4 font-medium text-gray-400">Kayıt</th>
                <th className="text-right p-4 font-medium text-gray-400">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="w-8 h-8 border-4 border-rose-400 border-t-rose-600 rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Kullanıcı bulunamadı.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-800/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-rose flex items-center justify-center text-white text-xs font-bold">
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <span className="text-white font-medium">{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400">{u.email}</td>
                    <td className="p-4">
                      <span className={`badge ${ROLE_COLORS[u.role] || ""}`}>{ROLE_LABELS[u.role] || u.role}</span>
                    </td>
                    <td className="p-4 text-gray-400">{u.tenant?.name || "—"}</td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleActive(u.id)}
                        className={`${u.isActive ? "text-emerald-400" : "text-gray-600"}`}
                        title={u.isActive ? "Pasife al" : "Aktifleştir"}
                      >
                        {u.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                    </td>
                    <td className="p-4 text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setResetTarget(u)}
                          className="text-gray-400 hover:text-blue-400 transition-colors"
                          title="Şifre sıfırlama bağlantısı gönder"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateUserModal
            tenants={tenants}
            onClose={() => setShowCreate(false)}
            onCreated={() => { setShowCreate(false); load(); setToast("Kullanıcı oluşturuldu"); }}
          />
        )}
        {resetTarget && (
          <ResetPasswordModal
            user={resetTarget}
            onClose={() => setResetTarget(null)}
            onDone={(msg) => { setResetTarget(null); setToast(msg); }}
          />
        )}
        {deleteTarget && (
          <DeleteUserModal
            user={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onDeleted={() => { setDeleteTarget(null); load(); setToast("Kullanıcı silindi"); }}
          />
        )}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-[60] bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateUserModal({
  tenants,
  onClose,
  onCreated,
}: {
  tenants: Tenant[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    role: "STORE_ADMIN",
    tenantId: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsTenant = form.role === "STORE_ADMIN" || form.role === "EMPLOYEE";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır");
      return;
    }
    if (needsTenant && !form.tenantId) {
      setError("Bu rol için mağaza seçilmelidir");
      return;
    }
    setSaving(true);
    try {
      await api.post("/users", {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        password: form.password,
        role: form.role,
        tenantId: form.tenantId || undefined,
      });
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || "Oluşturulamadı");
    } finally {
      setSaving(false);
    }
  };

  const genPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    let out = "";
    const arr = new Uint32Array(14);
    crypto.getRandomValues(arr);
    for (let i = 0; i < 14; i++) out += chars[arr[i] % chars.length];
    setForm((f) => ({ ...f, password: out }));
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
          className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900">
            <h3 className="font-semibold text-white">Yeni Kullanıcı Oluştur</h3>
            <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Ad *</label>
                <input required className="input bg-gray-800 border-gray-700 text-white" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Soyad *</label>
                <input required className="input bg-gray-800 border-gray-700 text-white" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">E-posta *</label>
              <input required type="email" className="input bg-gray-800 border-gray-700 text-white" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Telefon</label>
              <input className="input bg-gray-800 border-gray-700 text-white" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Rol *</label>
              <select className="input bg-gray-800 border-gray-700 text-white" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, tenantId: e.target.value === "SUPERADMIN" || e.target.value === "CUSTOMER" ? "" : form.tenantId })}>
                <option value="SUPERADMIN">Süper Yönetici</option>
                <option value="STORE_ADMIN">Mağaza Yöneticisi</option>
                <option value="EMPLOYEE">Çalışan</option>
                <option value="CUSTOMER">Müşteri</option>
              </select>
            </div>
            {needsTenant && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Mağaza *</label>
                <select required className="input bg-gray-800 border-gray-700 text-white" value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })}>
                  <option value="">Seçiniz…</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Başlangıç Şifresi * <span className="text-gray-500">(en az 8 karakter)</span></label>
              <div className="flex gap-2">
                <input
                  required
                  minLength={8}
                  className="input bg-gray-800 border-gray-700 text-white font-mono text-sm flex-1"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button type="button" onClick={genPassword} className="btn btn-ghost btn-sm text-gray-300 border border-gray-700">
                  Üret
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Kullanıcıya bu şifreyi iletin; ilk girişte şifre sıfırlama bağlantısı göndermeniz önerilir.</p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-3 sticky bottom-0">
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm text-gray-400">İptal</button>
            <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
              {saving ? "Oluşturuluyor…" : "Oluştur"}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

function ResetPasswordModal({
  user,
  onClose,
  onDone,
}: {
  user: UserRow;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trigger = async () => {
    setError(null);
    setBusy(true);
    try {
      await api.post(`/users/${user.id}/reset-password`);
      onDone(`Sıfırlama bağlantısı ${user.email} adresine gönderildi`);
    } catch (err: any) {
      setError(err.response?.data?.message || "İşlem başarısız");
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
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Şifre Sıfırlama Bağlantısı</h3>
                <p className="text-xs text-gray-400">{user.firstName} {user.lastName}</p>
              </div>
            </div>
            <p className="text-sm text-gray-300">
              <span className="font-mono text-blue-300">{user.email}</span> adresine 60 dakika geçerli bir şifre sıfırlama bağlantısı gönderilecek.
              Varsa önceki tüm bağlantılar geçersiz kılınacak.
            </p>
            {error && (
              <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
            <button onClick={onClose} className="btn btn-ghost btn-sm text-gray-400">Vazgeç</button>
            <button
              onClick={trigger}
              disabled={busy}
              className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700"
            >
              <KeyRound className="w-4 h-4" />
              {busy ? "Gönderiliyor…" : "Bağlantıyı Gönder"}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function DeleteUserModal({
  user,
  onClose,
  onDeleted,
}: {
  user: UserRow;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText === user.email;

  const doDelete = async () => {
    setError(null);
    setBusy(true);
    try {
      await api.delete(`/users/${user.id}`);
      onDeleted();
    } catch (err: any) {
      setError(err.response?.data?.message || "Silme başarısız");
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
                <h3 className="font-semibold text-white">Kullanıcıyı Sil</h3>
                <p className="text-xs text-gray-400">{user.firstName} {user.lastName}</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              Bu işlem geri alınamaz. Randevu geçmişi bulunan kullanıcılar silinemez. Devam etmek için kullanıcının e-posta adresini yazın:
              <br />
              <span className="font-mono text-rose-400">{user.email}</span>
            </p>
            <input
              className="input bg-gray-800 border-gray-700 text-white font-mono text-sm w-full"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={user.email}
            />
            {error && (
              <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
            <button onClick={onClose} className="btn btn-ghost btn-sm text-gray-400">Vazgeç</button>
            <button
              onClick={doDelete}
              disabled={!canDelete || busy}
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
