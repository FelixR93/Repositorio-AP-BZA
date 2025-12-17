import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { APS } from '../../../core/constants/aps.const';

@Component({
  selector: 'app-ap-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ap-tabs.html',
  styleUrl: './ap-tabs.scss'
})
export class ApTabs {
  aps = APS;

  constructor(private router: Router) {}

  goGlobal() {
    this.router.navigateByUrl('/inventory/global');
  }

  goAp(ap: string) {
    const slug = ap.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    this.router.navigateByUrl(`/inventory/${slug}`);
  }
}
