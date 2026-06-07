import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    output,
    signal,
  } from '@angular/core';
  import { FormsModule } from '@angular/forms';
  import { endOfMonth, startOfMonth } from '../../../../shared/utils/format';
  import type { DashboardQuery } from '@centavo/shared-types';
  
  type Preset = 'this-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'this-year';
  
  @Component({
    selector: 'app-period-selector',
    standalone: true,
    imports: [FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
      <div class="period-selector">
        <label for="dashboard-period">Period</label>
        <select
          id="dashboard-period"
          [ngModel]="preset()"
          (ngModelChange)="onChange($event)"
        >
          <option value="this-month">This month</option>
          <option value="last-month">Last month</option>
          <option value="last-3-months">Last 3 months</option>
          <option value="last-6-months">Last 6 months</option>
          <option value="this-year">This year</option>
        </select>
      </div>
    `,
    styles: [
      `
        .period-selector {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
  
        label {
          font-size: var(--text-xs);
          font-weight: 500;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
  
        select {
          padding: var(--space-2) var(--space-3);
          background-color: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          color: var(--color-text);
          font-size: var(--text-sm);
          min-width: 180px;
          transition: var(--transition-fast);
  
          &:focus {
            outline: none;
            border-color: var(--color-primary);
            box-shadow: 0 0 0 3px var(--color-primary-soft);
          }
        }
      `,
    ],
  })
  export class PeriodSelectorComponent implements OnInit {
    readonly queryChange = output<DashboardQuery>();
  
    protected readonly preset = signal<Preset>('this-month');
  
    ngOnInit(): void {
      this.emit();
    }
  
    onChange(preset: Preset): void {
      this.preset.set(preset);
      this.emit();
    }
  
    private emit(): void {
      const range = this.resolveRange();
      this.queryChange.emit({
        startDate: range.start.toISOString(),
        endDate: range.end.toISOString(),
      });
    }
  
    private resolveRange(): { start: Date; end: Date } {
      const now = new Date();
      switch (this.preset()) {
        case 'this-month':
          return { start: startOfMonth(now), end: endOfMonth(now) };
        case 'last-month': {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
        }
        case 'last-3-months': {
          const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          return { start, end: endOfMonth(now) };
        }
        case 'last-6-months': {
          const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
          return { start, end: endOfMonth(now) };
        }
        case 'this-year': {
          const start = new Date(now.getFullYear(), 0, 1);
          const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          return { start, end };
        }
      }
    }
  }