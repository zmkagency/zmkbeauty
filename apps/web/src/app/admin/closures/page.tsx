"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, CalendarOff } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { toast } from "react-hot-toast";

export default function AdminClosuresPage() {
  const { user } = useAuthStore();
  const [closures, setClosures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  const load = () => {
    if (user?.tenantId) {
      api.get(`/tenants/${user.tenantId}/closures`).then((res) => setClosures(res.data)).finally(() => setLoading(false));
    }
  };

  useEffect(() => { load(); }, [user]);

  const handleAdd = async () => {
    if (!date) return;
    try {
      await api.post(`/tenants/${user?.tenantId}/closures`, { date, reason });
      setDate("");
      setReason("");
      toast.success("Kapalı gün eklendi");
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Bir hata oluştu");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/tenants/${user?.tenantId}/closures/${id}`);
      toast.success("Kapalı gün silindi");
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Silinemedi");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-display)" }}>Kapalı Günler</h1>

      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Kapalı Gün Ekle</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="date" className="input max-w-[200px]" value={date} onChange={(e) => setDate(e.target.value)} />
          <input className="input flex-1" placeholder="Sebep (opsiyonel)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button onClick={handleAdd} className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /> Ekle</button>
        </div>
      </div>

      <div className="card divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" /></div>
        ) : closures.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
            <CalendarOff className="w-8 h-8 text-gray-300" />
            <p>Planlanan kapalı gün bulunmamaktadır.</p>
          </div>
        ) : closures.map((c) => (
          <div key={c.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
            <div>
              <p className="font-medium text-gray-900">{formatDate(c.date)}</p>
              {c.reason && <p className="text-sm text-gray-500">{c.reason}</p>}
            </div>
            <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
