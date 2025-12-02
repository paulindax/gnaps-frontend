export interface Organization {
  id: number;
  name: string;
  type: 'national' | 'region' | 'zone';
  parent_id?: number;
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
  status?: string;
}

export interface User {
  id: number;
  email: string;
  role: 'system_admin' | 'national_admin' | 'regional_admin' | 'zone_admin' | 'school_user';
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
