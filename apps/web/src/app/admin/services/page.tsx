"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Sparkles, Clock, Edit, Trash2, X, Save } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface ServiceForm {
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
}

const emptyForm: ServiceForm = { name: "", description: "", duration: 30, price: 0, category: "" };

export default function AdminServicesPage() {
  const { user } = useAuthStore();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const loadServices = () => {
    if (user?.tenantId) {
      api.get(`/tenants/${user.tenantId}/services`)
        .then((res) => setServices(res.data))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => { loadServices(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/tenants/${user?.tenantId}/services/${editingId}`, form);
        toast.success("Hizmet güncellendi");
      } else {
        await api.post(`/tenants/${user?.tenantId}/services`, form);
        toast.success("Hizmet eklendi");
      }
      resetForm();
      loadServices();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Bir hata oluştu");
    } finally { 
      setSaving(false); 
    }
  };

  const startEdit = (service: any) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description || "",
      duration: service.duration,
      price: Number(service.price),
      category: service.category || "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bu hizmeti silmek istediğinizden emin misiniz?")) {
      await api.delete(`/tenants/${user?.tenantId}/services/${id}`);
      loadServices();
    }
  };

  const filtered = services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>Hizmetler</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Yeni Hizmet
        </button>
      </div>

      {/* Create / Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="card p-6 mb-6 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                {editingId ? "✏️ Hizmet Düzenle" : "➕ Yeni Hizmet Ekle"}
              </h3>
              <button type="button" onClick={resetForm} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet Adı</label>
                <input className="input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Saç Kesimi" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <input className="input" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} placeholder="Saç Hizmetleri" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Süre (dk)</label>
                <input type="number" className="input" value={form.duration} onChange={(e) => setForm({...form, duration: +e.target.value})} min={5} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺)</label>
                <input type="number" className="input" value={form.price} onChange={(e) => setForm({...form, price: +e.target.value})} min={0} step="0.01" required />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
              <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Hizmet açıklaması..." />
            </div>
            <div className="flex gap-3 mt-4">
              <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
                <Save className="w-4 h-4" />
                {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Kaydet"}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-ghost btn-sm">İptal</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input className="input pl-11" placeholder="Hizmet ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Services List */}
      <div className="card divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-gray-500">Hizmet bulunamadı.</p>
        ) : filtered.map((service) => (
          <div key={service.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{service.name}</p>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {service.duration} dk</span>
                  {service.category && <span className="badge bg-gray-100 text-gray-600">{service.category}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-rose-600">{formatPrice(service.price)}</span>
              <button onClick={() => startEdit(service)} className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(service.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
