import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: (req: Request) => req?.cookies?.accessToken || null,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    // Your token uses `sub` for user id
    const userId = BigInt(payload.sub);

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.deleted_at) {
      throw new UnauthorizedException('User not found');
    }

    // 🔍 Attach investorProfileUid to req.user
    const profile = await this.prisma.investor_profiles.findUnique({
      where: { user_id: user.id },
      select: { uid: true },
    });

    return {
      id: user.id.toString(),
      email: user.email,
      userType: user.user_type,
      roleId: user.role_id,
      roleName: user.role?.name || '',
      isEmailVerified: user.is_email_verified,
      lastLoginAt: user.last_login_at,
      investorProfileUid: profile?.uid ?? null, // 👈 crucial
    };
  }
}
