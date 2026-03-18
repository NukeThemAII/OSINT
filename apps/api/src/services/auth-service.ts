import { randomUUID } from 'node:crypto';

import argon2 from 'argon2';

import { AppRepository, type AdminSessionRecord } from '@investor-intel/db';
import type { AuthSession } from '@investor-intel/core';
import { stableHash } from '@investor-intel/core/hashing';

import type { ApiEnv } from '../env';

interface MemorySession extends AdminSessionRecord {
  tokenHash: string;
}

export class AuthService {
  private readonly fallbackSessions = new Map<string, MemorySession>();

  constructor(
    private readonly repository: AppRepository,
    private readonly env: ApiEnv,
  ) {}

  async login(input: {
    email: string;
    password: string;
    userAgent?: string;
    ipHash?: string;
  }): Promise<{ token: string; session: AuthSession } | null> {
    let passwordHash: string | undefined;
    let adminUserId: string | undefined;

    if (this.env.ADMIN_EMAIL === input.email && this.env.ADMIN_PASSWORD_HASH) {
      passwordHash = this.env.ADMIN_PASSWORD_HASH;
    } else {
      const adminUser = await this.repository.findAdminUserByEmail(input.email);
      if (adminUser) {
        passwordHash = adminUser.passwordHash;
        adminUserId = adminUser.id;
      }
    }

    if (!passwordHash) return null;

    const validPassword = await argon2.verify(passwordHash, input.password);
    if (!validPassword) return null;

    const token = `${randomUUID()}${randomUUID()}`;
    const tokenHash = stableHash(token);
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

    if (this.repository.configured) {
      await this.repository.createAdminSession({
        tokenHash,
        email: input.email,
        expiresAt,
        adminUserId,
        userAgent: input.userAgent,
        ipHash: input.ipHash,
      });
    } else {
      this.fallbackSessions.set(tokenHash, {
        id: randomUUID(),
        email: input.email,
        expiresAt,
        tokenHash,
      });
    }

    return {
      token,
      session: {
        authenticated: true,
        email: input.email,
        expiresAt,
      },
    };
  }

  async getSession(token?: string): Promise<AuthSession> {
    if (!token) {
      return { authenticated: false };
    }

    const tokenHash = stableHash(token);
    let session: AdminSessionRecord | null = null;

    if (this.repository.configured) {
      session = await this.repository.getAdminSession(tokenHash);
    } else {
      const memorySession = this.fallbackSessions.get(tokenHash);
      if (memorySession && new Date(memorySession.expiresAt).getTime() > Date.now()) {
        session = memorySession;
      }
    }

    if (!session) {
      return { authenticated: false };
    }

    return {
      authenticated: true,
      email: session.email,
      expiresAt: session.expiresAt,
    };
  }

  async logout(token?: string): Promise<void> {
    if (!token) return;
    const tokenHash = stableHash(token);
    if (this.repository.configured) {
      await this.repository.deleteAdminSession(tokenHash);
      return;
    }
    this.fallbackSessions.delete(tokenHash);
  }
}
