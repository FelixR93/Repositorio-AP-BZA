import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApsResponse } from '../models/ap.model';
import { Observable } from 'rxjs';

const API_BASE_URL = 'http://127.0.0.1:4000/api';

@Injectable({ providedIn: 'root' })
export class ApsService {
  constructor(private http: HttpClient) {}

  getAps(): Observable<ApsResponse> {
    return this.http.get<ApsResponse>(`${API_BASE_URL}/aps`);
  }
}
