"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, X } from "lucide-react";
import api from "@/lib/api";

const ACTION_OPTIONS = [
  { value: "", label: "Tümü" },
  { value: "CREATE", label: "Oluşturma" },
  { value: "UPDATE", label: "Güncelleme" },
  { value: "DELETE", label: "Silme" },
  { value: "LOGIN", label: "Giriş" },
  { value: "LOGOUT", label: "Çıkış" },
];

const ENTITY_OPTIONS = [
  { value: "", label: "Tümü" },
  { value: "User", label: "Kullanıcı" },
  { value: "Tenant", label: "Mağaza" },
  { value: "Appointment", label: "Randevu" },
  { value: "Service", label: "Hizmet" },
  { value: "Employee", label: "Çalışan" },
  { value: "Payment", label: "Ödeme" },
];

const ACTION_COLOR: Record<string, string> = {
  CREATE: "bg-emerald-900/40 text-emerald-300 border border-emerald-800",
  UPDATE: "bg-blue-900/40 text-blue-300 border border-blue-800",
  DELETE: "bg-red-900/40 text-red-300 border border-red-800",
  LOGIN: "bg-violet-900/40 text-violet-300 border border-violet-800",
  LOGOUT: "bg-gray-800 text-gray-300 border border-gray-700",
};

export default function SuperadminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [tenantFilter, setTenantFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [limit, setLimit] = useState(100);

  const fetchLogs = useCallback(() => {
    const params: Record<string, string | number> = { limit };
    if (tenantFilter) params.tenantId = tenantFilter;
    if (actionFilter) params.action = actionFilter;
    if (entityFilter) params.entity = entityFilter;
    setLoading(true);
    api.get("/audit-logs", { params }).then((r) => setLogs(r.data)).catch(() => setLogs([])).finally(() => setLoading(false));
  }, [tenantFilter, actionFilter, entityFilter, limit]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { api.get("/tenants").then((r) => setTenants(r.data)).catch(() => {}); }, []);

  const clearFilters = () => { setTenantFilter(""); setActionFilter(""); setEntityFilter(""); };
  const hasFilters = tenantFilter || actionFilter || entityFilter;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Sistem Logları</h1>
        <p className="text-sm text-gray-400 mt-0.5">{logs.length} kayıt</p>
      </div>

      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div className="md:col-span-2">
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
          <label className="block text-xs font-medium text-gray-400 mb-1">Eylem</label>
          <select
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-rose-500"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            {ACTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Varlık</label>
          <select
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-rose-500"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
          >
            {ENTITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Limit</label>
          <div className="flex gap-2">
            <select
              className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-rose-500"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>
            {hasFilters && (
              <button onClick={clearFilters} className="px-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white" title="Temizle">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-rose-400 border-t-rose-600 rounded-full animate-spin" /></div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
            <FileText className="w-10 h-10 text-gray-600" />
            <p>Bu kriterlere uygun log yok.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800 max-h-[700px] overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-800/50 text-sm">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ACTION_COLOR[log.action] || "bg-gray-800 text-gray-300"}`}>{log.action}</span>
                  <span className="text-gray-200 font-medium">{log.entity}</span>
                  {log.entityId && <span className="text-gray-600 font-mono text-xs">{log.entityId.slice(0, 12)}...</span>}
                  {log.userId && <span className="text-gray-500 text-xs">user: {log.userId.slice(0, 8)}</span>}
                  {log.tenantId && <span className="text-rose-400 text-xs">tenant: {log.tenantId.slice(0, 8)}</span>}
                  {log.ipAddress && <span className="text-gray-500 text-xs ml-auto">{log.ipAddress}</span>}
                </div>
                {log.details && (
                  <pre className="mt-2 text-xs text-gray-500 bg-gray-950 rounded p-2 overflow-x-auto">{JSON.stringify(log.details, null, 2)}</pre>
                )}
                <p className="text-gray-600 text-xs mt-1">{new Date(log.createdAt).toLocaleString("tr-TR")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
