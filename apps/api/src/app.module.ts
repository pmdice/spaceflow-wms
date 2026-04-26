import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PalletsModule } from './pallets/pallets.module';

@Module({
  imports: [PalletsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
