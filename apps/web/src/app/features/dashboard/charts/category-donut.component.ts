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
  import type { ExpenseByCategory } from '@centavo/shared-types';
  
  @Component({
    selector: 'app-category-donut',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
      <div class="chart-card">
        <header class="chart-header">
          <h3 class="chart-title">Expenses by category</h3>
          <p class="chart-subtitle">Where your money went</p>
        </header>
  
        @if (data().length === 0) {
          <p class="chart-empty">No expenses for this period.</p>
        } @else {
          <div class="donut-layout">
            <div class="donut-canvas-wrapper">
              <canvas #canvas></canvas>
            </div>
  
            <ul class="donut-legend">
              @for (item of data(); track item.categoryName) {
                <li class="donut-legend-item">
                  <span
                    class="donut-legend-dot"
                    [style.background-color]="item.color"
                  ></span>
                  <span class="donut-legend-name">{{ item.categoryName }}</span>
                  <span class="donut-legend-value">
                    {{ formatPercent(item.percentage) }}
                  </span>
                </li>
              }
            </ul>
          </div>
        }
      </div>
    `,
    styleUrl: './chart-card.scss',
  })
  export class CategoryDonutComponent implements AfterViewInit, OnDestroy {
    readonly data = input.required<ExpenseByCategory[]>();
  
    private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
    private chart: Chart | null = null;
  
    constructor() {
      registerChartComponents();
  
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
  
    protected formatPercent(value: number): string {
      return `${(value * 100).toFixed(1)}%`;
    }
  
    private renderChart(data: ExpenseByCategory[]): void {
      const canvas = this.canvasRef()?.nativeElement;
      if (!canvas) return;
  
      this.chart?.destroy();
  
      const labels = data.map((d) => d.categoryName);
      const values = data.map((d) => Number(d.amount));
      const colors = data.map((d) => d.color);
  
      const config: ChartConfiguration<'doughnut'> = {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: colors,
              borderColor: '#0a0a0b',
              borderWidth: 2,
              hoverOffset: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: { display: false }, // we render our own
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
                  const value = context.parsed;
                  const total = context.dataset.data.reduce(
                    (sum: number, n: number) => sum + n,
                    0,
                  );
                  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                  return `${context.label}: ${this.formatCurrency(value)} (${pct}%)`;
                },
              },
            },
          },
        },
      };
  
      this.chart = new Chart(canvas, config);
    }
  
    private formatCurrency(value: number): string {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    }
  }