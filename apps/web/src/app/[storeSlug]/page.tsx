"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MapPin, Phone, Globe, Clock, Star, Scissors, Calendar, ArrowRight, ChevronRight, Sparkles, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { formatPrice } from "@/lib/utils";

export default function StorePage() {
  const { storeSlug } = useParams();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/tenants/slug/${storeSlug}`)
      .then((res) => setStore(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [storeSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mağaza Bulunamadı</h1>
          <p className="text-gray-500 mb-6">Bu adrese ait bir mağaza bulunmamaktadır.</p>
          <Link href="/" className="btn btn-primary">Ana Sayfaya Dön</Link>
        </div>
      </div>
    );
  }

  const topServices = store.services?.slice(0, 6) || [];
  const topEmployees = store.employees?.slice(0, 4) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Store nav rendered by the layout shell */}

      {/* ============ HERO ============ */}
      <section className="pt-20 pb-16 bg-gradient-mesh relative overflow-hidden">
        <div className="absolute top-10 right-0 w-72 h-72 rounded-full bg-rose-200/20 blur-3xl" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-rose mx-auto flex items-center justify-center mb-6 shadow-lg shadow-rose-200">
              <Scissors className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
              {store.name}
            </h1>

            {store.shortDescription && (
              <p className="mt-3 text-lg text-gray-600">{store.shortDescription}</p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-gray-500">
              {store.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  {store.district && `${store.district}, `}{store.city}
                </span>
              )}
              {store.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4 text-rose-500" />
                  {store.phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                4.9 (128 yorum)
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <Link href={`/${storeSlug}/booking`} className="btn btn-primary btn-lg btn-shine">
                <Calendar className="w-5 h-5" />
                Randevu Oluştur
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href={`/${storeSlug}/services`} className="btn btn-outline btn-lg">
                Hizmetleri İncele
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ SERVICES PREVIEW ============ */}
      {topServices.length > 0 && (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>Hizmetlerimiz</h2>
                <p className="text-gray-500 mt-1">En popüler hizmetlerimiz</p>
              </div>
              <Link href={`/${storeSlug}/services`} className="text-rose-600 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                Tümünü Gör <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topServices.map((service: any, i: number) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="card p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{service.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{service.duration} dk</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-rose-600">{formatPrice(service.price)}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ TEAM PREVIEW ============ */}
      {topEmployees.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>Ekibimiz</h2>
              <p className="text-gray-500 mt-1">Uzman kadromuz ile hizmetinizdeyiz</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topEmployees.map((emp: any, i: number) => (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="card p-6 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-rose mx-auto flex items-center justify-center text-white text-xl font-bold mb-4">
                    {emp.firstName[0]}{emp.lastName[0]}
                  </div>
                  <p className="font-semibold text-gray-900">{emp.firstName} {emp.lastName}</p>
                  {emp.title && <p className="text-sm text-rose-600 mt-0.5">{emp.title}</p>}
                  <p className="text-xs text-gray-400 mt-2">
                    {emp.services?.length || 0} hizmet
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ CTA ============ */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-dark rounded-3xl p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-rose-500/10 blur-3xl" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 relative" style={{ fontFamily: "var(--font-display)" }}>
              Hemen Randevu Oluşturun
            </h2>
            <p className="text-rose-100 mb-6 relative">30 saniyede online randevu alın.</p>
            <Link href={`/${storeSlug}/booking`} className="btn btn-primary btn-lg btn-shine relative">
              <Calendar className="w-5 h-5" />
              Randevu Oluştur
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">© 2026 {store.name}. ZMK Beauty Platform üzerinde çalışmaktadır.</p>
            <div className="flex items-center gap-4">
              {store.socialLinks?.instagram && (
                <a href={store.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-rose-600">
                  <Globe className="w-5 h-5" />
                </a>
              )}
              {store.socialLinks?.facebook && (
                <a href={store.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-rose-600">
                  <Heart className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
