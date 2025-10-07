"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Clock, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTelegram } from "../../../hooks/useTelegram";
import { apiClient, Product } from "../../../lib/api";

export default function ProductDetailsPage() {
  const params = useParams();
  const productId = params.id as string;
  const { getTelegramUser } = useTelegram(); // Initialize Telegram singleton
  
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isReserving, setIsReserving] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;

      try {
        const productData = await apiClient.getProductById(Number(productId));
        setProduct(productData);
      } catch (error) {
        console.error('Failed to load product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const handleReserve = async () => {
    if (!product || isReserving) return;

    setIsReserving(true);
    try {
      // Use default phone number for now (could be made configurable later)
      const contactPhone = "+77777777777";
      
      const orderData = {
        storeId: product.storeId,
        orderItems: [{
          productId: product.id,
          quantity: quantity
        }],
        notes: `Забронировано через приложение. Количество: ${quantity}`,
        contactPhone: contactPhone
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('Sending order data:', orderData);
      }

      const order = await apiClient.createOrder(orderData);
      
      // Show success message or redirect
      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        console.log(`Заказ успешно создан! Номер заказа: ${order.id}`);
      }
      
      // Redirect to orders page
      window.location.href = '/orders';
    } catch (error) {
      console.error('Failed to create order:', error);
      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        console.error('Ошибка при создании заказа. Попробуйте снова.');
      }
    } finally {
      setIsReserving(false);
    }
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} ₸`;
  };

  const calculateTotalPrice = () => {
    if (!product) return 0;
    const price = product.discountedPrice || product.originalPrice;
    return price * quantity;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pb-24" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div className="px-4 pt-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-48 bg-gray-200 rounded-2xl mb-4"></div>
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white pb-24 flex items-center justify-center" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <p className="text-black/50 font-inter">Продукт не найден</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Link href="/boxes" className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-black font-inter">Детали продукта</h1>
        </div>
      </div>

      {/* Store Info */}
      <div className="px-4 mt-6">
        <h2 className="text-xl font-semibold text-black font-inter">{product.storeName}</h2>
        <div className="flex items-center gap-3 mt-2 text-sm font-medium text-black/60 font-inter">
          <span>{product.stockQuantity} шт.</span>
          <span>•</span>
          <span>В наличии</span>
        </div>
      </div>

      {/* Product Image */}
      <div className="px-4 mt-6">
        <div className="bg-gray-100 rounded-2xl h-64 overflow-hidden">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#73be61] flex items-center justify-center">
              <span className="text-white text-4xl">🍽️</span>
            </div>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="px-4 mt-6">
        <h3 className="text-2xl font-bold text-black font-inter">{product.name}</h3>
        {product.description && (
          <p className="text-base text-black/60 mt-3 font-inter leading-relaxed">
            {product.description}
          </p>
        )}
        
        {/* Category */}
        {product.categoryName && (
          <div className="mt-4">
            <span className="bg-gray-100 text-black/60 px-3 py-1 rounded-lg text-sm font-inter">
              {product.categoryName}
            </span>
          </div>
        )}
      </div>

      {/* Price Section */}
      <div className="px-4 mt-6">
        <div className="bg-[#73be61] rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              {product.discountPercentage && product.discountPercentage > 0 && (
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white rounded-xl px-3 py-1">
                    <span className="text-[#73be61] text-sm font-bold font-inter">
                      -{product.discountPercentage}%
                    </span>
                  </div>
                  <p className="text-base font-medium text-white/70 line-through font-inter">
                    {formatPrice(product.originalPrice)}
                  </p>
                </div>
              )}
              <p className="text-3xl font-bold text-white font-inter">
                {formatPrice(product.discountedPrice || product.originalPrice)}
              </p>
            </div>
          </div>
          
          {/* Total for quantity */}
          {quantity > 1 && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-white/80 text-sm font-inter">
                Итого за {quantity} шт: {formatPrice(calculateTotalPrice())}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stock Warning */}
      {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
        <div className="px-4 mt-4">
          <div className="bg-orange-100 border border-orange-200 rounded-xl p-3">
            <p className="text-orange-800 text-sm font-inter">
              ⚠️ Осталось всего {product.stockQuantity} шт.
            </p>
          </div>
        </div>
      )}

      {/* Out of Stock */}
      {product.stockQuantity <= 0 && (
        <div className="px-4 mt-4">
          <div className="bg-red-100 border border-red-200 rounded-xl p-3">
            <p className="text-red-800 text-sm font-inter">
              ❌ Товара нет в наличии
            </p>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 bg-white border-t border-gray-100 safe-area-inset-bottom">
        <div className="flex gap-3 pt-4">
          {/* Quantity Selector */}
          <div className="bg-gray-100 rounded-xl flex items-center justify-between px-1 h-12 min-w-32">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 flex items-center justify-center text-black hover:bg-gray-200 rounded-lg transition-colors"
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-xl font-semibold text-black mx-2 font-inter min-w-8 text-center">
              {quantity}
            </span>
            <button 
              onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
              className="w-10 h-10 flex items-center justify-center text-black hover:bg-gray-200 rounded-lg transition-colors"
              disabled={quantity >= product.stockQuantity}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {/* Reserve Button */}
          <button 
            onClick={handleReserve}
            disabled={product.stockQuantity <= 0 || isReserving}
            className="flex-1 bg-[#73be61] rounded-xl h-12 flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#68a556] transition-colors"
          >
            <span className="text-lg font-medium text-white font-inter">
              {isReserving ? 'Бронирование...' : 'Забронировать'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}