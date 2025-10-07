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
  telegramUserId?: string;
  telegramUsername?: string;
  role: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
  email?: string;
  openingHours?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL';
  category?: string;
  rating?: number;
  ownerId: number;
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
  token: string;
  refreshToken: string;
  user: User;
}

export interface TelegramAuthRequest {
  initData: string;
}

// API client class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    // Try to get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
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
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async authenticateWithTelegram(initData: string): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    });
    
    this.setToken(response.token);
    return response;
  }

  async getCurrentUser(): Promise<User> {
    return this.makeRequest<User>('/auth/me');
  }

  // Store methods
  async getActiveStores(): Promise<Store[]> {
    return this.makeRequest<Store[]>('/stores/active');
  }

  async getStoreById(id: number): Promise<Store> {
    return this.makeRequest<Store>(`/stores/${id}`);
  }

  // Product methods
  async getAllProducts(page = 0, size = 20): Promise<PaginationResponse<Product>> {
    return this.makeRequest<PaginationResponse<Product>>(`/products?page=${page}&size=${size}`);
  }

  async getProductsByStore(storeId: number, page = 0, size = 20): Promise<PaginationResponse<Product>> {
    return this.makeRequest<PaginationResponse<Product>>(`/products/store/${storeId}?page=${page}&size=${size}`);
  }

  async getProductById(id: number): Promise<Product> {
    return this.makeRequest<Product>(`/products/${id}`);
  }

  async getFeaturedProducts(page = 0, size = 20): Promise<PaginationResponse<Product>> {
    return this.makeRequest<PaginationResponse<Product>>(`/products/featured?page=${page}&size=${size}`);
  }

  // Order methods
  async getMyOrders(): Promise<Order[]> {
    return this.makeRequest<Order[]>('/orders/my-orders');
  }

  async getOrderById(id: number): Promise<Order> {
    return this.makeRequest<Order>(`/orders/${id}`);
  }

  async createOrder(orderData: {
    storeId: number;
    orderItems: Array<{
      productId: number;
      quantity: number;
    }>;
    notes?: string;
    reservationDateTime?: string;
  }): Promise<Order> {
    return this.makeRequest<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
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