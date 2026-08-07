import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { ApiService, CableTermination } from '../../services/api.service';
import { ThaiDatePipe } from '../../pipes/thai-date.pipe';
import { BehaviorSubject, combineLatest, Subscription, timer, of } from 'rxjs';
import { debounce, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs/operators';


@Component({
  selector: 'app-record-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    ThaiDatePipe
  ],
  templateUrl: './record-list.component.html',
  styleUrl: './record-list.component.css'
})
export class RecordListComponent implements OnInit, OnDestroy {
  dataSource: CableTermination[] = [];
  displayedColumns: string[] = [
    'index',
    'circuitName',
    'peaName',
    'phase',
    'operationType',
    'terminationType',
    'installationDate',
    'userId',
    'actions'
  ];

  totalCount = 0;
  page = 1;
  limit = 10;
  searchQuery = '';
  isLoading = false;

  private pageSubject = new BehaviorSubject<number>(1);
  private limitSubject = new BehaviorSubject<number>(10);
  private searchSubject = new BehaviorSubject<string>('');
  private stateSubscription?: Subscription;

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.stateSubscription = combineLatest([
      this.pageSubject.pipe(distinctUntilChanged()),
      this.limitSubject.pipe(distinctUntilChanged()),
      this.searchSubject.pipe(
        // Instant emit on empty search query, otherwise debounce 400ms
        debounce((val) => val === '' ? timer(0) : timer(400)),
        distinctUntilChanged()
      )
    ]).pipe(
      tap(([page, limit, search]) => {
        this.isLoading = true;
        this.page = page;
        this.limit = limit;
        this.searchQuery = search;
        this.cdr.detectChanges();
      }),
      switchMap(([page, limit, search]) => {
        return this.apiService.getTerminations(page, limit, search).pipe(
          catchError((err) => {
            console.error('Failed to load terminations:', err);
            this.isLoading = false;
            this.cdr.detectChanges();
            return of({ data: [], totalCount: 0, page, limit, totalPages: 1 });
          })
        );
      })
    ).subscribe({
      next: (res) => {
        this.dataSource = res.data;
        this.totalCount = res.totalCount;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
  }

  onPageChange(event: PageEvent): void {
    this.pageSubject.next(event.pageIndex + 1);
    this.limitSubject.next(event.pageSize);
  }

  onSearchChange(value: string): void {
    this.pageSubject.next(1); // Reset page to 1 on search change
    this.searchSubject.next(value.trim());
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.pageSubject.next(1);
    this.searchSubject.next('');
    this.cdr.detectChanges();
  }
}
