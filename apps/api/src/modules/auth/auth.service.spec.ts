import { Test, type TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AgenciesService } from '../agencies/agencies.service';

jest.mock('bcryptjs', () => ({
  ...jest.requireActual('bcryptjs'),
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('$2a$12$hashed')
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let agenciesService: Partial<Record<keyof AgenciesService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;

  const mockUser = {
    id: 'user-1',
    email: 'agent@test.com',
    passwordHash: '$2a$12$hash',
    role: 'agent' as const,
    agencyId: 'agency-1',
    createdAt: new Date()
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn()
    };
    agenciesService = {
      create: jest.fn().mockResolvedValue({ id: 'agency-1', name: 'Test Agency', createdAt: new Date() })
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('jwt-token')
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: AgenciesService, useValue: agenciesService },
        { provide: JwtService, useValue: jwtService }
      ]
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('should register a new user and return token + user', async () => {
      usersService.create!.mockResolvedValue(mockUser);

      const result = await service.register({ email: 'agent@test.com', password: 'password123', agencyName: 'Test Agency' });

      expect(result.accessToken).toBe('jwt-token');
      expect(result.user.id).toBe('user-1');
      expect(result.user.email).toBe('agent@test.com');
      expect(result.user.role).toBe('agent');
      expect(result.user.agencyId).toBe('agency-1');
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'agent@test.com', role: 'agent' })
      );
    });

    it('should reject invalid email', async () => {
      await expect(service.register({ email: 'bad', password: 'password123', agencyName: 'Test Agency' })).rejects.toThrow();
    });

    it('should reject password shorter than 8 chars', async () => {
      await expect(service.register({ email: 'a@b.com', password: 'short', agencyName: 'Test Agency' })).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const bcryptjs = jest.requireMock('bcryptjs');
      usersService.findByEmail!.mockResolvedValue(mockUser);
      bcryptjs.compare.mockResolvedValue(true);

      const result = await service.login({ email: 'agent@test.com', password: 'password123' });

      expect(result.accessToken).toBe('jwt-token');
      expect(result.user.id).toBe('user-1');
    });

    it('should throw UnauthorizedException for unknown email', async () => {
      usersService.findByEmail!.mockResolvedValue(null);

      await expect(service.login({ email: 'none@test.com', password: 'pass' })).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const bcryptjs = jest.requireMock('bcryptjs');
      usersService.findByEmail!.mockResolvedValue(mockUser);
      bcryptjs.compare.mockResolvedValue(false);

      await expect(service.login({ email: 'agent@test.com', password: 'wrong' })).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});
