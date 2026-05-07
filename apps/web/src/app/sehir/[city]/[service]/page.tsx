import { Metadata } from "next";
import Link from "next/link";
import { MapPin, Star, ArrowRight, Calendar } from "lucide-react";

// SEO Landing Pages for city + service combinations
// e.g., /istanbul/kuafor, /ankara/lazer-epilasyon

const serviceNames: Record<string, string> = {
  "kuafor": "Kuaför",
  "guzellik-merkezi": "Güzellik Merkezi",
  "lazer-epilasyon": "Lazer Epilasyon",
  "cilt-bakimi": "Cilt Bakımı",
  "sac-bakimi": "Saç Bakımı",
  "tirnak-bakimi": "Tırnak Bakımı",
  "makyaj": "Makyaj",
  "masaj": "Masaj",
  "epilasyon": "Epilasyon",
  "kaş-kirpik": "Kaş & Kirpik",
};

const cityNames: Record<string, string> = {
  "istanbul": "İstanbul",
  "ankara": "Ankara",
  "izmir": "İzmir",
  "kirikkale": "Kırıkkale",
  "bursa": "Bursa",
  "antalya": "Antalya",
  "konya": "Konya",
  "adana": "Adana",
  "gaziantep": "Gaziantep",
  "kayseri": "Kayseri",
};

type Props = {
  params: Promise<{ city: string; service: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, service } = await params;
  const cityName = cityNames[city] || city;
  const serviceName = serviceNames[service] || service;

  return {
    title: `${cityName} ${serviceName} | Online Randevu Al - ZMK Beauty`,
    description: `${cityName} bölgesindeki en iyi ${serviceName.toLowerCase()} salonlarını keşfedin. Online randevu alın, fiyatları karşılaştırın. 7/24 randevu imkanı.`,
    openGraph: {
      title: `${cityName} ${serviceName} Salonları`,
      description: `${cityName}'daki ${serviceName.toLowerCase()} salonlarında online randevu alın.`,
    },
  };
}

export default async function CityServicePage({ params }: Props) {
  const { city, service } = await params;
  const cityName = cityNames[city] || city;
  const serviceName = serviceNames[service] || service;

  // JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${cityName} ${serviceName} Salonları`,
    description: `${cityName} bölgesindeki ${serviceName.toLowerCase()} salonları`,
    url: `https://zmkbeauty.com/${city}/${service}`,
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div className="bg-gradient-to-b from-rose-50 to-white pt-16 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <nav className="text-sm text-gray-500 mb-4">
            <Link href="/kesfet" className="hover:text-rose-600">Keşfet</Link>
            <span className="mx-2">/</span>
            <Link href={`/${city}`} className="hover:text-rose-600">{cityName}</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{serviceName}</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3" style={{ fontFamily: "var(--font-display)" }}>
            {cityName} {serviceName} Salonları
          </h1>
          <p className="text-lg text-gray-600">
            {cityName} bölgesindeki en iyi {serviceName.toLowerCase()} salonlarını keşfedin.
            Online randevu alın, fiyatları karşılaştırın.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-rose-50 rounded-2xl p-8 text-center mb-12">
          <Calendar className="w-12 h-12 mx-auto text-rose-600 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {cityName}'da {serviceName} Randevusu Almak Çok Kolay
          </h2>
          <p className="text-gray-600 mb-6">
            ZMK Beauty ile 7/24 online randevu alabilir, fiyatları karşılaştırabilir
            ve en uygun salonu seçebilirsiniz.
          </p>
          <Link href="/kesfet" className="btn btn-primary inline-flex items-center gap-2">
            Salonları Gör <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* SEO Content */}
        <div className="prose prose-gray max-w-none">
          <h2>{cityName} {serviceName} Hizmetleri Hakkında</h2>
          <p>
            {cityName} bölgesinde kaliteli {serviceName.toLowerCase()} hizmeti veren onlarca salon bulunmaktadır.
            ZMK Beauty platformu üzerinden bu salonların hizmetlerini, fiyatlarını ve müşteri
            yorumlarını karşılaştırarak size en uygun salonu seçebilirsiniz.
          </p>

          <h3>Neden Online Randevu?</h3>
          <ul>
            <li>7/24 randevu alma imkanı - bekleme yok</li>
            <li>Fiyat karşılaştırma - en uygun seçenek</li>
            <li>Müşteri yorumları - güvenilir tercih</li>
            <li>Online ödeme - güvenli ve kolay</li>
            <li>Hatırlatma bildirimleri - randevunuzu kaçırmayın</li>
          </ul>

          <h3>{cityName}'da Popüler {serviceName} Hizmetleri</h3>
          <p>
            {cityName} bölgesindeki {serviceName.toLowerCase()} salonları geniş bir hizmet yelpazesi sunmaktadır.
            Saç kesimi, boya, bakım, fön gibi temel hizmetlerin yanı sıra profesyonel
            uygulamalar da mevcuttur.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link href="/kesfet" className="btn btn-primary btn-lg inline-flex items-center gap-2">
            <MapPin className="w-5 h-5" /> {cityName} Salonlarını Keşfet
          </Link>
        </div>
      </div>
    </div>
  );
}
