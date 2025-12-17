import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService, CreateUserDto, UpdateUserDto } from '../../../core/services/users';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {
  loading = false;
  error = '';

  q = '';
  users: User[] = [];

  // Crear
  creating = false;
  createForm: CreateUserDto = {
    fullName: '',
    username: '',
    password: '',
    role: 'USER',
  };

  // Editar (modal)
  editOpen = false;
  savingEdit = false;
  editError = '';
  editTarget: User | null = null;
  editForm: UpdateUserDto = {
    fullName: '',
    username: '',
    role: 'USER',
    password: '',
  };

  // Eliminar (modal)
  deleteOpen = false;
  deleting = false;
  deleteError = '';
  deleteTarget: User | null = null;

  constructor(private usersService: UsersService) {
    this.load();
  }

  /** Normaliza para soportar _id o id, e isActive opcional */
  private normalize(u: User): User {
    return {
      ...u,
      _id: (u as any)._id || (u as any).id,
      isActive: (u as any).isActive ?? true,
    } as any;
  }

  load() {
    this.loading = true;
    this.error = '';

    this.usersService.getUsers().subscribe({
      next: (items: User[]) => {
        this.users = (items || []).map((u) => this.normalize(u));
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.error =
          err?.error?.message ||
          err?.message ||
          `Error ${err?.status}` ||
          'No se pudo cargar usuarios.';
      },
    });
  }

  get filtered(): User[] {
    const term = String(this.q || '')
      .trim()
      .toLowerCase();
    if (!term) return this.users;

    return this.users.filter((u) => {
      const name = String((u as any).fullName || '').toLowerCase();
      const user = String((u as any).username || '').toLowerCase();
      const role = String((u as any).role || '').toLowerCase();
      return name.includes(term) || user.includes(term) || role.includes(term);
    });
  }

  // ---------- Crear ----------
  create() {
    this.error = '';

    if (!this.createForm.fullName || !this.createForm.username || !this.createForm.password) {
      this.error = 'Completa: Nombre, Usuario y Contraseña.';
      return;
    }

    this.creating = true;

    this.usersService.createUser(this.createForm).subscribe({
      next: () => {
        this.creating = false;
        this.createForm = { fullName: '', username: '', password: '', role: 'USER' };
        this.load();
      },
      error: (err: any) => {
        this.creating = false;
        this.error =
          err?.error?.message ||
          err?.message ||
          `Error ${err?.status}` ||
          'No se pudo crear el usuario.';
      },
    });
  }

  // ---------- Editar ----------
  openEdit(u: User) {
    const nu = this.normalize(u);
    this.editTarget = nu;

    this.editForm = {
      fullName: (nu as any).fullName || '',
      username: (nu as any).username || '',
      role: (nu as any).role || 'USER',
      password: '', // opcional
    };

    this.editError = '';
    this.editOpen = true;
  }

  closeEdit() {
    this.editOpen = false;
    this.savingEdit = false;
    this.editError = '';
    this.editTarget = null;
    this.editForm = { fullName: '', username: '', role: 'USER', password: '' };
  }

  saveEdit() {
    if (!this.editTarget) return;
    const id = (this.editTarget as any)._id || (this.editTarget as any).id;
    if (!id) return;

    this.editError = '';

    if (!this.editForm.fullName || !this.editForm.username || !this.editForm.role) {
      this.editError = 'Completa: Nombre, Usuario y Rol.';
      return;
    }

    const payload: any = {
      fullName: this.editForm.fullName,
      username: this.editForm.username,
      role: this.editForm.role,
    };

    // password solo si se escribió
    if (this.editForm.password && String(this.editForm.password).trim()) {
      payload.password = String(this.editForm.password).trim();
    }

    this.savingEdit = true;

    this.usersService.updateUser(id, payload).subscribe({
      next: () => {
        this.savingEdit = false;
        this.closeEdit();
        this.load();
      },
      error: (err: any) => {
        console.error('saveEdit error:', err);
        this.savingEdit = false;
        this.editError =
          err?.error?.message ||
          err?.message ||
          `Error ${err?.status}` ||
          'No se pudo guardar cambios.';
      },
    });
  }

  // ---------- Activar/Desactivar ----------
  toggleActive(u: User) {
    const nu = this.normalize(u);

    // ✅ id SIEMPRE como string (si no existe, salimos)
    const id = String((nu as any)._id || (nu as any).id || '');
    if (!id) return;

    // ✅ calcular nextActive aquí (antes no existía)
    const current = Boolean((nu as any).isActive ?? true);
    const nextActive = !current;

    this.usersService.setActive(id, nextActive).subscribe({
      next: () => this.load(),
      error: (err: any) => {
        console.error('toggleActive error:', err);
        alert(
          err?.error?.message ||
            err?.message ||
            `Error ${err?.status}` ||
            'No se pudo actualizar estado.'
        );
      },
    });
  }

  // ---------- Eliminar ----------
  openDelete(u: User) {
    this.deleteTarget = this.normalize(u);
    this.deleteError = '';
    this.deleteOpen = true;
  }

  closeDelete() {
    this.deleteOpen = false;
    this.deleting = false;
    this.deleteError = '';
    this.deleteTarget = null;
  }

  confirmDelete() {
    if (!this.deleteTarget) return;
    const id = (this.deleteTarget as any)._id || (this.deleteTarget as any).id;
    if (!id) return;

    this.deleting = true;
    this.deleteError = '';

    this.usersService.deleteUser(id).subscribe({
      next: () => {
        this.deleting = false;
        this.closeDelete();
        this.load();
      },
      error: (err: any) => {
        console.error('confirmDelete error:', err);
        this.deleting = false;
        this.deleteError =
          err?.error?.message || err?.message || `Error ${err?.status}` || 'No se pudo eliminar.';
      },
    });
  }
}
