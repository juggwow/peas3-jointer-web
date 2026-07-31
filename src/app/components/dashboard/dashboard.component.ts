import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { StorageService, HistoryItem } from '../../services/storage.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="dashboard-container animate-fade-in">
      <!-- Welcome Hero Section -->
      <div class="hero-banner">
        <div class="hero-content">
          <div class="pea-logo-circle">
            <span class="material-icons logo-icon">electric_bolt</span>
          </div>
          <div class="hero-text">
            <h1>ระบบบันทึกข้อมูลการติดตั้ง Termination สายเคเบิลใต้ดิน</h1>
            <p>การไฟฟ้าส่วนภูมิภาค (Provincial Electricity Authority)</p>
          </div>
        </div>
      </div>

      <!-- Quick Action Cards & Stats -->
      <div class="stats-grid">
        <mat-card class="action-card pea-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon class="card-title-icon main-purple">assignment</mat-icon>
              บันทึกข้อมูลการติดตั้ง
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>บันทึกการติดตั้ง Cable Termination ใหม่ พร้อมระบุพิกัด GPS และอัปโหลดภาพถ่าย</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="accent" routerLink="/record/new" class="action-btn">
              <mat-icon>add_location_alt</mat-icon>
              เริ่มบันทึกข้อมูล
            </button>
          </mat-card-actions>
        </mat-card>

        <mat-card class="stat-info-card pea-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon class="card-title-icon main-orange">history</mat-icon>
              จำนวนรายการที่บันทึก
            </mat-card-title>
          </mat-card-header>
          <mat-card-content class="stat-content">
            <div class="huge-number">{{ historyList.length }}</div>
            <p>รายการที่ดำเนินการโดยเครื่องนี้ (ประวัติการบันทึก)</p>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Recent History List -->
      <div class="history-section pea-card">
        <h2 class="form-title">
          <mat-icon>list_alt</mat-icon>
          ประวัติการบันทึกข้อมูลล่าสุด
        </h2>

        <div *ngIf="historyList.length === 0" class="empty-state">
          <mat-icon class="empty-icon">history_toggle_off</mat-icon>
          <p>ยังไม่มีประวัติการบันทึกข้อมูลในเครื่องนี้</p>
          <button mat-stroked-button color="primary" routerLink="/record/new">
            กดเพื่อเริ่มต้นบันทึกรายการแรก
          </button>
        </div>

        <div *ngIf="historyList.length > 0" class="history-list">
          <div *ngFor="let item of historyList" class="history-item">
            <div class="item-icon-wrapper">
              <mat-icon class="item-icon">check_circle</mat-icon>
            </div>
            <div class="item-details">
              <div class="item-title">
                วงจร: <strong>{{ item.circuitName }}</strong> (Phase {{ item.phase }})
              </div>
              <div class="item-meta">
                ID: {{ item.id }} • วันที่บันทึก: {{ item.timestamp | date:'dd/MM/yyyy HH:mm' }} น.
              </div>
            </div>
            <div class="item-actions">
              <button mat-raised-button color="primary" [routerLink]="['/record', item.id]" class="view-btn">
                <mat-icon>visibility</mat-icon>
                ดูรายละเอียด
              </button>
              <button mat-icon-button color="warn" (click)="deleteHistory(item.id)" title="ลบออกจากประวัติ">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 24px 16px;
    }

    .hero-banner {
      background: linear-gradient(135deg, var(--primary-color) 0%, #a448aa 100%);
      color: white;
      border-radius: 20px;
      padding: 32px;
      margin-bottom: 28px;
      box-shadow: var(--shadow-md);
      position: relative;
      overflow: hidden;
    }

    .hero-banner::after {
      content: '';
      position: absolute;
      right: -5%;
      bottom: -30%;
      width: 300px;
      height: 300px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 50%;
    }

    .hero-content {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .pea-logo-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .logo-icon {
      font-size: 36px;
      color: #FFF;
    }

    .hero-text h1 {
      font-size: 1.8rem;
      font-weight: 600;
      margin: 0 0 4px 0;
    }

    .hero-text p {
      font-size: 1rem;
      opacity: 0.9;
      margin: 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
      margin-bottom: 28px;
    }

    @media (min-width: 768px) {
      .stats-grid {
        grid-template-columns: 2fr 1fr;
      }
    }

    .action-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .action-card p {
      color: var(--text-muted);
      margin: 12px 0 20px 0;
    }

    .card-title-icon {
      margin-right: 8px;
      vertical-align: middle;
    }

    .main-purple {
      color: var(--primary-color);
    }

    .main-orange {
      color: var(--accent-color);
    }

    .action-btn {
      width: 100%;
      height: 48px !important;
      font-size: 1.05rem !important;
    }

    .stat-info-card {
      text-align: center;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px 0;
    }

    .huge-number {
      font-size: 3.5rem;
      font-weight: 700;
      color: var(--primary-color);
      line-height: 1;
      margin-bottom: 8px;
    }

    .stat-content p {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .history-section {
      background: white;
    }

    .empty-state {
      text-align: center;
      padding: 48px 16px;
      color: var(--text-muted);
    }

    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
      color: #94A3B8;
    }

    .empty-state p {
      margin-bottom: 16px;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 16px;
    }

    .history-item {
      display: flex;
      align-items: center;
      padding: 16px;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      background-color: var(--bg-color);
      transition: var(--transition-smooth);
    }

    .history-item:hover {
      border-color: var(--primary-light);
      background-color: #FFF;
      box-shadow: var(--shadow-sm);
    }

    .item-icon-wrapper {
      margin-right: 16px;
      color: var(--success-color);
      display: flex;
      align-items: center;
    }

    .item-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .item-details {
      flex-grow: 1;
    }

    .item-title {
      font-size: 1.05rem;
      margin-bottom: 4px;
    }

    .item-meta {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .item-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .view-btn {
      height: 38px !important;
      border-radius: 6px !important;
    }
  `]
})
export class DashboardComponent implements OnInit {
  historyList: HistoryItem[] = [];

  constructor(private storageService: StorageService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.historyList = this.storageService.getHistory();
  }

  deleteHistory(id: string): void {
    if (confirm('คุณต้องการลบรายการนี้ออกจากประวัติในเครื่องนี้ใช่หรือไม่? (ข้อมูลในเซิร์ฟเวอร์จะไม่ถูกลบ)')) {
      this.storageService.removeRecord(id);
      this.loadHistory();
    }
  }
}
