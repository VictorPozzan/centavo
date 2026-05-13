
export function formatCurrency(amount: number | string): string {
    const value = typeof amount === 'string' ? Number(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
  
  export function formatDate(date: string | Date, style: 'short' | 'long' = 'short'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: style === 'short' ? 'short' : 'long',
      day: 'numeric',
    }).format(d);
  }
  
  /**
   * Returns a YYYY-MM-DD string suitable for <input type="date" />
   */
  export function toDateInput(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  /**
   * Converts a YYYY-MM-DD input to an ISO string at midnight UTC.
   */
  export function fromDateInput(value: string): string {
    return new Date(`${value}T00:00:00.000Z`).toISOString();
  }
  
  export function startOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  
  export function endOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  }