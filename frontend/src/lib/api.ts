const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Utility function to detect client timezone
export const getClientTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Failed to detect client timezone, falling back to UTC');
    return 'UTC';
  }
};

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
  status: string;
  subscription_status: string;
  subscription_ends_at?: number | null;
  last_password_change?: string | null;
  password_expires_at?: string | null;
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
    has_gmail_permissions?: boolean;
    required_scopes?: string[];
    needs_reauth?: boolean;
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

  // Case Types Settings endpoints
  async getCaseTypes(): Promise<CaseType[]> {
    const response = await fetch(`${API_BASE_URL}/settings/case-types`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to get case types');
    }

    return response.json();
  }

  async createCaseType(data: CaseTypeCreate): Promise<CaseType> {
    const response = await fetch(`${API_BASE_URL}/settings/case-types`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to create case type');
    }

    return response.json();
  }

  async updateCaseType(id: string, data: CaseTypeUpdate): Promise<CaseType> {
    const response = await fetch(`${API_BASE_URL}/settings/case-types/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to update case type');
    }

    return response.json();
  }

  async deleteCaseType(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/settings/case-types/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to delete case type');
    }

    return response.json();
  }

  // Intake Page Settings endpoints
  async getIntakePageSettings(): Promise<IntakePageSetting> {
    const response = await fetch(`${API_BASE_URL}/settings/intake-page`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to get intake page settings');
    }

    return response.json();
  }

  async updateIntakePageSettings(data: IntakePageSettingUpdate): Promise<IntakePageSetting> {
    const response = await fetch(`${API_BASE_URL}/settings/intake-page`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to update intake page settings');
    }

    return response.json();
  }

  // Public Intake Form endpoints (no authentication required)
  async getPublicIntakePageData(firmId: string): Promise<PublicIntakePageData> {
    const response = await fetch(`${API_BASE_URL}/public/intake/${firmId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to get intake page data');
    }

    return response.json();
  }

  async submitPublicIntakeForm(firmId: string, data: IntakeFormSubmissionData): Promise<IntakeFormSubmissionResponse> {
    const response = await fetch(`${API_BASE_URL}/public/intake/${firmId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        // Handle FastAPI validation errors
        if (error.detail) {
          if (Array.isArray(error.detail)) {
            // Pydantic validation errors
            const validationErrors = error.detail.map((err: any) =>
              `${err.loc?.join(' -> ') || 'Field'}: ${err.msg}`
            ).join(', ');
            throw new Error(`Validation error: ${validationErrors}`);
          } else if (typeof error.detail === 'string') {
            // Simple error message
            throw new Error(error.detail);
          }
        }
        throw new Error('Failed to submit intake form');
      } catch (parseError) {
        // If we can't parse the error response, throw a generic error
        throw new Error('Failed to submit intake form. Please check all fields and try again.');
      }
    }

    return response.json();
  }

  // Public Calendar Booking endpoints (no authentication required)
  async getPublicAvailability(firmId: string): Promise<AvailabilityResponse> {
    const response = await fetch(`${API_BASE_URL}/public/availability/${firmId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to get availability');
    }

    return response.json();
  }

  async createPublicBooking(caseId: string, booking: BookingRequest): Promise<BookingResponse> {
    const response = await fetch(`${API_BASE_URL}/public/booking/${caseId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(booking),
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        if (error.detail) {
          if (Array.isArray(error.detail)) {
            // Pydantic validation errors
            const validationErrors = error.detail.map((err: any) =>
              `${err.loc?.join(' -> ') || 'Field'}: ${err.msg}`
            ).join(', ');
            throw new Error(`Validation error: ${validationErrors}`);
          } else if (typeof error.detail === 'string') {
            // Simple error message
            throw new Error(error.detail);
          }
        }
        throw new Error('Failed to create booking');
      } catch (parseError) {
        throw new Error('Failed to create booking. Please try again.');
      }
    }

    return response.json();
  }

  // Case Detail and Timeline endpoints
  async getCaseById(caseId: string): Promise<CaseDetailResponse> {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to get case details');
    }

    return response.json();
  }

  async getCaseTimeline(caseId: string): Promise<TimelineResponse> {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/timeline`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to get case timeline');
    }

    return response.json();
  }

  async addTimelineNote(caseId: string, content: string): Promise<TimelineEventResponse> {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/timeline`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to add note');
    }

    return response.json();
  }

  // User Management endpoints (Admin only)
  async getUsers(): Promise<UserListResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/settings/users`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to get users');
    }

    return response.json();
  }

  async inviteUser(data: UserInviteRequest): Promise<UserInviteResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/settings/users/invite`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to invite user');
    }

    return response.json();
  }

  async updateUser(userId: string, data: UserUpdateRequest): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/settings/users/${userId}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to update user');
    }

    return response.json();
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/settings/users/${userId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to delete user');
    }

    return response.json();
  }

  async changePassword(data: PasswordChangeRequest): Promise<PasswordChangeResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to change password');
    }

    return response.json();
  }

  // Availability Management endpoints
  async getTimezones(): Promise<TimezonesResponse> {
    const response = await fetch(`${API_BASE_URL}/integrations/timezones`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to get timezones');
    }

    return response.json();
  }

  async getAvailability(): Promise<AvailabilitySettings> {
    const response = await fetch(`${API_BASE_URL}/integrations/availability`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to get availability settings');
    }

    return response.json();
  }

  async updateAvailability(data: AvailabilityUpdateRequest): Promise<AvailabilitySettings> {
    const response = await fetch(`${API_BASE_URL}/integrations/availability`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to update availability settings');
    }

    return response.json();
  }

  async getBlockedDates(): Promise<BlockedDatesResponse> {
    const response = await fetch(`${API_BASE_URL}/integrations/blocked-dates`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to get blocked dates');
    }

    return response.json();
  }

  async createBlockedDate(data: BlockedDateCreateRequest): Promise<BlockedDate> {
    const response = await fetch(`${API_BASE_URL}/integrations/blocked-dates`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to create blocked date');
    }

    return response.json();
  }

  async checkBlockedDateConflicts(data: BlockedDateCreateRequest): Promise<ConflictResponse> {
    const response = await fetch(`${API_BASE_URL}/integrations/blocked-dates/check-conflicts`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to check conflicts');
    }

    return response.json();
  }

  async checkAppointmentConflicts(startDate: string, endDate: string): Promise<ConflictResponse> {
    const response = await fetch(`${API_BASE_URL}/integrations/blocked-dates/check-conflicts`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
      }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to check appointment conflicts');
    }

    return response.json();
  }

  async deleteBlockedDate(blockedDateId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/integrations/blocked-dates/${blockedDateId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to delete blocked date');
    }

    return response.json();
  }
}

// Type definitions for Case Types and Intake Page Settings
export interface CaseType {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CaseTypeCreate {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface CaseTypeUpdate {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface IntakePageSetting {
  id: string;
  welcome_message: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface IntakePageSettingUpdate {
  welcome_message?: string;
  logo_url?: string;
}

// Public Intake Form types
export interface PublicIntakePageData {
  firm_name: string;
  welcome_message: string;
  logo_url?: string;
  case_types: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
}

export interface IntakeFormSubmissionData {
  client_name: string;
  client_email: string;
  client_phone?: string;
  case_type_id: string;
  description: string;
  client_timezone?: string;
}

export interface IntakeFormSubmissionResponse {
  message: string;
  case_id: string;
  status: string;
}

export const apiClient = new ApiClient();
// Calendar Booking types
export interface AvailableTimeSlot {
  start_time: string;
  end_time: string;
  formatted_time: string;
}

export interface AvailabilityResponse {
  available_slots: AvailableTimeSlot[];
  firm_name: string;
}

export interface BookingRequest {
  start_time: string;
  client_name: string;
  client_email: string;
  client_timezone?: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  appointment_id: string;
  meeting_link?: string;
}

// Case Detail and Timeline types
export interface CaseDetailResponse {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  description: string;
  status: 'new_lead' | 'meeting_scheduled' | 'pending_review' | 'engaged' | 'closed' | 'archived';
  priority: 'low' | 'medium' | 'high';
  case_type_id: string;
  firm_id: string;
  created_at: string;
  updated_at: string;
  last_activity: string;
}

export interface TimelineEventResponse {
  id: string;
  case_id: string;
  type: 'note' | 'status_change' | 'case_created';
  content: string;
  created_by: string;
  created_at: string;
  firm_id: string;
}

export interface TimelineResponse {
  events: TimelineEventResponse[];
  total: number;
}

// User Management types
export interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  last_password_change?: string | null;
  created_at: string;
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
}

export interface UserInviteRequest {
  email: string;
  name: string;
  role: string;
}

export interface UserInviteResponse {
  message: string;
  user_id: string;
  temporary_password: string;
}

export interface UserUpdateRequest {
  name?: string;
  role?: string;
  status?: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface PasswordChangeResponse {
  message: string;
}

// Availability Management types
export interface TimeSlot {
  enabled: boolean;
  start_time: string;
  end_time: string;
}

export interface WeeklySchedule {
  monday: TimeSlot;
  tuesday: TimeSlot;
  wednesday: TimeSlot;
  thursday: TimeSlot;
  friday: TimeSlot;
  saturday: TimeSlot;
  sunday: TimeSlot;
}

export interface AvailabilitySettings {
  firm_id: string;
  timezone: string;
  weekly_schedule: WeeklySchedule;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityUpdateRequest {
  timezone: string;
  weekly_schedule: WeeklySchedule;
}

export interface BlockedDate {
  id: string;
  firm_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  created_at: string;
}

export interface BlockedDateCreateRequest {
  start_date: string;
  end_date: string;
  reason?: string;
}

export interface BlockedDatesResponse {
  blocked_dates: BlockedDate[];
  total: number;
}

export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
}

export interface TimezonesResponse {
  timezones: TimezoneOption[];
}

export interface ConflictWarning {
  appointment_id: string;
  title: string;
  client_name: string;
  date: string;
  time: string;
  attendees?: string;
}

export interface ConflictResponse {
  conflicts: ConflictWarning[];
  message: string;
}