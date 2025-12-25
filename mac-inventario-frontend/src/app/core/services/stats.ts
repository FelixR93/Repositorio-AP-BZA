import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE_URL = 'http://127.0.0.1:4000/api';

export interface DashboardStats {
  total: number;
  byAp: Array<{ apName: string; count: number }>;
  byType: Array<{ _id: string; count: number }>;
  byArea: Array<{ _id: string; count: number }>;
  recent: Array<{
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'LOGIN';
    message: string;
    userName: string;
    role: string;
    ip: string;
    createdAt: string;
    apName?: string;
    mac?: string;
  }>;
}

export interface LogsPage<T> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: T[];
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${API_BASE_URL}/stats/dashboard`);
  }

  // ✅ NUEVO: logs paginados
  getLogs(params?: {
    page?: number;
    limit?: number;
    q?: string;
    action?: string; // ALL | CREATE | UPDATE...
  }): Observable<LogsPage<DashboardStats['recent'][number]>> {
    let p = new HttpParams();

    if (params?.page) p = p.set('page', String(params.page));
    if (params?.limit) p = p.set('limit', String(params.limit));
    if (params?.q) p = p.set('q', params.q);
    if (params?.action) p = p.set('action', params.action);

    return this.http.get<LogsPage<DashboardStats['recent'][number]>>(
      `${API_BASE_URL}/stats/logs`,
      { params: p }
    );
  }
}
