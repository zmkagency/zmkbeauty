"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Check, Zap, Star, Building2, ArrowRight, CreditCard, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { toast } from "react-hot-toast";

const PLANS = [
  {
    tier: "FREE",
    name: "Başlangıç",
    icon: Zap,
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxEmployees: 1,
    maxAppointments: 50,
    commission: "%5",
    color: "gray",
  },
  {
    tier: "PRO",
    name: "Profesyonel",
    icon: Star,
    monthlyPrice: 399,
    yearlyPrice: 319,
    maxEmployees: 5,
    maxAppointments: -1,
    commission: "%2.5",
    color: "rose",
    popular: true,
  },
  {
    tier: "BUSINESS",
    name: "İşletme",
    icon: Building2,
    monthlyPrice: 699,
    yearlyPrice: 559,
    maxEmployees: 15,
    maxAppointments: -1,
    commission: "%1.5",
    color: "purple",
  },
  {
    tier: "ENTERPRISE",
    name: "Kurumsal",
    icon: Crown,
    monthlyPrice: -1,
    yearlyPrice: -1,
    maxEmployees: -1,
    maxAppointments: -1,
    commission: "%0",
    color: "amber",
  },
];

export default function AdminSubscriptionPage() {
  const { user } = useAuthStore();
  const [subscription, setSubscription] = useState<any>(null);
  const [limits, setLimits] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (user?.tenantId) {
      Promise.all([
        api.get(`/subscriptions/${user.tenantId}`),
        api.get(`/subscriptions/${user.tenantId}/limits`),
      ]).then(([subRes, limRes]) => {
        setSubscription(subRes.data);
        setLimits(limRes.data);
      }).finally(() => setLoading(false));
    }
  }, [user]);

  const handleUpgrade = async (tier: string) => {
    if (tier === "ENTERPRISE") {
      toast("Kurumsal plan için lütfen bizimle +90 541 381 2114 numarasından iletişime geçin.");
      return;
    }
    setUpgrading(true);
    try {
      await api.post(`/subscriptions/${user?.tenantId}/upgrade`, { tier, billingCycle });
      toast.success("Plan güncellendi!");
      // Reload
      const subRes = await api.get(`/subscriptions/${user?.tenantId}`);
      setSubscription(subRes.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Bir hata oluştu");
    } finally {
      setUpgrading(false);
    }
  };

  const currentTier = subscription?.tier || "FREE";

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-display)" }}>Abonelik Yönetimi</h1>

      {/* Current Plan Summary */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Mevcut Planınız</p>
            <h2 className="text-xl font-bold text-gray-900">{PLANS.find(p => p.tier === currentTier)?.name || currentTier}</h2>
            {subscription?.currentPeriodEnd && (
              <p className="text-xs text-gray-500 mt-1">
                Bitiş: {new Date(subscription.currentPeriodEnd).toLocaleDateString('tr-TR')}
              </p>
            )}
          </div>
          <div className="text-right">
            {limits && (
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">
                  Personel: <span className="font-bold">{limits.employees.current}/{limits.employees.max === -1 ? '∞' : limits.employees.max}</span>
                  {limits.employees.exceeded && <AlertTriangle className="w-4 h-4 inline ml-1 text-amber-500" />}
                </p>
                <p className="text-gray-600">
                  Randevu (bu ay): <span className="font-bold">{limits.appointments.current}/{limits.appointments.max === -1 ? '∞' : limits.appointments.max}</span>
                  {limits.appointments.exceeded && <AlertTriangle className="w-4 h-4 inline ml-1 text-amber-500" />}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
          <button onClick={() => setBillingCycle("monthly")} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}>
            Aylık
          </button>
          <button onClick={() => setBillingCycle("yearly")} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === "yearly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}>
            Yıllık <span className="text-green-600 font-bold ml-1">%20 Tasarruf</span>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
          const isCurrent = plan.tier === currentTier;

          return (
            <div key={plan.tier} className={`card p-5 flex flex-col ${isCurrent ? "ring-2 ring-rose-500" : ""} ${plan.popular ? "shadow-lg" : ""}`}>
              {plan.popular && <span className="text-xs font-bold text-rose-600 mb-2">En Popüler</span>}
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-gray-900">{plan.name}</h3>
              </div>

              <div className="mb-4">
                {price === 0 ? (
                  <span className="text-2xl font-bold">Ücretsiz</span>
                ) : price === -1 ? (
                  <span className="text-lg font-bold">Özel Fiyat</span>
                ) : (
                  <span className="text-2xl font-bold">₺{price}<span className="text-sm text-gray-500 font-normal">/ay</span></span>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600 flex-1 mb-4">
                <p>{plan.maxEmployees === -1 ? 'Sınırsız' : plan.maxEmployees} personel</p>
                <p>{plan.maxAppointments === -1 ? 'Sınırsız' : plan.maxAppointments} randevu/ay</p>
                <p>{plan.commission} komisyon</p>
              </div>

              {isCurrent ? (
                <button disabled className="w-full py-2 rounded-lg bg-gray-100 text-gray-500 text-sm font-medium">Mevcut Plan</button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.tier)}
                  disabled={upgrading}
                  className="w-full py-2 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors"
                >
                  {upgrading ? "..." : "Yükselt"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Invoices */}
      {subscription?.invoices?.length > 0 && (
        <div className="mt-8">
          <h3 className="font-bold text-gray-900 mb-4">Fatura Geçmişi</h3>
          <div className="card divide-y divide-gray-100">
            {subscription.invoices.map((inv: any) => (
              <div key={inv.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{inv.description || 'Abonelik'}</p>
                  <p className="text-xs text-gray-500">{new Date(inv.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₺{Number(inv.amount).toLocaleString('tr-TR')}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {inv.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
