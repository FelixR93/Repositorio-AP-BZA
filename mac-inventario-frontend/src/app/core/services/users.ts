import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UserRole } from '../models/user.model';

const API_BASE_URL = 'http://127.0.0.1:4000/api';

export type CreateUserDto = {
  fullName: string;
  username: string;
  password: string;
  role: UserRole;
};

export type UpdateUserDto = {
  fullName: string;
  username: string;
  role: UserRole;
  password?: string; // opcional: si viene, se cambia contraseña
};

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private http: HttpClient) {}

  /** Listar usuarios */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${API_BASE_URL}/users`);
  }

  /** Obtener usuario por id */
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${API_BASE_URL}/users/${id}`);
  }

  /** Crear usuario */
  createUser(data: CreateUserDto): Observable<User> {
    return this.http.post<User>(`${API_BASE_URL}/users`, data);
  }

  /** Actualizar usuario (edición) */
  updateUser(id: string, data: UpdateUserDto): Observable<User> {
    return this.http.put<User>(`${API_BASE_URL}/users/${id}`, data);
  }

  /** Activar / desactivar */
  setActive(id: string, isActive: boolean): Observable<User> {
    return this.http.patch<User>(`${API_BASE_URL}/users/${id}/active`, { isActive });
  }

  /** Eliminar usuario */
  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_BASE_URL}/users/${id}`);
  }
}
