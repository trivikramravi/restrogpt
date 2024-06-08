import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FlintridgeService } from './web-services/flintridge.service';
import { ToastService } from './web-services/toast.pu.service';
import { LoggerModule} from 'nestjs-pino';
import { SoModuleService } from './web-services/so.modules.service';
import { pinoConfig } from './utills/pino-config';
@Module({
  imports: [SoModuleService.initLogger()
],
  controllers: [AppController],
  providers: [AppService,FlintridgeService,ToastService],
})
export class AppModule {}
