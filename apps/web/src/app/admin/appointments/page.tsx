"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Filter, X, Phone, Mail, Clock, User as UserIcon,
  Scissors, CheckCircle2, XCircle, PlayCircle, AlertCircle, CreditCard, LayoutList,
  Search, Download, Plus,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { formatDate, formatPrice, getStatusLabel, getStatusColor } from "@/lib/utils";
import AppointmentCalendar from "@/components/admin/AppointmentCalendar";
import WalkinModal from "@/components/admin/WalkinModal";

const STATUS_OPTIONS = [
  { value: "", label: "Tüm Durumlar" },
  { value: "PENDING_PAYMENT", label: "Ödeme Bekleniyor" },
  { value: "CONFIRMED", label: "Onaylandı" },
  { value: "IN_PROGRESS", label: "Devam Ediyor" },
  { value: "COMPLETED", label: "Tamamlandı" },
  { value: "CANCELLED", label: "İptal" },
  { value: "NO_SHOW", label: "Gelmedi" },
];

export default function AdminAppointmentsPage() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId;

  const [appointments, setAppointments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [view, setView] = useState<'list' | 'calendar'>('calendar');
  const [detail, setDetail] = useState<any | null>(null);
  const [showWalkin, setShowWalkin] = useState(false);

  // Debounce search input → search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchList = useCallback(() => {
    if (!tenantId) return;
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    if (dateFilter) params.date = dateFilter;
    if (employeeFilter) params.employeeId = employeeFilter;
    if (search) params.q = search;
    setLoading(true);
    api
      .get(`/tenants/${tenantId}/appointments`, { params })
      .then((res) => setAppointments(res.data))
      .finally(() => setLoading(false));
  }, [tenantId, statusFilter, dateFilter, employeeFilter, search]);

  useEffect(() => { fetchList(); }, [fetchList]);

  useEffect(() => {
    if (!tenantId) return;
    Promise.all([
      api.get(`/tenants/${tenantId}/employees`),
      api.get(`/tenants/${tenantId}/services`),
    ])
      .then(([empRes, srvRes]) => {
        setEmployees(empRes.data);
        setServices(srvRes.data);
      })
      .catch(() => {});
  }, [tenantId]);

  const exportCsv = async () => {
    if (!tenantId) return;
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (dateFilter) {
      params.set("from", dateFilter);
      params.set("to", dateFilter);
    }
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/tenants/${tenantId}/appointments.csv?${params.toString()}`;
    const res = await api.get(url, { responseType: "blob" });
    const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `randevular-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/appointments/${id}/status`, { status });
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    setDetail((d: any) => (d && d.id === id ? { ...d, status } : d));
  };

  const clearFilters = () => {
    setStatusFilter("");
    setDateFilter("");
    setEmployeeFilter("");
    setSearchInput("");
    setSearch("");
  };

  const hasFilters = statusFilter || dateFilter || employeeFilter || search;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>Randevular</h1>
          <p className="text-sm text-gray-500 mt-0.5">{appointments.length} randevu</p>
        </div>
        <div className="flex flex-wrap gap-2 self-start">
          <button onClick={() => setShowWalkin(true)} className="btn btn-primary btn-sm">
            <Plus className="w-4 h-4" /> Manuel Randevu
          </button>
          <button onClick={exportCsv} className="btn btn-outline btn-sm" title="CSV indir">
            <Download className="w-4 h-4" /> CSV
          </button>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${view === 'calendar' ? 'bg-white shadow text-gray-900 font-medium' : 'text-gray-500'}`}
            >
              <Calendar className="w-4 h-4" /> Takvim
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${view === 'list' ? 'bg-white shadow text-gray-900 font-medium' : 'text-gray-500'}`}
            >
              <LayoutList className="w-4 h-4" /> Liste
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`card p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end ${view === 'calendar' ? 'hidden' : ''}`}>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">Ara</label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="input pl-9"
              placeholder="İsim, e-posta, telefon, hizmet…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Durum</label>
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tarih</label>
          <input type="date" className="input" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Çalışan</label>
          <div className="flex gap-2">
            <select className="input flex-1" value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
              <option value="">Tümü</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </select>
            {hasFilters && (
              <button onClick={clearFilters} className="btn btn-ghost btn-sm" title="Temizle">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {view === 'calendar' ? (
        <AppointmentCalendar appointments={appointments} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-500">Müşteri</th>
                  <th className="text-left p-4 font-medium text-gray-500">Hizmet</th>
                  <th className="text-left p-4 font-medium text-gray-500">Çalışan</th>
                  <th className="text-left p-4 font-medium text-gray-500">Tarih</th>
                  <th className="text-left p-4 font-medium text-gray-500">Saat</th>
                  <th className="text-left p-4 font-medium text-gray-500">Durum</th>
                  <th className="text-right p-4 font-medium text-gray-500">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center"><div className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto" /></td></tr>
                ) : appointments.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">{hasFilters ? "Seçilen filtrelere uygun randevu bulunamadı." : "Randevu bulunmamaktadır."}</td></tr>
                ) : appointments.map((appt) => (
                  <tr
                    key={appt.id}
                    onClick={() => setDetail(appt)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="p-4">
                      <p className="font-medium text-gray-900">{appt.customer?.firstName} {appt.customer?.lastName}</p>
                      <p className="text-xs text-gray-400">{appt.customer?.phone || appt.customer?.email}</p>
                    </td>
                    <td className="p-4 text-gray-700">{appt.service?.name}</td>
                    <td className="p-4 text-gray-700">{appt.employee?.firstName} {appt.employee?.lastName}</td>
                    <td className="p-4 text-gray-700">{formatDate(appt.date)}</td>
                    <td className="p-4 text-gray-700 font-medium">{appt.startTime} - {appt.endTime}</td>
                    <td className="p-4"><span className={`badge ${getStatusColor(appt.status)}`}>{getStatusLabel(appt.status)}</span></td>
                    <td className="p-4 text-right font-semibold text-rose-600">{formatPrice(appt.totalPrice || appt.service?.price || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {detail && (
          <AppointmentDetailModal
            appointment={detail}
            onClose={() => setDetail(null)}
            onStatusChange={updateStatus}
          />
        )}
        {showWalkin && tenantId && (
          <WalkinModal
            tenantId={tenantId}
            services={services}
            employees={employees}
            onClose={() => setShowWalkin(false)}
            onCreated={fetchList}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AppointmentDetailModal({
  appointment,
  onClose,
  onStatusChange,
}: {
  appointment: any;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
}) {
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const act = async (status: string, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBusyAction(status);
    try {
      await onStatusChange(appointment.id, status);
    } finally {
      setBusyAction(null);
    }
  };

  const s = appointment.status;
  const canConfirm = s === "PENDING_PAYMENT";
  const canStart = s === "CONFIRMED";
  const canComplete = s === "CONFIRMED" || s === "IN_PROGRESS";
  const canCancel = s === "CONFIRMED" || s === "PENDING_PAYMENT" || s === "IN_PROGRESS";
  const canNoShow = s === "CONFIRMED";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-40"
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-gray-900">Randevu Detayı</h3>
              <p className="text-xs text-gray-500 mt-0.5">#{appointment.id.slice(-8).toUpperCase()}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
          </div>

          <div className="p-6 space-y-5">
            <span className={`badge ${getStatusColor(s)}`}>{getStatusLabel(s)}</span>

            <Row icon={UserIcon} label="Müşteri" value={`${appointment.customer?.firstName || ""} ${appointment.customer?.lastName || ""}`.trim()} />
            {appointment.customer?.phone && <Row icon={Phone} label="Telefon" value={appointment.customer.phone} />}
            {appointment.customer?.email && <Row icon={Mail} label="E-posta" value={appointment.customer.email} />}

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <Row icon={Scissors} label="Hizmet" value={appointment.service?.name} />
              <Row icon={UserIcon} label="Çalışan" value={`${appointment.employee?.firstName || ""} ${appointment.employee?.lastName || ""}`.trim()} />
              <Row icon={Calendar} label="Tarih" value={formatDate(appointment.date)} />
              <Row icon={Clock} label="Saat" value={`${appointment.startTime} – ${appointment.endTime}`} />
              <Row icon={CreditCard} label="Tutar" value={formatPrice(appointment.totalPrice || appointment.service?.price || 0)} emphasize />
            </div>

            {appointment.notes && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs font-medium text-amber-700 mb-1">Müşteri Notu</p>
                <p className="text-sm text-amber-900">{appointment.notes}</p>
              </div>
            )}

            {appointment.payment && (
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Ödeme</p>
                <p className="text-sm text-gray-900">{appointment.payment.status} {appointment.payment.paidAt && `• ${formatDate(appointment.payment.paidAt)}`}</p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-2 justify-end">
            {canConfirm && (
              <button onClick={() => act("CONFIRMED")} disabled={busyAction !== null} className="btn btn-sm btn-primary">
                <CheckCircle2 className="w-4 h-4" /> Onayla
              </button>
            )}
            {canStart && (
              <button onClick={() => act("IN_PROGRESS")} disabled={busyAction !== null} className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700">
                <PlayCircle className="w-4 h-4" /> Başlat
              </button>
            )}
            {canComplete && (
              <button onClick={() => act("COMPLETED")} disabled={busyAction !== null} className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700">
                <CheckCircle2 className="w-4 h-4" /> Tamamla
              </button>
            )}
            {canNoShow && (
              <button
                onClick={() => act("NO_SHOW", "Müşteri gelmedi olarak işaretlenecek. Emin misin?")}
                disabled={busyAction !== null}
                className="btn btn-sm bg-amber-500 text-white hover:bg-amber-600"
              >
                <AlertCircle className="w-4 h-4" /> Gelmedi
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => act("CANCELLED", "Bu randevu iptal edilecek. Emin misin?")}
                disabled={busyAction !== null}
                className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
              >
                <XCircle className="w-4 h-4" /> İptal Et
              </button>
            )}
            <button onClick={onClose} className="btn btn-sm btn-ghost">Kapat</button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function Row({ icon: Icon, label, value, emphasize }: { icon: any; label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm ${emphasize ? "font-bold text-rose-600" : "text-gray-900 font-medium"}`}>{value || "—"}</p>
      </div>
    </div>
  );
}
