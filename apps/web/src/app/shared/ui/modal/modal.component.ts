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
    templateUrl: './modal.component.html',
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