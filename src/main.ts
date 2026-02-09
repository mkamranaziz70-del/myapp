// .env file ko app start hote hi load karne ke liye
// process.env ke through environment variables accessible ho jaate hain
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Express-specific features (static files waghera) ke liye
import { NestExpressApplication } from '@nestjs/platform-express';

// File paths handle karne ke liye
import * as path from 'path';

async function bootstrap() {

  // NestJS app create ho rahi hai with Express support
  const app =
    await NestFactory.create<NestExpressApplication>(AppModule);

  // ================================
  // 🌍 CORS Configuration
  // ================================
  // Ye frontend (web / mobile) ko backend access dene ke liye hota hai
  app.enableCors({
    origin: '*', // kisi bhi domain se request allow
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // headers jo accept honge
  });

  // ================================
  // 📂 Static Files (Uploads)
  // ================================
  // uploads folder ko publicly accessible banata hai
  // Example: http://server/uploads/image.png
  app.useStaticAssets(
    path.join(process.cwd(), 'uploads'), // root/uploads
    { prefix: '/uploads' } // URL prefix
  );

  // ================================
  // ☁️ Port Configuration (Cloud Run / Render / VPS)
  // ================================
  // Cloud platforms usually PORT env variable dete hain
  // Agar nahi mile to default 8080 use hoga
  const port = Number(process.env.PORT) || 8080;

  // Server ko start karna (⚠️ ye line zaroori hoti hai)
  await app.listen(port);

  // Server status log
  console.log(`🚀 Backend running on port ${port}`);
}

// App start point
bootstrap();
