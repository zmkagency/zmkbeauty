import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable, filter, map } from 'rxjs';

export interface DomainEvent {
  type: string; // appointment.created | appointment.updated | payment.success | ...
  tenantId?: string | null;
  payload: any;
  timestamp: string;
}

/**
 * In-memory event bus that backs the Server-Sent Events stream consumed by
 * admin and superadmin panels. Producers (services like AppointmentsService,
 * PaymentsService) call `emit()`. Consumers (the SSE controller) subscribe via
 * `stream()` filtered by tenant scope.
 *
 * For multi-instance deployments swap the Subject for a Redis pub/sub bridge —
 * the public surface (`emit`/`stream`) stays identical so callers never change.
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private readonly subject = new Subject<DomainEvent>();

  emit(event: Omit<DomainEvent, 'timestamp'>) {
    const enriched: DomainEvent = { ...event, timestamp: new Date().toISOString() };
    this.subject.next(enriched);
  }

  /**
   * Stream filtered by tenantId. Pass `null` for superadmin (all tenants).
   */
  stream(tenantId?: string | null): Observable<{ data: DomainEvent }> {
    return this.subject.asObservable().pipe(
      filter((e) => tenantId == null || e.tenantId === tenantId),
      map((e) => ({ data: e })),
    );
  }
}
