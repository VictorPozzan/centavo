import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Category } from '@centavo/shared-types';

@Component({
  selector: 'app-category-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-card.component.html',
  styleUrl: './category-card.component.scss',
})
export class CategoryCardComponent {
  readonly category = input.required<Category>();

  readonly edit = output<Category>();
  readonly remove = output<Category>();
}