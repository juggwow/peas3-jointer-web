import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { StorageService } from '../../services/storage.service';
import { ApiService, CableTermination } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  employeeId: string | null = null;
  loginForm!: FormGroup;
  recordsList: CableTermination[] = [];
  isLoading = false;
  totalRecords = 0;

  constructor(
    private fb: FormBuilder,
    private storageService: StorageService,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.initLoginForm();
  }

  ngOnInit(): void {
    this.checkLogin();
  }

  initLoginForm(): void {
    this.loginForm = this.fb.group({
      userId: ['', [Validators.required, Validators.pattern(/^\d{6,7}$/)]]
    });
  }

  checkLogin(): void {
    this.employeeId = this.storageService.getEmployeeId();
    if (this.employeeId) {
      this.loadRecords();
    }
  }

  onLoginSubmit(): void {
    if (this.loginForm.invalid) return;
    const id = this.loginForm.value.userId;
    this.storageService.setEmployeeId(id);
    this.employeeId = id;
    this.cdr.detectChanges();
    this.loadRecords();
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
    this.loginForm.reset();
    this.cdr.detectChanges();
  }
}
