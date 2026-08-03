import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TerminationImage {
  id: string;
  terminationId: string;
  imageKey?: string;
  imageUrl: string;
  uploadedAt: string;
}

export interface CableTermination {
  id?: string;
  userId: string;
  latitude: number;
  longitude: number;
  operationType: string;
  circuitName: string;
  phase: string;
  terminationType: string;
  installationDate: string;
  createdAt?: string;
  images?: TerminationImage[];
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  createTermination(termination: CableTermination): Observable<{ message: string; data: CableTermination }> {
    return this.http.post<{ message: string; data: CableTermination }>(
      `${this.baseUrl}/terminations`,
      termination
    );
  }

  uploadImages(terminationId: string, files: File[]): Observable<{ message: string; data: TerminationImage[] }> {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    return this.http.post<{ message: string; data: TerminationImage[] }>(
      `${this.baseUrl}/termination/${terminationId}/images`,
      formData
    );
  }

  deleteImage(terminationId: string, imageKey: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/termination/${terminationId}/images/${imageKey}`
    );
  }

  getTermination(id: string): Observable<CableTermination> {
    return this.http.get<CableTermination>(`${this.baseUrl}/termination/${id}`);
  }

  getTerminations(page: number, limit: number, search?: string, userId?: string): Observable<PaginatedResponse<CableTermination>> {
    let url = `${this.baseUrl}/terminations?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    if (userId) {
      url += `&userId=${encodeURIComponent(userId)}`;
    }
    return this.http.get<PaginatedResponse<CableTermination>>(url);
  }

  getImageUrl(imageId: string): string {
    return `${this.baseUrl}/images/${imageId}`;
  }
}
