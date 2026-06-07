import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CashflowChartComponent } from './charts/cashflow-chart.component';
import { CategoryDonutComponent } from './charts/category-donut.component';
import { DashboardService } from './dashboard.service';
import { AuthService } from '../../core/auth/auth.service';
import { PeriodSelectorComponent } from './components/period-selector/period-selector.component';
import { KpiCardsComponent } from './components/kpi-cards/kpi-cards.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import type { DashboardQuery } from '@centavo/shared-types';


@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    PeriodSelectorComponent,
    KpiCardsComponent,
    CashflowChartComponent,
    CategoryDonutComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  protected readonly authService = inject(AuthService);
  protected readonly dashboardService = inject(DashboardService);
  private readonly toast = inject(ToastService);

  onPeriodChange(query: DashboardQuery): void {
    this.dashboardService.load(query).subscribe({
      error: () => this.toast.error('Failed to load dashboard.'),
    });
  }
}