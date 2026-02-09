import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtStrategy } from "../jwt.strategy";
import { MailService } from 'src/mail/mail.service';
@Global()
@Module({
  
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
    
  ],
  controllers: [AuthController],
  providers: [JwtStrategy,PrismaService,MailService],
  exports: [JwtModule],
})
export class AuthModule {}
