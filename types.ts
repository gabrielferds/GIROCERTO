
export type AppView = 'dashboard' | 'calendar' | 'history' | 'insights' | 'add' | 'goals' | 'maintenance' | 'debts' | 'payment';

export type PlanStatus = 'trial' | 'active' | 'expired';

export interface DailyEntry {
  id: string;
  date: string; // ISO format YYYY-MM-DD
  earnings: AppEarning[];
  expenses: CategoryExpense[];
  hoursWorked: number;
  fuelUsed?: number;
  status: 'work' | 'off';
  notes?: string;
}

export interface AppEarning {
  app: string;
  amount: number;
}

export interface CategoryExpense {
  category: ExpenseCategory;
  amount: number;
}

export enum ExpenseCategory {
  FUEL = 'Combustível',
  MAINTENANCE = 'Manutenção',
  APP_FEES = 'Taxas de Apps',
  INTERNET = 'Internet/Celular',
  UNFORESEEN = 'Imprevistos',
  OTHERS = 'Outros'
}

export interface Holiday {
  date: string;
  name: string;
}

export interface FinancialGoals {
  daily: number;
  weekly: number;
  monthly: number;
}

export interface MaintenanceItem {
  id: string;
  name: string;
  qtyPerYear: number;
  unitValue: number;
}

export interface BikeInfo {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  condition: 'excellent' | 'good' | 'regular' | 'bad';
  usage: 'work' | 'mixed';
  licensePlate?: string;
  fipeValue?: number;
  fipeDate?: string;
  manualValue?: number;
}

export interface ReplacementGoal {
  targetModel: string;
  targetYear: number;
  targetPrice: number;
  monthsToGoal: number;
  paymentMethod: 'cash' | 'financing' | 'consortium';
  downPayment?: number;
  installmentValue?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  planned_work_days: number;
  plan_status: PlanStatus;
  trial_expires_at: string;
  plano_inicio?: string;
  plano_fim?: string;
  last_payment_id?: string;
}

export interface ExpenseDebt {
  id: string;
  name: string;
  type: 'fixed' | 'installment' | 'financing' | 'card';
  paymentMethod: 'debit' | 'credit' | 'boleto' | 'pix';
  totalValue?: number;
  installmentValue: number;
  totalInstallments?: number;
  paidInstallments: number;
  startDate: string;
  dueDay: number;
  status: 'active' | 'paid' | 'cancelled';
}

export interface PixPaymentResponse {
  id: string;
  qr_code: string;
  qr_code_base64: string;
  status: string;
}
