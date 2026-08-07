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

import { Subscription } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { GeolocationService } from '../../services/geolocation.service';
import { StorageService, FormDraft } from '../../services/storage.service';
import { resizeImage, isSupportedImageType } from '../../utils/image-utils';

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
  templateUrl: './record-form.component.html',
  styleUrl: './record-form.component.css'
})
export class RecordFormComponent implements OnInit, OnDestroy, AfterViewInit {
  recordForm!: FormGroup;
  map!: L.Map;
  marker!: L.Marker;
  imageQueue: ImageFile[] = [];
  submitting = false;
  uploadProgress = 0;
  statusText = '';
  private formSubscription?: Subscription;

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

  ngOnInit(): void {
    const savedUserId = this.storageService.getEmployeeId();
    if (!savedUserId) {
      this.snackBar.open('กรุณากรอกรหัสพนักงานก่อนดำเนินการบันทึกข้อมูล', 'ปิด', { duration: 5000 });
      this.router.navigate(['/']);
      return;
    }

    // Subscribe to form value changes to save draft
    this.formSubscription = this.recordForm.valueChanges.subscribe(value => {
      if (!this.submitting) {
        this.storageService.saveFormDraft(value);
      }
    });

    // Check for existing draft and offer to restore
    const draft = this.storageService.getFormDraft();
    if (draft) {
      setTimeout(() => {
        const snackBarRef = this.snackBar.open('พบข้อมูลแบบร่างที่คุณกรอกไว้ก่อนหน้านี้', 'กู้คืนข้อมูล', {
          duration: 10000
        });
        snackBarRef.onAction().subscribe(() => {
          this.restoreDraft(draft);
        });
      }, 500);
    }
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
  }

  restoreDraft(draft: FormDraft): void {
    if (!draft) return;

    let parsedDate = new Date();
    if (draft.installationDate) {
      parsedDate = new Date(draft.installationDate);
    }

    this.recordForm.patchValue({
      installationDate: parsedDate,
      operationType: draft.operationType,
      operationTypeCustom: draft.operationTypeCustom,
      circuitName: draft.circuitName,
      phase: draft.phase,
      terminationType: draft.terminationType,
      terminationTypeCustom: draft.terminationTypeCustom,
      latitude: draft.latitude,
      longitude: draft.longitude
    });

    if (draft.operationType) {
      this.onOperationTypeChange(draft.operationType);
    }
    if (draft.terminationType) {
      this.onTerminationTypeChange(draft.terminationType);
    }

    this.onCoordsChange();
    this.snackBar.open('กู้คืนข้อมูลแบบร่างเรียบร้อยแล้ว', 'ตกลง', { duration: 3000 });
  }

  initForm(): void {
    const savedUserId = this.storageService.getEmployeeId();
    this.recordForm = this.fb.group({
      userId: [{ value: savedUserId || '', disabled: !!savedUserId }, [Validators.required, Validators.pattern(/^\d{6,7}$/)]],
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

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files: FileList | null = target.files;
    if (!files || files.length === 0) return;

    this.snackBar.open('กำลังประมวลผลและบีบอัดรูปภาพ...', 'ปิด', { duration: 2000 });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!isSupportedImageType(file)) {
        this.snackBar.open(`ไฟล์ ${file.name} ไม่รองรับ! อนุญาตเฉพาะ JPEG, PNG และ HEIC`, 'ตกลง', { duration: 5000 });
        continue;
      }

      if (file.size > 20 * 1024 * 1024) {
        this.snackBar.open(`ไฟล์ ${file.name} เกินขนาด 20MB!`, 'ตกลง', { duration: 4000 });
        continue;
      }

      resizeImage(file).then(resizedFile => {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          this.imageQueue.push({
            file: resizedFile,
            previewUrl: e.target?.result as string
          });
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(resizedFile);
      }).catch(err => {
        console.error('Failed to process image:', err);
        // Fallback to original
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          this.imageQueue.push({
            file,
            previewUrl: e.target?.result as string
          });
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      });
    }

    target.value = '';
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

    const formVal = this.recordForm.getRawValue();
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
      installationDate: dateObj.toISOString(),
      regionGroup: this.storageService.getUser()?.regionGroup || 'L00000'
    };

    this.apiService.createTermination(payload).subscribe({
      next: (res) => {
        const createdId = res.data.id;
        
        if (!createdId) {
          this.handleError('เซิร์ฟเวอร์ไม่ได้ส่ง ID ประจำรายการกลับมา');
          return;
        }

        // Clear draft since it is successfully submitted
        this.storageService.clearFormDraft();

        // Save to local history
        this.storageService.saveRecord(createdId, payload.circuitName, payload.phase);

        // Upload images if any
        if (this.imageQueue.length > 0) {
          this.uploadProgress = 50;
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
