"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Users, CreditCard, TrendingUp, Clock, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { formatPrice, formatDate, getStatusLabel, getStatusColor } from "@/lib/utils";
import RevenueChart from "@/components/admin/RevenueChart";

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.tenantId) {
      Promise.all([
        api.get(`/dashboard/store/${user.tenantId}`),
        api.get('/dashboard/analytics?range=30d')
      ])
        .then(([storeRes, analyticsRes]) => {
          setData(storeRes.data);
          setAnalytics(analyticsRes.data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" /></div>;

  const kpis = data?.kpis || {};

  const kpiCards = [
    { label: "Bugünkü Randevular", value: kpis.todayAppointments || 0, icon: Calendar, color: "bg-rose-50 text-rose-600" },
    { label: "Haftalık Randevular", value: kpis.weekAppointments || 0, icon: TrendingUp, color: "bg-blue-50 text-blue-600" },
    { label: "Toplam Müşteri", value: kpis.totalCustomers || 0, icon: Users, color: "bg-emerald-50 text-emerald-600" },
    { label: "Aylık Ciro", value: formatPrice(kpis.monthRevenue || 0), icon: CreditCard, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
          Hoş geldiniz, {user?.firstName} 👋
        </h1>
        <p className="text-gray-500 mt-1">İşletmenizin günlük özeti</p>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${kpi.color} flex items-center justify-center`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Advanced Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <RevenueChart data={analytics?.revenueData || []} />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">En Çok Tercih Edilen Hizmetler</h3>
          <ul className="space-y-4">
            {(analytics?.topServices || []).map((srv: any, idx: number) => (
              <li key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{srv.name}</p>
                  <p className="text-xs text-gray-500">{srv.count} Randevu</p>
                </div>
                <span className="font-bold text-rose-600">₺{srv.revenue}</span>
              </li>
            ))}
            {(analytics?.topServices || []).length === 0 && (
               <li className="text-sm text-gray-500 text-center py-4">Veri bulunamadı</li>
            )}
          </ul>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="card">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-rose-600" /> Yaklaşan Randevular
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {(data?.upcomingAppointments || []).length === 0 ? (
            <p className="p-8 text-center text-gray-500">Yaklaşan randevu bulunmamaktadır.</p>
          ) : (
            (data?.upcomingAppointments || []).map((appt: any) => (
              <div key={appt.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 font-bold text-sm">
                    {appt.customer?.firstName?.[0]}{appt.customer?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{appt.customer?.firstName} {appt.customer?.lastName}</p>
                    <p className="text-sm text-gray-500">{appt.service?.name} • {appt.employee?.firstName} {appt.employee?.lastName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{appt.startTime} - {appt.endTime}</p>
                  <p className="text-xs text-gray-500">{formatDate(appt.date)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
