import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { StatsService, DashboardStats } from '../../core/services/stats';

type LogItem = DashboardStats['recent'][number];
type ActionFilter = 'ALL' | 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'LOGIN';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logs.html',
  styleUrl: './logs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Logs implements OnInit {
  loading = false;
  error = '';

  q = '';
  action: ActionFilter = 'ALL';

  page = 1;
  limit = 20;
  total = 0;
  totalPages = 1;

  items: LogItem[] = [];

  constructor(
    private stats: StatsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.stats.getLogs({ page: this.page, limit: this.limit, q: this.q, action: this.action })
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res) => {
          this.items = res.items || [];
          this.page = res.page || 1;
          this.limit = res.limit || this.limit;
          this.total = res.total || 0;
          this.totalPages = res.totalPages || 1;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudo cargar la bitácora.';
          this.cdr.markForCheck();
        }
      });
  }

  applyFilters() {
    this.page = 1;
    this.load();
  }

  setPage(p: number) {
    const next = Math.min(Math.max(1, p), this.totalPages);
    if (next === this.page) return;
    this.page = next;
    this.load();
  }

  prev() { this.setPage(this.page - 1); }
  next() { this.setPage(this.page + 1); }

  actionClass(action: string): string {
    const a = String(action || '').toUpperCase();
    if (a.includes('CREATE') || a.includes('ADD') || a.includes('IMPORT')) return 'ok';
    if (a.includes('UPDATE') || a.includes('EDIT')) return 'warn';
    if (a.includes('DELETE') || a.includes('REMOVE')) return 'danger';
    if (a.includes('LOGIN')) return 'info';
    return 'neutral';
  }

  formatIp(ip?: string): string {
    const v = (ip || '').trim();
    return v ? v : '—';
  }

  trackByLog = (_: number, l: any) => l?._id || l?.createdAt || _;
}
