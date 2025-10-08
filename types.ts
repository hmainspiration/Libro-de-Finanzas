
export interface Member {
  id: string;
  name: string;
}

export interface Donation {
  id: string;
  memberId: string;
  memberName: string;
  category: string;
  amount: number;
}

export interface Formulas {
  diezmoPercentage: number;
  remanenteThreshold: number;
}

export interface WeeklyRecord {
  id: string;
  day: number;
  month: number;
  year: number;
  minister: string;
  donations: Donation[];
  formulas: Formulas;
}

export type Tab = 'register' | 'summary' | 'history' | 'monthly' | 'admin';
