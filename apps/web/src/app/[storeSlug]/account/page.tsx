"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Calendar, Clock, User, LogOut,
  Sparkles, X, History, Edit, Save, Star, RefreshCw, MessageSquare, Repeat,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { formatPrice, formatDate, getStatusLabel, getStatusColor } from "@/lib/utils";

export default function StoreAccountPage() {
  const { storeSlug } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, loadUser, logout } = useAuthStore();

  const [store, setStore] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past" | "profile">("upcoming");

  const [profile, setProfile] = useState({ firstName: "", lastName: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Reschedule modal
  const [rescheduleAppt, setRescheduleAppt] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<any[]>([]);
  const [rescheduleSlot, setRescheduleSlot] = useState<any>(null);
  const [reschedLoading, setReschedLoading] = useState(false);
  const [reschedSaving, setReschedSaving] = useState(false);
  const [reschedError, setReschedError] = useState("");

  // Review modal
  const [reviewAppt, setReviewAppt] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => { loadUser(); }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${storeSlug}/login`);
    }
  }, [isLoading, isAuthenticated, storeSlug, router]);

  useEffect(() => {
    api.get(`/tenants/slug/${storeSlug}`).then((res) => setStore(res.data)).catch(() => {});
  }, [storeSlug]);

  const refreshAppointments = async () => {
    const { data } = await api.get("/appointments/my");
    setAppointments(data);
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshAppointments().finally(() => setLoadingList(false));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) {
      setProfile({ firstName: user.firstName || "", lastName: user.lastName || "", phone: (user as any).phone || "" });
    }
  }, [user]);

  const tenantAppointments = appointments.filter((a) => a.tenant?.slug === storeSlug || a.tenantId === store?.id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = tenantAppointments.filter((a) => new Date(a.date) >= today && !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(a.status));
  const past = tenantAppointments.filter((a) => new Date(a.date) < today || ["CANCELLED", "COMPLETED", "NO_SHOW"].includes(a.status));

  const handleCancel = async (id: string) => {
    if (!confirm("Bu randevuyu iptal etmek istediğinizden emin misiniz?")) return;
    try {
      await api.patch(`/appointments/${id}/cancel`);
      await refreshAppointments();
    } catch (err: any) {
      alert(err.response?.data?.message || "İptal başarısız oldu.");
    }
  };

  // ---------- Reschedule helpers ----------
  const openReschedule = (appt: any) => {
    setRescheduleAppt(appt);
    setRescheduleDate("");
    setRescheduleSlots([]);
    setRescheduleSlot(null);
    setReschedError("");
  };

  useEffect(() => {
    if (rescheduleAppt && rescheduleDate) {
      setReschedLoading(true);
      setRescheduleSlot(null);
      api
        .get(`/tenants/${rescheduleAppt.tenantId || store?.id}/slots`, {
          params: {
            employeeId: rescheduleAppt.employeeId || rescheduleAppt.employee?.id,
            serviceId: rescheduleAppt.serviceId || rescheduleAppt.service?.id,
            date: rescheduleDate,
          },
        })
        .then((res) => setRescheduleSlots(res.data))
        .catch(() => setRescheduleSlots([]))
        .finally(() => setReschedLoading(false));
    }
  }, [rescheduleAppt, rescheduleDate, store]);

  const handleReschedule = async () => {
    if (!rescheduleAppt || !rescheduleDate || !rescheduleSlot) return;
    setReschedSaving(true);
    setReschedError("");
    try {
      await api.patch(`/appointments/${rescheduleAppt.id}/reschedule`, {
        date: rescheduleDate,
        startTime: rescheduleSlot.startTime,
      });
      await refreshAppointments();
      setRescheduleAppt(null);
    } catch (err: any) {
      setReschedError(err.response?.data?.message || "Erteleme başarısız.");
    } finally {
      setReschedSaving(false);
    }
  };

  // ---------- Review helpers ----------
  const openReview = (appt: any) => {
    setReviewAppt(appt);
    setReviewRating(5);
    setReviewComment("");
    setReviewError("");
  };

  const handleReview = async () => {
    if (!reviewAppt) return;
    setReviewSaving(true);
    setReviewError("");
    try {
      await api.post("/reviews", {
        appointmentId: reviewAppt.id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      await refreshAppointments();
      setReviewAppt(null);
    } catch (err: any) {
      setReviewError(err.response?.data?.message || "Yorum gönderilemedi.");
    } finally {
      setReviewSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setProfileMsg("");
    try {
      await api.put("/users/me", profile);
      setProfileMsg("✅ Profil başarıyla güncellendi.");
      const me = await api.post("/auth/me");
      if (me.data) {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, ...me.data }));
      }
      setTimeout(() => setProfileMsg(""), 3000);
    } catch {
      setProfileMsg("⚠️ Profil güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push(`/${storeSlug}`);
  };

  // Generate next 14 days for reschedule date picker
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  if (isLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/${storeSlug}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> {store?.name || "Mağaza"}
          </Link>
          <button onClick={handleLogout} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-600">
            <LogOut className="w-4 h-4" /> Çıkış
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-rose flex items-center justify-center text-white text-2xl font-bold">
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
              Merhaba, {user.firstName}
            </h1>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </div>
          <Link href={`/${storeSlug}/booking`} className="ml-auto btn btn-primary btn-sm">
            <Calendar className="w-4 h-4" /> Yeni Randevu
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white rounded-2xl border border-gray-100 mb-6 w-full sm:w-fit">
          <button onClick={() => setTab("upcoming")} className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition ${tab === "upcoming" ? "bg-rose-50 text-rose-700" : "text-gray-500 hover:text-gray-900"}`}>
            <Calendar className="w-4 h-4" /> Yaklaşan ({upcoming.length})
          </button>
          <button onClick={() => setTab("past")} className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition ${tab === "past" ? "bg-rose-50 text-rose-700" : "text-gray-500 hover:text-gray-900"}`}>
            <History className="w-4 h-4" /> Geçmiş ({past.length})
          </button>
          <button onClick={() => setTab("profile")} className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition ${tab === "profile" ? "bg-rose-50 text-rose-700" : "text-gray-500 hover:text-gray-900"}`}>
            <User className="w-4 h-4" /> Profil
          </button>
        </div>

        {/* Content */}
        {tab === "profile" ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6 max-w-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Edit className="w-5 h-5 text-rose-600" /> Profil Bilgileri
            </h2>
            {profileMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                {profileMsg}
              </div>
            )}
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                  <input className="input" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
                  <input className="input" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <input className="input" value={user.email} disabled />
                <p className="text-xs text-gray-400 mt-1">E-posta değiştirilemez.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="05XX XXX XX XX" />
              </div>
              <button onClick={handleSaveProfile} disabled={saving} className="btn btn-primary btn-sm">
                <Save className="w-4 h-4" /> {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {loadingList ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
              </div>
            ) : (tab === "upcoming" ? upcoming : past).length === 0 ? (
              <div className="card p-10 text-center">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">
                  {tab === "upcoming" ? "Yaklaşan randevunuz bulunmamaktadır." : "Geçmiş randevunuz bulunmamaktadır."}
                </p>
                {tab === "upcoming" && (
                  <Link href={`/${storeSlug}/booking`} className="btn btn-primary btn-sm inline-flex">
                    <Calendar className="w-4 h-4" /> Randevu Al
                  </Link>
                )}
              </div>
            ) : (
              (tab === "upcoming" ? upcoming : past).map((a) => {
                const canCancelOrReschedule =
                  tab === "upcoming" && !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(a.status);
                const canReview = a.status === "COMPLETED" && !a.review;
                const reviewed = !!a.review;
                const canRebook = tab === "past";
                const rebookHref = canRebook
                  ? `/${storeSlug}/booking?service=${a.service?.id || a.serviceId || ""}&employee=${a.employee?.id || a.employeeId || ""}`
                  : null;
                return (
                  <div key={a.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-rose-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">{a.service?.name}</p>
                        <span className={`badge ${getStatusColor(a.status)}`}>{getStatusLabel(a.status)}</span>
                        {reviewed && (
                          <span className="badge bg-amber-50 text-amber-700 inline-flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {a.review.rating}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {a.employee?.firstName} {a.employee?.lastName}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(a.date)}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {a.startTime} — {a.endTime}</span>
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-2 flex-wrap justify-end">
                      <span className="font-bold text-rose-600">{formatPrice(a.totalPrice)}</span>
                      {canCancelOrReschedule && (
                        <>
                          <button
                            onClick={() => openReschedule(a)}
                            className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Ertele"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCancel(a.id)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                            title="İptal Et"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {canReview && (
                        <button
                          onClick={() => openReview(a)}
                          className="btn btn-primary btn-sm"
                          title="Değerlendir"
                        >
                          <Star className="w-4 h-4" /> Değerlendir
                        </button>
                      )}
                      {canRebook && rebookHref && (
                        <Link href={rebookHref} className="btn btn-outline btn-sm" title="Aynı hizmet ve uzmanla yeni randevu">
                          <Repeat className="w-4 h-4" /> Tekrar Al
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </div>

      {/* ============ Reschedule Modal ============ */}
      <AnimatePresence>
        {rescheduleAppt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setRescheduleAppt(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-rose-600" /> Randevuyu Ertele
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{rescheduleAppt.service?.name} — {rescheduleAppt.employee?.firstName}</p>
                </div>
                <button onClick={() => setRescheduleAppt(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {reschedError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {reschedError}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Yeni Tarih</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {dates.map((d) => {
                      const date = new Date(d);
                      return (
                        <button
                          key={d}
                          onClick={() => setRescheduleDate(d)}
                          className={`flex flex-col items-center px-3 py-2 rounded-xl min-w-[64px] text-xs ${
                            rescheduleDate === d ? "bg-rose-600 text-white" : "bg-gray-50 border border-gray-200"
                          }`}
                        >
                          <span className="opacity-75">{date.toLocaleDateString("tr-TR", { weekday: "short" })}</span>
                          <span className="text-lg font-bold">{date.getDate()}</span>
                          <span className="opacity-75">{date.toLocaleDateString("tr-TR", { month: "short" })}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {rescheduleDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Müsait Saatler</p>
                    {reschedLoading ? (
                      <div className="flex justify-center py-6">
                        <div className="w-6 h-6 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
                      </div>
                    ) : rescheduleSlots.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">Bu tarihte müsait saat yok</p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {rescheduleSlots.map((slot) => (
                          <button
                            key={slot.startTime}
                            onClick={() => setRescheduleSlot(slot)}
                            className={`p-2 rounded-lg text-sm font-medium ${
                              rescheduleSlot?.startTime === slot.startTime
                                ? "bg-rose-600 text-white"
                                : "bg-white border border-gray-200 hover:border-rose-300"
                            }`}
                          >
                            {slot.startTime}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-gray-100 flex gap-2">
                <button onClick={() => setRescheduleAppt(null)} className="btn btn-outline btn-sm flex-1">
                  Vazgeç
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={!rescheduleSlot || reschedSaving}
                  className="btn btn-primary btn-sm flex-1"
                >
                  {reschedSaving ? "Kaydediliyor..." : "Ertele"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ Review Modal ============ */}
      <AnimatePresence>
        {reviewAppt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setReviewAppt(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-rose-600" /> Deneyiminizi Değerlendirin
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{reviewAppt.service?.name}</p>
                </div>
                <button onClick={() => setReviewAppt(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {reviewError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {reviewError}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Puanınız</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setReviewRating(n)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-9 h-9 ${
                            n <= reviewRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yorumunuz (isteğe bağlı)</label>
                  <textarea
                    rows={4}
                    className="input w-full"
                    placeholder="Deneyiminizi paylaşın…"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 flex gap-2">
                <button onClick={() => setReviewAppt(null)} className="btn btn-outline btn-sm flex-1">
                  Vazgeç
                </button>
                <button
                  onClick={handleReview}
                  disabled={reviewSaving}
                  className="btn btn-primary btn-sm flex-1"
                >
                  {reviewSaving ? "Gönderiliyor..." : "Gönder"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
