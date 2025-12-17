export type UserRole = 'ADMIN' | 'USER';

export interface User {
  _id?: string;     // Mongo
  id?: string;      // por si backend responde "id"

  fullName: string;
  username: string;
  role: UserRole;

  isActive?: boolean;

  createdAt?: string;
  updatedAt?: string;
}
