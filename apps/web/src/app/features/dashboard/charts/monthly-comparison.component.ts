import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    OnDestroy,
    effect,
    input,
    viewChild,
  } from '@angular/core';
  import { Chart, ChartConfiguration } from 'chart.js';
  import { BarController, BarElement } from 'chart.js';
  import { registerChartComponents } from './chart-setup';
  import type { MonthlyComparison } from '@centavo/shared-types';
  
  // Bar chart components weren't registered in chart-setup yet — register here too.
  let barRegistered = false;
  function registerBarComponents(): void {
    if (barRegistered) return;
    Chart.register(BarController, BarElement);
    barRegistered = true;
  }
  
  @Component({
    selector: 'app-monthly-comparison',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
      <div class="chart-card">
        <header class="chart-header">
          <h3 class="chart-title">Last 6 months</h3>
          <p class="chart-subtitle">Income vs expense, regardless of the period filter</p>
        </header>
  
        @if (data().length === 0) {
          <p class="chart-empty">Not enough history yet.</p>
        } @else {
          <div class="chart-canvas-wrapper">
            <canvas #canvas></canvas>
          </div>
        }
      </div>
    `,
    styleUrl: './chart-card.scss',
  })
  export class MonthlyComparisonComponent implements AfterViewInit, OnDestroy {
    readonly data = input.required<MonthlyComparison[]>();
  
    private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
    private chart: Chart | null = null;
  
    constructor() {
      registerChartComponents();
      registerBarComponents();
  
      effect(() => {
        const data = this.data();
        if (this.canvasRef() && data.length > 0) {
          this.renderChart(data);
        }
      });
    }
  
    ngAfterViewInit(): void {
      if (this.data().length > 0) {
        this.renderChart(this.data());
      }
    }
  
    ngOnDestroy(): void {
      this.chart?.destroy();
    }
  
    private renderChart(data: MonthlyComparison[]): void {
      const canvas = this.canvasRef()?.nativeElement;
      if (!canvas) return;
  
      this.chart?.destroy();
  
      const labels = data.map((d) => this.formatMonthLabel(d.month));
      const incomeValues = data.map((d) => Number(d.income));
      const expenseValues = data.map((d) => Number(d.expense));
  
      const config: ChartConfiguration<'bar'> = {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Income',
              data: incomeValues,
              backgroundColor: 'rgba(16, 185, 129, 0.7)',
              borderColor: '#10b981',
              borderWidth: 1,
              borderRadius: 4,
            },
            {
              label: 'Expense',
              data: expenseValues,
              backgroundColor: 'rgba(239, 68, 68, 0.7)',
              borderColor: '#ef4444',
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 16,
                usePointStyle: true,
                pointStyle: 'rect',
                font: { size: 12 },
              },
            },
            tooltip: {
              backgroundColor: '#18181b',
              borderColor: '#27272a',
              borderWidth: 1,
              padding: 12,
              cornerRadius: 8,
              titleColor: '#f4f4f5',
              bodyColor: '#a1a1aa',
              callbacks: {
                label: (context) => {
                  const value = context.parsed.y;
                  return `${context.dataset.label}: ${this.formatCurrency(value)}`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 } },
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(39, 39, 42, 0.5)' },
              ticks: {
                font: { size: 11 },
                callback: (value: number) => this.formatCurrencyShort(Number(value)),
              },
            },
          },
        },
      };
  
      this.chart = new Chart(canvas, config);
    }
  
    private formatMonthLabel(month: string): string {
      // month comes as "YYYY-MM"
      const [year, monthNum] = month.split('-').map(Number);
      const date = new Date(year, monthNum - 1, 1);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        year: '2-digit',
      }).format(date);
    }
  
    private formatCurrency(value: number): string {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    }
  
    private formatCurrencyShort(value: number): string {
      if (Math.abs(value) >= 1000) {
        return `$${(value / 1000).toFixed(1)}k`;
      }
      return `$${value.toFixed(0)}`;
    }
  }