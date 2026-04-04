import { perfil_usuario } from '@prisma/client';

export type AuthenticatedUser = {
  sub: string;
  email: string;
  perfil: perfil_usuario;
  nome: string;
};
