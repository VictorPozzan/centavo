export interface DashboardTotals {
    income: string;
    expense: string;
    net: string;
    savingsRate: number | null;
  }
  
  export interface BalanceTimelinePoint {
    date: string;
    income: string;
    expense: string;
    net: string;
  }
  
  export interface ExpenseByCategory {
    categoryId: string | null;
    categoryName: string;
    color: string;
    amount: string;
    percentage: number;
  }
  
  export interface TopCategory {
    categoryId: string | null;
    categoryName: string;
    amount: string;
    transactionCount: number;
  }
  
  export interface MonthlyComparison {
    month: string;
    income: string;
    expense: string;
  }
  
  export interface DashboardData {
    totals: DashboardTotals;
    balanceTimeline: BalanceTimelinePoint[];
    expensesByCategory: ExpenseByCategory[];
    topCategories: TopCategory[];
    monthlyComparison: MonthlyComparison[];
  }
  
  export interface DashboardQuery {
    startDate?: string;
    endDate?: string;
  }