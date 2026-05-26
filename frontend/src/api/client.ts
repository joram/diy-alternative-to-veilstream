export interface CustomerSummary {
  customer_id: number;
  first_name: string;
  last_name: string;
  country: string;
  email: string;
}

export interface Customer extends CustomerSummary {
  company: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
  fax: string | null;
  support_rep_id: number | null;
}

export interface AdminCustomer extends Customer {
  total_revenue: number;
  total_margin: number;
}

export interface Invoice {
  invoice_id: number;
  customer_id: number;
  invoice_date: string;
  billing_address: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_country: string | null;
  billing_postal_code: string | null;
  total: string;
  margin?: number;
  internal_notes?: string | null;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface InvoiceLine {
  invoice_line_id: number;
  invoice_id: number;
  track_id: number;
  quantity: number;
  unit_price: string;
  unit_cost?: string | null;
  track_name: string;
  album_title: string | null;
  artist_name: string | null;
}

export interface AdminStats {
  customers: number;
  invoices: number;
  revenue: number;
  margin: number;
}

export type CustomerViewMode = "customer" | "support";

export interface AuthState {
  role: "customer" | "admin";
  customerId: number | null;
  viewMode: CustomerViewMode | null;
}

export interface SupportChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface QueryResult {
  columns: string[];
  rows: unknown[][];
  row_count: number;
  scoped_sql: string;
}

export interface SupportChatResponse {
  reply: string;
  toolsUsed?: string[];
  llmEnabled?: boolean;
  provider?: string;
  model?: string;
  baseUrl?: string;
  queryResult?: QueryResult;
  error?: string;
}

export interface SupportStatus {
  llmEnabled: boolean;
  provider: string;
  model: string;
  baseUrl: string;
}

const TOKEN_KEY = "chinook_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...init, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data as T;
}

export const client = {
  listCustomers: () => api<CustomerSummary[]>("/api/customers"),

  becomeCustomer: (customerId: number, mode: CustomerViewMode) =>
    api<{ token: string; role: "customer"; customerId: number; viewMode: CustomerViewMode }>(
      `/api/auth/become/${customerId}`,
      { method: "POST", body: JSON.stringify({ mode }) },
    ),

  loginAdmin: (password: string) =>
    api<{ token: string; role: "admin" }>("/api/auth/admin", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  logout: () => api<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),

  me: () => api<AuthState>("/api/auth/me"),

  customerProfile: () => api<Customer>("/api/dashboard/profile"),

  customerInvoices: () => api<Invoice[]>("/api/dashboard/invoices"),

  customerInvoiceLines: (invoiceId: number) =>
    api<InvoiceLine[]>(`/api/dashboard/invoices/${invoiceId}/lines`),

  adminCustomers: () => api<AdminCustomer[]>("/api/admin/customers"),

  adminInvoices: () => api<Invoice[]>("/api/admin/invoices"),

  adminInvoiceLines: (invoiceId: number) =>
    api<InvoiceLine[]>(`/api/admin/invoices/${invoiceId}/lines`),

  adminStats: () => api<AdminStats>("/api/admin/stats"),

  supportStatus: () => api<SupportStatus>("/api/support/status"),

  supportChat: (message: string, history: SupportChatMessage[]) =>
    api<SupportChatResponse>("/api/support/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),
};
