"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Save, Clock, MapPin, Phone, Mail, Palette, Globe } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

const DAYS = [
  { key: "mon", label: "Pazartesi" },
  { key: "tue", label: "Salı" },
  { key: "wed", label: "Çarşamba" },
  { key: "thu", label: "Perşembe" },
  { key: "fri", label: "Cuma" },
  { key: "sat", label: "Cumartesi" },
  { key: "sun", label: "Pazar" },
];

export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [domainForm, setDomainForm] = useState("");
  const [savingDomain, setSavingDomain] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    shortDescription: "",
    address: "",
    phone: "",
    email: "",
    city: "",
    district: "",
    themeColor: "#e11d48",
    bufferMinutes: 0,
    seoTitle: "",
    seoDescription: "",
  });

  const [hours, setHours] = useState<any>({
    mon: { open: "09:00", close: "20:00", active: true },
    tue: { open: "09:00", close: "20:00", active: true },
    wed: { open: "09:00", close: "20:00", active: true },
    thu: { open: "09:00", close: "20:00", active: true },
    fri: { open: "09:00", close: "20:00", active: true },
    sat: { open: "10:00", close: "18:00", active: true },
    sun: { open: "09:00", close: "18:00", active: false },
  });

  useEffect(() => {
    if (user?.tenantId) {
      api.get(`/tenants/${user.tenantId}`)
        .then((res) => {
          const s = res.data;
          setStore(s);
          setForm({
            name: s.name || "",
            description: s.description || "",
            shortDescription: s.shortDescription || "",
            address: s.address || "",
            phone: s.phone || "",
            email: s.email || "",
            city: s.city || "",
            district: s.district || "",
            themeColor: s.themeColor || "#e11d48",
            bufferMinutes: s.bufferMinutes || 0,
            seoTitle: s.seoTitle || "",
            seoDescription: s.seoDescription || "",
          });
          setDomainForm(s.customDomain || "");
          if (s.workingHours) {
            const wh: any = {};
            DAYS.forEach(({ key }) => {
              const val = s.workingHours[key];
              wh[key] = val ? { open: val.open, close: val.close, active: true } : { open: "09:00", close: "18:00", active: false };
            });
            setHours(wh);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const workingHours: any = {};
      DAYS.forEach(({ key }) => {
        workingHours[key] = hours[key].active ? { open: hours[key].open, close: hours[key].close } : null;
      });

      await api.put(`/tenants/${user?.tenantId}`, { ...form, workingHours });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {} finally { setSaving(false); }
  };

  const handleSaveDomain = async () => {
    setSavingDomain(true);
    try {
      await api.patch(`/tenants/${user?.tenantId}/domain`, { domain: domainForm || null });
      setStore({ ...store, customDomain: domainForm, domainVerified: false });
      alert("Özel domain başarıyla güncellendi! Lütfen DNS ayarlarınızdan CNAME kaydı yönlendirmesini yapmayı unutmayın.");
    } catch (err: any) {
      alert(err.response?.data?.message || "Domain kaydedilirken bir hata oluştu.");
    } finally {
      setSavingDomain(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>Mağaza Ayarları</h1>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
          <Save className="w-4 h-4" />
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>

      {success && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          ✅ Ayarlar başarıyla kaydedildi.
        </motion.div>
      )}

      {/* Genel Bilgiler */}
      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-rose-600" /> Genel Bilgiler
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mağaza Adı</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kısa Açıklama</label>
            <input className="input" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} placeholder="Profesyonel güzellik hizmetleri" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Detaylı Açıklama</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
      </div>

      {/* İletişim */}
      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Phone className="w-5 h-5 text-rose-600" /> İletişim
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">İl</label>
            <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
            <input className="input" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Çalışma Saatleri */}
      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-rose-600" /> Çalışma Saatleri
        </h3>
        <div className="space-y-3">
          {DAYS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <label className="flex items-center gap-2 w-28">
                <input
                  type="checkbox"
                  checked={hours[key].active}
                  onChange={(e) => setHours({ ...hours, [key]: { ...hours[key], active: e.target.checked } })}
                  className="w-4 h-4 accent-rose-600 rounded"
                />
                <span className={`text-sm font-medium ${hours[key].active ? "text-gray-900" : "text-gray-400"}`}>{label}</span>
              </label>
              {hours[key].active ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    className="input !w-28 text-sm"
                    value={hours[key].open}
                    onChange={(e) => setHours({ ...hours, [key]: { ...hours[key], open: e.target.value } })}
                  />
                  <span className="text-gray-400">—</span>
                  <input
                    type="time"
                    className="input !w-28 text-sm"
                    value={hours[key].close}
                    onChange={(e) => setHours({ ...hours, [key]: { ...hours[key], close: e.target.value } })}
                  />
                </div>
              ) : (
                <span className="text-sm text-gray-400 italic">Kapalı</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1">Randevu Arası Tampon (dk)</label>
          <input type="number" className="input !w-24" value={form.bufferMinutes} onChange={(e) => setForm({ ...form, bufferMinutes: +e.target.value })} min={0} max={60} />
          <p className="text-xs text-gray-400 mt-1">Randevular arasında bırakılacak boş süre</p>
        </div>
      </div>

      {/* SEO */}
      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-rose-600" /> SEO Ayarları
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SEO Başlık</label>
            <input className="input" value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} placeholder="Mağaza Adı | Şehir" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SEO Açıklama</label>
            <textarea className="input" rows={2} value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} placeholder="Google arama sonuçlarında görünecek açıklama" />
          </div>
        </div>
      </div>

      {/* Özel Domain */}
      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-rose-600" /> Özel Domain (White-Labeling)
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Müşterilerinizin kendi alan adınız üzerinden (örn: randevu.salonunuz.com) randevu almasını sağlayın. 
          Domaininizi buraya girdikten sonra, alan adı sağlayıcınızdan bir CNAME kaydı oluşturarak <strong className="font-semibold">zmkbeauty.com</strong> adresine yönlendirmelisiniz.
        </p>
        <div className="flex sm:flex-row flex-col gap-4 items-start">
          <div className="flex-1 w-full">
            <input 
              className="input" 
              placeholder="örn: randevu.guzellikmerkezi.com" 
              value={domainForm} 
              onChange={(e) => setDomainForm(e.target.value)} 
            />
            {store?.customDomain && store.customDomain === domainForm && (
              <p className="text-xs mt-2 font-medium flex items-center gap-1">
                <span className="text-emerald-600">✅ Aktif Domain</span>
                {!store?.domainVerified && <span className="text-amber-500 ml-1">- DNS Doğrulaması Bekleniyor</span>}
              </p>
            )}
          </div>
          <button 
            onClick={handleSaveDomain} 
            disabled={savingDomain} 
            className="btn btn-outline w-full sm:w-auto whitespace-nowrap"
          >
            {savingDomain ? "Kaydediliyor..." : "Domaini Bağla / Güncelle"}
          </button>
        </div>
      </div>

      {/* Tema */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-rose-600" /> Tema Rengi
        </h3>
        <div className="flex items-center gap-4">
          <input type="color" value={form.themeColor} onChange={(e) => setForm({ ...form, themeColor: e.target.value })} className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer" />
          <span className="text-sm text-gray-600">{form.themeColor}</span>
        </div>
      </div>

      {/* Bottom Save */}
      <div className="mt-6 flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          <Save className="w-4 h-4" />
          {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </button>
      </div>
    </div>
  );
}
