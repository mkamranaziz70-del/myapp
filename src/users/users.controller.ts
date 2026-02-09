import {
  Controller,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}
@Put('profile')
@UseGuards(AuthGuard('jwt'))
async updateProfile(@Req() req: any, @Body() body: any) {
  const userId = req.user.id;

  return this.prisma.user.update({
    where: { id: userId },
    data: {
      fullName: body.fullName,
      email: body.email,
    },
  });
}

  /* ===================== GET MY PROFILE ===================== */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Req() req: any) {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  /* ===================== UPLOAD AVATAR ===================== */
  @Post('avatar')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const unique =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException();
    }

    if (!file) {
      throw new BadRequestException('Avatar file missing');
    }

    /* ===== 1️⃣ Get old avatar from DB ===== */
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    /* ===== 2️⃣ Delete old avatar file safely ===== */
    if (existingUser?.avatarUrl) {
      const oldFilePath = path.join(
        process.cwd(),
        existingUser.avatarUrl.replace('/uploads/', 'uploads/'),
      );

      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (e) {
          console.log('⚠️ Failed to delete old avatar:', e);
        }
      }
    }

    /* ===== 3️⃣ Save new avatar path ===== */
    const avatarUrl = `/uploads/avatars/${file.filename}`;

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return { avatarUrl };
  }

  
}
