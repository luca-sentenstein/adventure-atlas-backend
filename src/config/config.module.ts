import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { MyConfigService } from './config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the config available globally
      envFilePath: join(__dirname, '../../.env'), // Path to your .env file
    }),
  ],
  providers: [MyConfigService],
  exports: [MyConfigService]
})
export class AppConfigModule {}
