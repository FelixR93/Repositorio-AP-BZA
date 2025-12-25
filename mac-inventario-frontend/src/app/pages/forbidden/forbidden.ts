import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './forbidden.html',
  styleUrl: './forbidden.scss'
})
export class Forbidden {
  constructor(private router: Router) {}

  goHome() {
    this.router.navigateByUrl('/');
  }

  goBack() {
    history.back();
  }
}
