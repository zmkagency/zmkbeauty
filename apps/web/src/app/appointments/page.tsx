"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, ArrowLeft, XCircle, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { formatPrice, formatDate, getStatusLabel, getStatusColor } from "@/lib/utils";
import Link from "next/link";

export default function MyAppointmentsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    loadAppointments();
  }, [user]);

  const loadAppointments = async () => {
    try {
      const res = await api.get("/appointments/my");
      setAppointments(res.data);
    } catch {} finally { setLoading(false); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Bu randevuyu iptal etmek istediğinizden emin misiniz?")) return;
    setCancelling(id);
    try {
      await api.patch(`/appointments/${id}/cancel`);
      loadAppointments();
    } catch {} finally { setCancelling(null); }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED": return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case "COMPLETED": return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case "CANCELLED": return <XCircle className="w-4 h-4 text-red-500" />;
      case "PENDING_PAYMENT": return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const upcoming = appointments.filter(a => 
    new Date(a.date) >= new Date(new Date().toDateString()) && 
    !["CANCELLED", "COMPLETED"].includes(a.status)
  );
  const past = appointments.filter(a => 
    new Date(a.date) < new Date(new Date().toDateString()) || 
    ["CANCELLED", "COMPLETED"].includes(a.status)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-rose-600 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Ana Sayfa
          </Link>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
            Randevularım
          </h1>
          <p className="text-gray-500 mt-1">Tüm randevu geçmişiniz burada</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Henüz Randevunuz Yok</h2>
            <p className="text-gray-500 mb-6">İlk randevunuzu oluşturmak için bir güzellik merkezi seçin.</p>
            <Link href="/" className="btn btn-primary">Mağazaları Keşfet</Link>
          </div>
        ) : (
          <>
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-rose-600" /> Yaklaşan Randevular
                </h2>
                <div className="space-y-3">
                  {upcoming.map((appt, i) => (
                    <motion.div
                      key={appt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="card p-5"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-6 h-6 text-rose-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{appt.service?.name}</p>
                            <p className="text-sm text-gray-500">{appt.tenant?.name}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> {formatDate(appt.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> {appt.startTime} - {appt.endTime}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Uzman: {appt.employee?.firstName} {appt.employee?.lastName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <span className="text-lg font-bold text-rose-600">{formatPrice(appt.service?.price)}</span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(appt.status)}`}>
                            {getStatusIcon(appt.status)}
                            {getStatusLabel(appt.status)}
                          </span>
                          {["CONFIRMED", "PENDING_PAYMENT"].includes(appt.status) && (
                            <button
                              onClick={() => handleCancel(appt.id)}
                              disabled={cancelling === appt.id}
                              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mt-1"
                            >
                              {cancelling === appt.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                              İptal Et
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" /> Geçmiş Randevular
                </h2>
                <div className="space-y-3">
                  {past.map((appt, i) => (
                    <motion.div
                      key={appt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="card p-5 opacity-75"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-700">{appt.service?.name}</p>
                            <p className="text-sm text-gray-500">{appt.tenant?.name}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> {formatDate(appt.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> {appt.startTime}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-gray-500">{formatPrice(appt.service?.price)}</span>
                          <div className="mt-1">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(appt.status)}`}>
                              {getStatusIcon(appt.status)}
                              {getStatusLabel(appt.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
