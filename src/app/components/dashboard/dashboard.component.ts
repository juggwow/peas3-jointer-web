import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { StorageService } from '../../services/storage.service';
import { ApiService, CableTermination } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  employeeId: string | null = null;
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
    this.employeeId = this.storageService.getEmployeeId();
    if (this.employeeId) {
      this.loadRecords();
    } else {
      // Just in case guard fails or gets bypassed
      this.router.navigate(['/login']);
    }
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
    this.recordsList = [];
    this.totalRecords = 0;
    this.router.navigate(['/login']);
    this.cdr.detectChanges();
  }
}
