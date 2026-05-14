import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    output,
    signal,
  } from '@angular/core';
  import { CentavoCurrencyPipe } from '../../../../shared/pipes/currency.pipe.';
  import { formatDate } from '../../../../shared/utils/format';
  import { CategoriesService } from '../../../categories/categories.service';
  import type { ImportPreviewItem, ImportPreviewResult } from '@centavo/shared-types';
  
  export interface ReviewedItem extends ImportPreviewItem {
    selected: boolean;
    categoryId: string | null;
  }
  
  @Component({
    selector: 'app-review-step',
    standalone: true,
    imports: [CentavoCurrencyPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
      <div class="review-step">
        <div class="review-summary">
          <div class="review-stat">
            <span class="review-stat-value">{{ preview().totalParsed }}</span>
            <span class="review-stat-label">parsed</span>
          </div>
          <div class="review-stat review-stat-new">
            <span class="review-stat-value">{{ preview().newCount }}</span>
            <span class="review-stat-label">new</span>
          </div>
          <div class="review-stat review-stat-duplicate">
            <span class="review-stat-value">{{ preview().duplicateCount }}</span>
            <span class="review-stat-label">duplicates</span>
          </div>
          <div class="review-stat review-stat-selected">
            <span class="review-stat-value">{{ selectedCount() }}</span>
            <span class="review-stat-label">to import</span>
          </div>
        </div>
  
        @if (preview().warnings.length > 0) {
          <details class="review-warnings">
            <summary>{{ preview().warnings.length }} warning(s) during parsing</summary>
            <ul>
              @for (warning of preview().warnings; track warning) {
                <li>{{ warning }}</li>
              }
            </ul>
          </details>
        }
  
        <div class="review-list">
          @for (item of items(); track item.externalId) {
            <div
              class="review-item"
              [class.is-duplicate]="item.isDuplicate"
              [class.is-deselected]="!item.selected"
            >
              <input
                type="checkbox"
                class="review-item-check"
                [checked]="item.selected"
                (change)="toggleItem(item.externalId)"
                [attr.aria-label]="'Include ' + item.description"
              />
  
              <div class="review-item-info">
                <span class="review-item-description">{{ item.description }}</span>
                <span class="review-item-meta">
                  {{ formatItemDate(item.date) }}
                  @if (item.isDuplicate) {
                    <span class="review-item-badge">Already imported</span>
                  }
                </span>
              </div>
  
              <select
                class="review-item-category"
                [value]="item.categoryId ?? ''"
                (change)="onCategoryChange(item.externalId, $event)"
                [disabled]="!item.selected"
              >
                <option value="">No category</option>
                @for (category of categoriesService.categories(); track category.id) {
                  <option [value]="category.id">{{ category.name }}</option>
                }
              </select>
  
              <span
                class="review-item-amount"
                [class.is-expense]="item.type === 'EXPENSE'"
              >
                {{ item.type === 'EXPENSE' ? '-' : '+' }}{{ item.amount | centavoCurrency }}
              </span>
            </div>
          }
        </div>
  
        <div class="form-actions">
          <button type="button" class="btn-ghost" (click)="back.emit()">
            Back
          </button>
          <button
            type="button"
            class="btn-primary"
            [disabled]="selectedCount() === 0 || committing()"
            (click)="confirm()"
          >
            {{
              committing()
                ? 'Importing…'
                : 'Import ' + selectedCount() + ' transaction' + (selectedCount() === 1 ? '' : 's')
            }}
          </button>
        </div>
      </div>
    `,
    styleUrl: './review-step.component.scss',
  })
  export class ReviewStepComponent {
    protected readonly categoriesService = inject(CategoriesService);
  
    readonly preview = input.required<ImportPreviewResult>();
    readonly committing = input<boolean>(false);
  
    readonly back = output<void>();
    readonly confirmImport = output<ReviewedItem[]>();
  
    protected readonly items = signal<ReviewedItem[]>([]);
  
    protected readonly selectedCount = computed(
      () => this.items().filter((i) => i.selected).length,
    );
  
    constructor() {
      // Initialize the editable list from the preview input.
      // Duplicates start deselected; new items start selected.
      queueMicrotask(() => {
        this.items.set(
          this.preview().items.map((item) => ({
            ...item,
            selected: !item.isDuplicate,
            categoryId: item.suggestedCategoryId,
          })),
        );
      });
    }
  
    toggleItem(externalId: string): void {
      this.items.update((items) =>
        items.map((item) =>
          item.externalId === externalId
            ? { ...item, selected: !item.selected }
            : item,
        ),
      );
    }
  
    onCategoryChange(externalId: string, event: Event): void {
      const select = event.target as HTMLSelectElement;
      const categoryId = select.value || null;
      this.items.update((items) =>
        items.map((item) =>
          item.externalId === externalId ? { ...item, categoryId } : item,
        ),
      );
    }
  
    confirm(): void {
      const selected = this.items().filter((i) => i.selected);
      this.confirmImport.emit(selected);
    }
  
    protected formatItemDate(date: string): string {
      return formatDate(date);
    }
  }