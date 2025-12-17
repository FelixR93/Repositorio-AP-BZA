import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE_URL = 'http://localhost:4000/api';

export interface DashboardStats {
  total: number;
  byAp: Array<{ apName: string; count: number }>;
  byType: Array<{ _id: string; count: number }>;
  byArea: Array<{ _id: string; count: number }>;
  recent: Array<{
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT';
    message: string;
    userName: string;
    role: string;
    ip: string;
    createdAt: string;
    apName?: string;
    mac?: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${API_BASE_URL}/stats/dashboard`);
  }
}
