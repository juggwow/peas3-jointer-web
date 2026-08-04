import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { StorageService } from './services/storage.service';
import { ApiService, User } from './services/api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  title = 'PEA Jointer Portal';
  employeeId: string | null = null;
  user: User | null = null;
  private sub?: Subscription;
  private userSub?: Subscription;

  constructor(
    private storageService: StorageService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sub = this.storageService.getEmployeeIdObservable().subscribe(id => {
      this.employeeId = id;
      if (id && !this.storageService.getUser()) {
        this.apiService.getUser(id).subscribe({
          next: (user) => {
            this.storageService.setUser(user);
          },
          error: (err) => {
            console.error('Failed to sync user on load', err);
          }
        });
      }
    });

    this.userSub = this.storageService.getUserObservable().subscribe(user => {
      this.user = user;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.userSub?.unsubscribe();
  }

  logout(): void {
    this.storageService.clearEmployeeId();
    this.router.navigate(['/login']);
  }
}
