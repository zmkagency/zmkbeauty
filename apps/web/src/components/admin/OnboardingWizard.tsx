"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Check, Loader2, Wand2, Building2, Clock, Sparkles, Rocket } from "lucide-react";
import api from "@/lib/api";

const TEMPLATES = [
  {
    key: "kuafor",
    label: "Kuaför / Berber",
    services: [
      { name: "Saç Kesimi", duration: 30, price: 250 },
      { name: "Sakal Tıraşı", duration: 20, price: 150 },
      { name: "Saç Boyama", duration: 90, price: 750 },
    ],
  },
  {
    key: "guzellik",
    label: "Güzellik Merkezi",
    services: [
      { name: "Cilt Bakımı", duration: 60, price: 600 },
      { name: "Kaş Tasarımı", duration: 30, price: 200 },
      { name: "Manikür & Pedikür", duration: 60, price: 500 },
    ],
  },
  {
    key: "lazer",
    label: "Lazer Epilasyon",
    services: [
      { name: "Bölgesel Lazer (Koltuk Altı)", duration: 20, price: 350 },
      { name: "Tüm Vücut Lazer", duration: 90, price: 2500 },
      { name: "Yüz Lazer", duration: 30, price: 500 },
    ],
  },
  {
    key: "spa",
    label: "Spa & Masaj",
    services: [
      { name: "Klasik Masaj", duration: 60, price: 700 },
      { name: "Aromaterapi", duration: 75, price: 850 },
      { name: "Hot Stone", duration: 90, price: 1100 },
    ],
  },
];

const DEFAULT_HOURS: Record<string, { open: string; close: string } | null> = {
  mon: { open: "09:00", close: "20:00" },
  tue: { open: "09:00", close: "20:00" },
  wed: { open: "09:00", close: "20:00" },
  thu: { open: "09:00", close: "20:00" },
  fri: { open: "09:00", close: "20:00" },
  sat: { open: "10:00", close: "18:00" },
  sun: null,
};

const DAY_LABELS: Record<string, string> = {
  mon: "Pzt", tue: "Sal", wed: "Çar", thu: "Per", fri: "Cum", sat: "Cmt", sun: "Paz",
};

interface Props {
  onClose: () => void;
  onCompleted: (tenantId: string, slug: string) => void;
}

export default function OnboardingWizard({ onClose, onCompleted }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugState, setSlugState] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Step 2
  const [hours, setHours] = useState(DEFAULT_HOURS);

  // Step 3
  const [templateKey, setTemplateKey] = useState<string>("");
  const [services, setServices] = useState<Array<{ name: string; duration: number; price: number }>>([]);

  // Step 4
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Step 5 (busy)
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Slug auto-derive from name
  const handleNameChange = (v: string) => {
    setName(v);
    if (!slug) {
      const auto = v
        .toLocaleLowerCase("tr")
        .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
        .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      setSlug(auto);
    }
  };

  const checkSlug = async (s: string) => {
    if (!/^[a-z0-9-]+$/.test(s) || s.length < 2) {
      setSlugState("invalid");
      return;
    }
    setSlugState("checking");
    try {
      const res = await api.get(`/tenants/check-slug/${s}`);
      setSlugState(res.data.available ? "available" : "taken");
    } catch {
      setSlugState("idle");
    }
  };

  const applyTemplate = (key: string) => {
    setTemplateKey(key);
    const tpl = TEMPLATES.find((t) => t.key === key);
    if (tpl) setServices(tpl.services.map((s) => ({ ...s })));
  };

  const setDayHours = (day: string, field: "open" | "close" | "off") => {
    if (field === "off") {
      setHours({ ...hours, [day]: hours[day] ? null : { open: "09:00", close: "18:00" } });
    }
  };

  const updateDayTime = (day: string, field: "open" | "close", value: string) => {
    const h = hours[day];
    if (!h) return;
    setHours({ ...hours, [day]: { ...h, [field]: value } });
  };

  const updateService = (i: number, field: keyof typeof services[number], value: any) => {
    setServices(services.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const removeService = (i: number) => setServices(services.filter((_, idx) => idx !== i));
  const addService = () => setServices([...services, { name: "", duration: 30, price: 0 }]);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      // 1. Create tenant
      const tenantRes = await api.post("/tenants", {
        name,
        slug,
        city: city || undefined,
        district: district || undefined,
        phone: phone || undefined,
        email: email || undefined,
        workingHours: hours,
        themeColor: "#e11d48",
      });
      const tenant = tenantRes.data;

      // 2. Create services in parallel
      await Promise.all(
        services
          .filter((s) => s.name.trim())
          .map((s) =>
            api.post(`/tenants/${tenant.id}/services`, {
              name: s.name,
              duration: Number(s.duration),
              price: Number(s.price),
              isActive: true,
            }),
          ),
      );

      // 3. Create store admin user (optional)
      if (adminEmail && adminPassword && adminFirstName) {
        await api
          .post("/users", {
            email: adminEmail,
            password: adminPassword,
            firstName: adminFirstName,
            lastName: adminLastName || "Admin",
            role: "STORE_ADMIN",
            tenantId: tenant.id,
          })
          .catch(() => {
            // non-fatal — admin can be added later
          });
      }

      onCompleted(tenant.id, tenant.slug);
    } catch (err: any) {
      setError(err.response?.data?.message || "Mağaza oluşturulamadı");
    } finally {
      setBusy(false);
    }
  };

  const stepValid =
    step === 1
      ? name.trim().length >= 2 && slugState === "available"
      : step === 2
      ? Object.values(hours).some((h) => h !== null)
      : step === 3
      ? services.length > 0 && services.every((s) => s.name.trim() && s.duration > 0)
      : step === 4
      ? !adminEmail || (adminEmail && adminPassword.length >= 6 && adminFirstName.trim().length > 0)
      : true;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 z-40"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl pointer-events-auto max-h-[92vh] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-rose-500" />
              <h3 className="font-semibold text-white">Hızlı Mağaza Onboarding</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="px-6 pt-4 flex items-center gap-1 text-xs">
            {[
              { n: 1, icon: Building2, label: "Bilgiler" },
              { n: 2, icon: Clock, label: "Saatler" },
              { n: 3, icon: Sparkles, label: "Hizmetler" },
              { n: 4, icon: Rocket, label: "Admin" },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center gap-1 flex-1">
                <span className={`w-7 h-7 rounded-full grid place-items-center font-bold ${
                  step >= (s.n as 1|2|3|4)
                    ? "bg-rose-600 text-white"
                    : "bg-gray-800 text-gray-500"
                }`}>
                  <s.icon className="w-3.5 h-3.5" />
                </span>
                <span className={step >= (s.n as 1|2|3|4) ? "text-rose-400 font-medium" : "text-gray-500"}>
                  {s.label}
                </span>
                {i < 3 && <div className={`flex-1 h-0.5 ${step > s.n ? "bg-rose-600" : "bg-gray-800"}`} />}
              </div>
            ))}
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">
                {error}
              </div>
            )}

            {step === 1 && (
              <>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Mağaza Adı *</label>
                  <input
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="örn. Bella Güzellik Merkezi"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">URL (slug) *</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">zmkbeauty.com/</span>
                    <input
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white font-mono"
                      value={slug}
                      onChange={(e) => { setSlug(e.target.value); checkSlug(e.target.value); }}
                      onBlur={() => checkSlug(slug)}
                      placeholder="bella-guzellik"
                    />
                  </div>
                  <div className="mt-1 text-xs">
                    {slugState === "checking" && <span className="text-gray-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Kontrol…</span>}
                    {slugState === "available" && <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Kullanılabilir</span>}
                    {slugState === "taken" && <span className="text-red-400">Bu URL kullanılıyor</span>}
                    {slugState === "invalid" && <span className="text-amber-400">Geçersiz format</span>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">İl</label>
                    <input className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white" value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">İlçe</label>
                    <input className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white" value={district} onChange={(e) => setDistrict(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Telefon</label>
                    <input className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">E-posta</label>
                    <input className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-xs text-gray-400">Bu saatler mağaza yöneticisinin panelinden istediği zaman değiştirilebilir.</p>
                {Object.entries(hours).map(([day, h]) => (
                  <div key={day} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/40 border border-gray-800">
                    <span className="w-12 text-sm text-gray-300 font-medium">{DAY_LABELS[day]}</span>
                    <label className="flex items-center gap-2 text-xs text-gray-400">
                      <input type="checkbox" checked={!!h} onChange={() => setDayHours(day, "off")} className="rounded" />
                      Açık
                    </label>
                    {h && (
                      <>
                        <input
                          type="time"
                          className="px-2 py-1 rounded bg-gray-900 border border-gray-700 text-white text-sm"
                          value={h.open}
                          onChange={(e) => updateDayTime(day, "open", e.target.value)}
                        />
                        <span className="text-gray-500">—</span>
                        <input
                          type="time"
                          className="px-2 py-1 rounded bg-gray-900 border border-gray-700 text-white text-sm"
                          value={h.close}
                          onChange={(e) => updateDayTime(day, "close", e.target.value)}
                        />
                      </>
                    )}
                  </div>
                ))}
              </>
            )}

            {step === 3 && (
              <>
                <p className="text-xs text-gray-400">Hızlı başlamak için bir şablon seçin, sonra düzenleyin.</p>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => applyTemplate(t.key)}
                      className={`p-3 rounded-lg border text-left text-sm ${
                        templateKey === t.key
                          ? "border-rose-500 bg-rose-950/30 text-white"
                          : "border-gray-800 bg-gray-800/30 text-gray-300 hover:border-gray-700"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-400">Hizmetler</p>
                    <button type="button" onClick={addService} className="text-xs text-rose-400 hover:text-rose-300">
                      + Yeni Ekle
                    </button>
                  </div>
                  {services.map((s, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        className="col-span-6 px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-white text-sm"
                        placeholder="Hizmet adı"
                        value={s.name}
                        onChange={(e) => updateService(i, "name", e.target.value)}
                      />
                      <input
                        type="number"
                        className="col-span-2 px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-white text-sm"
                        placeholder="dk"
                        value={s.duration}
                        onChange={(e) => updateService(i, "duration", Number(e.target.value))}
                      />
                      <input
                        type="number"
                        className="col-span-3 px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-white text-sm"
                        placeholder="₺"
                        value={s.price}
                        onChange={(e) => updateService(i, "price", Number(e.target.value))}
                      />
                      <button
                        type="button"
                        onClick={() => removeService(i)}
                        className="col-span-1 text-gray-500 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {services.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-4">Bir şablon seçin veya manuel ekleyin</p>
                  )}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <p className="text-xs text-gray-400">
                  Mağaza yöneticisi için bir hesap oluşturun. Bu adım opsiyoneldir — daha sonra da ekleyebilirsiniz.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Ad</label>
                    <input className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white" value={adminFirstName} onChange={(e) => setAdminFirstName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Soyad</label>
                    <input className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white" value={adminLastName} onChange={(e) => setAdminLastName(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">E-posta</label>
                  <input className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Geçici Şifre (en az 6 karakter)</label>
                  <input type="text" className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white font-mono" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
                  <p className="text-[10px] text-gray-500 mt-1">İlk girişte mağaza sahibi şifresini değiştirebilir.</p>
                </div>
              </>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-800 flex justify-between">
            <button
              onClick={() => (step === 1 ? onClose() : setStep((step - 1) as 1|2|3|4))}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white"
              disabled={busy}
            >
              {step === 1 ? "Vazgeç" : "Geri"}
            </button>
            {step < 4 ? (
              <button
                onClick={() => setStep((step + 1) as 1|2|3|4)}
                disabled={!stepValid}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-rose-500"
              >
                İlerle
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!stepValid || busy}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-rose-500 inline-flex items-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                {busy ? "Kuruluyor…" : "Mağazayı Yayınla"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
