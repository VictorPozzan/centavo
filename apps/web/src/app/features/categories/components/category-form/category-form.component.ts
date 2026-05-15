import {
    ChangeDetectionStrategy,
    Component,
    inject,
    input,
    output,
    signal,
    effect,
  } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
  import type { Category, CreateCategoryPayload } from '@centavo/shared-types';
  
  const DEFAULT_COLORS = [
    '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
    '#ef4444', '#06b6d4', '#84cc16', '#a855f7', '#71717a',
  ];
  
  @Component({
    selector: 'app-category-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './category-form.component.html',
    styleUrl: './category-form.component.scss',
  })
  export class CategoryFormComponent {
    private readonly fb = inject(FormBuilder);
  
    readonly category = input<Category | null>(null);
    readonly saving = input<boolean>(false);
  
    readonly submit = output<CreateCategoryPayload>();
    readonly cancel = output<void>();
  
    protected readonly colors = DEFAULT_COLORS;
  
    protected readonly form = this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      color: [DEFAULT_COLORS[0]],
    });
  
    protected readonly submitLabel = signal('Create');
  
    constructor() {
      effect(() => {
        const category = this.category();
        if (category) {
          this.form.patchValue({ name: category.name, color: category.color });
          this.submitLabel.set('Save changes');
        } else {
          this.form.reset({ name: '', color: DEFAULT_COLORS[0] });
          this.submitLabel.set('Create');
        }
      });
    }
  
    hasError(field: 'name'): boolean {
      const control = this.form.controls[field];
      return control.invalid && (control.dirty || control.touched);
    }
  
    onSubmit(): void {
      if (this.form.invalid) return;
      this.submit.emit(this.form.getRawValue());
    }
  }