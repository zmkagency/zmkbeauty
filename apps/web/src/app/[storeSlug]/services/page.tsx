"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Clock, ArrowLeft, Calendar, Filter } from "lucide-react";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";

export default function StoreServicesPage() {
  const { storeSlug } = useParams();
  const [store, setStore] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/tenants/slug/${storeSlug}`).then((res) => {
      setStore(res.data);
      const svcs = res.data.services || [];
      setServices(svcs);
      const cats = [...new Set(svcs.map((s: any) => s.category).filter(Boolean))] as string[];
      setCategories(cats);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [storeSlug]);

  const filtered = activeCategory === "all" ? services : services.filter((s) => s.category === activeCategory);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Link href={`/${storeSlug}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-rose-600 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> {store?.name || "Mağaza"}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>Hizmetlerimiz</h1>
            <p className="text-gray-500 mt-1">{services.length} hizmet mevcut</p>
          </div>
          <Link href={`/${storeSlug}/booking`} className="btn btn-primary btn-sm">
            <Calendar className="w-4 h-4" /> Randevu Al
          </Link>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button onClick={() => setActiveCategory("all")} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === "all" ? "bg-rose-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              <Filter className="w-3 h-3 inline mr-1" /> Tümü
            </button>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat ? "bg-rose-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Services Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5 flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-rose-600" />
                </div>
                {service.category && (
                  <span className="badge bg-rose-50 text-rose-600">{service.category}</span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
              {service.description && <p className="text-sm text-gray-500 mt-1 flex-1">{service.description}</p>}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" /> {service.duration} dakika
                </div>
                <span className="text-xl font-bold text-rose-600">{formatPrice(service.price)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
