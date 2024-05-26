import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FlintridgeService } from './web-services/flintridge.service';
import { ToastService } from './web-services/toast.pu.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService,FlintridgeService,ToastService],
})
export class AppModule {}
