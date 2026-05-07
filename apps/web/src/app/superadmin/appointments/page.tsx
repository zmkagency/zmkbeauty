"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import api from "@/lib/api";
import { formatPrice, formatDate, getStatusLabel, getStatusColor } from "@/lib/utils";

const STATUSES = [
  { value: "", label: "Tüm Durumlar" },
  { value: "PENDING_PAYMENT", label: "Ödeme Bekleniyor" },
  { value: "CONFIRMED", label: "Onaylandı" },
  { value: "IN_PROGRESS", label: "Devam Ediyor" },
  { value: "COMPLETED", label: "Tamamlandı" },
  { value: "CANCELLED", label: "İptal" },
  { value: "NO_SHOW", label: "Gelmedi" },
];

export default function SuperadminAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("");
  const [tenantFilter, setTenantFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchAppts = useCallback(() => {
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    if (tenantFilter) params.tenantId = tenantFilter;
    if (from) params.from = from;
    if (to) params.to = to;
    if (search) params.q = search;
    setLoading(true);
    api.get("/appointments", { params }).then((res) => setAppointments(res.data)).finally(() => setLoading(false));
  }, [statusFilter, tenantFilter, from, to, search]);

  useEffect(() => { fetchAppts(); }, [fetchAppts]);

  useEffect(() => {
    api.get("/tenants").then((r) => setTenants(r.data)).catch(() => {});
  }, []);

  const clearFilters = () => {
    setStatusFilter(""); setTenantFilter(""); setFrom(""); setTo(""); setSearchInput(""); setSearch("");
  };
  const hasFilters = statusFilter || tenantFilter || from || to || search;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Tüm Randevular</h1>
          <p className="text-sm text-gray-400 mt-0.5">{appointments.length} kayıt</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-4 mb-6 grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-400 mb-1">Ara</label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500"
              placeholder="Müşteri, e-posta, mağaza…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Durum</label>
          <select
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-rose-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Mağaza</label>
          <select
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-rose-500"
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
          >
            <option value="">Tümü</option>
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Başlangıç</label>
          <input
            type="date"
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-rose-500"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Bitiş</label>
          <div className="flex gap-2">
            <input
              type="date"
              className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-rose-500"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            {hasFilters && (
              <button onClick={clearFilters} className="px-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white" title="Temizle">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800">
              <tr>
                <th className="text-left p-4 font-medium text-gray-400">Tarih</th>
                <th className="text-left p-4 font-medium text-gray-400">Mağaza</th>
                <th className="text-left p-4 font-medium text-gray-400">Müşteri</th>
                <th className="text-left p-4 font-medium text-gray-400">Hizmet</th>
                <th className="text-right p-4 font-medium text-gray-400">Tutar</th>
                <th className="text-left p-4 font-medium text-gray-400">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center"><div className="w-8 h-8 border-4 border-rose-400 border-t-rose-600 rounded-full animate-spin mx-auto" /></td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Kayıt bulunamadı</td></tr>
              ) : appointments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-800/50">
                  <td className="p-4 text-gray-500 text-xs whitespace-nowrap">{formatDate(a.date)} • {a.startTime}</td>
                  <td className="p-4 text-rose-400 font-medium">{a.tenant?.name}</td>
                  <td className="p-4 text-white">{a.customer?.firstName} {a.customer?.lastName}</td>
                  <td className="p-4 text-gray-300">{a.service?.name}</td>
                  <td className="p-4 text-right text-white font-medium">{formatPrice(a.totalPrice || a.service?.price || 0)}</td>
                  <td className="p-4"><span className={`badge ${getStatusColor(a.status)}`}>{getStatusLabel(a.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
