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
  import { registerChartComponents } from './chart-setup';
  import type { BalanceTimelinePoint } from '@centavo/shared-types';
  
  @Component({
    selector: 'app-cashflow-chart',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
      <div class="chart-card">
        <header class="chart-header">
          <h3 class="chart-title">Cash flow</h3>
          <p class="chart-subtitle">Daily income vs expense</p>
        </header>
  
        @if (data().length === 0) {
          <p class="chart-empty">No data for this period.</p>
        } @else {
          <div class="chart-canvas-wrapper">
            <canvas #canvas></canvas>
          </div>
        }
      </div>
    `,
    styleUrl: './chart-card.scss',
  })
  export class CashflowChartComponent implements AfterViewInit, OnDestroy {
    readonly data = input.required<BalanceTimelinePoint[]>();
  
    private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
    private chart: Chart | null = null;
  
    constructor() {
      registerChartComponents();
  
      // React to data changes — rebuild the chart
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
  
    private renderChart(data: BalanceTimelinePoint[]): void {
      const canvas = this.canvasRef()?.nativeElement;
      if (!canvas) return;
  
      this.chart?.destroy();
  
      const labels = data.map((d) => this.formatLabel(d.date));
      const incomeValues = data.map((d) => Number(d.income));
      const expenseValues = data.map((d) => Number(d.expense));
      const netValues = data.map((d) => Number(d.net));
  
      const config: ChartConfiguration<'line'> = {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Income',
              data: incomeValues,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              tension: 0.3,
              fill: true,
              pointRadius: 0,
              pointHoverRadius: 4,
              borderWidth: 2,
            },
            {
              label: 'Expense',
              data: expenseValues,
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              tension: 0.3,
              fill: true,
              pointRadius: 0,
              pointHoverRadius: 4,
              borderWidth: 2,
            },
            {
              label: 'Net',
              data: netValues,
              borderColor: '#a1a1aa',
              borderDash: [5, 5],
              tension: 0.3,
              fill: false,
              pointRadius: 0,
              pointHoverRadius: 4,
              borderWidth: 1.5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 16,
                usePointStyle: true,
                pointStyle: 'circle',
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
                  const value = context.parsed.y as number;
                  return `${context.dataset.label}: ${this.formatCurrency(value)}`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 8,
                font: { size: 11 },
              },
            },
            y: {
              grid: { color: 'rgba(39, 39, 42, 0.5)' },
              ticks: {
                font: { size: 11 },
                callback: (value) => this.formatCurrencyShort(Number(value)),
              },
            },
          },
        },
      };
  
      this.chart = new Chart(canvas, config);
    }
  
    private formatLabel(date: string): string {
      const d = new Date(date);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
      }).format(d);
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