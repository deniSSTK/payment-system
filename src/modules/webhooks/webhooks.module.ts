import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WebhookService } from './services/webhook.service';
import { WEBHOOK_SERVICE } from './interfaces/webhook-service.interface';

@Module({
  imports: [HttpModule],
  providers: [
    WebhookService,
    {
      provide: WEBHOOK_SERVICE,
      useExisting: WebhookService,
    },
  ],
  exports: [WEBHOOK_SERVICE],
})
export class WebhooksModule {}
