import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { perfil_usuario } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BootstrapAdminDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async bootstrapAdmin(dto: BootstrapAdminDto) {
    const totalUsuarios = await this.prisma.usuarios.count();

    if (totalUsuarios > 0) {
      throw new BadRequestException(
        'O usuário administrador inicial já foi configurado.',
      );
    }

    const adminPassword = this.config.get<string>('ADMIN_BOOTSTRAP_PASSWORD');
    if (!adminPassword || adminPassword.length < 6) {
      throw new BadRequestException(
        'Senha do administrador não configurada em ADMIN_BOOTSTRAP_PASSWORD.',
      );
    }
    const senha_hash = await bcrypt.hash(adminPassword, 10);

    const usuario = await this.prisma.usuarios.create({
      data: {
        nome: dto.nome,
        email: dto.email.toLowerCase(),
        senha_hash,
        perfil: perfil_usuario.administrador,
      },
    });

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      ativo: usuario.ativo,
    };
  }

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { email: dto.email.toLowerCase() },
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
    const totalUsuarios = await this.prisma.usuarios.count();

    return {
      possuiUsuarios: totalUsuarios > 0,
      totalUsuarios,
    };
  }
}
