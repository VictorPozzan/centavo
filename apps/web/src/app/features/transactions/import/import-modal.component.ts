import {
    ChangeDetectionStrategy,
    Component,
    inject,
    output,
    signal,
  } from '@angular/core';
  import { ModalComponent } from '../../../shared/ui/modal/modal.component';
  import { ToastService } from '../../../shared/ui/toast/toast.service';
  import { AccountsService } from '../../accounts/accounts.service';
  import { CategoriesService } from '../../categories/categories.service';
  import { ImportService } from './import.service';
  import { UploadStepComponent, UploadSubmit } from './steps/upload-step.component';
  import { ReviewStepComponent, ReviewedItem } from './steps/review-step.component';
  import type { ImportPreviewResult } from '@centavo/shared-types';
  
  type Step = 'upload' | 'review';
  
  @Component({
    selector: 'app-import-modal',
    standalone: true,
    imports: [ModalComponent, UploadStepComponent, ReviewStepComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
      <app-modal [title]="modalTitle()" (dismiss)="onDismiss()">
        @if (step() === 'upload') {
          <app-upload-step
            (submitUpload)="onUploadSubmit($event)"
            (cancel)="onDismiss()"
          />
        } @else if (step() === 'review' && preview()) {
          <app-review-step
            [preview]="preview()!"
            [committing]="committing()"
            (back)="onBack()"
            (confirmImport)="onConfirmImport($event)"
          />
        }
  
        @if (step() === 'upload' && loadingPreview()) {
          <div class="import-loading">
            <span>Parsing file…</span>
          </div>
        }
      </app-modal>
    `,
    styles: [
      `
        .import-loading {
          text-align: center;
          padding: var(--space-4);
          color: var(--color-text-muted);
          font-size: var(--text-sm);
        }
      `,
    ],
  })
  export class ImportModalComponent {
    private readonly importService = inject(ImportService);
    private readonly accountsService = inject(AccountsService);
    private readonly categoriesService = inject(CategoriesService);
    private readonly toast = inject(ToastService);
  
    /** Emits the number of imported transactions on success */
    readonly imported = output<number>();
    readonly dismiss = output<void>();
  
    protected readonly step = signal<Step>('upload');
    protected readonly preview = signal<ImportPreviewResult | null>(null);
    protected readonly loadingPreview = signal(false);
    protected readonly committing = signal(false);
  
    private accountId = '';
  
    protected readonly modalTitle = () =>
      this.step() === 'upload' ? 'Import transactions' : 'Review import';
  
    constructor() {
      // Make sure accounts and categories are loaded for the dropdowns
      if (this.accountsService.count() === 0) {
        this.accountsService.loadAll().subscribe();
      }
      if (this.categoriesService.count() === 0) {
        this.categoriesService.loadAll().subscribe();
      }
    }
  
    onUploadSubmit(submit: UploadSubmit): void {
      this.accountId = submit.accountId;
      this.loadingPreview.set(true);
  
      this.importService.preview(submit.file).subscribe({
        next: (result) => {
          this.loadingPreview.set(false);
          if (result.items.length === 0) {
            this.toast.error('No transactions found in the file.');
            return;
          }
          this.preview.set(result);
          this.step.set('review');
        },
        error: (err) => {
          this.loadingPreview.set(false);
          const message =
            err.error?.message ??
            'Failed to parse the file. Please check the format.';
          this.toast.error(
            Array.isArray(message) ? message.join(', ') : message,
          );
        },
      });
    }
  
    onBack(): void {
      this.step.set('upload');
      this.preview.set(null);
    }
  
    onConfirmImport(items: ReviewedItem[]): void {
      this.committing.set(true);
  
      const payload = {
        accountId: this.accountId,
        items: items.map((item) => ({
          description: item.description,
          amount: item.amount,
          type: item.type,
          date: item.date,
          externalId: item.externalId,
          categoryId: item.categoryId,
        })),
      };
  
      this.importService.commit(payload).subscribe({
        next: (result) => {
          this.committing.set(false);
          this.toast.success(
            `Imported ${result.importedCount} transaction${
              result.importedCount === 1 ? '' : 's'
            }.`,
          );
          this.imported.emit(result.importedCount);
        },
        error: () => {
          this.committing.set(false);
          this.toast.error('Failed to import transactions. Please try again.');
        },
      });
    }
  
    onDismiss(): void {
      this.dismiss.emit();
    }
  }