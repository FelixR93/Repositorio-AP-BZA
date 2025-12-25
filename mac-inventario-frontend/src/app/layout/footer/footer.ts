import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {
  year = new Date().getFullYear();

  // Opcional (si luego quieres mostrar versión)
  appName = 'Inventario MAC';
  company = 'EXPORTADORA AURÍFERA BONANZA (EXPAUSA.SA)';
  areas = 'Control • Seguridad • Monitoreo';
}
