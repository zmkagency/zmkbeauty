"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Users, Trash2, Calendar, Edit, X, Save, Briefcase,
  CalendarDays, CalendarOff, Clock,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { toast } from "react-hot-toast";

interface EmpForm {
  firstName: string;
  lastName: string;
  title: string;
  bio: string;
  serviceIds: string[];
}

const emptyForm: EmpForm = { firstName: "", lastName: "", title: "", bio: "", serviceIds: [] };

const DAY_LABELS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

type ScheduleDay = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
  isWorking: boolean;
};

const defaultSchedule = (): ScheduleDay[] =>
  Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    startTime: "09:00",
    endTime: "18:00",
    breakStart: "12:00",
    breakEnd: "13:00",
    isWorking: i !== 6,
  }));

export default function AdminEmployeesPage() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId;

  const [employees, setEmployees] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EmpForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [detailEmp, setDetailEmp] = useState<any | null>(null);

  const load = useCallback(() => {
    if (!tenantId) return;
    setLoading(true);
    Promise.all([
      api.get(`/tenants/${tenantId}/employees`),
      api.get(`/tenants/${tenantId}/services`),
    ])
      .then(([empRes, svcRes]) => {
        setEmployees(empRes.data);
        setServices(svcRes.data);
      })
      .finally(() => setLoading(false));
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSaving(true);
    try {
      const body = { ...form };
      if (editingId) {
        await api.put(`/tenants/${tenantId}/employees/${editingId}`, body);
        toast.success("Çalışan güncellendi");
      } else {
        await api.post(`/tenants/${tenantId}/employees`, body);
        toast.success("Çalışan eklendi");
      }
      resetForm();
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Bir hata oluştu");
    } finally { 
      setSaving(false); 
    }
  };

  const startEdit = (emp: any) => {
    setEditingId(emp.id);
    setForm({
      firstName: emp.firstName,
      lastName: emp.lastName,
      title: emp.title || "",
      bio: emp.bio || "",
      serviceIds: (emp.services || []).map((es: any) => es.serviceId || es.service?.id).filter(Boolean),
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const handleDelete = async (id: string) => {
    if (!tenantId) return;
    if (confirm("Bu çalışanı pasif yapmak istediğinizden emin misiniz?")) {
      await api.delete(`/tenants/${tenantId}/employees/${id}`);
      load();
    }
  };

  const toggleServiceInForm = (id: string) => {
    setForm((f) =>
      f.serviceIds.includes(id)
        ? { ...f, serviceIds: f.serviceIds.filter((x) => x !== id) }
        : { ...f, serviceIds: [...f.serviceIds, id] }
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>Çalışanlar</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /> Yeni Çalışan</button>
      </div>

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
                {editingId ? "Çalışan Düzenle" : "Yeni Çalışan Ekle"}
              </h3>
              <button type="button" onClick={resetForm} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Ad</label><input className="input" value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label><input className="input" value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Ünvan</label><input className="input" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="Kuaför Uzmanı" /></div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Kısa Biyografi</label>
              <textarea className="input" rows={2} value={form.bio} onChange={(e) => setForm({...form, bio: e.target.value})} placeholder="Deneyim, uzmanlık alanları..." />
            </div>

            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Verebileceği Hizmetler</label>
              {services.length === 0 ? (
                <p className="text-sm text-gray-500">Önce hizmet ekleyin.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {services.map((s) => {
                    const checked = form.serviceIds.includes(s.id);
                    return (
                      <label key={s.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${checked ? "border-rose-300 bg-rose-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleServiceInForm(s.id)} className="accent-rose-600" />
                        <span className="text-sm text-gray-800">{s.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
                <Save className="w-4 h-4" />
                {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Kaydet"}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-ghost btn-sm">İptal</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <div className="col-span-full flex justify-center py-12"><div className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" /></div> :
        employees.length === 0 ? <p className="col-span-full text-center py-12 text-gray-500">Çalışan bulunmamaktadır.</p> :
        employees.map((emp, i) => (
          <motion.div key={emp.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-rose flex items-center justify-center text-white font-bold">
                  {emp.firstName[0]}{emp.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{emp.firstName} {emp.lastName}</p>
                  {emp.title && <p className="text-sm text-rose-600">{emp.title}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(emp)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="Düzenle"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(emp.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" title="Sil"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {emp._count?.appointments || 0} randevu</span>
              <span>{emp.services?.length || 0} hizmet</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {(emp.services || []).slice(0, 3).map((es: any) => (
                <span key={es.id} className="badge bg-rose-50 text-rose-600">{es.service?.name || "—"}</span>
              ))}
              {(emp.services || []).length > 3 && <span className="badge bg-gray-100 text-gray-500">+{emp.services.length - 3}</span>}
            </div>
            <button
              onClick={() => setDetailEmp(emp)}
              className="mt-4 w-full btn btn-ghost btn-sm border border-gray-200"
            >
              <CalendarDays className="w-4 h-4" /> Program & İzin
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {detailEmp && (
          <EmployeeDetailDrawer
            key={detailEmp.id}
            tenantId={tenantId!}
            employee={detailEmp}
            onClose={() => setDetailEmp(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmployeeDetailDrawer({ tenantId, employee, onClose }: { tenantId: string; employee: any; onClose: () => void }) {
  const [tab, setTab] = useState<"schedule" | "leaves">("schedule");
  const [schedule, setSchedule] = useState<ScheduleDay[]>(defaultSchedule());
  const [leaves, setLeaves] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [leavesLoading, setLeavesLoading] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [newLeave, setNewLeave] = useState({ startDate: "", endDate: "", reason: "" });
  const [addingLeave, setAddingLeave] = useState(false);

  useEffect(() => {
    setScheduleLoading(true);
    api.get(`/employees/${employee.id}/schedules`)
      .then((res) => {
        const byDay = new Map<number, ScheduleDay>();
        for (const s of res.data) {
          byDay.set(s.dayOfWeek, {
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            breakStart: s.breakStart,
            breakEnd: s.breakEnd,
            isWorking: s.isWorking,
          });
        }
        setSchedule(
          Array.from({ length: 7 }, (_, i) =>
            byDay.get(i) || {
              dayOfWeek: i,
              startTime: "09:00",
              endTime: "18:00",
              breakStart: "12:00",
              breakEnd: "13:00",
              isWorking: i !== 6,
            }
          )
        );
      })
      .finally(() => setScheduleLoading(false));

    setLeavesLoading(true);
    api.get(`/tenants/${tenantId}/employees/${employee.id}/leaves`)
      .then((res) => setLeaves(res.data))
      .finally(() => setLeavesLoading(false));
  }, [employee.id, tenantId]);

  const saveSchedule = async () => {
    setSavingSchedule(true);
    try {
      const payload = schedule.map((d) => ({
        ...d,
        breakStart: d.breakStart || null,
        breakEnd: d.breakEnd || null,
      }));
      await api.put(`/employees/${employee.id}/schedules`, payload);
    } catch {} finally { setSavingSchedule(false); }
  };

  const addLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeave.startDate || !newLeave.endDate) return;
    setAddingLeave(true);
    try {
      const body = {
        startDate: new Date(newLeave.startDate).toISOString(),
        endDate: new Date(newLeave.endDate).toISOString(),
        reason: newLeave.reason || undefined,
      };
      await api.post(`/tenants/${tenantId}/employees/${employee.id}/leaves`, body);
      const res = await api.get(`/tenants/${tenantId}/employees/${employee.id}/leaves`);
      setLeaves(res.data);
      setNewLeave({ startDate: "", endDate: "", reason: "" });
    } catch {} finally { setAddingLeave(false); }
  };

  const removeLeave = async (id: string) => {
    if (!confirm("Bu izni silmek istediğinizden emin misiniz?")) return;
    await api.delete(`/tenants/${tenantId}/employees/leaves/${id}`);
    setLeaves((l) => l.filter((x) => x.id !== id));
  };

  const updateDay = (i: number, patch: Partial<ScheduleDay>) => {
    setSchedule((s) => s.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  };

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
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white z-50 shadow-2xl overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-rose flex items-center justify-center text-white font-bold">
              {employee.firstName[0]}{employee.lastName[0]}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{employee.firstName} {employee.lastName}</p>
              <p className="text-xs text-gray-500">{employee.title || "Çalışan"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="px-6 pt-4">
          <div className="inline-flex rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setTab("schedule")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "schedule" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Clock className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Haftalık Program
            </button>
            <button
              onClick={() => setTab("leaves")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "leaves" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              <CalendarOff className="w-4 h-4 inline mr-1.5 -mt-0.5" /> İzinler ({leaves.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {tab === "schedule" ? (
            scheduleLoading ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" /></div>
            ) : (
              <div className="space-y-3">
                {schedule.map((d, i) => (
                  <div key={i} className={`rounded-xl border p-3 ${d.isWorking ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"}`}>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 min-w-[140px]">
                        <input
                          type="checkbox"
                          checked={d.isWorking}
                          onChange={(e) => updateDay(i, { isWorking: e.target.checked })}
                          className="accent-rose-600"
                        />
                        <span className={`text-sm font-medium ${d.isWorking ? "text-gray-900" : "text-gray-400"}`}>{DAY_LABELS[i]}</span>
                      </label>
                      {d.isWorking && (
                        <>
                          <input type="time" value={d.startTime} onChange={(e) => updateDay(i, { startTime: e.target.value })} className="input py-1.5 text-sm flex-1" />
                          <span className="text-gray-400">–</span>
                          <input type="time" value={d.endTime} onChange={(e) => updateDay(i, { endTime: e.target.value })} className="input py-1.5 text-sm flex-1" />
                        </>
                      )}
                    </div>
                    {d.isWorking && (
                      <div className="mt-2 flex items-center gap-3 pl-6">
                        <span className="text-xs text-gray-500 min-w-[100px]">Mola (ops.)</span>
                        <input
                          type="time"
                          value={d.breakStart || ""}
                          onChange={(e) => updateDay(i, { breakStart: e.target.value || null })}
                          className="input py-1 text-sm flex-1"
                        />
                        <span className="text-gray-400">–</span>
                        <input
                          type="time"
                          value={d.breakEnd || ""}
                          onChange={(e) => updateDay(i, { breakEnd: e.target.value || null })}
                          className="input py-1 text-sm flex-1"
                        />
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={saveSchedule} disabled={savingSchedule} className="btn btn-primary w-full">
                  <Save className="w-4 h-4" /> {savingSchedule ? "Kaydediliyor..." : "Programı Kaydet"}
                </button>
              </div>
            )
          ) : (
            <div>
              <form onSubmit={addLeave} className="card p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Yeni İzin Ekle</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Başlangıç</label>
                    <input type="date" className="input" value={newLeave.startDate} onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Bitiş</label>
                    <input type="date" className="input" value={newLeave.endDate} onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })} required />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs text-gray-500 mb-1">Açıklama (opsiyonel)</label>
                  <input className="input" value={newLeave.reason} onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })} placeholder="Yıllık izin, sağlık raporu..." />
                </div>
                <button type="submit" disabled={addingLeave} className="btn btn-primary btn-sm mt-4">
                  <Plus className="w-4 h-4" /> {addingLeave ? "Ekleniyor..." : "İzin Ekle"}
                </button>
              </form>

              {leavesLoading ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" /></div>
              ) : leaves.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-8">Kayıtlı izin bulunmamaktadır.</p>
              ) : (
                <ul className="space-y-2">
                  {leaves.map((l) => (
                    <li key={l.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(l.startDate).toLocaleDateString("tr-TR")} – {new Date(l.endDate).toLocaleDateString("tr-TR")}
                        </p>
                        {l.reason && <p className="text-xs text-gray-500 mt-0.5">{l.reason}</p>}
                      </div>
                      <button onClick={() => removeLeave(l.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
