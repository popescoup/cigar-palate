// src/types/auth.ts
import { User } from './user';

export interface CurrentUser extends User {
  userId: number;
}

export interface AuthState {
  currentUser: CurrentUser | null;
  isLoading: boolean;
  error: string | null;
}