import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { StorageService } from '../../services/storage.service';
import { ApiService, CableTermination, User } from '../../services/api.service';
import { ThaiDatePipe } from '../../pipes/thai-date.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    ThaiDatePipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  employeeId: string | null = null;
  user: User | null = null;
  userPeaName = '';
  recordsList: CableTermination[] = [];
  isLoading = false;
  totalRecords = 0;

  constructor(
    private router: Router,
    private storageService: StorageService,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkLogin();
  }

  checkLogin(): void {
    this.user = this.storageService.getUser();
    if (this.user) {
      this.employeeId = this.user.id;
      this.loadRecords();
      this.loadUserPeaName();
    } else {
      this.employeeId = this.storageService.getEmployeeId();
      if (this.employeeId) {
        // Fallback: fetch user from API
        this.apiService.getUser(this.employeeId).subscribe({
          next: (user) => {
            this.user = user;
            this.storageService.setUser(user);
            this.loadRecords();
            this.loadUserPeaName();
          },
          error: () => {
            this.router.navigate(['/login']);
          }
        });
      } else {
        this.router.navigate(['/login']);
      }
    }
  }

  loadUserPeaName(): void {
    if (!this.user || !this.user.regionGroup) return;
    this.apiService.getPeaOffices(this.user.regionGroup).subscribe({
      next: (offices) => {
        const matchingOffice = offices.find(o => o.regionGroup === this.user?.regionGroup);
        if (matchingOffice) {
          this.userPeaName = matchingOffice.peaName;
        } else {
          this.userPeaName = this.user?.regionGroup || '';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.userPeaName = this.user?.regionGroup || '';
        this.cdr.detectChanges();
      }
    });
  }

  loadRecords(): void {
    if (!this.employeeId) return;
    this.isLoading = true;
    this.cdr.detectChanges();
    this.apiService.getTerminations(1, 50, '', this.employeeId).subscribe({
      next: (res) => {
        this.recordsList = res.data;
        this.totalRecords = res.totalCount;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load records for employee', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  logout(): void {
    this.storageService.clearEmployeeId();
    this.employeeId = null;
    this.user = null;
    this.userPeaName = '';
    this.recordsList = [];
    this.totalRecords = 0;
    this.router.navigate(['/login']);
    this.cdr.detectChanges();
  }
}
