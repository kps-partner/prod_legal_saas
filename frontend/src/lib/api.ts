const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export interface RegisterRequest {
  firm_name: string;
  user_name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  firm_id: string;
  role: string;
  is_active: boolean;
  subscription_status: string;
  subscription_ends_at?: number | null;
}

export interface ApiError {
  detail: string;
}

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async register(data: RegisterRequest): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const formData = new URLSearchParams();
    formData.append('username', data.username);
    formData.append('password', data.password);

    const response = await fetch(`${API_BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to get user info');
    }

    return response.json();
  }

  async createCheckoutSession(priceId: string): Promise<{ url: string }> {
    const response = await fetch(`${API_BASE_URL}/billing/create-checkout-session`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ price_id: priceId }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to create checkout session');
    }

    return response.json();
  }

  async createCustomerPortalSession(): Promise<{ url: string }> {
    const response = await fetch(`${API_BASE_URL}/billing/create-customer-portal-session`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to create customer portal session');
    }

    return response.json();
  }

  async cancelSubscription(): Promise<{ message: string; subscription_id: string; current_period_end: number; cancel_at_period_end: boolean }> {
    const response = await fetch(`${API_BASE_URL}/billing/cancel-subscription`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to cancel subscription');
    }

    return response.json();
  }

  // Google Calendar Integration endpoints
  async getGoogleAuthUrl(): Promise<{ auth_url: string }> {
    const response = await fetch(`${API_BASE_URL}/integrations/google/authorize`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to get Google auth URL');
    }

    return response.json();
  }

  async getGoogleCalendars(): Promise<{ calendars: Array<{ id: string; summary: string; primary?: boolean }> }> {
    const response = await fetch(`${API_BASE_URL}/integrations/google/calendars`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to get Google calendars');
    }

    return response.json();
  }

  async selectGoogleCalendar(calendarId: string, calendarName: string): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/integrations/google/calendars/select`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        calendar_id: calendarId,
        calendar_name: calendarName,
      }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to select calendar');
    }

    return response.json();
  }

  async getGoogleCalendarStatus(): Promise<{
    connected: boolean;
    calendar_id?: string;
    calendar_name?: string;
    connected_at?: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/integrations/google/status`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to get calendar status');
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();