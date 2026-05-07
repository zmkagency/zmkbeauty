"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, UserPlus, CalendarPlus } from "lucide-react";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";

interface Props {
  tenantId: string;
  services: any[];
  employees: any[];
  onClose: () => void;
  onCreated: () => void;
}

/**
 * Walk-in / manual appointment creation modal for store admins.
 * Skips online payment — store collects cash and marks "paid" if applicable.
 */
export default function WalkinModal({ tenantId, services, employees, onClose, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [serviceId, setServiceId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("");
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [customerFirstName, setCustomerFirstName] = useState("");
  const [customerLastName, setCustomerLastName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paid, setPaid] = useState(true);
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedService = services.find((s) => s.id === serviceId);

  // Filter employees that can perform the selected service
  const eligibleEmployees = serviceId
    ? employees.filter((e) =>
        e.services?.some((es: any) => es.serviceId === serviceId || es.service?.id === serviceId),
      )
    : employees;

  useEffect(() => {
    if (serviceId && employeeId && date) {
      setLoadingSlots(true);
      setStartTime("");
      api
        .get(`/tenants/${tenantId}/slots`, { params: { employeeId, serviceId, date } })
        .then((res) => setSlots(res.data))
        .catch(() => setSlots([]))
        .finally(() => setLoadingSlots(false));
    }
  }, [tenantId, serviceId, employeeId, date]);

  const handleCreate = async () => {
    setSaving(true);
    setError("");
    try {
      await api.post("/appointments/walkin", {
        tenantId,
        serviceId,
        employeeId,
        date,
        startTime,
        customerFirstName: customerFirstName.trim(),
        customerLastName: customerLastName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        paid,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Randevu oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  };

  const canStep2 = !!serviceId && !!employeeId && !!date && !!startTime;
  const canSubmit = canStep2 && customerFirstName.trim().length > 0 && customerLastName.trim().length > 0;

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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden pointer-events-auto max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-rose-600" />
              <h3 className="font-semibold text-gray-900">Manuel Randevu Oluştur</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="px-6 pt-4 flex items-center gap-2 text-xs">
            {[
              { n: 1, label: "Hizmet & Saat" },
              { n: 2, label: "Müşteri" },
              { n: 3, label: "Onay" },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center gap-2 flex-1">
                <span
                  className={`w-6 h-6 rounded-full grid place-items-center font-bold ${
                    step >= (s.n as 1 | 2 | 3)
                      ? "bg-rose-600 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {s.n}
                </span>
                <span className={step >= (s.n as 1 | 2 | 3) ? "text-rose-600 font-medium" : "text-gray-400"}>
                  {s.label}
                </span>
                {i < 2 && <div className={`flex-1 h-0.5 ${step > s.n ? "bg-rose-600" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet</label>
                  <select className="input" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                    <option value="">— Hizmet seç —</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} • {s.duration} dk • ₺{Number(s.price).toLocaleString("tr-TR")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Çalışan</label>
                  <select
                    className="input"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    disabled={!serviceId}
                  >
                    <option value="">{serviceId ? "— Çalışan seç —" : "Önce hizmet seçin"}</option>
                    {eligibleEmployees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} {e.title ? `(${e.title})` : ""}
                      </option>
                    ))}
                  </select>
                  {serviceId && eligibleEmployees.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Bu hizmeti veren çalışan yok. Hizmet → Çalışan eşlemesi yapın.
                    </p>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                    <input
                      type="date"
                      className="input"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Saat</label>
                    {!employeeId ? (
                      <p className="text-xs text-gray-500 italic mt-2">Önce çalışan seçin</p>
                    ) : loadingSlots ? (
                      <p className="text-xs text-gray-500 italic mt-2">Yükleniyor…</p>
                    ) : slots.length === 0 ? (
                      <p className="text-xs text-amber-600 mt-2">Bu tarihte müsait saat yok</p>
                    ) : (
                      <select className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                        <option value="">— Saat seç —</option>
                        {slots.map((s) => (
                          <option key={s.startTime} value={s.startTime}>
                            {s.startTime} – {s.endTime}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-xs text-gray-500">
                  E-posta veya telefon eşleşirse mevcut müşteriyle bağlantılanır. Boş bırakılırsa hızlı bir
                  müşteri kaydı oluşturulur.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ad *</label>
                    <input
                      className="input"
                      value={customerFirstName}
                      onChange={(e) => setCustomerFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Soyad *</label>
                    <input
                      className="input"
                      value={customerLastName}
                      onChange={(e) => setCustomerLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input
                      className="input"
                      placeholder="05XX XXX XX XX"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                    <input
                      className="input"
                      placeholder="opsiyonel"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Not</label>
                  <textarea
                    rows={2}
                    className="input"
                    placeholder="opsiyonel"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={paid}
                    onChange={(e) => setPaid(e.target.checked)}
                    className="rounded"
                  />
                  Ödeme tahsil edildi (kasa/peşin)
                </label>
              </>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 space-y-2 text-sm">
                  <Row label="Müşteri" value={`${customerFirstName} ${customerLastName}`} />
                  <Row label="Telefon" value={customerPhone || "—"} />
                  <Row label="Hizmet" value={selectedService?.name || ""} />
                  <Row label="Çalışan" value={
                    employees.find((e) => e.id === employeeId)
                      ? `${employees.find((e) => e.id === employeeId).firstName} ${employees.find((e) => e.id === employeeId).lastName}`
                      : ""
                  } />
                  <Row label="Tarih & Saat" value={`${date} • ${startTime}`} />
                  <Row label="Tutar" value={selectedService ? formatPrice(selectedService.price) : ""} emphasize />
                  <Row label="Ödeme" value={paid ? "Tahsil edildi" : "Beklemede"} />
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between">
            <button
              onClick={() => (step === 1 ? onClose() : setStep(((step - 1) as 1 | 2 | 3)))}
              className="btn btn-ghost btn-sm"
              disabled={saving}
            >
              {step === 1 ? "Vazgeç" : "Geri"}
            </button>
            {step < 3 ? (
              <button
                onClick={() => setStep((step + 1) as 1 | 2 | 3)}
                disabled={(step === 1 && !canStep2) || (step === 2 && !canSubmit)}
                className="btn btn-primary btn-sm"
              >
                İlerle
              </button>
            ) : (
              <button onClick={handleCreate} disabled={saving} className="btn btn-primary btn-sm">
                <UserPlus className="w-4 h-4" /> {saving ? "Kaydediliyor…" : "Randevuyu Oluştur"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

function Row({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm ${emphasize ? "font-bold text-rose-600" : "text-gray-900 font-medium"}`}>
        {value || "—"}
      </span>
    </div>
  );
}
