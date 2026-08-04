import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface HistoryItem {
  id: string;
  circuitName: string;
  phase: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private historyKey = 'pea_jointer_history';
  private imageKeysKey = 'pea_jointer_image_keys';
  private employeeIdKey = 'pea_jointer_employee_id';

  private employeeId$ = new BehaviorSubject<string | null>(this.getEmployeeIdFromLocalStorage());

  constructor() {}

  private getEmployeeIdFromLocalStorage(): string | null {
    try {
      return localStorage.getItem(this.employeeIdKey);
    } catch (e) {
      console.error('Failed to read employee ID from localStorage', e);
      return null;
    }
  }

  /**
   * Get employee ID from local storage
   */
  getEmployeeId(): string | null {
    return this.employeeId$.value;
  }

  /**
   * Get employee ID observable
   */
  getEmployeeIdObservable(): Observable<string | null> {
    return this.employeeId$.asObservable();
  }

  /**
   * Save employee ID to local storage
   */
  setEmployeeId(id: string): void {
    try {
      localStorage.setItem(this.employeeIdKey, id);
      this.employeeId$.next(id);
    } catch (e) {
      console.error('Failed to save employee ID to localStorage', e);
    }
  }

  /**
   * Clear employee ID from local storage
   */
  clearEmployeeId(): void {
    try {
      localStorage.removeItem(this.employeeIdKey);
      this.employeeId$.next(null);
    } catch (e) {
      console.error('Failed to remove employee ID from localStorage', e);
    }
  }

  /**
   * Get all local history items
   */
  getHistory(): HistoryItem[] {
    try {
      const data = localStorage.getItem(this.historyKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to read history from localStorage', e);
      return [];
    }
  }

  /**
   * Save a new termination record ID to local history
   */
  saveRecord(id: string, circuitName: string, phase: string): void {
    try {
      const history = this.getHistory();
      if (!history.some(item => item.id === id)) {
        history.unshift({
          id,
          circuitName,
          phase,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem(this.historyKey, JSON.stringify(history.slice(0, 50)));
      }
    } catch (e) {
      console.error('Failed to write history to localStorage', e);
    }
  }

  /**
   * Remove a record from local history
   */
  removeRecord(id: string): void {
    try {
      const history = this.getHistory();
      const filtered = history.filter(item => item.id !== id);
      localStorage.setItem(this.historyKey, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to remove history item', e);
    }
  }

  /**
   * Store the mapping of imageId (UUID) to S3 ImageKey (filename)
   */
  saveImageKey(imageId: string, imageKey: string): void {
    try {
      const mappings = this.getAllImageKeyMappings();
      mappings[imageId] = imageKey;
      localStorage.setItem(this.imageKeysKey, JSON.stringify(mappings));
    } catch (e) {
      console.error('Failed to save image key mapping', e);
    }
  }

  /**
   * Retrieve the S3 ImageKey corresponding to an imageId
   */
  getImageKey(imageId: string): string | undefined {
    try {
      const mappings = this.getAllImageKeyMappings();
      return mappings[imageId];
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Remove a mapped image key
   */
  removeImageKey(imageId: string): void {
    try {
      const mappings = this.getAllImageKeyMappings();
      delete mappings[imageId];
      localStorage.setItem(this.imageKeysKey, JSON.stringify(mappings));
    } catch (e) {
      console.error('Failed to remove image key mapping', e);
    }
  }

  private getAllImageKeyMappings(): Record<string, string> {
    try {
      const data = localStorage.getItem(this.imageKeysKey);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }
}
