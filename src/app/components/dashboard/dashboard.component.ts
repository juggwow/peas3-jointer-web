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
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
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
