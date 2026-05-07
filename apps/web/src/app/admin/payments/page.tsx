"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Download, X, CreditCard, CheckCircle2, Clock, XCircle, RotateCcw, MoreVertical,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { formatPrice, getStatusLabel, getStatusColor, formatDate } from "@/lib/utils";

const PAYMENT_STATUSES = [
  { value: "", label: "Tüm Durumlar" },
  { value: "SUCCESS", label: "Başarılı" },
  { value: "PENDING", label: "Beklemede" },
  { value: "FAILED", label: "Başarısız" },
  { value: "REFUNDED", label: "İade Edildi" },
];

export default function AdminPaymentsPage() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId;

  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchData = useCallback(() => {
    if (!tenantId) return;
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    if (from) params.from = from;
    if (to) params.to = to;
    if (search) params.q = search;
    setLoading(true);
    Promise.all([
      api.get(`/payments/tenant/${tenantId}`, { params }),
      api.get(`/payments/tenant/${tenantId}/summary`, { params: { from, to } }),
    ])
      .then(([list, sum]) => {
        setPayments(list.data);
        setSummary(sum.data);
      })
      .finally(() => setLoading(false));
  }, [tenantId, statusFilter, from, to, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const clearFilters = () => {
    setStatusFilter("");
    setFrom("");
    setTo("");
    setSearchInput("");
    setSearch("");
  };
  const hasFilters = statusFilter || from || to || search;

  const exportCsv = async () => {
    if (!tenantId) return;
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/payments/tenant/${tenantId}/export.csv?${params.toString()}`;
    const res = await api.get(url, { responseType: "blob" });
    const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `odemeler-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const refund = async (id: string) => {
    if (!confirm("Bu ödemeyi iade olarak işaretlemek ve ilgili randevuyu iptal etmek istiyor musun?")) return;
    setBusyId(id);
    try {
      await api.post(`/payments/${id}/refund`);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "İade işaretlenemedi");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>Ödemeler</h1>
          <p className="text-sm text-gray-500 mt-0.5">{payments.length} kayıt</p>
        </div>
        <button onClick={exportCsv} className="btn btn-outline btn-sm self-start">
          <Download className="w-4 h-4" /> CSV İndir
        </button>
      </div>

      {/* KPI cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiCard
            icon={CheckCircle2}
            label="Tahsil Edilen"
            value={formatPrice(summary.success.amount)}
            sub={`${summary.success.count} işlem`}
            color="bg-emerald-50 text-emerald-700"
          />
          <KpiCard
            icon={Clock}
            label="Bekleyen"
            value={formatPrice(summary.pending.amount)}
            sub={`${summary.pending.count} işlem`}
            color="bg-amber-50 text-amber-700"
          />
          <KpiCard
            icon={XCircle}
            label="Başarısız"
            value={formatPrice(summary.failed.amount)}
            sub={`${summary.failed.count} işlem`}
            color="bg-red-50 text-red-700"
          />
          <KpiCard
            icon={RotateCcw}
            label="İade Edilen"
            value={formatPrice(summary.refunded.amount)}
            sub={`${summary.refunded.count} işlem`}
            color="bg-violet-50 text-violet-700"
          />
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">Ara</label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="input pl-9"
              placeholder="Müşteri, hizmet, ödeme no…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Durum</label>
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {PAYMENT_STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Başlangıç</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Bitiş</label>
          <div className="flex gap-2">
            <input type="date" className="input flex-1" value={to} onChange={(e) => setTo(e.target.value)} />
            {hasFilters && (
              <button onClick={clearFilters} className="btn btn-ghost btn-sm" title="Temizle">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 font-medium text-gray-500">Tarih</th>
                <th className="text-left p-4 font-medium text-gray-500">Ödeme No</th>
                <th className="text-left p-4 font-medium text-gray-500">Müşteri</th>
                <th className="text-left p-4 font-medium text-gray-500">Hizmet</th>
                <th className="text-right p-4 font-medium text-gray-500">Tutar</th>
                <th className="text-left p-4 font-medium text-gray-500">Durum</th>
                <th className="text-right p-4 font-medium text-gray-500">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center"><div className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto" /></td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">{hasFilters ? "Filtrelere uygun ödeme yok." : "Henüz ödeme yok."}</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-4 text-gray-500 text-xs whitespace-nowrap">{new Date(p.createdAt).toLocaleString("tr-TR")}</td>
                  <td className="p-4 text-gray-700 font-mono text-xs">{p.paytrOrderId?.slice(-12) || p.id.slice(-8)}</td>
                  <td className="p-4 font-medium text-gray-900">{p.appointment?.customer?.firstName} {p.appointment?.customer?.lastName}</td>
                  <td className="p-4 text-gray-600">{p.appointment?.service?.name}</td>
                  <td className="p-4 text-right font-semibold text-gray-900">{formatPrice(p.amount)}</td>
                  <td className="p-4"><span className={`badge ${getStatusColor(p.status)}`}>{getStatusLabel(p.status)}</span></td>
                  <td className="p-4 text-right">
                    {p.status === "SUCCESS" && (
                      <button
                        onClick={() => refund(p.id)}
                        disabled={busyId === p.id}
                        className="btn btn-ghost btn-sm text-violet-700"
                        title="İade işaretle"
                      >
                        <RotateCcw className="w-4 h-4" /> İade
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-lg ${color} grid place-items-center`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-[10px] text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
