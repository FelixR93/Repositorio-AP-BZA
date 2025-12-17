import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { APS } from '../../core/constants/aps.const';
import { StatsService, DashboardStats } from '../../core/services/stats';
import { AuthService } from '../../core/services/auth';
import { User } from '../../core/models/user.model';

type DeviceType = 'MOVIL' | 'LAPTOP' | 'PC';
type AreaType = 'CONTROL' | 'SEGURIDAD' | 'MONITOREO';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  aps = APS;

  loading = false;
  error = '';

  user: User | null = null;

  total = 0;

  byAp: Record<string, number> = {};
  byArea: Record<AreaType, number> = { CONTROL: 0, SEGURIDAD: 0, MONITOREO: 0 };
  byType: Record<DeviceType, number> = { MOVIL: 0, LAPTOP: 0, PC: 0 };

  // ✅ Bitácora (ADMIN)
  logs: DashboardStats['recent'] = [];

  constructor(
    private statsService: StatsService,
    private auth: AuthService
  ) {
    this.user = this.auth.getUser();
    this.auth.user$.subscribe(u => (this.user = u));

    // init
    for (const ap of this.aps) this.byAp[ap] = 0;

    this.refresh();
  }

  get isAdmin(): boolean {
    return this.user?.role === 'ADMIN';
  }

  refresh() {
    this.loading = true;
    this.error = '';

    this.statsService.getDashboard().subscribe({
      next: (data) => {
        this.loading = false;

        this.total = data.total;

        // reset
        this.byAp = {};
        for (const ap of this.aps) this.byAp[ap] = 0;

        this.byArea = { CONTROL: 0, SEGURIDAD: 0, MONITOREO: 0 };
        this.byType = { MOVIL: 0, LAPTOP: 0, PC: 0 };

        // byAp (backend ya devuelve todos los APs)
        for (const x of data.byAp || []) {
          this.byAp[x.apName] = x.count;
        }

        // byType
        for (const x of data.byType || []) {
          const k = (String(x._id || '').toUpperCase() as DeviceType);
          if (k === 'MOVIL' || k === 'LAPTOP' || k === 'PC') this.byType[k] = x.count;
        }

        // byArea
        for (const x of data.byArea || []) {
          const k = (String(x._id || '').toUpperCase() as AreaType);
          if (k === 'CONTROL' || k === 'SEGURIDAD' || k === 'MONITOREO') this.byArea[k] = x.count;
        }

        // logs
        this.logs = data.recent || [];
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'No se pudo cargar el dashboard.';
      }
    });
  }

  apPercent(ap: string): number {
    if (!this.total) return 0;
    return Math.round(((this.byAp[ap] || 0) / this.total) * 100);
  }
}
