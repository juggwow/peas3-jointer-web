import { Injectable } from '@angular/core';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  constructor() {}

  getCurrentLocation(): Promise<LocationCoords> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          latitude: 13.736717,
          longitude: 100.523186,
          error: 'Geolocation is not supported by this browser.'
        });
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude
          });
        },
        (error) => {
          let errorMessage = 'Failed to retrieve location.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'User denied the request for Geolocation.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'The request to get user location timed out.';
              break;
          }
          resolve({
            latitude: 13.7563,
            longitude: 100.5018,
            error: errorMessage
          });
        },
        options
      );
    });
  }
}
