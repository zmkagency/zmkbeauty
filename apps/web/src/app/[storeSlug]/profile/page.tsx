"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Phone, Clock, Mail, Globe, Heart } from "lucide-react";
import api from "@/lib/api";
import { getDayName } from "@/lib/utils";

export default function StoreProfilePage() {
  const { storeSlug } = useParams();
  const [store, setStore] = useState<any>(null);

  useEffect(() => {
    api.get(`/tenants/slug/${storeSlug}`).then((res) => setStore(res.data)).catch(() => {});
  }, [storeSlug]);

  if (!store) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" /></div>;

  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link href={`/${storeSlug}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-rose-600 mb-6">
          <ArrowLeft className="w-4 h-4" /> Geri
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "var(--font-display)" }}>Hakkımızda</h1>
          
          {store.description && (
            <p className="text-gray-600 leading-relaxed mt-4 text-lg">{store.description}</p>
          )}

          {/* Info Cards */}
          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            {store.address && (
              <div className="card p-5">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Adres</p>
                    <p className="text-sm text-gray-600">{store.address}</p>
                  </div>
                </div>
              </div>
            )}
            {store.phone && (
              <div className="card p-5">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Telefon</p>
                    <a href={`tel:${store.phone}`} className="text-sm text-rose-600">{store.phone}</a>
                  </div>
                </div>
              </div>
            )}
            {store.email && (
              <div className="card p-5">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">E-posta</p>
                    <a href={`mailto:${store.email}`} className="text-sm text-rose-600">{store.email}</a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Working Hours */}
          {store.workingHours && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-600" /> Çalışma Saatleri
              </h2>
              <div className="card divide-y divide-gray-100">
                {dayKeys.map((key, i) => {
                  const hours = store.workingHours[key];
                  return (
                    <div key={key} className="flex items-center justify-between px-5 py-3">
                      <span className="font-medium text-gray-700">{getDayName(i)}</span>
                      {hours ? (
                        <span className="text-sm text-gray-600">{hours.open} - {hours.close}</span>
                      ) : (
                        <span className="text-sm text-red-500 font-medium">Kapalı</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Social Links */}
          {store.socialLinks && (
            <div className="mt-8 flex items-center gap-4">
              {store.socialLinks.instagram && (
                <a href={store.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="card p-3 hover:bg-rose-50 transition-colors">
                  <Globe className="w-6 h-6 text-rose-600" />
                </a>
              )}
              {store.socialLinks.facebook && (
                <a href={store.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="card p-3 hover:bg-rose-50 transition-colors">
                  <Heart className="w-6 h-6 text-rose-600" />
                </a>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
