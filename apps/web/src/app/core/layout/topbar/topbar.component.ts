import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topbar">
      <div class="topbar-container">
        <a routerLink="/dashboard" class="topbar-brand" aria-label="Centavo home">
          <span class="topbar-brand-mark">¢</span>
          <span class="topbar-brand-name">Centavo</span>
        </a>

        <button
          type="button"
          class="topbar-menu-toggle"
          [class.is-open]="menuOpen()"
          (click)="toggleMenu()"
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav class="topbar-nav" [class.is-open]="menuOpen()" aria-label="Main navigation">
          <a routerLink="/dashboard" routerLinkActive="is-active" (click)="closeMenu()">
            Dashboard
          </a>
          <a routerLink="/transactions" routerLinkActive="is-active" (click)="closeMenu()">
            Transactions
          </a>
          <a routerLink="/accounts" routerLinkActive="is-active" (click)="closeMenu()">
            Accounts
          </a>
          <a routerLink="/categories" routerLinkActive="is-active" (click)="closeMenu()">
            Categories
          </a>
        </nav>

        <div class="topbar-user">
          <span class="topbar-user-name">{{ authService.user()?.name }}</span>
          <button type="button" class="topbar-logout" (click)="logout()" aria-label="Sign out">
            Sign out
          </button>
        </div>
      </div>
    </header>
  `,
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  protected readonly authService = inject(AuthService);
  protected readonly menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
  }
}