"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Clock,
  Calendar,
  User,
  CreditCard,
  Check,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Tag,
  X as XIcon,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { formatPrice, formatDate } from "@/lib/utils";

const STEPS = ["Hizmet Seç", "Çalışan Seç", "Tarih & Saat", "Onayla & Öde"];

export default function BookingPage() {
  const { storeSlug } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loadUser } = useAuthStore();

  const [store, setStore] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [error, setError] = useState("");

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [couponChecking, setCouponChecking] = useState(false);

  useEffect(() => { loadUser(); }, []);

  useEffect(() => {
    // If PayTR redirected back with success
    if (searchParams.get("success") === "1") {
      setStep(4);
    } else if (searchParams.get("fail") === "1") {
      setError("Ödeme başarısız oldu. Lütfen tekrar deneyin.");
      setStep(3); // Go back to payment step
    }
  }, [searchParams]);

  useEffect(() => {
    api.get(`/tenants/slug/${storeSlug}`).then((res) => setStore(res.data)).catch(() => {});
  }, [storeSlug]);

  // Pre-fill from query string (?service=&employee=) — for "Tekrar Al" flow
  useEffect(() => {
    if (!store) return;
    const sid = searchParams.get("service");
    const eid = searchParams.get("employee");
    if (sid && !selectedService) {
      const s = store.services?.find((x: any) => x.id === sid);
      if (s) {
        setSelectedService(s);
        setStep((cur) => Math.max(cur, 1));
      }
    }
    if (eid && !selectedEmployee) {
      const e = store.employees?.find((x: any) => x.id === eid);
      if (e) {
        setSelectedEmployee(e);
        setStep((cur) => Math.max(cur, 2));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  // Get available employees for selected service
  const availableEmployees = selectedService
    ? (store?.employees || []).filter((emp: any) =>
        emp.services?.some((es: any) => es.service?.id === selectedService.id || es.serviceId === selectedService.id)
      )
    : [];

  // Generate next 14 days for date picker
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  // Fetch slots when employee and date are selected
  useEffect(() => {
    if (selectedEmployee && selectedService && selectedDate && store) {
      setLoadingSlots(true);
      setSelectedSlot(null);
      api.get(`/tenants/${store.id}/slots`, {
        params: { employeeId: selectedEmployee.id, serviceId: selectedService.id, date: selectedDate },
      })
        .then((res) => setAvailableSlots(res.data))
        .catch(() => setAvailableSlots([]))
        .finally(() => setLoadingSlots(false));
    }
  }, [selectedEmployee, selectedService, selectedDate, store]);

  const applyCoupon = async () => {
    if (!couponInput.trim() || !selectedService || !store) return;
    setCouponChecking(true);
    setCouponError("");
    try {
      const { data } = await api.get(`/campaigns/validate`, {
        params: {
          tenantId: store.id,
          code: couponInput.trim(),
          amount: Number(selectedService.price),
        },
      });
      setCouponApplied(data);
    } catch (err: any) {
      setCouponApplied(null);
      setCouponError(err.response?.data?.message || "Kupon uygulanamadı");
    } finally {
      setCouponChecking(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponError("");
    setCouponInput("");
  };

  const handleBook = async () => {
    if (!isAuthenticated) {
      router.push(`/${storeSlug}/login?redirect=booking`);
      return;
    }

    setBooking(true);
    setError("");

    try {
      // Create appointment
      const { data: appointment } = await api.post("/appointments", {
        tenantId: store.id,
        serviceId: selectedService.id,
        employeeId: selectedEmployee.id,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        couponCode: couponApplied?.campaign?.code || undefined,
      });

      // Initiate payment (test mode auto-confirms)
      const { data: payment } = await api.post("/payments/initiate", {
        appointmentId: appointment.id,
      });

      setBookingResult({ appointment, payment });
      setStep(4); // Success step
    } catch (err: any) {
      setError(err.response?.data?.message || "Randevu oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setBooking(false);
    }
  };

  if (!store) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href={`/${storeSlug}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-rose-600 mb-4">
            <ArrowLeft className="w-4 h-4" /> {store.name}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>Randevu Oluştur</h1>

          {/* Progress Steps */}
          {step < 4 && (
            <div className="flex items-center gap-2 mt-4">
              {STEPS.map((s, i) => (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                    i <= step ? "bg-rose-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}>
                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${i <= step ? "text-rose-600" : "text-gray-400"}`}>{s}</span>
                  {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? "bg-rose-600" : "bg-gray-200"}`} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 0: Select Service */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Hizmet Seçin</h2>
              <div className="space-y-3">
                {(store.services || []).map((service: any) => (
                  <button
                    key={service.id}
                    onClick={() => { setSelectedService(service); setStep(1); }}
                    className={`w-full card p-4 flex items-center justify-between text-left transition-all ${
                      selectedService?.id === service.id ? "ring-2 ring-rose-600 bg-rose-50" : "hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {service.duration} dk
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-rose-600">{formatPrice(service.price)}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 1: Select Employee */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={() => setStep(0)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-rose-600 mb-4">
                <ChevronLeft className="w-4 h-4" /> Geri
              </button>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Çalışan Seçin</h2>
              <p className="text-sm text-gray-500 mb-4">{selectedService?.name} hizmetini veren çalışanlar</p>

              {availableEmployees.length === 0 ? (
                <p className="text-gray-500 p-8 text-center">Bu hizmet için müsait çalışan bulunmamaktadır.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {availableEmployees.map((emp: any) => (
                    <button
                      key={emp.id}
                      onClick={() => { setSelectedEmployee(emp); setStep(2); }}
                      className={`card p-5 text-center transition-all ${
                        selectedEmployee?.id === emp.id ? "ring-2 ring-rose-600 bg-rose-50" : "hover:shadow-md"
                      }`}
                    >
                      <div className="w-14 h-14 rounded-full bg-gradient-rose mx-auto flex items-center justify-center text-white text-lg font-bold mb-3">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <p className="font-semibold text-gray-900">{emp.firstName} {emp.lastName}</p>
                      {emp.title && <p className="text-sm text-rose-600 mt-0.5">{emp.title}</p>}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: Select Date & Time */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-rose-600 mb-4">
                <ChevronLeft className="w-4 h-4" /> Geri
              </button>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tarih & Saat Seçin</h2>

              {/* Date Picker */}
              <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
                {dates.map((d) => {
                  const date = new Date(d);
                  const dayName = date.toLocaleDateString("tr-TR", { weekday: "short" });
                  const dayNum = date.getDate();
                  const month = date.toLocaleDateString("tr-TR", { month: "short" });
                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDate(d)}
                      className={`flex flex-col items-center p-3 rounded-xl min-w-[72px] transition-all ${
                        selectedDate === d
                          ? "bg-rose-600 text-white shadow-lg shadow-rose-200"
                          : "bg-white border border-gray-200 hover:border-rose-300"
                      }`}
                    >
                      <span className="text-xs font-medium opacity-75">{dayName}</span>
                      <span className="text-xl font-bold">{dayNum}</span>
                      <span className="text-xs opacity-75">{month}</span>
                    </button>
                  );
                })}
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Müsait Saatler</h3>
                  {loadingSlots ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">Bu tarihte müsait saat bulunmamaktadır.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.startTime}
                          onClick={() => { setSelectedSlot(slot); setStep(3); }}
                          className={`p-3 rounded-xl text-sm font-semibold text-center transition-all ${
                            selectedSlot?.startTime === slot.startTime
                              ? "bg-rose-600 text-white shadow-md"
                              : "bg-white border border-gray-200 text-gray-700 hover:border-rose-300 hover:bg-rose-50"
                          }`}
                        >
                          {slot.startTime}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: Confirm & Pay */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-rose-600 mb-4">
                <ChevronLeft className="w-4 h-4" /> Geri
              </button>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Randevu Özeti</h2>

              <div className="card divide-y divide-gray-100 mb-6">
                <div className="p-4 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-rose-600" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Hizmet</p>
                    <p className="font-semibold text-gray-900">{selectedService?.name}</p>
                  </div>
                  <span className="font-bold text-rose-600">{formatPrice(selectedService?.price)}</span>
                </div>
                <div className="p-4 flex items-center gap-3">
                  <User className="w-5 h-5 text-rose-600" />
                  <div>
                    <p className="text-sm text-gray-500">Çalışan</p>
                    <p className="font-semibold text-gray-900">{selectedEmployee?.firstName} {selectedEmployee?.lastName}</p>
                  </div>
                </div>
                <div className="p-4 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-rose-600" />
                  <div>
                    <p className="text-sm text-gray-500">Tarih & Saat</p>
                    <p className="font-semibold text-gray-900">{formatDate(selectedDate)} — {selectedSlot?.startTime} - {selectedSlot?.endTime}</p>
                  </div>
                </div>
                <div className="p-4 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-rose-600" />
                  <div>
                    <p className="text-sm text-gray-500">Süre</p>
                    <p className="font-semibold text-gray-900">{selectedService?.duration} dakika</p>
                  </div>
                </div>
              </div>

              {/* Coupon section */}
              <div className="card p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-rose-600" />
                  <span className="text-sm font-medium text-gray-700">Kupon Kodu</span>
                </div>
                {couponApplied ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div>
                      <p className="text-sm font-semibold text-emerald-700">
                        ✓ {couponApplied.campaign?.code} uygulandı
                      </p>
                      <p className="text-xs text-emerald-600">
                        İndirim: {formatPrice(couponApplied.discount)}
                      </p>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100"
                      title="Kuponu kaldır"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input flex-1 uppercase"
                        placeholder="ÖRN: BAHAR20"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={!couponInput.trim() || couponChecking}
                        className="btn btn-outline btn-sm"
                      >
                        {couponChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Uygula"}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-600 mt-2">{couponError}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="card p-5 mb-6 bg-gray-50">
                {couponApplied && (
                  <>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                      <span>Hizmet</span>
                      <span>{formatPrice(selectedService?.price)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-emerald-600 mb-2">
                      <span>İndirim ({couponApplied.campaign?.code})</span>
                      <span>−{formatPrice(couponApplied.discount)}</span>
                    </div>
                    <div className="border-t border-gray-200 my-2" />
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Toplam</span>
                  <span className="text-2xl font-bold text-rose-600">
                    {formatPrice(couponApplied ? couponApplied.finalAmount : selectedService?.price)}
                  </span>
                </div>
              </div>

              {!bookingResult?.payment?.token ? (
                <button
                  onClick={handleBook}
                  disabled={booking}
                  className="w-full btn btn-primary btn-lg btn-shine"
                >
                  {booking ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Güvenli Ödeme ile Onayla (PayTR)
                    </>
                  )}
                </button>
              ) : (
                <div className="mt-8 border border-gray-200 rounded-2xl overflow-hidden bg-white">
                  <iframe 
                    src={`https://www.paytr.com/odeme/guvenli/${bookingResult.payment.token}`} 
                    id="paytriframe" 
                    frameBorder="0" 
                    scrolling="no" 
                    style={{ width: '100%', height: '600px', display: 'block' }}
                  />
                  {typeof window !== 'undefined' && <script src="https://www.paytr.com/js/iframeResizer.min.js"></script>}
                  {typeof window !== 'undefined' && <script>iFrameResize({"{} "}, '#paytriframe');</script>}
                </div>
              )}

              {!isAuthenticated && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  Ödeme için{" "}
                  <Link href={`/${storeSlug}/login`} className="text-rose-600 font-semibold">giriş yapmanız</Link>{" "}
                  gerekmektedir.
                </p>
              )}
            </motion.div>
          )}

          {/* STEP 4: Success */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-emerald-100 mx-auto flex items-center justify-center mb-6">
                <Check className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Randevunuz Onaylandı! 🎉
              </h2>
              <p className="text-gray-600 mb-8">Ödemeniz başarıyla alındı ve randevu detaylarınız kaydedildi.</p>

              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
                <Link href={`/${storeSlug}`} className="btn btn-outline">Mağazaya Dön</Link>
                <Link href={`/${storeSlug}/booking`} className="btn btn-primary" onClick={() => { setStep(0); setSelectedService(null); setSelectedEmployee(null); setSelectedDate(""); setSelectedSlot(null); setBookingResult(null); }}>
                  Yeni Randevu
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
