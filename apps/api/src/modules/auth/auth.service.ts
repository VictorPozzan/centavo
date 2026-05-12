import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    ForbiddenException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import { ConfigService } from '@nestjs/config';
  import * as argon2 from 'argon2';
  import { randomUUID } from 'crypto';
  import { PrismaService } from '../prisma/prisma.service';
  import { RegisterDto } from './dto/register.dto';
  import { LoginDto } from './dto/login.dto';
  import { JwtDuration } from '../../common/types/jwt-duration.type';

  export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
  }
  
  export interface AuthResponse extends AuthTokens {
    user: {
      id: string;
      email: string;
      name: string;
    };
  }
  
  @Injectable()
  export class AuthService {
    constructor(
      private readonly prisma: PrismaService,
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService,
    ) {}
  
    async register(dto: RegisterDto): Promise<AuthResponse> {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
  
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
  
      const passwordHash = await argon2.hash(dto.password, {
        type: argon2.argon2id,
        memoryCost: 19456, // 19 MB — OWASP recommended for argon2id
        timeCost: 2,
        parallelism: 1,
      });
  
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          name: dto.name,
        },
        select: { id: true, email: true, name: true },
      });
  
      const tokens = await this.generateTokens(user.id, user.email);
  
      return { ...tokens, user };
    }
  
    async login(dto: LoginDto): Promise<AuthResponse> {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
  
      // Mensagem genérica pra não vazar quais emails existem (user enumeration)
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
  
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      const tokens = await this.generateTokens(user.id, user.email);
  
      return {
        ...tokens,
        user: { id: user.id, email: user.email, name: user.name },
      };
    }
  
    async refresh(refreshToken: string): Promise<AuthTokens> {
      const tokenHash = await this.hashToken(refreshToken);
  
      const stored = await this.prisma.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });
  
      if (!stored) {
        throw new UnauthorizedException('Invalid refresh token');
      }
  
      if (stored.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      }
  
      // Token rotacionando: se já foi usado, alguém o roubou — invalida tudo
      if (stored.revokedAt) {
        await this.prisma.refreshToken.updateMany({
          where: { userId: stored.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        throw new ForbiddenException('Refresh token reuse detected — all sessions revoked');
      }
  
      const newTokens = await this.generateTokens(stored.userId, stored.user.email);
  
      // Marca o atual como revogado e linka pro novo
      const newTokenHash = await this.hashToken(newTokens.refreshToken);
      const newStored = await this.prisma.refreshToken.findUnique({
        where: { tokenHash: newTokenHash },
      });
  
      await this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: {
          revokedAt: new Date(),
          replacedBy: newStored?.id,
        },
      });
  
      return newTokens;
    }
  
    async logout(userId: string): Promise<void> {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  
    private async generateTokens(userId: string, email: string): Promise<AuthTokens> {
      const payload = { sub: userId, email };
  
      const accessToken = await this.jwtService.signAsync(payload, {
        expiresIn: this.configService.getOrThrow<JwtDuration>('JWT_EXPIRES_IN'),
      });
  
      const refreshToken = randomUUID();
      const tokenHash = await this.hashToken(refreshToken);
  
      const refreshExpiresIn = this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN');
      const expiresAt = this.parseDuration(refreshExpiresIn);
  
      await this.prisma.refreshToken.create({
        data: { tokenHash, userId, expiresAt },
      });
  
      return { accessToken, refreshToken };
    }
  
    private async hashToken(token: string): Promise<string> {
      // Hash determinístico (sem salt) pra permitir buscar no banco
      const crypto = await import('crypto');
      return crypto.createHash('sha256').update(token).digest('hex');
    }
  
    private parseDuration(duration: string): Date {
      const match = duration.match(/^(\d+)([smhd])$/);
      if (!match) throw new Error(`Invalid duration: ${duration}`);
  
      const [, amount, unit] = match;
      const ms = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
      }[unit];
  
      return new Date(Date.now() + parseInt(amount) * ms!);
    }
  }