import { Client } from './client';

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  service_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  hsn_code: string;
  gst_rate: number;
  subtotal: number;
  tax: number;
  total: number;
  created_at?: string;
}

export interface Invoice {
  id: string;
  client_id: string;
  client?: Client;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes: string;
  items: InvoiceItem[];
  user_id?: string;
  created_at: string;
} 