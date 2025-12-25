import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private pending = 0;
  private readonly _loading$ = new BehaviorSubject<boolean>(false);

  get loading$(): Observable<boolean> {
    return this._loading$.asObservable();
  }

  show(): void {
    this.pending++;
    if (this.pending === 1) {
      queueMicrotask(() => this._loading$.next(true));
    }
  }

  hide(): void {
    if (this.pending > 0) this.pending--;
    if (this.pending === 0) {
      queueMicrotask(() => this._loading$.next(false));
    }
  }

  reset(): void {
    this.pending = 0;
    queueMicrotask(() => this._loading$.next(false));
  }
}
