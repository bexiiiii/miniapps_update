"use client";

import { useEffect, useState } from "react";
import { Bell, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "../hooks/useTranslation";
import { useAuth } from "../hooks/useAuth";
import { useTelegram } from "../hooks/useTelegram";
import { apiClient, Product, Order, Store } from "../lib/api";

export default function HomePage() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading, login } = useAuth();
  const { getTelegramUser, getTelegramInitData } = useTelegram();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");

  const banners = [
    { id: 1, title: t("foodWithDiscount"), subtitle: t("upTo80"), color: "#de8a08" },
    { id: 2, title: t("freeDelivery"), subtitle: t("from2000"), color: "#73be61" },
    { id: 3, title: t("newRestaurants"), subtitle: t("everyDay"), color: "#ff6b6b" },
  ];

  const nearbyBoxes = [
    {
      id: 1,
      name: t("donerNaAbaya"),
      meals: `15 ${t("meals")}`,
      location: t("kabanbayBatyra"),
    },
    {
      id: 2,
      name: t("burgerFastFood"),
      meals: `23 ${t("meals")}`,
      location: t("satpayeva"),
    },
    {
      id: 3,
      name: t("pizzaHouse"),
      meals: `18 ${t("meals")}`,
      location: t("abaya150"),
    },
    {
      id: 4,
      name: t("shaurmaExpress"),
      meals: `12 ${t("meals")}`,
      location: t("rozybakyeva"),
    },
    {
      id: 5,
      name: t("coffeeAndMore"),
      meals: `8 ${t("meals")}`,
      location: t("nazarbayeva"),
    },
  ];

  useEffect(() => {
    let isMounted = true;
    let initializationStarted = false;

    const initializeApp = async () => {
      if (initializationStarted) return; // Prevent multiple simultaneous initializations
      initializationStarted = true;

      // Get user name from Telegram
      const telegramUser = getTelegramUser();
      if (telegramUser && isMounted) {
        const fullName = `${telegramUser.first_name || ''} ${telegramUser.last_name || ''}`.trim();
        setUserName(fullName || telegramUser.username || 'Пользователь');
      }

      // Authenticate user with Telegram
      const initData = getTelegramInitData();
      if (initData && !authLoading && isMounted) {
        try {
          await login(initData);
        } catch (error) {
          console.error('Telegram authentication failed:', error);
        }
      }

      // Load public data (no authentication required)
      if (isMounted) {
        try {
          const productsResponse = await apiClient.getFeaturedProducts(0, 5);
          if (isMounted) {
            setFeaturedProducts(productsResponse.content);
          }
        } catch (error) {
          console.error('Failed to load featured products:', error);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }
    };

    if (!authLoading) {
      initializeApp();
    }

    return () => {
      isMounted = false; // Cleanup to prevent state updates after unmount
    };
  }, [authLoading, getTelegramUser, getTelegramInitData, login]); // Include stable dependencies

  // Separate effect for banner auto-scroll
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [banners.length]); // Separate banner effect

  // Separate effect for loading user-specific data
  useEffect(() => {
    let isMounted = true;
    let loadingStarted = false;

    const loadUserData = async () => {
      if (!user || authLoading || loadingStarted) return;
      loadingStarted = true;

      if (process.env.NODE_ENV === 'development') {
        console.log('Loading user data for user:', user);
      }
      try {
        const orders = await apiClient.getMyOrders();
        if (process.env.NODE_ENV === 'development') {
          console.log('Orders loaded:', orders);
        }
        if (orders.length > 0 && isMounted) {
          setLatestOrder(orders[0]); // Most recent order
        }
      } catch (error) {
        console.error('Failed to load user orders:', error);
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  return (
    <div className="min-h-screen bg-white pb-20" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div className="px-4 pt-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-black/50 font-medium font-inter">{t("welcome")}</p>
            <h1 className="text-lg font-bold text-black mt-1 font-inter">
              {userName || user?.firstName || user?.telegramUsername || t("userName")}
            </h1>
          </div>
          <Link href="/notifications" className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Discount Banner - Carousel */}
      <div className="px-4 mt-6">
        <div className="relative overflow-hidden rounded-2xl h-[100px]">
          <div 
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentBanner * 100}%)` }}
          >
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="min-w-full h-full rounded-2xl p-5 relative overflow-hidden flex-shrink-0"
                style={{ backgroundColor: banner.color }}
              >
                <h2 className="text-white text-xl font-semibold leading-tight font-inter">
                  {banner.title}<br />{banner.subtitle}
                </h2>
                <button className="absolute top-4 right-4">
                  <ArrowUpRight className="w-5 h-5 text-white" />
                </button>
              </div>
            ))}
          </div>
          
          {/* Carousel Indicators */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBanner(index)}
                className={`h-1 rounded-full transition-all ${
                  index === currentBanner 
                    ? 'w-4 bg-white' 
                    : 'w-1 bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* My Orders */}
      <div className="px-4 mt-8">
        <div className="bg-gray-100 rounded-2xl p-5 relative">
          <p className="text-black/50 text-base font-medium font-inter">{t("myOrders")}</p>
          
          {isLoading ? (
            <div className="mt-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded mt-2 w-1/2 animate-pulse"></div>
            </div>
          ) : latestOrder ? (
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-black font-inter">
                  {latestOrder.storeName}
                </h3>
                <div className="bg-[#73be61] rounded-2xl px-4 py-1">
                  <span className="text-white text-sm font-medium font-inter">
                    {latestOrder.status === 'CONFIRMED' ? t("reserved") : latestOrder.status}
                  </span>
                </div>
              </div>
              <p className="text-sm text-black/60 font-inter mt-1">
                {new Date(latestOrder.createdAt).toLocaleDateString()} • {latestOrder.totalAmount}₸
              </p>
            </div>
          ) : (
            <div className="mt-2">
              <h3 className="text-lg text-black/60 font-inter">{t("noOrders")}</h3>
              <p className="text-sm text-black/40 font-inter mt-1">{t("makeFirstOrder")}</p>
            </div>
          )}
          
          <Link href="/orders" className="absolute bottom-4 right-5 text-xs text-black/50 font-inter">
            {t("allOrders")}
          </Link>
        </div>
      </div>

      {/* Nearby boxes */}
            {/* Nearby boxes */}
      <div className="px-4 mt-20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-black font-inter">{t("nearbyBoxes")}</h3>
          <Link href="/markets" className="text-base font-semibold text-[#73be61] font-inter">
            {t("seeAll")}
          </Link>
        </div>
        
        <div className="overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex gap-4">
            {featuredProducts.map((product) => (
              <Link key={product.id} href={`/details/${product.id}`} className="flex-shrink-0 w-[250px]">
                <div className="bg-gray-100 rounded-2xl p-4">
                  <h4 className="text-lg font-medium text-black font-inter">{product.name}</h4>
                  <div className="flex items-center gap-4 mt-2 text-sm font-semibold text-black/60 font-inter">
                    <span>{product.stockQuantity} {t("meals")}</span>
                    <span>{product.storeName}</span>
                  </div>
                  <div className="bg-[#73be61] rounded-2xl h-32 mt-4 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <div className="text-white text-sm font-inter">Фото</div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            {featuredProducts.length === 0 && !isLoading && (
              <div className="flex-shrink-0 w-[250px]">
                <div className="bg-gray-100 rounded-2xl p-4">
                  <h4 className="text-lg font-medium text-black font-inter">{t("donerNaAbaya")}</h4>
                  <div className="flex items-center gap-4 mt-2 text-sm font-semibold text-black/60 font-inter">
                    <span>15 {t("meals")}</span>
                    <span>{t("kabanbayBatyra")}</span>
                  </div>
                  <div className="bg-[#73be61] rounded-2xl h-32 mt-4"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-100 rounded-t-3xl px-4 py-3 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          <Link href="/" className="flex flex-col items-center gap-1 group">
            <div className="w-12 h-12 bg-[#73be61] rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-active:scale-95">
              <svg className="w-6 h-6 text-white transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </Link>
          
          <Link href="/markets" className="flex flex-col items-center gap-1 group">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-active:scale-95 group-hover:bg-gray-50">
              <svg className="w-6 h-6 text-black transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </Link>
          
          <Link href="/orders" className="flex flex-col items-center gap-1 group">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-active:scale-95 group-hover:bg-gray-50">
              <svg className="w-6 h-6 text-black transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </Link>
          
          <Link href="/profile" className="flex flex-col items-center gap-1 group">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-active:scale-95 group-hover:bg-gray-50">
              <svg className="w-6 h-6 text-black transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </Link>
        </div>
      </nav>
    </div>
  );
}