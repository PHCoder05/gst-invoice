export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
  hsn_code: string;
  gst_rate: number;
  user_id?: string;
  created_at: string;
} 