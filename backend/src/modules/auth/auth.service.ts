import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { perfil_usuario } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './auth.dto';

@Injectable()
export class AuthService implements OnModuleInit {
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

  private async syncAdminFromEnv() {
    const { adminEmail, adminPassword, adminName } = this.getAdminConfig();
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
    const { adminEmail } = this.getAdminConfig();
    const loginEmail = dto.email.toLowerCase().trim();

    if (loginEmail !== adminEmail) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const usuario = await this.prisma.usuarios.findUnique({
      where: { email: adminEmail },
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
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      },
    };
  }

  async status() {
    const { adminEmail } = this.getAdminConfig();
    const totalUsuarios = await this.prisma.usuarios.count({
      where: { email: adminEmail, ativo: true },
    });

    return {
      possuiUsuarios: totalUsuarios > 0,
      totalUsuarios,
    };
  }
}
