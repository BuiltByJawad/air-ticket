import { Test, type TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AgenciesService } from '../agencies/agencies.service';
import { PrismaService } from '../prisma/prisma.service';

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
  let prismaService: { user: { findUnique: jest.Mock; update: jest.Mock } };

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
    prismaService = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn()
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: AgenciesService, useValue: agenciesService },
        { provide: JwtService, useValue: jwtService },
        { provide: PrismaService, useValue: prismaService }
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

  describe('getProfile', () => {
    it('should return user profile with agency from single query', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        name: 'Test Agent',
        phone: '+8801712345678',
        agency: { id: 'agency-1', name: 'Test Agency' }
      });

      const result = await service.getProfile({
        sub: 'user-1',
        email: 'agent@test.com',
        role: 'agent',
        agencyId: 'agency-1'
      });

      expect(result.user.name).toBe('Test Agent');
      expect(result.user.agency).toEqual({ id: 'agency-1', name: 'Test Agency' });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { agency: { select: { id: true, name: true } } }
      });
    });

    it('should return null agency when user has no agency', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        agencyId: null,
        agency: null
      });

      const result = await service.getProfile({
        sub: 'user-1',
        email: 'agent@test.com',
        role: 'admin',
        agencyId: null
      });

      expect(result.user.agency).toBeNull();
    });
  });

  describe('updateProfile', () => {
    const jwtUser = {
      sub: 'user-1',
      email: 'agent@test.com',
      role: 'agent' as const,
      agencyId: 'agency-1'
    };

    it('should update name and return updated profile', async () => {
      prismaService.user.update.mockResolvedValue({ ...mockUser, name: 'New Name' });
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        name: 'New Name',
        agency: { id: 'agency-1', name: 'Test Agency' }
      });

      const result = await service.updateProfile(jwtUser, { name: 'New Name' });

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'New Name' }
      });
      expect(result.user.name).toBe('New Name');
    });

    it('should update phone and return updated profile', async () => {
      prismaService.user.update.mockResolvedValue({ ...mockUser, phone: '+123' });
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        phone: '+123',
        agency: { id: 'agency-1', name: 'Test Agency' }
      });

      const result = await service.updateProfile(jwtUser, { phone: '+123' });

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { phone: '+123' }
      });
      expect(result.user.phone).toBe('+123');
    });

    it('should hash and update password when currentPassword is correct', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      prismaService.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        agency: { id: 'agency-1', name: 'Test Agency' }
      });

      const bcryptjs = jest.requireMock('bcryptjs');
      bcryptjs.compare.mockResolvedValue(true);

      await service.updateProfile(jwtUser, { currentPassword: 'oldPass', password: 'newPassword123' });

      expect(bcryptjs.compare).toHaveBeenCalledWith('oldPass', '$2a$12$hash');
      expect(bcryptjs.hash).toHaveBeenCalledWith('newPassword123', 12);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: '$2a$12$hashed' }
      });
    });

    it('should reject password change without currentPassword', async () => {
      await expect(
        service.updateProfile(jwtUser, { password: 'newPassword123' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject password change with incorrect currentPassword', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(mockUser);

      const bcryptjs = jest.requireMock('bcryptjs');
      bcryptjs.compare.mockResolvedValue(false);

      await expect(
        service.updateProfile(jwtUser, { currentPassword: 'wrongPass', password: 'newPassword123' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should update multiple fields at once', async () => {
      prismaService.user.update.mockResolvedValue(mockUser);
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        name: 'Updated',
        phone: '+999',
        agency: { id: 'agency-1', name: 'Test Agency' }
      });

      await service.updateProfile(jwtUser, { name: 'Updated', phone: '+999' });

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'Updated', phone: '+999' }
      });
    });

    it('should not call update when no fields provided', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        agency: { id: 'agency-1', name: 'Test Agency' }
      });

      await service.updateProfile(jwtUser, {});

      expect(prismaService.user.update).not.toHaveBeenCalled();
    });
  });
});
