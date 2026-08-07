import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { StorageService } from '../../services/storage.service';
import { ApiService, User, PeaOffice } from '../../services/api.service';
import { of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-login',
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
    MatAutocompleteModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  isRegistering = false;
  isLoading = false;
  returnUrl = '/';
  filteredOffices: PeaOffice[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private storageService: StorageService,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.initLoginForm();
  }

  ngOnInit(): void {
    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    // If already logged in, redirect to returnUrl or dashboard
    if (this.storageService.getEmployeeId()) {
      this.router.navigateByUrl(this.returnUrl);
    }
  }

  initLoginForm(): void {
    this.loginForm = this.fb.group({
      userId: ['', [Validators.required, Validators.pattern(/^\d{6,7}$/)]]
    });
  }

  initRegisterForm(id: string): void {
    this.registerForm = this.fb.group({
      id: [{ value: id, disabled: true }, [Validators.required, Validators.pattern(/^\d{6,7}$/)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      position: [''],
      department: [''],
      regionGroup: ['', Validators.required],
      peaOfficeSearch: ['', Validators.required]
    });

    // Set up autocomplete
    this.registerForm.get('peaOfficeSearch')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        const searchStr = typeof value === 'string' ? value : (value?.peaName || '');
        if (!searchStr) return of([]);
        return this.apiService.getPeaOffices(searchStr);
      })
    ).subscribe(offices => {
      this.filteredOffices = offices;
      this.cdr.detectChanges();
    });

    // Reset regionGroup if user types manually
    this.registerForm.get('peaOfficeSearch')?.valueChanges.subscribe(value => {
      if (typeof value === 'string') {
        this.registerForm.get('regionGroup')?.setValue('');
      }
    });
  }

  displayOfficeFn(office: PeaOffice): string {
    return office ? `${office.peaName} (${office.regionGroup})` : '';
  }

  onOfficeSelected(event: MatAutocompleteSelectedEvent): void {
    const office = event.option.value as PeaOffice;
    this.registerForm.patchValue({
      regionGroup: office.regionGroup
    });
  }

  onLoginSubmit(): void {
    if (this.loginForm.invalid) return;
    const id = this.loginForm.value.userId;
    this.isLoading = true;
    this.cdr.detectChanges();

    this.apiService.getUser(id).subscribe({
      next: (user) => {
        this.isLoading = false;
        this.storageService.setUser(user);
        this.storageService.setEmployeeId(user.id);
        this.snackBar.open('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับคุณ ' + user.firstName, 'ปิด', { duration: 3000 });
        this.cdr.detectChanges();
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 404) {
          // User not found -> Show register form
          this.isRegistering = true;
          this.initRegisterForm(id);
          this.snackBar.open('ไม่พบข้อมูลพนักงาน กรุณากรอกประวัติเพื่อลงทะเบียนใหม่', 'ปิด', { duration: 5000 });
        } else {
          this.snackBar.open('เกิดข้อผิดพลาดในการตรวจสอบรหัสพนักงาน: ' + (err.error?.error || err.message), 'ปิด', { duration: 5000 });
        }
        this.cdr.detectChanges();
      }
    });
  }

  onRegisterSubmit(): void {
    if (this.registerForm.invalid) return;

    const rawVal = this.registerForm.getRawValue();
    const payload: User = {
      id: rawVal.id,
      firstName: rawVal.firstName,
      lastName: rawVal.lastName,
      position: rawVal.position,
      department: rawVal.department,
      regionGroup: rawVal.regionGroup.toUpperCase()
    };

    this.isLoading = true;
    this.cdr.detectChanges();

    this.apiService.createUser(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.isRegistering = false;
        this.storageService.setUser(res.data);
        this.storageService.setEmployeeId(res.data.id);
        this.snackBar.open('ลงทะเบียนและเข้าสู่ระบบสำเร็จ', 'ปิด', { duration: 3000 });
        this.cdr.detectChanges();
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('ลงทะเบียนพนักงานไม่สำเร็จ: ' + (err.error?.error || err.message), 'ปิด', { duration: 5000 });
        this.cdr.detectChanges();
      }
    });
  }

  cancelRegister(): void {
    this.isRegistering = false;
    this.loginForm.reset();
    this.cdr.detectChanges();
  }
}
