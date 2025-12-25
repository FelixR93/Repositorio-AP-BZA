import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, finalize } from 'rxjs';

import { APS } from '../../core/constants/aps.const';
import { StatsService, DashboardStats } from '../../core/services/stats';
import { AuthService } from '../../core/services/auth';
import { User } from '../../core/models/user.model';

type DeviceType = 'MOVIL' | 'LAPTOP' | 'PC';
type AreaType = 'MOLINOS' | 'MINA' | 'SEGURIDAD';
type ApItem = { ap: string; count: number; percent: number };

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit, OnDestroy {
  aps = APS;

  loading = false;
  refreshing = false;
  error = '';

  user: User | null = null;

  total = 0;
  byAp: Record<string, number> = {};
  byArea: Record<AreaType, number> = { MOLINOS: 0, MINA: 0, SEGURIDAD: 0 };
  byType: Record<DeviceType, number> = { MOVIL: 0, LAPTOP: 0, PC: 0 };

  logs: DashboardStats['recent'] = [];
  lastUpdated: Date | null = null;

  // UI
  apsModalOpen = false;

  private sub = new Subscription();

  constructor(
    private statsService: StatsService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.resetAll();
  }

  ngOnInit(): void {
    this.user = this.auth.getUser();

    this.sub.add(
      this.auth.user$.subscribe((u) => {
        this.user = u;
        this.cdr.markForCheck();
      })
    );

    this.refresh();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // ----------------------------
  // UI computed
  // ----------------------------
  get isAdmin(): boolean {
    return this.user?.role === 'ADMIN';
  }

  get userLabel(): string {
    const u: any = this.user;
    return u?.fullName || u?.username || u?.nombre || u?.userName || u?.id || 'Usuario';
  }

  get roleLabel(): string {
    return this.user?.role || '—';
  }

  get allApsSorted(): ApItem[] {
    const items: ApItem[] = this.aps.map((ap) => ({
      ap,
      count: this.byAp[ap] || 0,
      percent: this.apPercent(ap),
    }));
    return items.sort((a, b) => b.count - a.count);
  }

  get topAps(): ApItem[] {
    return this.allApsSorted.slice(0, 6);
  }

  get totalAreas(): number {
    return (this.byArea.MOLINOS || 0) + (this.byArea.MINA || 0) + (this.byArea.SEGURIDAD || 0);
  }

  get totalTypes(): number {
    return (this.byType.MOVIL || 0) + (this.byType.LAPTOP || 0) + (this.byType.PC || 0);
  }

  // ----------------------------
  // Actions
  // ----------------------------
  refresh() {
    // evita dobles clicks
    if (this.loading) return;

    this.error = '';
    this.loading = true;
    this.refreshing = true;
    this.cdr.markForCheck();

    const s = this.statsService
      .getDashboard()
      .pipe(
        finalize(() => {
          // ✅ SIEMPRE apaga loading
          this.loading = false;
          this.refreshing = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (data) => {
          this.applyData(data);
          this.lastUpdated = new Date();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudo cargar el dashboard.';
          this.cdr.markForCheck();
        },
      });

    this.sub.add(s);
  }

  openApsModal() {
    this.apsModalOpen = true;
    this.cdr.markForCheck();
  }

  closeApsModal() {
    this.apsModalOpen = false;
    this.cdr.markForCheck();
  }

  // ----------------------------
  // Helpers
  // ----------------------------
  private resetAll() {
    this.total = 0;

    this.byAp = {};
    for (const ap of this.aps) this.byAp[ap] = 0;

    this.byArea = { MOLINOS: 0, MINA: 0, SEGURIDAD: 0 };
    this.byType = { MOVIL: 0, LAPTOP: 0, PC: 0 };

    this.logs = [];
  }

  private applyData(data: DashboardStats) {
    this.resetAll();

    this.total = data?.total || 0;

    for (const x of data.byAp || []) {
      const key = String(x?.apName || '').trim();
      if (!key) continue;
      this.byAp[key] = (this.byAp[key] || 0) + (x.count || 0);
    }

    for (const x of data.byType || []) {
      const k = String(x._id || '').toUpperCase() as DeviceType;
      if (k === 'MOVIL' || k === 'LAPTOP' || k === 'PC') this.byType[k] = x.count || 0;
    }

    for (const x of data.byArea || []) {
      const k = String(x._id || '').toUpperCase() as AreaType;
      if (k === 'MOLINOS' || k === 'MINA' || k === 'SEGURIDAD') this.byArea[k] = x.count || 0;
    }

    this.logs = data.recent || [];
  }

  apPercent(ap: string): number {
    if (!this.total) return 0;
    return Math.round(((this.byAp[ap] || 0) / this.total) * 100);
  }

  areaPercent(k: AreaType): number {
    if (!this.total) return 0;
    return Math.round(((this.byArea[k] || 0) / this.total) * 100);
  }

  typeLabel(k: DeviceType): string {
    if (k === 'MOVIL') return 'Móviles';
    if (k === 'LAPTOP') return 'Laptops';
    return 'PCs';
  }

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

  trackByAp = (_: number, x: ApItem) => x.ap;
  trackByLog = (_: number, l: any) => l?._id || l?.createdAt || _;
}
