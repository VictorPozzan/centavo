import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
  } from '@angular/core';
  import { CentavoCurrencyPipe } from '../../../shared/pipes/currency.pipe';
  import type { TopCategory } from '@centavo/shared-types';
  
  @Component({
    selector: 'app-top-categories',
    standalone: true,
    imports: [CentavoCurrencyPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
      <div class="card">
        <header class="card-header">
          <h3 class="card-title">Top categories</h3>
          <p class="card-subtitle">Where most of your money went</p>
        </header>
  
        @if (data().length === 0) {
          <p class="empty">No expenses to rank.</p>
        } @else {
          <ul class="ranking">
            @for (item of rankedItems(); track item.categoryName) {
              <li class="ranking-item">
                <div class="ranking-line">
                  <span class="ranking-rank">{{ $index + 1 }}</span>
                  <span class="ranking-name">{{ item.categoryName }}</span>
                  <span class="ranking-value">{{ item.amount | centavoCurrency }}</span>
                </div>
                <div class="ranking-bar">
                  <div
                    class="ranking-bar-fill"
                    [style.width.%]="item.barPercent"
                  ></div>
                </div>
                <p class="ranking-meta">
                  {{ item.transactionCount }} transaction{{ item.transactionCount === 1 ? '' : 's' }}
                </p>
              </li>
            }
          </ul>
        }
      </div>
    `,
    styleUrl: './top-categories.component.scss',
  })
  export class TopCategoriesComponent {
    readonly data = input.required<TopCategory[]>();
  
    /**
     * Computes the bar width as a percentage relative to the top category.
     * The #1 always gets 100%, the rest are proportional.
     */
    protected readonly rankedItems = computed(() => {
      const items = this.data();
      if (items.length === 0) return [];
  
      const topAmount = Number(items[0].amount);
  
      return items.map((item) => ({
        ...item,
        barPercent: topAmount > 0
          ? (Number(item.amount) / topAmount) * 100
          : 0,
      }));
    });
  }