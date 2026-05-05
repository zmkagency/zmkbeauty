import { Controller, Sse, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Observable, merge, interval, map } from 'rxjs';
import { EventsService } from './events.service';
import { Role } from '@prisma/client';

/**
 * Server-Sent Events stream for admin & superadmin panels.
 *
 *   GET /api/events/stream
 *
 * The browser opens an `EventSource(url, { withCredentials: true })` and the
 * server pushes domain events scoped to the caller's tenant (STORE_ADMIN) or
 * unscoped (SUPERADMIN). The connection holds open with a keep-alive ping
 * every 25 s — long enough to survive proxy timeouts but cheap enough to add
 * no real load.
 */
@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private events: EventsService) {}

  @Sse('stream')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Real-time event stream (SSE)' })
  stream(@Req() req: Request): Observable<{ data: any }> {
    const user = req.user as { id: string; role: Role; tenantId?: string | null } | undefined;
    if (!user) throw new ForbiddenException();

    if (user.role !== Role.SUPERADMIN && user.role !== Role.STORE_ADMIN) {
      throw new ForbiddenException('Sadece yönetici roller event stream alabilir');
    }

    const scope = user.role === Role.SUPERADMIN ? null : user.tenantId || null;
    const events$ = this.events.stream(scope);

    // Keep-alive ping — browsers and intermediaries close idle EventSource
    // connections after ~30s, so we emit a small heartbeat every 25s.
    const heartbeat$ = interval(25_000).pipe(
      map(() => ({ data: { type: 'ping', timestamp: new Date().toISOString() } })),
    );

    return merge(events$, heartbeat$);
  }
}
