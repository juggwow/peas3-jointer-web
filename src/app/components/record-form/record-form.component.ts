import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ApiService } from '../../services/api.service';
import { GeolocationService } from '../../services/geolocation.service';
import { StorageService } from '../../services/storage.service';

import * as L from 'leaflet';

const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';
const defaultIcon = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = defaultIcon;

interface ImageFile {
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-record-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  template: `
    <div class="form-container animate-fade-in">
      <mat-card class="pea-card">
        <mat-card-header>
          <div class="form-title">
            <mat-icon>add_location_alt</mat-icon>
            บันทึกการติดตั้ง Cable Termination ใหม่ (Angular 22)
          </div>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="recordForm" (ngSubmit)="onSubmit()">
            
            <!-- 1. Operator Information Section -->
            <div class="section-divider">ข้อมูลผู้ปฏิบัติงาน</div>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>รหัสพนักงาน (7 หลัก)</mat-label>
                <input matInput formControlName="userId" placeholder="ตัวอย่าง: 1023456" maxlength="7">
                <mat-error *ngIf="recordForm.get('userId')?.hasError('required')">
                  กรุณากรอกรหัสพนักงาน
                </mat-error>
                <mat-error *ngIf="recordForm.get('userId')?.hasError('pattern')">
                  รหัสพนักงานต้องเป็นตัวเลข 7 หลักเท่านั้น
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>วันที่ติดตั้ง</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="installationDate">
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-error *ngIf="recordForm.get('installationDate')?.hasError('required')">
                  กรุณาเลือกวันที่ติดตั้ง
                </mat-error>
              </mat-form-field>
            </div>

            <!-- 2. Cable Termination Technical Information Section -->
            <div class="section-divider">รายละเอียดการติดตั้ง</div>
            <div class="form-grid">
              <div class="select-with-custom-container">
                <mat-form-field appearance="outline">
                  <mat-label>ประเภทการติดตั้ง (Operation Type)</mat-label>
                  <mat-select formControlName="operationType" (selectionChange)="onOperationTypeChange($event.value)">
                    <mat-option value="New Installation">ติดตั้งใหม่ (New Installation)</mat-option>
                    <mat-option value="Maintenance">บำรุงรักษา (Maintenance)</mat-option>
                    <mat-option value="Replacement">เปลี่ยนใหม่ (Replacement)</mat-option>
                    <mat-option value="Repair">ซ่อมแซม (Repair)</mat-option>
                    <mat-option value="Other">อื่นๆ (ระบุเอง)</mat-option>
                  </mat-select>
                  <mat-error *ngIf="recordForm.get('operationType')?.hasError('required')">
                    กรุณาเลือกประเภทการติดตั้ง
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" *ngIf="recordForm.get('operationType')?.value === 'Other'" class="animate-fade-in">
                  <mat-label>ระบุประเภทการติดตั้งอื่น ๆ</mat-label>
                  <input matInput formControlName="operationTypeCustom" placeholder="ตัวอย่าง: ย้ายแนวสายเคเบิล">
                  <mat-error *ngIf="recordForm.get('operationTypeCustom')?.hasError('required')">
                    กรุณาระบุประเภทการติดตั้ง
                  </mat-error>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline">
                <mat-label>ชื่อวงจร (Circuit Name)</mat-label>
                <input matInput formControlName="circuitName" placeholder="ตัวอย่าง: F12-03 Main Feeder">
                <mat-error *ngIf="recordForm.get('circuitName')?.hasError('required')">
                  กรุณากรอกชื่อวงจร
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-grid">
              <div class="phase-container">
                <label class="radio-label">เฟส (Phase):</label>
                <mat-radio-group formControlName="phase" color="primary">
                  <mat-radio-button value="A">Phase A</mat-radio-button>
                  <mat-radio-button value="B">Phase B</mat-radio-button>
                  <mat-radio-button value="C">Phase C</mat-radio-button>
                </mat-radio-group>
                <mat-error *ngIf="recordForm.get('phase')?.touched && recordForm.get('phase')?.hasError('required')" class="radio-error">
                  กรุณาเลือกเฟส
                </mat-error>
              </div>

              <div class="select-with-custom-container">
                <mat-form-field appearance="outline">
                  <mat-label>ประเภทวัสดุ Termination</mat-label>
                  <mat-select formControlName="terminationType" (selectionChange)="onTerminationTypeChange($event.value)">
                    <mat-option value="Cold Shrink 3M (Indoor)">Cold Shrink 3M (Indoor)</mat-option>
                    <mat-option value="Cold Shrink 3M (Outdoor)">Cold Shrink 3M (Outdoor)</mat-option>
                    <mat-option value="Heat Shrink Raychem (Indoor)">Heat Shrink Raychem (Indoor)</mat-option>
                    <mat-option value="Heat Shrink Raychem (Outdoor)">Heat Shrink Raychem (Outdoor)</mat-option>
                    <mat-option value="Elbow Connector">Elbow Connector (15kV / 22kV)</mat-option>
                    <mat-option value="Straight Joint">Straight Joint</mat-option>
                    <mat-option value="Other">อื่นๆ (ระบุเอง)</mat-option>
                  </mat-select>
                  <mat-error *ngIf="recordForm.get('terminationType')?.hasError('required')">
                    กรุณาเลือกหรือระบุประเภท Termination
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" *ngIf="recordForm.get('terminationType')?.value === 'Other'" class="animate-fade-in">
                  <mat-label>ระบุประเภทวัสดุอื่น ๆ</mat-label>
                  <input matInput formControlName="terminationTypeCustom" placeholder="ตัวอย่าง: Cold Shrink Brand X">
                  <mat-error *ngIf="recordForm.get('terminationTypeCustom')?.hasError('required')">
                    กรุณาระบุประเภทวัสดุ
                  </mat-error>
                </mat-form-field>
              </div>
            </div>

            <!-- 3. Geographic Coordinates Section -->
            <div class="section-divider">
              ตำแหน่งพิกัดทางภูมิศาสตร์
              <button type="button" mat-stroked-button color="accent" (click)="getUserLocation()" class="gps-btn">
                <mat-icon>my_location</mat-icon>
                ดึงพิกัดปัจจุบันจาก GPS
              </button>
            </div>
            
            <p class="location-help-text">
              * ท่านสามารถดึงพิกัดจาก GPS มือถือจริง หรือใช้เมาส์ลากจุดหมุดบนแผนที่ หรือป้อนพิกัดตัวเลขโดยตรงเพื่อระบุตำแหน่งการติดตั้ง
            </p>

            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Latitude (ละติจูด)</mat-label>
                <input matInput type="number" step="any" formControlName="latitude" (change)="onCoordsChange()">
                <mat-error *ngIf="recordForm.get('latitude')?.hasError('required')">
                  กรุณากรอกพิกัดละติจูด
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Longitude (ลองจิจูด)</mat-label>
                <input matInput type="number" step="any" formControlName="longitude" (change)="onCoordsChange()">
                <mat-error *ngIf="recordForm.get('longitude')?.hasError('required')">
                  กรุณากรอกพิกัดลองจิจูด
                </mat-error>
              </mat-form-field>
            </div>

            <!-- Map Container -->
            <div id="form-map" class="map-container mb-24"></div>

            <!-- 4. Image Upload Section -->
            <div class="section-divider">ภาพถ่ายจุดติดตั้งสายเคเบิลใต้ดิน</div>
            
            <div class="upload-area">
              <input type="file" #fileInput id="file-uploader" (change)="onFileSelected($event)" accept="image/*" multiple class="hidden-input">
              <label for="file-uploader" class="upload-box-label">
                <mat-icon class="upload-icon">add_a_photo</mat-icon>
                <span>กดที่นี่เพื่อเพิ่มรูปภาพ หรือถ่ายภาพจากกล้องมือถือ</span>
                <span class="upload-subtext">จำกัดขนาดไฟล์ไม่เกิน 5MB ต่อภาพ</span>
              </label>
            </div>

            <!-- Selected Images Preview -->
            <div *ngIf="imageQueue.length > 0" class="image-preview-grid">
              <div *ngFor="let img of imageQueue; let i = index" class="preview-card">
                <img [src]="img.previewUrl" alt="Image preview">
                <div class="preview-info">
                  <span class="file-name">{{ img.file.name | slice:0:15 }}...</span>
                  <span class="file-size">{{ (img.file.size / 1024 / 1024) | number:'1.1-2' }} MB</span>
                </div>
                <button type="button" class="remove-img-btn" (click)="removeImage(i)" title="ลบภาพนี้">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>

            <!-- Progress Bar -->
            <div *ngIf="submitting" class="progress-section">
              <p class="progress-text">{{ statusText }}</p>
              <mat-progress-bar mode="determinate" [value]="uploadProgress"></mat-progress-bar>
            </div>

            <!-- Actions buttons -->
            <div class="form-actions">
              <button type="button" mat-button routerLink="/" [disabled]="submitting">
                ยกเลิก
              </button>
              <button type="submit" mat-raised-button color="primary" [disabled]="!recordForm.valid || submitting" class="submit-btn">
                <mat-icon>save</mat-icon>
                บันทึกข้อมูล
              </button>
            </div>

          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px 16px;
    }

    .section-divider {
      font-weight: 500;
      font-size: 1.1rem;
      color: var(--primary-color);
      margin: 24px 0 16px 0;
      padding-bottom: 6px;
      border-bottom: 2px solid #E2E8F0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .gps-btn {
      height: 36px !important;
      font-size: 0.85rem !important;
      border-radius: 6px !important;
    }

    .location-help-text {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 12px;
    }

    .phase-container {
      display: flex;
      flex-direction: column;
      margin-bottom: 8px;
      justify-content: center;
    }

    .radio-label {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .radio-error {
      font-size: 11px;
      color: var(--danger-color);
      margin-top: 4px;
    }

    .mb-24 {
      margin-bottom: 24px;
    }

    .upload-area {
      border: 2px dashed #CBD5E1;
      border-radius: 12px;
      background-color: var(--bg-color);
      padding: 32px 16px;
      text-align: center;
      cursor: pointer;
      transition: var(--transition-smooth);
      margin-bottom: 16px;
    }

    .upload-area:hover {
      border-color: var(--primary-color);
      background-color: var(--primary-light);
    }

    .hidden-input {
      display: none;
    }

    .upload-box-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: var(--text-muted);
    }

    .upload-box-label span {
      font-weight: 500;
    }

    .upload-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--primary-color);
    }

    .upload-subtext {
      font-size: 0.8rem;
      color: #94A3B8;
    }

    .image-preview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }

    .preview-card {
      position: relative;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
      aspect-ratio: 1;
      box-shadow: var(--shadow-sm);
      background-color: #000;
    }

    .preview-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.85;
    }

    .preview-info {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      font-size: 0.75rem;
      padding: 4px 6px;
      display: flex;
      flex-direction: column;
    }

    .file-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-size {
      opacity: 0.8;
      font-size: 0.7rem;
    }

    .remove-img-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      background: rgba(239, 68, 68, 0.9);
      color: white;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .remove-img-btn:hover {
      background: rgba(220, 38, 38, 1);
    }

    .progress-section {
      margin: 20px 0;
      padding: 12px;
      background-color: var(--primary-light);
      border-radius: 8px;
    }

    .progress-text {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--primary-color);
      margin-bottom: 6px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }

    .select-with-custom-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .submit-btn {
      min-width: 130px;
    }
  `]
})
export class RecordFormComponent implements OnInit, OnDestroy, AfterViewInit {
  recordForm!: FormGroup;
  map!: L.Map;
  marker!: L.Marker;
  imageQueue: ImageFile[] = [];
  submitting = false;
  uploadProgress = 0;
  statusText = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private apiService: ApiService,
    private geolocationService: GeolocationService,
    private storageService: StorageService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  initForm(): void {
    this.recordForm = this.fb.group({
      userId: ['', [Validators.required, Validators.pattern(/^\d{7}$/)]],
      installationDate: [new Date(), Validators.required],
      operationType: ['New Installation', Validators.required],
      operationTypeCustom: [''],
      circuitName: ['', Validators.required],
      phase: ['A', Validators.required],
      terminationType: ['Cold Shrink 3M (Outdoor)', Validators.required],
      terminationTypeCustom: [''],
      latitude: [13.736717, Validators.required],
      longitude: [100.523186, Validators.required]
    });
  }

  onOperationTypeChange(value: string): void {
    const customControl = this.recordForm.get('operationTypeCustom');
    if (value === 'Other') {
      customControl?.setValidators([Validators.required]);
    } else {
      customControl?.clearValidators();
      customControl?.setValue('');
    }
    customControl?.updateValueAndValidity();
  }

  onTerminationTypeChange(value: string): void {
    const customControl = this.recordForm.get('terminationTypeCustom');
    if (value === 'Other') {
      customControl?.setValidators([Validators.required]);
    } else {
      customControl?.clearValidators();
      customControl?.setValue('');
    }
    customControl?.updateValueAndValidity();
  }

  initMap(): void {
    const lat = this.recordForm.get('latitude')?.value;
    const lng = this.recordForm.get('longitude')?.value;

    this.map = L.map('form-map').setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);

    this.marker.on('dragend', () => {
      const position = this.marker.getLatLng();
      this.recordForm.patchValue({
        latitude: parseFloat(position.lat.toFixed(6)),
        longitude: parseFloat(position.lng.toFixed(6))
      });
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const coords = e.latlng;
      this.marker.setLatLng(coords);
      this.recordForm.patchValue({
        latitude: parseFloat(coords.lat.toFixed(6)),
        longitude: parseFloat(coords.lng.toFixed(6))
      });
    });
  }

  onCoordsChange(): void {
    const lat = this.recordForm.get('latitude')?.value;
    const lng = this.recordForm.get('longitude')?.value;
    if (lat && lng && this.marker && this.map) {
      const newLatLng = new L.LatLng(lat, lng);
      this.marker.setLatLng(newLatLng);
      this.map.setView(newLatLng, this.map.getZoom());
    }
  }

  async getUserLocation(): Promise<void> {
    this.snackBar.open('กำลังค้นหาพิกัด GPS ของคุณ...', 'ปิด', { duration: 3000 });
    const coords = await this.geolocationService.getCurrentLocation();
    
    if (coords.error) {
      this.snackBar.open(`ไม่สามารถระบุพิกัดได้: ${coords.error}`, 'ตกลง', { duration: 5000 });
    }

    this.recordForm.patchValue({
      latitude: parseFloat(coords.latitude.toFixed(6)),
      longitude: parseFloat(coords.longitude.toFixed(6))
    });

    if (this.marker && this.map) {
      const newLatLng = new L.LatLng(coords.latitude, coords.longitude);
      this.marker.setLatLng(newLatLng);
      this.map.setView(newLatLng, 17);
    }

    this.snackBar.open('ดึงข้อมูลพิกัด GPS เรียบร้อยแล้ว', 'ตกลง', { duration: 3000 });
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open(`ไฟล์ ${file.name} เกินขนาด 5MB!`, 'ตกลง', { duration: 4000 });
        continue;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageQueue.push({
          file,
          previewUrl: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }

    event.target.value = '';
  }

  removeImage(index: number): void {
    const img = this.imageQueue[index];
    if (img.previewUrl) {
      URL.revokeObjectURL(img.previewUrl);
    }
    this.imageQueue.splice(index, 1);
  }

  onSubmit(): void {
    if (this.recordForm.invalid || this.submitting) return;

    this.submitting = true;
    this.uploadProgress = 10;
    this.statusText = 'กำลังส่งข้อมูลบันทึกไปยังระบบ...';
    this.cdr.detectChanges();

    const formVal = this.recordForm.value;
    const dateObj: Date = formVal.installationDate;

    const opType = formVal.operationType === 'Other' ? formVal.operationTypeCustom : formVal.operationType;
    const termType = formVal.terminationType === 'Other' ? formVal.terminationTypeCustom : formVal.terminationType;
    
    const payload = {
      userId: formVal.userId,
      latitude: Number(formVal.latitude),
      longitude: Number(formVal.longitude),
      operationType: opType,
      circuitName: formVal.circuitName,
      phase: formVal.phase,
      terminationType: termType,
      installationDate: dateObj.toISOString()
    };

    this.apiService.createTermination(payload).subscribe({
      next: (res) => {
        const createdId = res.data.id;
        
        if (!createdId) {
          this.handleError('เซิร์ฟเวอร์ไม่ได้ส่ง ID ประจำรายการกลับมา');
          return;
        }

        // Save to local history
        this.storageService.saveRecord(createdId, payload.circuitName, payload.phase);

        // Upload images if any
        if (this.imageQueue.length > 0) {
          this.uploadProgress = 40;
          this.statusText = `กำลังอัปโหลดรูปภาพ (${this.imageQueue.length} ภาพ)...`;
          this.cdr.detectChanges();
          
          const files = this.imageQueue.map(img => img.file);
          
          this.apiService.uploadImages(createdId, files).subscribe({
            next: (uploadRes) => {
              // Store image key mappings in localStorage!
              if (uploadRes.data && Array.isArray(uploadRes.data)) {
                uploadRes.data.forEach(img => {
                  if (img.id && img.imageKey) {
                    this.storageService.saveImageKey(img.id, img.imageKey);
                  }
                });
              }

              this.uploadProgress = 100;
              this.statusText = 'บันทึกข้อมูลและอัปโหลดภาพเสร็จสิ้น!';
              this.snackBar.open('บันทึกข้อมูลเสร็จเรียบร้อยแล้ว!', 'ตกลง', { duration: 3000 });
              this.cdr.detectChanges();
              setTimeout(() => {
                this.router.navigate(['/record', createdId]);
              }, 1000);
            },
            error: (err) => {
              console.error('Image upload failed', err);
              this.snackBar.open('บันทึกข้อมูลแล้ว แต่ไม่สามารถอัปโหลดบางภาพได้', 'ตกลง', { duration: 6000 });
              this.submitting = false;
              this.cdr.detectChanges();
              this.router.navigate(['/record', createdId]);
            }
          });
        } else {
          this.uploadProgress = 100;
          this.statusText = 'บันทึกข้อมูลเสร็จสิ้น!';
          this.snackBar.open('บันทึกข้อมูลเสร็จเรียบร้อยแล้ว!', 'ตกลง', { duration: 3000 });
          this.cdr.detectChanges();
          setTimeout(() => {
            this.router.navigate(['/record', createdId]);
          }, 1000);
        }
      },
      error: (err) => {
        console.error('Failed to create termination record', err);
        this.handleError(err.error?.error || 'เกิดข้อผิดพลาดในการติดต่อกับเซิร์ฟเวอร์');
      }
    });
  }

  private handleError(message: string): void {
    this.submitting = false;
    this.uploadProgress = 0;
    this.statusText = '';
    this.snackBar.open(`ล้มเหลว: ${message}`, 'ตกลง', { duration: 5000 });
    this.cdr.detectChanges();
  }
}
