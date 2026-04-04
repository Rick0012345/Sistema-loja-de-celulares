import { SetMetadata } from '@nestjs/common';
import { perfil_usuario } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: perfil_usuario[]) => SetMetadata(ROLES_KEY, roles);
