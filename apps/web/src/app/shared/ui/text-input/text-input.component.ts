import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './text-input.component.html',
  styleUrl: './text-input.component.scss'
})
export class EmptyStateComponent {
  readonly icon = input<string>('📭');
  readonly title = input.required<string>();
  readonly description = input.required<string>();
}