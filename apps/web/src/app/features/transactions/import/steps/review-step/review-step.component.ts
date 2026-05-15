import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    output,
    signal,
  } from '@angular/core';
  import { CentavoCurrencyPipe } from '../../../../../shared/pipes/currency.pipe';
  import { formatDate } from '../../../../../shared/utils/format';
  import { CategoriesService } from '../../../../categories/categories.service';
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
    templateUrl: './review-step.component.html',
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