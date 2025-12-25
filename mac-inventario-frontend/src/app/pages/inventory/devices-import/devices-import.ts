import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DevicesService } from '../../../core/services/devices';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { User } from '../../../core/models/user.model';

type ImportSummary = {
  totalRows: number;
  parsedValid: number;
  inserted: number;
  duplicates: number;
  failed: number;
};

type ImportResponse = {
  summary: ImportSummary;
  inserted: Array<{ id: string; mac: string; apName: string }>;
  duplicates: Array<{
    mac: string;
    message: string;
    existing?: { apName: string; locationPoint: string; ownerName: string };
  }>;
  failed: Array<{
    row?: any;
    errors: string[];
  }>;
};

@Component({
  selector: 'app-devices-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devices-import.html',
  styleUrl: './devices-import.scss',
})
export class DevicesImport {
  apSlug = '';
  apName = '';

  file: File | null = null;

  uploading = false;
  error = '';
  result: ImportResponse | null = null;

  user: User | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private devicesService: DevicesService,
    private auth: AuthService
  ) {
    this.apSlug = this.route.snapshot.paramMap.get('ap') || '';
    this.apName = this.fromSlug(this.apSlug);

    this.user = this.auth.getUser();
    this.auth.user$.subscribe((u) => (this.user = u));
  }

  get importUserName(): string {
    return (this.user as any)?.fullName || (this.user as any)?.username || 'N/D';
  }

  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0] || null;

    this.error = '';
    this.result = null;

    if (!f) {
      this.file = null;
      return;
    }

    if (!f.name.toLowerCase().endsWith('.xlsx')) {
      this.file = null;
      input.value = '';
      this.error = 'Archivo inválido. Debe ser .xlsx';
      return;
    }

    this.file = f;
  }

  upload() {
    this.error = '';
    this.result = null;

    if (!this.file) {
      this.error = 'Selecciona un archivo .xlsx';
      return;
    }

    this.uploading = true;

    this.devicesService.importExcel(this.file, this.apName).subscribe({
      next: (res: any) => {
        this.uploading = false;
        this.result = {
          ...res,
          inserted: res.inserted || [],
          duplicates: res.duplicates || [],
          failed: res.failed || [],
        };
      },
      error: (err: any) => {
        this.uploading = false;
        this.error = err?.error?.message || 'No se pudo importar el archivo.';
      },
    });
  }

  back() {
    this.router.navigateByUrl(`/inventory/${this.apSlug}`);
  }

  downloadTemplate() {
    this.devicesService.downloadTemplate(this.apName).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Plantilla_Import_${this.apSlug}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err: any) => alert(err?.error?.message || 'No se pudo descargar la plantilla.'),
    });
  }

  private fromSlug(slug: string): string {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
