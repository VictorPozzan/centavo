import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    inject,
    signal,
  } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { ModalComponent } from '../../shared/ui/modal/modal.component';
  import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog/confirm-dialog.component';
  import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
  import { ToastService } from '../../shared/ui/toast/toast.service';
  import { CategoriesService } from './categories.service';
  import { CategoryFormComponent } from './components/category-form.component';
  import { CategoryCardComponent } from './components/category-card.component';
  import type { Category, CreateCategoryPayload } from '@centavo/shared-types';
  
  type Mode = 'create' | 'edit' | null;
  
  @Component({
    selector: 'app-categories-page',
    standalone: true,
    imports: [
      CommonModule,
      ModalComponent,
      ConfirmDialogComponent,
      EmptyStateComponent,
      CategoryFormComponent,
      CategoryCardComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
      <header class="page-header">
        <div>
          <h1 class="page-title">Categories</h1>
          <p class="page-subtitle">
            Group your transactions for clearer insights.
          </p>
        </div>
        <button type="button" class="btn-primary" (click)="openCreate()">
          + New category
        </button>
      </header>
  
      @if (categoriesService.loading() && categoriesService.count() === 0) {
        <p class="loading-state">Loading categories…</p>
      } @else if (categoriesService.count() === 0) {
        <app-empty-state
          icon="🏷"
          title="No categories yet"
          description="Add categories to classify your transactions — Food, Transportation, etc."
        >
          <button type="button" class="btn-primary" (click)="openCreate()">
            Create your first category
          </button>
        </app-empty-state>
      } @else {
        <div class="categories-grid">
          @for (category of categoriesService.categories(); track category.id) {
            <app-category-card
              [category]="category"
              (edit)="openEdit($event)"
              (remove)="confirmRemove($event)"
            />
          }
        </div>
      }
  
      @if (mode() !== null) {
        <app-modal
          [title]="mode() === 'create' ? 'New category' : 'Edit category'"
          (dismiss)="closeModal()"
        >
          <app-category-form
            [category]="editing()"
            [saving]="saving()"
            (submit)="onSubmit($event)"
            (cancel)="closeModal()"
          />
        </app-modal>
      }
  
      @if (toDelete()) {
        <app-confirm-dialog
          title="Delete category"
          [message]="
            'Delete the category ' +
            toDelete()!.name +
            '? Transactions in this category will not be deleted — they will just lose their category.'
          "
          confirmLabel="Delete"
          [destructive]="true"
          (confirm)="performDelete()"
          (cancel)="toDelete.set(null)"
        />
      }
    `,
    styleUrl: './categories.page.scss',
  })
  export class CategoriesPage implements OnInit {
    protected readonly categoriesService = inject(CategoriesService);
    private readonly toast = inject(ToastService);
  
    protected readonly mode = signal<Mode>(null);
    protected readonly editing = signal<Category | null>(null);
    protected readonly saving = signal(false);
    protected readonly toDelete = signal<Category | null>(null);
  
    ngOnInit(): void {
      this.categoriesService.loadAll().subscribe({
        error: () => this.toast.error('Failed to load categories.'),
      });
    }
  
    openCreate(): void {
      this.editing.set(null);
      this.mode.set('create');
    }
  
    openEdit(category: Category): void {
      this.editing.set(category);
      this.mode.set('edit');
    }
  
    closeModal(): void {
      this.mode.set(null);
      this.editing.set(null);
    }
  
    onSubmit(payload: CreateCategoryPayload): void {
      this.saving.set(true);
  
      const operation = this.editing()
        ? this.categoriesService.update(this.editing()!.id, payload)
        : this.categoriesService.create(payload);
  
      operation.subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success(
            this.editing() ? 'Category updated.' : 'Category created.',
          );
          this.closeModal();
        },
        error: (err) => {
          this.saving.set(false);
          if (err.status === 409) {
            this.toast.error('A category with this name already exists.');
          } else {
            this.toast.error('Something went wrong. Please try again.');
          }
        },
      });
    }
  
    confirmRemove(category: Category): void {
      this.toDelete.set(category);
    }
  
    performDelete(): void {
      const category = this.toDelete();
      if (!category) return;
  
      this.categoriesService.remove(category.id).subscribe({
        next: () => {
          this.toast.success('Category deleted.');
          this.toDelete.set(null);
        },
        error: () => {
          this.toast.error('Failed to delete category.');
          this.toDelete.set(null);
        },
      });
    }
  }