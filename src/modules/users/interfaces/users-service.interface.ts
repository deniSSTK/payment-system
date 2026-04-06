import type { User } from '../entities/user.entity';

export const USERS_SERVICE = Symbol('USERS_SERVICE');

export interface CreateClientInput {
  email: string;
  passwordHash: string;
}

export interface IUsersService {
  createClient(input: CreateClientInput): Promise<User>;
  findByEmailWithSecrets(email: string): Promise<User | null>;
  findByIdOrFail(id: string): Promise<User>;
  findByIdWithSecrets(id: string): Promise<User | null>;
  updateRefreshTokenHash(userId: string, refreshTokenHash: string): Promise<void>;
  clearRefreshTokenHash(userId: string): Promise<void>;
  setActive(userId: string, isActive: boolean): Promise<User>;
}
