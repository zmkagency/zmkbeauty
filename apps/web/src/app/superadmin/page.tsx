"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Store, Users, Calendar, CreditCard, TrendingUp, Clock } from "lucide-react";
import api from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";

export default function SuperadminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/superadmin").then((res) => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-400 border-t-rose-600 rounded-full animate-spin" /></div>;

  const kpis = data?.kpis || {};

  const kpiCards = [
    { label: "Toplam Mağaza", value: kpis.totalTenants, icon: Store, color: "from-rose-500 to-pink-600" },
    { label: "Aktif Mağaza", value: kpis.activeTenants, icon: TrendingUp, color: "from-emerald-500 to-teal-600" },
    { label: "Toplam Müşteri", value: kpis.totalCustomers, icon: Users, color: "from-blue-500 to-indigo-600" },
    { label: "Bugünkü Randevu", value: kpis.todayAppointments, icon: Calendar, color: "from-amber-500 to-orange-600" },
    { label: "Aylık Randevu", value: kpis.monthlyAppointments, icon: Clock, color: "from-violet-500 to-purple-600" },
    { label: "Toplam Ciro", value: formatPrice(kpis.totalRevenue || 0), icon: CreditCard, color: "from-rose-600 to-red-700" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
          God Mode Dashboard 🛡️
        </h1>
        <p className="text-gray-400 mt-1">Platformun tam durumu</p>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-2xl bg-gradient-to-br ${kpi.color} p-5 text-white shadow-lg`}
          >
            <div className="flex items-center justify-between mb-3">
              <kpi.icon className="w-6 h-6 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{kpi.value}</p>
            <p className="text-sm opacity-80 mt-0.5">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Appointments */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
        <div className="p-5 border-b border-gray-800">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-rose-500" /> Son Randevular
          </h2>
        </div>
        <div className="divide-y divide-gray-800">
          {(data?.recentAppointments || []).length === 0 ? (
            <p className="p-8 text-center text-gray-500">Randevu bulunmamaktadır.</p>
          ) : (data?.recentAppointments || []).map((appt: any) => (
            <div key={appt.id} className="p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
              <div>
                <p className="font-medium text-white">{appt.customer?.firstName} {appt.customer?.lastName}</p>
                <p className="text-sm text-gray-400">{appt.tenant?.name} • {appt.service?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-rose-400">{formatPrice(appt.service?.price || 0)}</p>
                <p className="text-xs text-gray-500">{formatDate(appt.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
