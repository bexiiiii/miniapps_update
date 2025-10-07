// API client configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginationResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Entity types based on backend DTOs
export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  telegramUserId?: string | number;
  telegramUsername?: string;
  telegramPhotoUrl?: string;
  telegramLanguageCode?: string;
  telegramRegisteredAt?: string;
  telegramUser?: boolean;
  role: string;
  phoneNumber?: string;
  phone?: string;
  isEmailVerified?: boolean;
  isActive?: boolean;
  active?: boolean;
  address?: string;
  password?: string;
  profilePicture?: string;
  registrationSource?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: number;
  name: string;
  description?: string;
  logo?: string;
  logoUrl?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  phoneNumber?: string;
  email?: string;
  openingHours?: string;
  closingHours?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL';
  category?: string;
  rating?: number;
  ownerId: number;
  managerId?: number;
  managerName?: string;
  ownerName?: string;
  productCount?: number;
  active?: boolean;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  originalPrice: number;
  discountedPrice?: number;
  discountPercentage?: number;
  stockQuantity: number;
  expirationDate?: string;
  storeId: number;
  storeName?: string;
  categoryId?: number;
  categoryName?: string;
  status: 'AVAILABLE' | 'OUT_OF_STOCK' | 'EXPIRED' | 'INACTIVE';
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  userId: number;
  storeId: number;
  storeName?: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  orderItems: OrderItem[];
  reservationDateTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

// Authentication types
export interface AuthResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user: User;
}

export interface TelegramAuthRequest {
  initData: string;
}

// API client class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private activeRequests = new Map<string, Promise<any>>(); // Cache for preventing duplicate requests

  constructor() {
    this.baseURL = API_BASE_URL;
    // Load token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
      if (process.env.NODE_ENV === 'development') {
        console.log('Token saved:', token.substring(0, 20) + '...');
      }
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Create a unique key for this request
    const requestKey = `${options.method || 'GET'}:${endpoint}:${JSON.stringify(options.body || '')}`;
    
    // If the same request is already in progress, return the existing promise
    if (this.activeRequests.has(requestKey)) {
      return this.activeRequests.get(requestKey);
    }

    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      if (process.env.NODE_ENV === 'development') {
        console.log('Making request with token:', this.token.substring(0, 20) + '...');
      }
    } else if (process.env.NODE_ENV === 'development') {
      console.log('Making request without token');
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const requestPromise = (async () => {
      try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
          // Handle 401 Unauthorized - clear tokens
          if (response.status === 401) {
            console.warn('Authentication failed - clearing tokens');
            this.clearToken();
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      } finally {
        // Remove from active requests when done
        this.activeRequests.delete(requestKey);
      }
    })();

    // Store the promise to prevent duplicate requests
    this.activeRequests.set(requestKey, requestPromise);
    
    return requestPromise;
  }

  // Helper method for public requests (no auth required)
  private async makePublicRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Public API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async authenticateWithTelegram(initData: string): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    });
    
    // Server returns 'accessToken', not 'token'
    const token = response.accessToken || response.token;
    if (token) {
      this.setToken(token);
    }
    return response;
  }

  async getCurrentUser(): Promise<User> {
    return this.makeRequest<User>('/auth/me');
  }

  // Store methods
  async getActiveStores(): Promise<Store[]> {
    return this.makePublicRequest<Store[]>('/stores/active');
  }

  async getStoreById(id: number): Promise<Store> {
    return this.makePublicRequest<Store>(`/stores/${id}`);
  }

  // Product methods
  async getAllProducts(page = 0, size = 20): Promise<PaginationResponse<Product>> {
    return this.makePublicRequest<PaginationResponse<Product>>(`/products?page=${page}&size=${size}`);
  }

  async getProductsByStore(storeId: number, page = 0, size = 20): Promise<PaginationResponse<Product>> {
    return this.makePublicRequest<PaginationResponse<Product>>(`/products/store/${storeId}?page=${page}&size=${size}`);
  }

  async getProductById(id: number): Promise<Product> {
    return this.makePublicRequest<Product>(`/products/${id}`);
  }

  async getFeaturedProducts(page = 0, size = 20): Promise<PaginationResponse<Product>> {
    return this.makePublicRequest<PaginationResponse<Product>>(`/products/featured?page=${page}&size=${size}`);
  }

  // Order methods
  async getMyOrders(): Promise<Order[]> {
    return this.makeRequest<Order[]>('/orders/my-orders');
  }

  async getOrderById(id: number): Promise<Order> {
    return this.makeRequest<Order>(`/orders/${id}`);
  }

  // Mini App specific method for creating reservations
  async createReservation(orderData: {
    productId: number;
    quantity: number;
    note?: string;
  }): Promise<Order> {
    const reservationData = {
      productId: orderData.productId,
      quantity: orderData.quantity,
      note: orderData.note || 'Забронировано через мини-приложение Telegram'
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating reservation with data:', reservationData);
    }
    
    return this.makeRequest<Order>('/miniapp/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData),
    });
  }

  // Legacy method - keep for compatibility but use createReservation instead
  async createOrder(orderData: {
    storeId: number;
    orderItems: Array<{
      productId: number;
      quantity: number;
    }>;
    notes?: string;
    reservationDateTime?: string;
    contactPhone?: string;
  }): Promise<Order> {
    // For mini app, use the first product for reservation
    if (orderData.orderItems && orderData.orderItems.length > 0) {
      const firstItem = orderData.orderItems[0];
      return this.createReservation({
        productId: firstItem.productId,
        quantity: firstItem.quantity,
        note: orderData.notes || 'Забронировано через мини-приложение Telegram'
      });
    }
    
    throw new Error('No items to order');
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Helper hooks and functions for React components
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};