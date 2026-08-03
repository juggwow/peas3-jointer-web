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
  templateUrl: './record-detail.component.html',
  styleUrl: './record-detail.component.css'
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
