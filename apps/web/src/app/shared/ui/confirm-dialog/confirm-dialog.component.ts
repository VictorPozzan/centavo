import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [title]="title()" (dismiss)="cancel.emit()">
      <p class="confirm-message">{{ message() }}</p>

      <div class="confirm-actions">
        <button type="button" class="btn-ghost" (click)="cancel.emit()">
          {{ cancelLabel() }}
        </button>
        <button
          type="button"
          [class]="destructive() ? 'btn-danger' : 'btn-primary'"
          (click)="confirm.emit()"
        >
          {{ confirmLabel() }}
        </button>
      </div>
    </app-modal>
  `,
  styles: [
    `
      .confirm-message {
        color: var(--color-text-muted);
        line-height: 1.6;
        margin-bottom: var(--space-6);
      }

      .confirm-actions {
        display: flex;
        gap: var(--space-3);
        justify-content: flex-end;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input<string>('Confirm');
  readonly cancelLabel = input<string>('Cancel');
  readonly destructive = input<boolean>(false);

  readonly confirm = output<void>();
  readonly cancel = output<void>();
}