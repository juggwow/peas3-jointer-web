import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

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

  getImageUrl(imageId: string): string {
    return `${this.baseUrl}/images/${imageId}`;
  }
}
