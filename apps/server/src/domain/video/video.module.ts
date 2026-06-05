import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { VideoRepository } from './video.repository';
import { AdminGuard } from '@/common/guards/admin.guard';
import { OptionalJwtAuthGuard } from '@/common/guards/optional-jwt-auth.guard';

@Module({
  controllers: [VideoController],
  providers: [VideoService, VideoRepository, AdminGuard, OptionalJwtAuthGuard],
})
export class VideoModule {}
