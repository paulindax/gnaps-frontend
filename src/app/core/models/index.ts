export interface Organization {
  id: number;
  name: string;
  type: 'national' | 'region' | 'zone';
  parent_id?: number;
}

export interface ContactPerson {
  id: number;
  created_at?: string;
  updated_at?: string;
  school_id?: number;
  first_name?: string;
  last_name?: string;
  relation?: string;
  email?: string;
  mobile_no?: string;
}

export interface School {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  member_no: string;
  joining_date: string;
  name: string;
  zone_id?: number;
  date_of_establishment: string;
  address?: string;
  location?: string;
  mobile_no?: string;
  email?: string;
  gps_address?: string;
  is_deleted?: boolean;
  user_id?: number;
  school_group_ids?: any;
  zone_name?: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
  contact_persons?: ContactPerson[];
  zone?: Zone;
  status?: string;
}

export interface User {
  id: number;
  email: string;
  role: 'system_admin' | 'national_admin' | 'region_admin' | 'zone_admin' | 'school_admin';
  first_name: string;
  last_name: string;
  username: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  organization_id: number;
  created_by: number;
  location?: string;
  venue?: string;
  is_paid: boolean;
  price?: number;
  max_attendees?: number;
  registration_deadline?: string;
  status?: 'draft' | 'published' | 'cancelled' | 'completed';
  image_url?: string;
  registration_code?: string;
  created_at?: string;
  updated_at?: string;
  registered_count?: number;
  bill_id?: number;
  bill_name?: string;
}

export interface EventRegistration {
  id: number;
  event_id: number;
  school_id: number;
  registered_by?: number;
  payment_status: 'pending' | 'paid' | 'confirmed' | 'failed';
  payment_reference?: string;
  payment_method?: 'MTN' | 'TELECEL' | 'AIRTELTIGO';
  payment_phone?: string;
  registration_date: string;
  number_of_attendees?: number;
  school_name?: string;
  school_member_no?: string;
  event_title?: string;
}

export interface Payment {
  id: number;
  school_id: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  created_at: string;
  payment_method?: string;
  paid_at?: string;
}

export interface SchoolBalance {
  balance: number;
  has_balance: boolean;
  bill_id?: number;
  bill_name?: string;
  blocked?: boolean;
  message?: string;
}

export interface News {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  image_url?: string;
  category?: string;
  status: 'draft' | 'published';
  featured: boolean;
  author_id?: number;
  executive_id?: number;
  region_ids?: number[];
  zone_ids?: number[];
  group_ids?: number[];
  school_ids?: number[];
  created_at: string;
  updated_at: string;
}

export interface NewsComment {
  id: number;
  news_id: number;
  user_id?: number;
  content: string;
  is_approved: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_users?: number;
  total_regions?: number;
  total_zones?: number;
  total_schools: number;
  recent_payments?: number;
  pending_bills?: number;
  outstanding_amount?: number;
  total_payments?: number;
  total_executives?: number;

}

export interface Region {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  name: string;
  code: string;
  is_deleted?: boolean;
}

export interface Zone {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  name: string;
  code: string;
  region_id: number;
  is_deleted?: boolean;
  region_name?: string;
}

export interface Position {
  id: number;
  name: string;
}

export interface Group {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  name: string;
  zone_id: number;
  description?: string;
  is_deleted?: boolean;
}

export interface DocumentField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'checkbox' | 'signature' | 'dropdown' | 'file';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For dropdown
  x: number;  // Position
  y: number;
  width: number;
  height: number;
}

export interface Document {
  id: number;
  title: string;
  description?: string;
  category?: string;
  status: 'draft' | 'published' | 'archived';
  template_data: DocumentField[];
  created_by?: number;
  is_required?: boolean;
  region_ids?: number[];
  zone_ids?: number[];
  group_ids?: number[];
  school_ids?: number[];
  version?: number;
  created_at: string;
  updated_at: string;
  submission_count?: number;
}

export interface DocumentSubmission {
  id: number;
  document_id: number;
  school_id: number;
  submitted_by: number;
  form_data: Record<string, any>;
  status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected';
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: number;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  document_title?: string;
  school_name?: string;
  submitter_name?: string;
}

export interface FinanceAccount {
  id: number;
  name: string;
  code: string;
  description?: string;
  account_type: string;
  is_income: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillParticular {
  id: number;
  name: string;
  priority?: number;
  finance_account_id?: number;
  finance_account_name?: string;
  is_arrears: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Bill {
  id: number;
  name: string;
  description?: string;
  is_deleted?: boolean;
  is_approved?: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillItem {
  id: number;
  bill_id: number;
  bill_particular_id: number;
  amount: number;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
  bill_particular?: BillParticular;
  region_ids?: number[];
  zone_ids?: number[];
  school_group_ids?: number[];
  school_ids?: number[];
}

export interface BillAssignment {
  id: number;
  bill_item_id: number;
  entity_type: 'region' | 'zone' | 'group' | 'school';
  entity_id: number;
  created_at: string;
  updated_at: string;
}

export type ExecutiveRole = 'national_admin' | 'region_admin' | 'zone_admin';

export interface Executive {
  id: number;
  executive_no?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  mobile_no?: string;
  gender?: string;
  position_id?: number;
  position_name?: string;
  role: ExecutiveRole;
  region_id?: number;
  region_name?: string;
  zone_id?: number;
  zone_name?: string;
  status: 'active' | 'inactive';
  photo_file_name?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface MomoPayment {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  amount?: number;
  status?: string;
  payment_gateway_id?: number;
  school_id?: number;
  payee_id?: number;
  payee_type?: string;
  user_id?: number;
  fee_name?: string;
  transaction_fee?: number;
  momo_network?: string;
  momo_number?: string;
  transaction_date: string;
  bank_status?: string;
  momo_transaction_id?: string;
  finance_transaction_ids?: any;
  v_code?: string;
  gateway_response?: any;
  payment_details?: any;
  mapi_momo_payment_id?: number;
  trans_status?: string;
  is_deleted?: boolean;
  retries?: number;
  school_name?: string;
}

export interface FinanceTransaction {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  title?: string;
  description?: string;
  amount?: number;
  finance_account_id?: number;
  transaction_date: string;
  finance_id?: number;
  finance_type?: string;
  school_id?: number;
  receipt_no?: string;
  voucher_no?: string;
  payment_mode?: string;
  mode_info?: string;
  payment_note?: string;
  user_id?: number;
  reference_no?: string;
  payment_details?: any;
  school_name?: string;
  finance_account_name?: string;
}

export interface SchoolBill {
  id: number;
  created_at: string;
  updated_at: string;
  school_id?: number;
  is_paid?: boolean;
  amount?: number;
  discounts?: number;
  amount_paid?: number;
  credit_amount?: number;
  balance?: number;
  bill_id?: number;
  zone_id?: number;
  fee_details?: any;
  school_group_ids?: any;
  bill_name?: string;
  school_name?: string;
}

export interface SchoolBillParticular {
  id: number;
  created_at: string;
  updated_at: string;
  school_id?: number;
  particular_name?: string;
  amount?: number;
  discount_amount?: number;
  amount_paid?: number;
  credit_amount?: number;
  priority?: number;
  bill_particular_id?: number;
  zone_id?: number;
  bill_id?: number;
  school_billing_id?: number;
  billing_item_id?: number;
  finance_account_id?: number;
  is_approved?: boolean;
  is_deleted?: boolean;
}

export interface SchoolPaymentRequest {
  school_id: number;
  school_name?: string;
  school_bill_id: number;
  amount: number;
  payment_mode: 'Cash' | 'MoMo';
  payment_date: string;
  payment_note?: string;
  momo_number?: string;
  momo_network?: 'MTN' | 'TELECEL' | 'AIRTELTIGO';
}

export interface PaymentStatusResponse {
  status: 'pending' | 'successful' | 'failed';
  bank_status?: string;
  trans_status?: string;
  message?: string;
  transaction_id?: string;
}
