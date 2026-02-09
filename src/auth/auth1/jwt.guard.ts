import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const payload = this.jwt.verify(token);

     const user = await this.prisma.user.findUnique({
  where: { id: payload.sub },
  include: {
    company: true,
    employee: true, 
  },
});

if (!user) {
  throw new UnauthorizedException('Invalid user');
}

req.user = {
  id: user.id,
  sub: user.id,
  companyId: user.companyId,
  role: user.role,

  employeeId: user.employee?.id || null,
};



      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}


