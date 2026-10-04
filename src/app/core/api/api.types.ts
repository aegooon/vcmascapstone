export interface ApiUser {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: 'administrator' | 'veterinarian' | 'staff' | 'client';
}

export interface ApiEnvelope<T> {
  data: T;
}

export interface ApiErrorBody {
  error?: { code?: string; message?: string };
}
