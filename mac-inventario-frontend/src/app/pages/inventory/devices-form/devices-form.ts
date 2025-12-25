import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { DevicesService } from '../../../core/services/devices';
import { Device, AreaType, DeviceType } from '../../../core/models/device.model';

@Component({
  selector: 'app-devices-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devices-form.html',
  styleUrl: './devices-form.scss'
})
export class DevicesForm implements OnInit, OnDestroy {
  private readonly isBrowser: boolean;
  private sub = new Subscription();

  apSlug = '';
  apName = '';

  id: string | null = null;
  isEdit = false;

  loading = false;
  saving = false;
  deleting = false;

  error = '';
  success = '';

  deviceTypes: DeviceType[] = ['MOVIL', 'LAPTOP', 'PC'];
  areas: AreaType[] = ['MOLINOS', 'MINA', 'SEGURIDAD'];

  deleteModalOpen = false;

  form: Device = this.blankForm();

  private loadTimer: any = null;
  private saveTimer: any = null;
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
    if (!this.isBrowser) {
      this.loading = false;
      return;
    }

    const s = this.route.paramMap.subscribe((pm) => {
      this.apSlug = pm.get('ap') || '';
      this.apName = this.fromSlug(this.apSlug);

      this.id = pm.get('id');
      this.isEdit = !!this.id;

      // reset UI
      this.error = '';
      this.success = '';
      this.deleteModalOpen = false;
      this.saving = false;
      this.deleting = false;

      if (!this.isEdit) {
        this.clearAllTimers();
        this.loading = false;
        this.form = this.blankForm();
        this.form.apName = this.apName;
        return;
      }

      this.loadDevice(this.id!);
    });

    this.sub.add(s);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.clearAllTimers();
  }

  private blankForm(): Device {
    return {
      apName: '',
      ownerName: '',
      mac: '',
      deviceType: 'LAPTOP',
      area: 'MOLINOS',
      locationPoint: '',
      brand: '',
      model: '',
      serial: '',
      hostname: '',
      notes: ''
    };
  }

  private loadDevice(id: string) {
    this.clearTimer('load');
    this.loading = true;
    this.error = '';
    this.success = '';

    this.startTimer('load', () => {
      this.loading = false;
      this.error = '⏱️ No hubo respuesta del servidor en 16s (cargar). Revisa backend.';
    });

    const s = this.devicesService.getDeviceById(id).pipe(
      catchError((err) => {
        this.error = err?.error?.message || `No se pudo cargar el registro. (${err?.status || 'sin status'})`;
        return of(null as any);
      }),
      finalize(() => {
        this.clearTimer('load');
        this.loading = false;
      })
    ).subscribe((d) => {
      if (!d) return;
      this.form = { ...d, apName: d.apName || this.apName };
    });

    this.sub.add(s);
  }

  save() {
    if (!this.isBrowser) return;
    if (this.saving || this.loading || this.deleting) return;

    this.error = '';
    this.success = '';

    const macNorm = this.normalizeMacStrict(this.form.mac);
    if (!macNorm) {
      this.error = 'MAC inválida. Ej: E8:89:47:76:3C:0E (solo 0-9 y A-F).';
      return;
    }

    if (!this.form.ownerName?.trim() || !this.form.locationPoint?.trim()) {
      this.error = 'Completa los campos obligatorios: Dueño, MAC y Punto.';
      return;
    }

    const payload: Device = {
      ...this.form,
      mac: macNorm,
      apName: this.isEdit ? (this.form.apName || this.apName) : this.apName
    };

    this.saving = true;

    this.clearTimer('save');
    this.startTimer('save', () => {
      this.saving = false;
      this.error = '⏱️ No hubo respuesta del servidor en 16s (guardar). Revisa backend.';
    });

    const req$ = this.isEdit && this.id
      ? this.devicesService.updateDevice(this.id, payload)
      : this.devicesService.createDevice(payload);

    const s = req$.pipe(
      catchError((err) => {
        this.error = err?.error?.message || `No se pudo guardar. (${err?.status || 'sin status'})`;
        return of(null as any);
      }),
      finalize(() => {
        this.clearTimer('save');
        this.saving = false;
      })
    ).subscribe((res) => {
      if (!res) return;

      this.success = this.isEdit
        ? '✅ Registro actualizado correctamente.'
        : '✅ MAC agregada correctamente.';

      if (!this.isEdit) {
        // ✅ te quedas para registrar más
        this.form = this.blankForm();
        this.form.apName = this.apName;
        setTimeout(() => (this.success = ''), 2000);
        return;
      }

      setTimeout(() => this.back(), 1200);
    });

    this.sub.add(s);
  }

  openDelete() {
    if (!this.isEdit) return;
    this.deleteModalOpen = true;
  }

  closeDelete() {
    this.deleteModalOpen = false;
  }

  confirmDelete() {
    if (!this.isBrowser) return;
    if (!this.isEdit || !this.id || this.deleting) return;

    this.deleting = true;
    this.error = '';
    this.success = '';

    this.clearTimer('delete');
    this.startTimer('delete', () => {
      this.deleting = false;
      this.error = '⏱️ No hubo respuesta del servidor en 16s (eliminar). Revisa backend.';
    });

    const s = this.devicesService.deleteDevice(this.id).pipe(
      catchError((err) => {
        this.error = err?.error?.message || `No se pudo eliminar. (${err?.status || 'sin status'})`;
        return of(null as any);
      }),
      finalize(() => {
        this.clearTimer('delete');
        this.deleting = false;
      })
    ).subscribe((resp) => {
      if (!resp) return;
      this.success = resp?.message || '✅ Registro eliminado correctamente.';
      setTimeout(() => this.back(), 600);
    });

    this.sub.add(s);
  }

  cancel() { this.back(); }

  private back() {
    const slug = this.apSlug || this.toSlug(this.apName);
    this.router.navigateByUrl(`/inventory/${slug}`);
  }

  private fromSlug(slug: string): string {
    return String(slug || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  private toSlug(ap: string): string {
    return String(ap || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }

  private normalizeMacStrict(mac: string): string {
    const clean = String(mac || '').trim().toUpperCase().replace(/[^0-9A-F]/g, '');
    if (clean.length !== 12) return '';
    return clean.match(/.{1,2}/g)!.join(':');
  }

  private startTimer(kind: 'load' | 'save' | 'delete', onFire: () => void) {
    this.clearTimer(kind);
    const t = setTimeout(onFire, 16000);
    if (kind === 'load') this.loadTimer = t;
    if (kind === 'save') this.saveTimer = t;
    if (kind === 'delete') this.deleteTimer = t;
  }

  private clearTimer(kind: 'load' | 'save' | 'delete') {
    const t =
      kind === 'load' ? this.loadTimer :
      kind === 'save' ? this.saveTimer :
      this.deleteTimer;

    if (t) clearTimeout(t);

    if (kind === 'load') this.loadTimer = null;
    if (kind === 'save') this.saveTimer = null;
    if (kind === 'delete') this.deleteTimer = null;
  }

  private clearAllTimers() {
    this.clearTimer('load');
    this.clearTimer('save');
    this.clearTimer('delete');
  }
}
