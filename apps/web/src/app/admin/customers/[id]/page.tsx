"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { User, Star, Calendar as CalendarIcon, DollarSign, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatPrice, getStatusLabel, getStatusColor } from "@/lib/utils";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/users/tenant-customers/${id}`)
      .then(res => setCustomer(res.data))
      .catch(err => console.error("Error fetching customer", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;
  if (!customer) return <div className="p-8 text-center text-red-500">Müşteri bulunamadı</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Link href="/admin/customers" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Müşterilere Dön
      </Link>

      {/* Header Profile */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
          <User className="w-10 h-10 text-rose-600" />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-bold text-gray-900">{customer.firstName} {customer.lastName}</h1>
          <p className="text-gray-500">{customer.email} • {customer.phone || 'Telefon yok'}</p>
        </div>
        <div className="md:ml-auto text-center md:text-right mt-4 md:mt-0 p-4 bg-emerald-50 rounded-xl border border-emerald-100 min-w-[200px]">
          <p className="text-sm text-emerald-800 font-medium mb-1">Toplam Ciro (LTV)</p>
          <p className="text-3xl font-bold text-emerald-600">{formatPrice(customer.ltv)}</p>
        </div>
      </div>

      {/* Appointment History */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
          Randevu Geçmişi
        </h3>
        <div className="space-y-3">
          {customer.appointments?.length === 0 && (
            <p className="text-gray-500 italic">Geçmiş randevu bulunmuyor.</p>
          )}
          {customer.appointments?.map((app: any) => (
            <div key={app.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors gap-4">
              <div>
                <p className="font-semibold text-gray-900">{app.service?.name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(app.date).toLocaleDateString('tr-TR')} • {app.startTime} - {app.endTime}
                </p>
                <p className="text-xs text-gray-400 mt-1">Personel: {app.employee?.firstName} {app.employee?.lastName}</p>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-end">
                <span className={`badge ${getStatusColor(app.status)}`}>
                  {getStatusLabel(app.status)}
                </span>
                <p className="mt-2 font-bold text-gray-900">{formatPrice(app.totalPrice || app.service?.price || 0)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}