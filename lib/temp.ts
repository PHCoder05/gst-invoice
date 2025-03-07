// Temporary fix for type issues
export type Transaction = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_gstin?: string;
  customer_address?: string;
  invoice_number: string;
  invoice_date: string;
  subtotal: number;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  total_amount: number;
  payment_status: "pending" | "paid";
  payment_id?: string;
  items: any[];
  created_at?: string;
}; 