import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ApiService, CableTermination, TerminationImage } from '../../services/api.service';
import { StorageService } from '../../services/storage.service';

import * as L from 'leaflet';

@Component({
  selector: 'app-record-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="detail-container animate-fade-in">
      
      <!-- Loading State -->
      <div *ngIf="loading" class="loading-wrapper">
        <mat-spinner color="primary" diameter="50"></mat-spinner>
        <p>กำลังโหลดข้อมูลจากเซิร์ฟเวอร์...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMsg && !loading" class="error-wrapper pea-card">
        <mat-icon color="warn" class="error-icon">error</mat-icon>
        <h2>ไม่พบข้อมูลรายการ</h2>
        <p>{{ errorMsg }}</p>
        <button mat-raised-button color="primary" routerLink="/">
          กลับไปยังหน้าหลัก
        </button>
      </div>

      <!-- Main Detail View -->
      <div *ngIf="record && !loading" class="detail-content">
        
        <!-- Header Controls -->
        <div class="header-controls">
          <button mat-button routerLink="/">
            <mat-icon>arrow_back</mat-icon>
            กลับหน้าหลัก
          </button>
          
          <div class="header-badges">
            <span class="badge" [ngClass]="getPhaseClass(record.phase)">
              Phase {{ record.phase }}
            </span>
            <span class="badge badge-op">
              {{ record.operationType }}
            </span>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="detail-grid">
          
          <!-- Text Details Card -->
          <mat-card class="pea-card info-card">
            <mat-card-header>
              <div class="form-title">
                <mat-icon>info</mat-icon>
                ข้อมูลสายเคเบิลใต้ดิน (Angular 22)
              </div>
            </mat-card-header>
            <mat-card-content>
              <table class="info-table">
                <tr>
                  <th>รหัสวงจร (Circuit):</th>
                  <td><strong>{{ record.circuitName }}</strong></td>
                </tr>
                <tr>
                  <th>รหัสพนักงานผู้ติดตั้ง:</th>
                  <td>{{ record.userId }}</td>
                </tr>
                <tr>
                  <th>ประเภทวัสดุ (Type):</th>
                  <td>{{ record.terminationType }}</td>
                </tr>
                <tr>
                  <th>วันที่ติดตั้ง:</th>
                  <td>{{ record.installationDate | date:'dd MMMM yyyy' }}</td>
                </tr>
                <tr>
                  <th>วันเวลาที่บันทึกระบบ:</th>
                  <td>{{ record.createdAt | date:'dd/MM/yyyy HH:mm:ss' }} น.</td>
                </tr>
                <tr>
                  <th>ละติจูด (Latitude):</th>
                  <td>{{ record.latitude }}</td>
                </tr>
                <tr>
                  <th>ลองจิจูด (Longitude):</th>
                  <td>{{ record.longitude }}</td>
                </tr>
              </table>
            </mat-card-content>
          </mat-card>

          <!-- Geographic Map Card -->
          <mat-card class="pea-card map-card">
            <mat-card-header>
              <div class="form-title">
                <mat-icon>map</mat-icon>
                พิกัดสถานที่ติดตั้ง
              </div>
            </mat-card-header>
            <mat-card-content>
              <div id="detail-map" class="map-container"></div>
            </mat-card-content>
          </mat-card>

        </div>

        <!-- Photo Gallery Card -->
        <mat-card class="pea-card gallery-card mb-24">
          <mat-card-header class="gallery-header">
            <div class="form-title">
              <mat-icon>collections</mat-icon>
              รูปภาพการทำงาน ({{ record.images?.length || 0 }} ภาพ)
            </div>
            
            <div class="gallery-actions">
              <input type="file" #addFileInput id="add-file-uploader" (change)="uploadMoreImages($event)" accept="image/*" multiple class="hidden-input">
              <label for="add-file-uploader" class="add-photos-btn" [ngClass]="{'disabled': uploadingImages}">
                <mat-icon>{{ uploadingImages ? 'sync' : 'add_a_photo' }}</mat-icon>
                <span>{{ uploadingImages ? 'กำลังอัปโหลด...' : 'เพิ่มรูปภาพ' }}</span>
              </label>
            </div>
          </mat-card-header>

          <mat-card-content>
            <div *ngIf="!record.images || record.images.length === 0" class="empty-gallery">
              <mat-icon class="gallery-empty-icon">no_photography</mat-icon>
              <p>ยังไม่มีภาพถ่ายของรายการติดตั้งนี้</p>
            </div>

            <div *ngIf="record.images && record.images.length > 0" class="images-grid">
              <div *ngFor="let img of record.images" class="gallery-item-card">
                <div class="img-wrapper" (click)="openFullScreen(img)">
                  <img [src]="getImageUrl(img.id)" alt="Termination image">
                </div>
                <div class="img-footer">
                  <span class="upload-date">{{ img.uploadedAt | date:'dd/MM/yy HH:mm' }} น.</span>
                  <button mat-icon-button color="warn" class="delete-img-btn" (click)="deleteImage(img)" title="ลบภาพนี้" [disabled]="deletingId === img.id">
                    <mat-icon *ngIf="deletingId !== img.id">delete_forever</mat-icon>
                    <mat-spinner *ngIf="deletingId === img.id" diameter="18" color="warn"></mat-spinner>
                  </button>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

      </div>
    </div>

    <!-- Fullscreen Modal View for Image -->
    <div *ngIf="activeFullImg" class="fullscreen-modal" (click)="closeFullScreen()">
      <button class="close-modal-btn" (click)="closeFullScreen()">
        <mat-icon>close</mat-icon>
      </button>
      <img [src]="getImageUrl(activeFullImg.id)" alt="Fullscreen termination image" (click)="$event.stopPropagation()">
      <div class="modal-info">
        <p>บันทึกเมื่อ: {{ activeFullImg.uploadedAt | date:'dd/MM/yyyy HH:mm:ss' }} น.</p>
      </div>
    </div>
  `,
  styles: [`
    .detail-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 24px 16px;
    }

    .loading-wrapper, .error-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 16px;
      text-align: center;
      background: white;
      border-radius: 16px;
      margin-top: 40px;
    }

    .loading-wrapper p {
      margin-top: 16px;
      color: var(--text-muted);
    }

    .error-icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
      margin-bottom: 16px;
    }

    .error-wrapper h2 {
      margin-bottom: 8px;
    }

    .error-wrapper p {
      color: var(--text-muted);
      margin-bottom: 24px;
    }

    .header-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .header-badges {
      display: flex;
      gap: 8px;
    }

    .badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
      color: white;
    }

    .badge-phase-a { background-color: #E2B93B; color: #1E293B; }
    .badge-phase-b { background-color: #EF4444; }
    .badge-phase-c { background-color: #3B82F6; }
    
    .badge-op {
      background-color: var(--primary-light);
      color: var(--primary-color);
      border: 1px solid var(--primary-color);
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    @media (min-width: 768px) {
      .detail-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }

    .info-table th {
      text-align: left;
      padding: 12px 8px;
      color: var(--text-muted);
      font-weight: 500;
      border-bottom: 1px solid var(--border-color);
      width: 45%;
    }

    .info-table td {
      padding: 12px 8px;
      border-bottom: 1px solid var(--border-color);
    }

    .info-table tr:last-child th,
    .info-table tr:last-child td {
      border-bottom: none;
    }

    .mb-24 {
      margin-bottom: 24px;
    }

    .gallery-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .gallery-actions {
      display: flex;
      align-items: center;
    }

    .hidden-input {
      display: none;
    }

    .add-photos-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      background-color: var(--accent-light);
      color: var(--accent-color);
      border: 1px solid var(--accent-color);
      font-weight: 500;
      font-size: 0.9rem;
      cursor: pointer;
      transition: var(--transition-smooth);
    }

    .add-photos-btn:hover {
      background-color: var(--accent-color);
      color: white;
    }

    .add-photos-btn.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .empty-gallery {
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
      border: 2px dashed var(--border-color);
      border-radius: 12px;
      background-color: var(--bg-color);
    }

    .gallery-empty-icon {
      font-size: 44px;
      width: 44px;
      height: 44px;
      color: #94A3B8;
      margin-bottom: 8px;
    }

    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .gallery-item-card {
      border: 1px solid var(--border-color);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      background-color: white;
      transition: var(--transition-smooth);
    }

    .gallery-item-card:hover {
      box-shadow: var(--shadow-md);
      transform: scale(1.02);
    }

    .img-wrapper {
      width: 100%;
      aspect-ratio: 4/3;
      cursor: pointer;
      background-color: #F1F5F9;
      overflow: hidden;
    }

    .img-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .img-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background-color: var(--bg-color);
      border-top: 1px solid var(--border-color);
    }

    .upload-date {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .delete-img-btn {
      width: 32px !important;
      height: 32px !important;
      display: flex !important;
      align-items: center;
      justify-content: center;
    }

    .fullscreen-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.95);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .fullscreen-modal img {
      max-width: 100%;
      max-height: 80vh;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }

    .close-modal-btn {
      position: absolute;
      top: 24px;
      right: 24px;
      background: rgba(255,255,255,0.1);
      color: white;
      border: none;
      border-radius: 50%;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: var(--transition-smooth);
    }

    .close-modal-btn:hover {
      background: rgba(255,255,255,0.25);
    }

    .close-modal-btn mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .modal-info {
      margin-top: 16px;
      color: #94A3B8;
      font-size: 0.9rem;
    }
  `]
})
export class RecordDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  recordId!: string;
  record: CableTermination | null = null;
  loading = true;
  errorMsg = '';
  map: L.Map | null = null;
  marker: L.Marker | null = null;
  deletingId = '';
  uploadingImages = false;
  activeFullImg: TerminationImage | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private storageService: StorageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMsg = 'ไม่มี ID ประจำรายการระบุมาใน URL';
      this.loading = false;
      return;
    }
    this.recordId = id;
    this.fetchDetails();
  }

  ngAfterViewInit(): void {
    // Map loaded in fetchDetails
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  fetchDetails(): void {
    this.loading = true;
    this.errorMsg = '';

    this.apiService.getTermination(this.recordId).subscribe({
      next: (res) => {
        this.record = res;
        this.loading = false;
        this.cdr.detectChanges();
        
        if (res.id && res.circuitName && res.phase) {
          this.storageService.saveRecord(res.id, res.circuitName, res.phase);
        }

        setTimeout(() => {
          try {
            this.initMap();
            this.cdr.detectChanges();
          } catch (mapErr) {
            console.error('Map initialization failed:', mapErr);
          }
        }, 100);
      },
      error: (err) => {
        console.error('Failed to get termination details:', err);
        this.errorMsg = err.status === 404 
          ? 'ไม่พบข้อมูลรายการติดตั้งนี้ในระบบ (404 Not Found)'
          : 'เกิดข้อผิดพลาดในการโหลดข้อมูลพิกัดและรายละเอียดจากเซิร์ฟเวอร์';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  initMap(): void {
    if (!this.record) return;

    const lat = this.record.latitude;
    const lng = this.record.longitude;

    this.destroyMap();

    const mapDiv = document.getElementById('detail-map');
    if (!mapDiv) return;

    this.map = L.map('detail-map').setView([lat, lng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    const popupHtml = `
      <div style="font-family: 'Kanit', sans-serif;">
        <strong>วงจร: ${this.record.circuitName}</strong><br>
        เฟส: Phase ${this.record.phase}<br>
        ประเภท: ${this.record.terminationType}
      </div>
    `;

    this.marker = L.marker([lat, lng])
      .addTo(this.map)
      .bindPopup(popupHtml)
      .openPopup();
  }

  destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

  getImageUrl(id: string): string {
    return this.apiService.getImageUrl(id);
  }

  getPhaseClass(phase: string): string {
    return `badge-phase-${phase.toLowerCase()}`;
  }

  deleteImage(img: TerminationImage): void {
    // 1. Get original key from payload (might be unmasked if API returned it)
    let key = img.imageKey;

    // 2. If empty (since backend masks it), query our localStorage mapping workaround!
    if (!key) {
      key = this.storageService.getImageKey(img.id);
    }

    if (!key) {
      this.snackBar.open('ไม่สามารถลบภาพได้เนื่องจากไม่พบคีย์ข้อมูลดั้งเดิมในประวัติการอัปโหลดของเครื่องนี้', 'ตกลง', { duration: 5000 });
      return;
    }

    if (!confirm('คุณยืนยันที่จะลบรูปภาพนี้ถาวรจากเซิร์ฟเวอร์ใช่หรือไม่?')) {
      return;
    }

    this.deletingId = img.id;
    this.apiService.deleteImage(this.recordId, key).subscribe({
      next: () => {
        this.snackBar.open('ลบรูปภาพสำเร็จ', 'ตกลง', { duration: 2500 });
        this.storageService.removeImageKey(img.id); // Clean map
        this.deletingId = '';
        this.fetchDetails();
      },
      error: (err) => {
        console.error('Delete image failed', err);
        this.snackBar.open('ลบรูปภาพล้มเหลว', 'ตกลง', { duration: 4000 });
        this.deletingId = '';
      }
    });
  }

  uploadMoreImages(event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0 || this.uploadingImages) return;

    const fileList: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open(`ภาพ ${file.name} เกินขนาด 5MB!`, 'ตกลง', { duration: 4000 });
        continue;
      }
      fileList.push(file);
    }

    if (fileList.length === 0) return;

    this.uploadingImages = true;
    this.snackBar.open(`กำลังอัปโหลดรูปภาพใหม่ ${fileList.length} ภาพ...`, 'ปิด', { duration: 2000 });

    this.apiService.uploadImages(this.recordId, fileList).subscribe({
      next: (uploadRes) => {
        // Store image key mappings in localStorage!
        if (uploadRes.data && Array.isArray(uploadRes.data)) {
          uploadRes.data.forEach(img => {
            if (img.id && img.imageKey) {
              this.storageService.saveImageKey(img.id, img.imageKey);
            }
          });
        }

        this.snackBar.open('อัปโหลดรูปภาพเพิ่มเติมเรียบร้อยแล้ว', 'ตกลง', { duration: 3000 });
        this.uploadingImages = false;
        this.fetchDetails();
      },
      error: (err) => {
        console.error('Upload more images failed', err);
        this.snackBar.open('ไม่สามารถอัปโหลดรูปภาพเพิ่มเติมได้', 'ตกลง', { duration: 4000 });
        this.uploadingImages = false;
      }
    });

    event.target.value = '';
  }

  openFullScreen(img: TerminationImage): void {
    this.activeFullImg = img;
  }

  closeFullScreen(): void {
    this.activeFullImg = null;
  }
}
