"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, MapPin, Star, Clock, Filter, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";

const cities = ["İstanbul", "Ankara", "İzmir", "Kırıkkale", "Bursa", "Antalya", "Konya", "Adana"];

export default function DiscoverPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    loadStores();
  }, [city]);

  const loadStores = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (search) params.set("search", search);
    params.set("isActive", "true");

    api.get(`/tenants?${params.toString()}`)
      .then((res) => setStores(res.data))
      .finally(() => setLoading(false));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadStores();
  };

  const filtered = search
    ? stores.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : stores;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Search */}
      <div className="bg-gradient-to-b from-rose-600 to-rose-700 pt-16 pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ fontFamily: "var(--font-display)" }}>
            Yakınındaki Güzellik Salonlarını Keşfet
          </h1>
          <p className="text-rose-100 mb-8">Binlerce salon arasından sana en uygun olanı bul ve hemen randevu al</p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border-0 shadow-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-rose-300"
                placeholder="Salon adı, hizmet veya bölge ara..."
              />
            </div>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="px-4 py-3.5 rounded-xl border-0 shadow-lg text-gray-900 bg-white"
            >
              <option value="">Tüm Şehirler</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button type="submit" className="px-6 py-3.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-lg">
              Ara
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 -mt-12">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              {filtered.length} Salon Bulundu
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="w-4 h-4" /> Sırala
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>Aramanıza uygun salon bulunamadı.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((store, i) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/${store.slug}`} className="block group">
                    <div className="rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-rose-200 transition-all">
                      {/* Cover Image */}
                      <div className="h-40 bg-gradient-to-br from-rose-100 to-purple-100 relative">
                        {store.coverImage && (
                          <img src={store.coverImage} alt={store.name} className="w-full h-full object-cover" />
                        )}
                        {store.logo && (
                          <div className="absolute -bottom-5 left-4 w-12 h-12 rounded-xl bg-white shadow-md border-2 border-white overflow-hidden">
                            <img src={store.logo} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      <div className="p-4 pt-8">
                        <h3 className="font-bold text-gray-900 group-hover:text-rose-600 transition-colors">{store.name}</h3>
                        {store.shortDescription && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{store.shortDescription}</p>
                        )}

                        <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                          {store.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> {store.city}
                              {store.district && `, ${store.district}`}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                          <span>{store._count?.services || 0} hizmet</span>
                          <span>{store._count?.employees || 0} uzman</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA for salon owners */}
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Siz de salonunuzu ekleyin!</h2>
        <p className="text-gray-600 mb-6">Ücretsiz başlayın, binlerce müşteriye ulaşın.</p>
        <Link href="/pricing" className="btn btn-primary btn-lg inline-flex items-center gap-2">
          Ücretsiz Kayıt Ol
        </Link>
      </div>
    </div>
  );
}
