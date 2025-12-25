import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Device } from '../models/device.model';
import { ImportResult } from '../models/import-result.model';

const API_BASE_URL = 'http://127.0.0.1:4000/api';

@Injectable({ providedIn: 'root' })
export class DevicesService {
  constructor(private http: HttpClient) {}

  /** Listar dispositivos (opcional por AP y búsqueda) */
  getDevices(apName?: string, q?: string): Observable<Device[]> {
    let params = new HttpParams();
    if (apName) params = params.set('ap', apName);
    if (q) params = params.set('q', q);
    return this.http.get<Device[]>(`${API_BASE_URL}/devices`, { params });
  }

  /** Crear dispositivo */
  createDevice(data: Device): Observable<Device> {
    return this.http.post<Device>(`${API_BASE_URL}/devices`, data);
  }

  /** Obtener por ID */
  getDeviceById(id: string): Observable<Device> {
    return this.http.get<Device>(`${API_BASE_URL}/devices/${id}`);
  }

  /** Actualizar */
  updateDevice(id: string, data: Device): Observable<Device> {
    return this.http.put<Device>(`${API_BASE_URL}/devices/${id}`, data);
  }

  /** Eliminar */
  deleteDevice(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_BASE_URL}/devices/${id}`);
  }

  /** Exportar Excel (por AP o todos) */
  exportExcel(apName?: string): Observable<Blob> {
    let params = new HttpParams();
    if (apName) params = params.set('ap', apName);

    return this.http.get(`${API_BASE_URL}/devices/export`, {
      params,
      responseType: 'blob'
    });
  }

  /** Descargar plantilla (si existe) */
  downloadTemplate(apName?: string): Observable<Blob> {
    let params = new HttpParams();
    if (apName) params = params.set('ap', apName);

    return this.http.get(`${API_BASE_URL}/devices/template`, {
      params,
      responseType: 'blob'
    });
  }

  /** Importar Excel */
  importExcel(file: File, apName?: string): Observable<ImportResult> {
    const form = new FormData();
    form.append('file', file);

    let params = new HttpParams();
    if (apName) params = params.set('ap', apName);

    return this.http.post<ImportResult>(`${API_BASE_URL}/devices/import`, form, { params });
  }
}
