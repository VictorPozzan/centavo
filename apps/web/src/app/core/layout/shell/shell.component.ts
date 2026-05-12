import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, TopbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-topbar />
    <main class="shell-main">
      <div class="shell-container">
        <router-outlet />
      </div>
    </main>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      .shell-main {
        flex: 1;
        padding: var(--space-6) var(--space-4);
      }

      .shell-container {
        max-width: var(--container-max);
        margin: 0 auto;
        width: 100%;
      }

      @media (min-width: 768px) {
        .shell-main {
          padding: var(--space-8) var(--space-6);
        }
      }
    `,
  ],
})
export class ShellComponent {}