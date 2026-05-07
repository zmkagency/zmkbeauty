"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RevenueChart({ data }: { data: { date: string, total: number }[] }) {
  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-500">Veri bulunamadı</div>;

  return (
    <div className="h-80 w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Son 30 Günlük Ciro</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(val) => `₺${val}`} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(value) => [`₺${value}`, 'Ciro']} labelStyle={{ color: '#374151' }} />
          <Line type="monotone" dataKey="total" stroke="#e11d48" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}