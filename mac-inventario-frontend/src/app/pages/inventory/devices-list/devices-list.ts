import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DevicesService } from '../../../core/services/devices';
import { Device } from '../../../core/models/device.model';
import { downloadBlob } from '../../../core/utils/download.util';

type SortKey = 'createdAt' | 'ownerName' | 'mac' | 'deviceType' | 'area' | 'locationPoint' | 'registeredByName';

@Component({
  selector: 'app-devices-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devices-list.html',
  styleUrl: './devices-list.scss'
})
export class DevicesList {
  apSlug = '';
  apName = '';

  q = '';

  sortKey: SortKey = 'createdAt';
  sortDir: 'asc' | 'desc' = 'desc';

  page = 1;
  pageSize = 10;

  loading = false;
  devices: Device[] = [];

  confirmOpen = false;
  deleting = false;
  toDelete: Device | null = null;
  modalError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private devicesService: DevicesService
  ) {
    this.apSlug = this.route.snapshot.paramMap.get('ap') || '';

    // ✅ GLOBAL: si apSlug === 'global' entonces apName vacío => trae TODO
    this.apName = this.apSlug === 'global' ? '' : this.fromSlug(this.apSlug);

    this.load();
  }

  load() {
    this.loading = true;

    this.devicesService.getDevices(this.apName, this.q).subscribe({
      next: (items) => {
        this.devices = items || [];
        this.loading = false;

        const maxPage = this.totalPages;
        if (this.page > maxPage) this.page = Math.max(1, maxPage);
      },
      error: (err) => {
        this.loading = false;
        alert(err?.error?.message || 'No se pudo cargar el inventario.');
      }
    });
  }

  titleLabel(): string {
    return this.apSlug === 'global' ? 'GLOBAL (Todos los APs)' : this.apName;
  }

  search() {
    this.page = 1;
    this.load();
  }

  clear() {
    this.q = '';
    this.page = 1;
    this.load();
  }

  setSort(key: SortKey) {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
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

  next() {
    if (this.page < this.totalPages) this.page++;
  }

  prev() {
    if (this.page > 1) this.page--;
  }

  exportExcel() {
    // ✅ Si es global => exporta todos (sin ap)
    const apParam = this.apSlug === 'global' ? undefined : this.apName;

    this.devicesService.exportExcel(apParam).subscribe({
      next: (blob) => downloadBlob(blob, `Inventario_${this.apSlug || 'dashboard'}.xlsx`),
      error: (err) => alert(err?.error?.message || 'No se pudo exportar.')
    });
  }

  importExcel() {
    // ✅ Import requiere AP, no global (tu negocio)
    if (this.apSlug === 'global') {
      alert('Para importar, selecciona un AP específico.');
      return;
    }
    this.router.navigateByUrl(`/inventory/${this.apSlug}/import`);
  }

  newDevice() {
    if (this.apSlug === 'global') {
      alert('Para crear registros, selecciona un AP específico.');
      return;
    }
    this.router.navigateByUrl(`/inventory/${this.apSlug}/new`);
  }

  edit(d: Device) {
    if (!d._id) return;

    // ✅ Si estás en global, edit igual debe abrir con su ap real
    const slug = this.toSlug(d.apName || this.apName);
    this.router.navigateByUrl(`/inventory/${slug}/${d._id}/edit`);
  }

  openDelete(d: Device) {
    this.toDelete = d;
    this.confirmOpen = true;
    this.modalError = '';
  }

  closeDelete() {
    this.confirmOpen = false;
    this.toDelete = null;
    this.modalError = '';
    this.deleting = false;
  }

  confirmDelete() {
    if (!this.toDelete?._id) return;

    this.deleting = true;
    this.modalError = '';

    this.devicesService.deleteDevice(this.toDelete._id).subscribe({
      next: () => {
        this.deleting = false;
        this.closeDelete();
        this.load();
      },
      error: (err) => {
        this.deleting = false;
        this.modalError = err?.error?.message || 'No se pudo eliminar.';
      }
    });
  }

  private fromSlug(slug: string): string {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private toSlug(name: string): string {
    return String(name || '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }
}
