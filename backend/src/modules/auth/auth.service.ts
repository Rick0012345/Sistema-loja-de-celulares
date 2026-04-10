import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { perfil_usuario } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto, LoginDto, UpdateUserDto } from './auth.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.syncAdminFromEnv();
  }

  private getAdminConfig() {
    const adminEmail = this.config
      .get<string>('ADMIN_EMAIL')
      ?.trim()
      .toLowerCase();
    const adminPassword = this.config.get<string>('ADMIN_PASSWORD');
    const adminName =
      this.config.get<string>('ADMIN_NAME')?.trim() || 'Administrador';

    if (!adminEmail) {
      throw new Error('ADMIN_EMAIL não configurado.');
    }

    if (!adminPassword || adminPassword.length < 6) {
      throw new Error(
        'ADMIN_PASSWORD não configurado ou com menos de 6 caracteres.',
      );
    }

    return {
      adminEmail,
      adminPassword,
      adminName,
    };
  }

  private getOptionalAdminConfig() {
    try {
      return this.getAdminConfig();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Configuracao de admin ausente.';
      this.logger.warn(
        `Bootstrap do admin ignorado: ${message} Configure ADMIN_EMAIL e ADMIN_PASSWORD para seed automatico.`,
      );
      return null;
    }
  }

  private async syncAdminFromEnv() {
    const adminConfig = this.getOptionalAdminConfig();

    if (!adminConfig) {
      return;
    }

    const { adminEmail, adminPassword, adminName } = adminConfig;
    const senha_hash = await bcrypt.hash(adminPassword, 10);
    const adminExistente = await this.prisma.usuarios.findUnique({
      where: { email: adminEmail },
    });

    if (adminExistente) {
      await this.prisma.usuarios.update({
        where: { id: adminExistente.id },
        data: {
          nome: adminName,
          senha_hash,
          perfil: perfil_usuario.administrador,
          ativo: true,
        },
      });
      return;
    }

    await this.prisma.usuarios.create({
      data: {
        nome: adminName,
        email: adminEmail,
        senha_hash,
        perfil: perfil_usuario.administrador,
        ativo: true,
      },
    });
  }

  async login(dto: LoginDto) {
    const loginEmail = dto.email.toLowerCase().trim();
    const usuario = await this.prisma.usuarios.findUnique({
      where: { email: loginEmail },
    });

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const senhaCorreta = await bcrypt.compare(dto.senha, usuario.senha_hash);

    if (!senhaCorreta) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
      nome: usuario.nome,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      usuario: this.serializeAuthenticatedUser(usuario),
    };
  }

  async status() {
    const totalUsuarios = await this.prisma.usuarios.count({
      where: { ativo: true },
    });

    return {
      possuiUsuarios: totalUsuarios > 0,
      totalUsuarios,
    };
  }

  listUsers() {
    return this.prisma.usuarios.findMany({
      orderBy: { created_at: 'desc' },
      select: this.managedUserSelect,
    });
  }

  async getCurrentUser(id: string) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
      },
    });

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }

    return this.serializeAuthenticatedUser(usuario);
  }

  async createUser(dto: CreateUserDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    await this.ensureEmailIsAvailable(normalizedEmail);

    const senha_hash = await bcrypt.hash(dto.senha, 10);
    return this.prisma.usuarios.create({
      data: {
        nome: dto.nome.trim(),
        email: normalizedEmail,
        senha_hash,
        perfil: dto.perfil,
        ativo: true,
      },
      select: this.managedUserSelect,
    });
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const adminEmail = this.getOptionalAdminConfig()?.adminEmail ?? null;
    const usuarioAtual = await this.prisma.usuarios.findUnique({
      where: { id },
      select: { id: true, email: true, perfil: true },
    });

    if (!usuarioAtual) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (adminEmail && usuarioAtual.email === adminEmail) {
      if (dto.email !== undefined) {
        throw new BadRequestException(
          'Não é permitido alterar o e-mail do administrador.',
        );
      }
      if (dto.perfil !== undefined) {
        throw new BadRequestException(
          'Não é permitido alterar o perfil do administrador.',
        );
      }
      if (dto.ativo !== undefined && dto.ativo === false) {
        throw new BadRequestException(
          'Não é permitido desativar o administrador.',
        );
      }
    }

    const data: {
      nome?: string;
      email?: string;
      senha_hash?: string;
      perfil?: perfil_usuario;
      ativo?: boolean;
    } = {};

    if (dto.nome !== undefined) {
      data.nome = dto.nome.trim();
    }

    if (dto.email !== undefined) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      if (normalizedEmail !== usuarioAtual.email) {
        await this.ensureEmailIsAvailable(normalizedEmail);
      }
      data.email = normalizedEmail;
    }

    if (dto.senha !== undefined) {
      data.senha_hash = await bcrypt.hash(dto.senha, 10);
    }

    if (dto.perfil !== undefined) {
      data.perfil = dto.perfil;
    }

    if (dto.ativo !== undefined) {
      data.ativo = dto.ativo;
    }

    return this.prisma.usuarios.update({
      where: { id },
      data,
      select: this.managedUserSelect,
    });
  }

  async disableUser(id: string) {
    const adminEmail = this.getOptionalAdminConfig()?.adminEmail ?? null;
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (adminEmail && usuario.email === adminEmail) {
      throw new BadRequestException(
        'Não é permitido desativar o administrador.',
      );
    }

    await this.prisma.usuarios.update({
      where: { id },
      data: { ativo: false },
    });

    return { disabled: true };
  }

  private async ensureEmailIsAvailable(email: string) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { email },
      select: { id: true },
    });

    if (usuario) {
      throw new BadRequestException('Já existe um usuário com este e-mail.');
    }
  }

  private readonly managedUserSelect = {
    id: true,
    nome: true,
    email: true,
    perfil: true,
    ativo: true,
    created_at: true,
    updated_at: true,
  } as const;

  private serializeAuthenticatedUser(usuario: {
    id: string;
    nome: string;
    email: string;
    perfil: perfil_usuario;
  }) {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    };
  }
}
