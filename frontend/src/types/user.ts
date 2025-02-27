// src/types/user.ts

export interface User {
    id: number;
    username: string;
    isAdmin: boolean;
    reputation: number;  // Added reputation field
}