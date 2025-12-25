import { Component, OnDestroy, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, of, combineLatest } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { DevicesService } from '../../../core/services/devices';
import { Device } from '../../../core/models/device.model';
import { downloadBlob } from '../../../core/utils/download.util';

type SortKey =
  | 'createdAt'
  | 'apName'
  | 'ownerName'
  | 'mac'
  | 'deviceType'
  | 'area'
  | 'locationPoint'
  | 'registeredByName';

@Component({
  selector: 'app-devices-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devices-list.html',
  styleUrl: './devices-list.scss',
})
export class DevicesList implements OnInit, OnDestroy {
  private readonly isBrowser: boolean;
  private sub = new Subscription();

  mode: 'GLOBAL' | 'AP' = 'AP';

  apSlug = '';
  apName = '';

  q = '';

  sortKey: SortKey = 'createdAt';
  sortDir: 'asc' | 'desc' = 'desc';

  page = 1;
  pageSize = 20;

  loading = false;
  devices: Device[] = [];

  // ✅ Error visible (NO alert)
  errorMsg = '';

  // ✅ Modal eliminar
  confirmOpen = false;
  deleting = false;
  toDelete: Device | null = null;
  modalError = '';

  // watchdog timers (anti “se queda cargando”)
  private loadTimer: any = null;
  private exportTimer: any = null;
  private deleteTimer: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private devicesService: DevicesService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    // ✅ data (mode) + paramMap (ap) juntos, 1 sola suscripción (evita doble load)
    const s = combineLatest([this.route.data, this.route.paramMap]).subscribe(([d, pm]) => {
      const newMode = ((d?.['mode'] as any) || 'AP') as 'GLOBAL' | 'AP';
      const slug = pm.get('ap') || '';

      this.closeDelete();
      this.errorMsg = '';

      // GLOBAL
      if (newMode === 'GLOBAL') {
        this.mode = 'GLOBAL';
        this.apSlug = 'global';
        this.apName = '';
        this.page = 1;
        this.load();
        return;
      }

      // AP
      this.mode = 'AP';

      if (!slug) {
        this.apSlug = '';
        this.apName = '';
        this.devices = [];
        this.loading = false;
        return;
      }

      const changed = slug !== this.apSlug;
      this.apSlug = slug;
      this.apName = this.fromSlug(slug);

      if (changed) {
        this.q = '';
        this.page = 1;
        this.sortKey = 'createdAt';
        this.sortDir = 'desc';
      }

      this.load();
    });

    this.sub.add(s);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.clearTimer('load');
    this.clearTimer('export');
    this.clearTimer('delete');
  }

  title(): string {
    return this.mode === 'GLOBAL' ? 'Inventario global' : `Inventario — ${this.apName}`;
  }

  subtitle(): string {
    return this.mode === 'GLOBAL'
      ? 'Busca por MAC, dueño, punto, AP o registrado por.'
      : 'Visualización por AP. Cada registro muestra quién lo creó.';
  }

  // -------------------
  // ✅ LOAD (anti-cuelgue)
  // -------------------
  load() {
    if (!this.isBrowser) return;

    this.closeDelete();
    this.errorMsg = '';
    this.loading = true;

    this.startTimer('load', () => {
      this.loading = false;
      this.devices = [];
      this.errorMsg =
        '⏱️ No hubo respuesta del servidor en 16s. Revisa backend (http://localhost:4000) / CORS / token.';
    });

    // ✅ SOLO apName (backend filtra por req.query.ap)
    const apFilterName = this.mode === 'GLOBAL' ? '' : this.apName;

    const s = this.devicesService.getDevices(apFilterName, this.q).pipe(
      catchError((err) => {
        this.devices = [];
        this.errorMsg =
          err?.error?.message ||
          `No se pudo cargar el inventario. (${err?.status || 'sin status'})`;
        return of([] as Device[]);
      }),
      finalize(() => {
        this.clearTimer('load');
        this.loading = false;
      })
    ).subscribe((items) => {
      this.devices = items || [];
      const maxPage = this.totalPages;
      if (this.page > maxPage) this.page = Math.max(1, maxPage);
    });

    this.sub.add(s);
  }

  search() { this.page = 1; this.load(); }
  clear() { this.q = ''; this.page = 1; this.load(); }

  setSort(key: SortKey) {
    if (this.sortKey === key) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else {
      this.sortKey = key;
      this.sortDir = key === 'createdAt' ? 'desc' : 'asc';
    }
  }

  get sorted(): Device[] {
    const arr = [...this.devices];
    const dir = this.sortDir === 'asc' ? 1 : -1;

    return arr.sort((a, b) => {
      const av: any = (a as any)[this.sortKey];
      const bv: any = (b as any)[this.sortKey];

      if (this.sortKey === 'createdAt') {
        const ta = new Date(av || 0).getTime();
        const tb = new Date(bv || 0).getTime();
        return (ta - tb) * dir;
      }

      const sa = String(av || '').toLowerCase();
      const sb = String(bv || '').toLowerCase();
      return sa.localeCompare(sb) * dir;
    });
  }

  get paged(): Device[] {
    const start = (this.page - 1) * this.pageSize;
    return this.sorted.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.devices.length / this.pageSize));
  }

  next() { if (this.page < this.totalPages) this.page++; }
  prev() { if (this.page > 1) this.page--; }

  exportExcel() {
    this.errorMsg = '';

    this.startTimer('export', () => {
      this.errorMsg = '⏱️ Exportación sin respuesta en 16s. Revisa backend.';
    });

    // ✅ SOLO apName
    const apName = this.mode === 'GLOBAL' ? '' : this.apName;

    const s = this.devicesService.exportExcel(apName).pipe(
      catchError((err) => {
        this.errorMsg = err?.error?.message || 'No se pudo exportar.';
        return of(null as any);
      }),
      finalize(() => this.clearTimer('export'))
    ).subscribe((blob) => {
      if (!blob) return;

      const name = this.mode === 'GLOBAL'
        ? `Inventario_GLOBAL.xlsx`
        : `Inventario_${this.apSlug}.xlsx`;

      downloadBlob(blob, name);
    });

    this.sub.add(s);
  }

  importExcel() {
    if (this.mode === 'GLOBAL') {
      this.errorMsg = 'La importación es por AP. Entra a un AP específico.';
      return;
    }
    this.router.navigateByUrl(`/inventory/${this.apSlug}/import`);
  }

  newDevice() {
    if (this.mode === 'GLOBAL') {
      this.errorMsg = 'El registro manual es por AP. Entra a un AP específico.';
      return;
    }
    this.router.navigateByUrl(`/inventory/${this.apSlug}/new`);
  }

  // ✅ Edit: GLOBAL -> usa el AP real del registro
  edit(d: Device) {
    if (!d._id) return;

    if (this.mode === 'GLOBAL') {
      const realSlug = this.toSlug(d.apName || '');
      if (!realSlug) {
        this.errorMsg = 'Este registro no tiene AP válido.';
        return;
      }
      this.router.navigateByUrl(`/inventory/${realSlug}/${d._id}/edit`);
      return;
    }

    this.router.navigateByUrl(`/inventory/${this.apSlug}/${d._id}/edit`);
  }

  // -----------------------------
  // Modal eliminar (anti-cuelgue)
  // -----------------------------
  openDelete(d: Device) {
    this.toDelete = d;
    this.confirmOpen = true;
    this.modalError = '';
    this.deleting = false;
  }

  closeDelete() {
    this.confirmOpen = false;
    this.toDelete = null;
    this.modalError = '';
    this.deleting = false;
  }

  confirmDelete() {
    if (!this.toDelete?._id || this.deleting) return;

    this.deleting = true;
    this.modalError = '';

    this.startTimer('delete', () => {
      this.deleting = false;
      this.modalError = '⏱️ Eliminar sin respuesta en 16s. Revisa backend.';
    });

    const s = this.devicesService.deleteDevice(this.toDelete._id).pipe(
      catchError((err) => {
        this.modalError = err?.error?.message || 'No se pudo eliminar.';
        return of(null as any);
      }),
      finalize(() => {
        this.clearTimer('delete');
        this.deleting = false;
      })
    ).subscribe((resp) => {
      if (!resp) return;
      this.closeDelete();
      this.load();
    });

    this.sub.add(s);
  }

  private fromSlug(slug: string): string {
    return String(slug || '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private toSlug(ap: string): string {
    return String(ap || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }

  private startTimer(kind: 'load' | 'export' | 'delete', onFire: () => void) {
    this.clearTimer(kind);
    const t = setTimeout(onFire, 16000);
    if (kind === 'load') this.loadTimer = t;
    if (kind === 'export') this.exportTimer = t;
    if (kind === 'delete') this.deleteTimer = t;
  }

  private clearTimer(kind: 'load' | 'export' | 'delete') {
    const t =
      kind === 'load' ? this.loadTimer :
      kind === 'export' ? this.exportTimer :
      this.deleteTimer;

    if (t) clearTimeout(t);

    if (kind === 'load') this.loadTimer = null;
    if (kind === 'export') this.exportTimer = null;
    if (kind === 'delete') this.deleteTimer = null;
  }
}
