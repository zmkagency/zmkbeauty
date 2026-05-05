import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.params.tenantId || request.headers['x-tenant-id'];

    // Superadmin can access everything
    if (user?.role === Role.SUPERADMIN) {
      return true;
    }

    // If no tenant context needed, allow
    if (!tenantId) {
      return true;
    }

    // Store admin and employees can only access their own tenant
    if (user?.tenantId && user.tenantId !== tenantId) {
      throw new ForbiddenException('Bu mağazaya erişim yetkiniz bulunmamaktadır');
    }

    return true;
  }
}
