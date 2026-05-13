import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Category } from '@centavo/shared-types';

@Component({
  selector: 'app-category-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="category-card">
      <div
        class="category-card-color"
        [style.background-color]="category().color"
        aria-hidden="true"
      ></div>
      <h3 class="category-card-name">{{ category().name }}</h3>
      <div class="category-card-actions">
        <button
          type="button"
          class="action-btn"
          (click)="edit.emit(category())"
          aria-label="Edit category"
        >
          ✎
        </button>
        <button
          type="button"
          class="action-btn action-btn-danger"
          (click)="remove.emit(category())"
          aria-label="Delete category"
        >
          🗑
        </button>
      </div>
    </article>
  `,
  styles: [
    `
      .category-card {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-4);
        background-color: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        transition: var(--transition-fast);

        &:hover {
          border-color: var(--color-border-strong);
        }
      }

      .category-card-color {
        width: 40px;
        height: 40px;
        border-radius: var(--radius-full);
        flex-shrink: 0;
      }

      .category-card-name {
        flex: 1;
        font-size: var(--text-base);
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .category-card-actions {
        display: flex;
        gap: var(--space-2);
        flex-shrink: 0;
      }

      .action-btn {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--color-surface-2);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        color: var(--color-text-muted);
        font-size: var(--text-sm);
        transition: var(--transition-fast);

        &:hover {
          background-color: var(--color-surface-3);
          color: var(--color-text);
        }
      }

      .action-btn-danger:hover {
        color: var(--color-expense);
        border-color: var(--color-expense);
      }
    `,
  ],
})
export class CategoryCardComponent {
  readonly category = input.required<Category>();

  readonly edit = output<Category>();
  readonly remove = output<Category>();
}