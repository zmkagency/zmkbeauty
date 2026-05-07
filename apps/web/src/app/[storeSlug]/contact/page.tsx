"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Phone, Mail, Clock } from "lucide-react";
import api from "@/lib/api";

export default function StoreContactPage() {
  const { storeSlug } = useParams();
  const [store, setStore] = useState<any>(null);

  useEffect(() => {
    api.get(`/tenants/slug/${storeSlug}`).then((res) => setStore(res.data)).catch(() => {});
  }, [storeSlug]);

  if (!store) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link href={`/${storeSlug}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-rose-600 mb-6">
          <ArrowLeft className="w-4 h-4" /> Geri
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-display)" }}>İletişim</h1>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {store.address && (
              <div className="card p-6">
                <MapPin className="w-6 h-6 text-rose-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Adres</h3>
                <p className="text-sm text-gray-600">{store.address}</p>
              </div>
            )}
            {store.phone && (
              <div className="card p-6">
                <Phone className="w-6 h-6 text-rose-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Telefon</h3>
                <a href={`tel:${store.phone}`} className="text-sm text-rose-600 font-medium">{store.phone}</a>
              </div>
            )}
            {store.email && (
              <div className="card p-6">
                <Mail className="w-6 h-6 text-rose-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">E-posta</h3>
                <a href={`mailto:${store.email}`} className="text-sm text-rose-600 font-medium">{store.email}</a>
              </div>
            )}
          </div>

          {store.latitude && store.longitude && (
            <div className="card overflow-hidden">
              <iframe
                src={`https://www.google.com/maps?q=${store.latitude},${store.longitude}&z=15&output=embed`}
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
