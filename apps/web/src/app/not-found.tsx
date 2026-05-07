import Link from "next/link";
import { Search, Home, Calendar } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-2xl bg-white shadow-lg mx-auto flex items-center justify-center mb-6">
          <Search className="w-10 h-10 text-rose-600" />
        </div>
        <p className="text-sm font-semibold text-rose-600 tracking-wider uppercase mb-2">404</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3" style={{ fontFamily: "var(--font-display)" }}>
          Sayfa Bulunamadı
        </h1>
        <p className="text-gray-500 mb-8">
          Aradığınız sayfa taşınmış veya hiç var olmamış olabilir. Mağaza URL&apos;inizi kontrol edin
          ya da ana sayfaya dönün.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn btn-primary">
            <Home className="w-4 h-4" /> Ana Sayfa
          </Link>
          <Link href="/login" className="btn btn-outline">
            <Calendar className="w-4 h-4" /> Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  );
}
