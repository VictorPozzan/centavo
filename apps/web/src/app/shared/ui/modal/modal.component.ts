import {
    ChangeDetectionStrategy,
    Component,
    HostListener,
    input,
    output,
  } from '@angular/core';
  
  @Component({
    selector: 'app-modal',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <div
          class="modal-content"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId()"
          (click)="$event.stopPropagation()"
        >
          <header class="modal-header">
            <h2 [id]="titleId()" class="modal-title">{{ title() }}</h2>
            <button
              type="button"
              class="modal-close"
              aria-label="Close dialog"
              (click)="dismiss.emit()"
            >
              ×
            </button>
          </header>
  
          <div class="modal-body">
            <ng-content></ng-content>
          </div>
        </div>
      </div>
    `,
    styleUrl: './modal.component.scss',
  })
  export class ModalComponent {
    readonly title = input.required<string>();
    readonly closeOnBackdrop = input<boolean>(true);
  
    readonly dismiss = output<void>();
  
    protected readonly titleId = () => `modal-title-${Math.random().toString(36).slice(2)}`;
  
    @HostListener('document:keydown.escape')
    onEscape(): void {
      this.dismiss.emit();
    }
  
    onBackdropClick(event: MouseEvent): void {
      if (this.closeOnBackdrop()) {
        this.dismiss.emit();
      }
    }
  }