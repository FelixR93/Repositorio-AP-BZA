import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { User } from '../models/user.model';

const API_BASE_URL = 'http://127.0.0.1:4000/api';
const TOKEN_KEY = 'bonanza_token';
const USER_KEY = 'bonanza_user';

export interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly isBrowser: boolean;

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    // ✅ solo en navegador
    if (this.isBrowser) {
      this.userSubject.next(this.readUser());
    }
  }

  // -----------------------------
  // LOGIN
  // -----------------------------
  login(username: string, password: string): Observable<LoginResponse> {
    const body = { username: username.trim(), password };

    return this.http.post<LoginResponse>(`${API_BASE_URL}/auth/login`, body).pipe(
      tap((res) => {
        // ✅ guardar SIEMPRE antes de emitir usuario
        if (this.isBrowser) {
          this.setToken(res.token);
          this.setUser(res.user);
        }
        this.userSubject.next(res.user);
      })
    );
  }

  // -----------------------------
  // LOGOUT
  // -----------------------------
  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    this.userSubject.next(null);
  }

  // -----------------------------
  // TOKEN
  // -----------------------------
  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string) {
    if (!this.isBrowser) return;
    localStorage.setItem(TOKEN_KEY, token);
  }

  // -----------------------------
  // USER
  // -----------------------------
  getUser(): User | null {
    return this.userSubject.value;
  }

  setUser(user: User) {
    if (!this.isBrowser) return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(roles: string[]): boolean {
    const u = this.getUser();
    return !!u && roles.includes(u.role);
  }

  private readUser(): User | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
