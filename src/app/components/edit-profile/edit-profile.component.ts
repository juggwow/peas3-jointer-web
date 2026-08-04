import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StorageService } from '../../services/storage.service';
import { ApiService, User } from '../../services/api.service';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.css'
})
export class EditProfileComponent implements OnInit {
  profileForm!: FormGroup;
  employeeId: string | null = null;
  isLoading = false;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private storageService: StorageService,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.employeeId = this.storageService.getEmployeeId();
    if (!this.employeeId) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadUserProfile();
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      id: [{ value: '', disabled: true }, Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      position: [''],
      department: [''],
      regionGroup: ['', [Validators.required, Validators.pattern(/^[A-La-l]\d{5}$/)]]
    });
  }

  loadUserProfile(): void {
    if (!this.employeeId) return;
    this.isLoading = true;
    this.cdr.detectChanges();

    this.apiService.getUser(this.employeeId).subscribe({
      next: (user) => {
        this.profileForm.patchValue({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          position: user.position || '',
          department: user.department || '',
          regionGroup: user.regionGroup
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('ไม่สามารถโหลดข้อมูลผู้ใช้งานได้: ' + (err.error?.error || err.message), 'ปิด', { duration: 5000 });
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid || !this.employeeId) return;

    const rawVal = this.profileForm.getRawValue();
    const payload: Partial<User> = {
      firstName: rawVal.firstName,
      lastName: rawVal.lastName,
      position: rawVal.position,
      department: rawVal.department,
      regionGroup: rawVal.regionGroup.toUpperCase()
    };

    this.isSaving = true;
    this.cdr.detectChanges();

    this.apiService.updateUser(this.employeeId, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.snackBar.open('แก้ไขข้อมูลผู้ใช้งานสำเร็จ', 'ปิด', { duration: 3000 });
        this.cdr.detectChanges();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isSaving = false;
        this.snackBar.open('ไม่สามารถแก้ไขข้อมูลได้: ' + (err.error?.error || err.message), 'ปิด', { duration: 5000 });
        this.cdr.detectChanges();
      }
    });
  }
}
