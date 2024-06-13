import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FlintridgeService } from './web-services/flintridge.service';
import { ToastService } from './web-services/toast.pu.service';
import { MailService } from './utills/mail-service';
import { LoggerModule } from 'nestjs-pino';
import { SoModuleService } from './web-services/so.modules.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    SoModuleService.initLogger(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'your_username',
      password: 'your_password',
      database: 'your_database',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService,FlintridgeService,ToastService,MailService],
})
export class AppModule {}
