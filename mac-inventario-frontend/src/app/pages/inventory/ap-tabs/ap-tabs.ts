import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { APS } from '../../../core/constants/aps.const';

@Component({
  selector: 'app-ap-tabs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ap-tabs.html',
  styleUrl: './ap-tabs.scss'
})
export class ApTabs {
  // ✅ APS es readonly (por "as const"), así que lo tipamos como readonly
  aps: readonly string[] = APS;

  q = '';

  constructor(private router: Router) {}

  goGlobal() {
    this.router.navigateByUrl('/inventory/global');
  }

  goAp(ap: string) {
    const slug = this.toSlug(ap);
    this.router.navigateByUrl(`/inventory/${slug}`);
  }

  // ✅ Devuelve readonly string[] para que coincida con APS
  get filteredAps(): readonly string[] {
    const term = String(this.q || '').trim().toLowerCase();

    // ✅ si no hay término, devolvemos una copia para evitar problemas de tipos
    if (!term) return [...this.aps];

    return this.aps.filter(ap => ap.toLowerCase().includes(term));
  }

  private toSlug(ap: string): string {
    return String(ap || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }
}
