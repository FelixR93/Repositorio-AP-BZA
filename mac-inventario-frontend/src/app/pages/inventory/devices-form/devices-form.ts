import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DevicesService } from '../../../core/services/devices';
import { Device, AreaType, DeviceType } from '../../../core/models/device.model';

@Component({
  selector: 'app-devices-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devices-form.html',
  styleUrl: './devices-form.scss'
})
export class DevicesForm {
  apSlug = '';
  apName = '';
  id: string | null = null;

  isEdit = false;

  loading = false;
  saving = false;
  error = '';
  success = '';

  deviceTypes: DeviceType[] = ['MOVIL', 'LAPTOP', 'PC'];
  areas: AreaType[] = ['CONTROL', 'SEGURIDAD', 'MONITOREO'];

  form: Device = {
    apName: '',
    ownerName: '',
    mac: '',
    deviceType: 'LAPTOP',
    area: 'CONTROL',
    locationPoint: '',
    brand: '',
    model: '',
    serial: '',
    hostname: '',
    notes: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private devicesService: DevicesService
  ) {
    this.apSlug = this.route.snapshot.paramMap.get('ap') || '';
    this.apName = this.fromSlug(this.apSlug);

    this.id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.id;

    this.form.apName = this.apName;

    if (this.isEdit && this.id) {
      this.loadDevice(this.id);
    }
  }

  private loadDevice(id: string) {
    this.loading = true;
    this.error = '';

    this.devicesService.getDeviceById(id).subscribe({
      next: (d) => {
        this.loading = false;
        this.form = {
          ...d,
          apName: d.apName || this.apName
        };
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'No se pudo cargar el registro.';
      }
    });
  }

  save() {
    this.error = '';
    this.success = '';

    this.form.mac = this.normalizeMac(this.form.mac);

    if (!this.form.ownerName || !this.form.mac || !this.form.locationPoint) {
      this.error = 'Completa los campos obligatorios.';
      return;
    }

    if (!this.isEdit) {
      this.form.apName = this.apName;
    }

    this.saving = true;

    const req$ = this.isEdit && this.id
      ? this.devicesService.updateDevice(this.id, this.form)
      : this.devicesService.createDevice(this.form);

    req$.subscribe({
      next: () => {
        this.saving = false;
        this.success = this.isEdit
          ? 'Registro actualizado correctamente.'
          : 'Dispositivo registrado correctamente.';

        setTimeout(() => this.back(), 600);
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'No se pudo guardar.';
      }
    });
  }

  cancel() {
    this.back();
  }

  private back() {
    this.router.navigateByUrl(`/inventory/${this.apSlug}`);
  }

  private fromSlug(slug: string): string {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  private normalizeMac(mac: string): string {
    const clean = String(mac || '').toUpperCase().replace(/[^0-9A-F]/g, '');
    if (clean.length !== 12) return mac;
    return clean.match(/.{1,2}/g)!.join(':');
  }
}
