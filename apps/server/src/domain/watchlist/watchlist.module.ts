/**
 * WatchlistModule - 自选股模块
 */

import { Module } from '@nestjs/common';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';
import { WatchlistRepository } from './watchlist.repository';

@Module({
  controllers: [WatchlistController],
  providers: [WatchlistService, WatchlistRepository],
  exports: [WatchlistService, WatchlistRepository],
})
export class WatchlistModule {}
