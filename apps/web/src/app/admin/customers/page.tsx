"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { Users, Calendar, Mail, Phone } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AdminCustomersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.tenantId) {
      api.get(`/users/tenant/${user.tenantId}/customers`).then((res) => setCustomers(res.data)).finally(() => setLoading(false));
    }
  }, [user]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-display)" }}>Müşteriler</h1>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 font-medium text-gray-500">Müşteri</th>
                <th className="text-left p-4 font-medium text-gray-500">E-posta</th>
                <th className="text-left p-4 font-medium text-gray-500">Telefon</th>
                <th className="text-left p-4 font-medium text-gray-500">Randevular</th>
                <th className="text-left p-4 font-medium text-gray-500">Kayıt Tarihi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center"><div className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto" /></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Müşteri bulunmamaktadır.</td></tr>
              ) : customers.map((c) => (
                <tr 
                  key={c.id} 
                  className="hover:bg-gray-50 cursor-pointer" 
                  onClick={() => router.push(`/admin/customers/${c.id}`)}
                >
                  <td className="p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 font-bold text-sm">{c.firstName?.[0]}{c.lastName?.[0]}</div><span className="font-medium text-gray-900">{c.firstName} {c.lastName}</span></div></td>
                  <td className="p-4 text-gray-600">{c.email}</td>
                  <td className="p-4 text-gray-600">{c.phone || "—"}</td>
                  <td className="p-4"><span className="badge bg-rose-50 text-rose-600">{c._count?.appointments || 0}</span></td>
                  <td className="p-4 text-gray-500">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
