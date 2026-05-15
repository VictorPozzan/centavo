import {
    ChangeDetectionStrategy,
    Component,
    inject,
    output,
    signal,
  } from '@angular/core';
  import { AccountsService } from '../../../../accounts/accounts.service';
  
  export interface UploadSubmit {
    file: File;
    accountId: string;
  }
  
  const ALLOWED_EXTENSIONS = ['.csv', '.tsv', '.ofx', '.qfx'];
  const MAX_FILE_SIZE = 2 * 1024 * 1024;
  
  @Component({
    selector: 'app-upload-step',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './upload-step.component.html',
    styleUrl: '../../import-modal.component.scss',
  })
  export class UploadStepComponent {
    protected readonly accountsService = inject(AccountsService);
  
    readonly submitUpload = output<UploadSubmit>();
    readonly cancel = output<void>();
  
    protected readonly selectedFile = signal<File | null>(null);
    protected readonly selectedAccountId = signal<string>('');
    protected readonly isDragging = signal(false);
    protected readonly error = signal<string | null>(null);
  
    protected readonly canSubmit = () =>
      this.selectedFile() !== null &&
      this.selectedAccountId() !== '' &&
      this.error() === null;
  
    onAccountChange(event: Event): void {
      const select = event.target as HTMLSelectElement;
      this.selectedAccountId.set(select.value);
    }
  
    onFileSelected(event: Event): void {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (file) {
        this.validateAndSet(file);
      }
    }
  
    onDragOver(event: DragEvent): void {
      event.preventDefault();
      this.isDragging.set(true);
    }
  
    onDragLeave(event: DragEvent): void {
      event.preventDefault();
      this.isDragging.set(false);
    }
  
    onDrop(event: DragEvent): void {
      event.preventDefault();
      this.isDragging.set(false);
      const file = event.dataTransfer?.files?.[0];
      if (file) {
        this.validateAndSet(file);
      }
    }
  
    clearFile(): void {
      this.selectedFile.set(null);
      this.error.set(null);
    }
  
    submit(): void {
      const file = this.selectedFile();
      const accountId = this.selectedAccountId();
      if (file && accountId) {
        this.submitUpload.emit({ file, accountId });
      }
    }
  
    protected formatSize(bytes: number): string {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  
    private validateAndSet(file: File): void {
      this.error.set(null);
  
      const extension = this.getExtension(file.name);
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        this.error.set(
          `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
        );
        this.selectedFile.set(null);
        return;
      }
  
      if (file.size > MAX_FILE_SIZE) {
        this.error.set('File is too large. Maximum size is 2 MB.');
        this.selectedFile.set(null);
        return;
      }
  
      this.selectedFile.set(file);
    }
  
    private getExtension(fileName: string): string {
      const lastDot = fileName.lastIndexOf('.');
      return lastDot === -1 ? '' : fileName.slice(lastDot).toLowerCase();
    }
  }
