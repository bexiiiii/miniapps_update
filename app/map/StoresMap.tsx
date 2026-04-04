'use client';

import { useEffect, useState } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import { apiClient, Store } from '../../lib/api';
import { useRef } from 'react';
import type { GeolocateControlRef } from 'react-map-gl/maplibre';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

export default function StoresMap() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewState, setViewState] = useState({
    longitude: 71.4460,
    latitude: 51.1801,
    zoom: 11,
  });
  const geolocateRef = useRef<GeolocateControlRef>(null);

  useEffect(() => {
    apiClient.getActiveStores()
      .then((data) => setStores(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));

    requestUserLocation();
  }, []);

  const requestUserLocation = () => {
    const tg = (window as any).Telegram?.WebApp;
    const lm = tg?.LocationManager;

    // Telegram LocationManager (Bot API 8.0+, работает на iOS/Android)
    if (lm) {
      lm.init(() => {
        lm.getLocation((loc: any) => {
          if (loc) {
            setViewState({ longitude: loc.longitude, latitude: loc.latitude, zoom: 13 });
          } else {
            // LocationManager есть но отказал — пробуем browser API
            fallbackGeolocation();
          }
        });
      });
    } else {
      // Старые клиенты — browser geolocation API
      fallbackGeolocation();
    }
  };

  const fallbackGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setViewState({
            longitude: pos.coords.longitude,
            latitude: pos.coords.latitude,
            zoom: 13,
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const storesWithCoords = stores.filter((s) => s.latitude && s.longitude);

  return (
    <div className="h-screen w-full relative" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Map */}
      <Map
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        onClick={() => setSelectedStore(null)}
        onLoad={() => {
          setTimeout(() => geolocateRef.current?.trigger(), 500);
        }}
      >
        <GeolocateControl
          ref={geolocateRef}
          position="top-right"
          style={{ marginTop: '80px', marginRight: '12px' }}
          trackUserLocation
          showUserHeading
          showAccuracyCircle
          onGeolocate={(e) => {
            setViewState((v) => ({
              ...v,
              longitude: e.coords.longitude,
              latitude: e.coords.latitude,
              zoom: 13,
            }));
          }}
        />
        <NavigationControl position="top-right" style={{ marginTop: '120px', marginRight: '12px' }} />

        {storesWithCoords.map((store) => (
          <Marker
            key={store.id}
            longitude={store.longitude!}
            latitude={store.latitude!}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedStore(store);
            }}
          >
            <div className="cursor-pointer flex flex-col items-center">
              <div className="w-10 h-10 bg-[#73be61] rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                {store.logo ? (
                  <img src={store.logo} alt={store.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-white text-xs font-bold font-inter">
                    {store.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#73be61]" />
            </div>
          </Marker>
        ))}

        {selectedStore && (
          <Popup
            longitude={selectedStore.longitude!}
            latitude={selectedStore.latitude!}
            anchor="top"
            onClose={() => setSelectedStore(null)}
            closeButton={false}
            offset={20}
          >
            <div className="p-3 min-w-[200px] max-w-[240px]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-[#73be61] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {selectedStore.logo ? (
                    <img src={selectedStore.logo} alt={selectedStore.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-white text-xs font-bold">{selectedStore.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <h3 className="font-bold text-black text-sm leading-tight">{selectedStore.name}</h3>
              </div>
              {selectedStore.address && (
                <p className="text-xs text-black/60 mb-1">{selectedStore.address}</p>
              )}
              {selectedStore.openingHours && (
                <div className="flex items-center gap-1 text-xs text-black/50 mb-3">
                  <Clock className="w-3 h-3" />
                  <span>{selectedStore.openingHours}{selectedStore.closingHours ? ` — ${selectedStore.closingHours}` : ''}</span>
                </div>
              )}
              <Link
                href={`/boxes?storeId=${selectedStore.id}`}
                className="block w-full bg-[#73be61] text-white text-center text-xs py-2 rounded-xl font-semibold font-inter"
              >
                Смотреть боксы
              </Link>
            </div>
          </Popup>
        )}
      </Map>

      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 px-4 pt-4 pb-2 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <Link href="/" className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all duration-300">
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </Link>
          <div className="bg-white rounded-xl px-4 py-2.5 shadow-md flex-1">
            <p className="text-sm font-bold text-black font-inter">Заведения на карте</p>
            {!isLoading && (
              <p className="text-xs text-black/50 font-inter">
                {storesWithCoords.length} из {stores.length} заведений на карте
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 bg-gray-100 rounded-t-3xl px-4 py-3 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          <Link href="/" className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </Link>

          <Link href="/markets" className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </Link>

          <Link href="/map" className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-[#73be61] rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </Link>

          <Link href="/orders" className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </Link>

          <Link href="/profile" className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </Link>
        </div>
      </nav>
    </div>
  );
}
