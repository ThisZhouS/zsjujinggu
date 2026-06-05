/**
 * AuthService - 认证业务逻辑
 * 负责登录、注册、Token 生成
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { maskPhone } from '@/common/utils/data-sanitizer';
import { RedisService } from '@/infrastructure/redis/redis.service';
import { EmailCodePurpose, SmsCodePurpose } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import * as tls from 'node:tls';
import { randomInt } from 'node:crypto';

interface VerificationCodeRecord {
  code: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly fallbackCodeStore = new Map<string, VerificationCodeRecord>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  /**
   * 用户登录
   */
  async login(phone: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const token = await this.generateToken(user);

    return {
      token,
      user: {
        id: Number(user.id),
        phone: maskPhone(user.phone),
        role: user.role,
        canUploadArticles: user.canUploadArticles,
        canAccessVideos: user.canAccessVideos,
        vipExpiresAt: user.vipExpiresAt ? Number(user.vipExpiresAt) : null,
      },
    };
  }

  /**
   * 用户注册
   */
  async register(
    phone: string,
    password: string,
    email: string,
    smsCode: string,
    emailCode: string,
    username?: string,
    nickname?: string,
  ) {
    const normalizedEmail = this.normalizeEmail(email);
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          { email: normalizedEmail },
        ],
      },
      select: {
        phone: true,
        email: true,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        existingUser.phone === phone ? '该手机号已注册' : '该邮箱已注册',
      );
    }

    await this.verifySmsCode(phone, 'register', smsCode);
    await this.verifyEmailCode(normalizedEmail, 'register', emailCode);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        phone,
        email: normalizedEmail,
        emailVerifiedAt: new Date(),
        password: hashedPassword,
        username,
        nickname,
      },
    });

    const token = await this.generateToken(user);

    return {
      token,
      user: {
        id: Number(user.id),
        phone: maskPhone(user.phone),
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt,
        role: user.role,
        canUploadArticles: user.canUploadArticles,
        canAccessVideos: user.canAccessVideos,
        vipExpiresAt: user.vipExpiresAt ? Number(user.vipExpiresAt) : null,
      },
    };
  }

  /**
   * 发送短信验证码
   */
  async sendSmsCode(
    phone: string,
    purpose: SmsCodePurpose = 'register',
  ): Promise<{ success: boolean; expiresIn: number }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { phone },
      select: { id: true },
    });

    if (purpose === 'register' && existingUser) {
      throw new ConflictException('该手机号已注册');
    }

    if (purpose === 'reset-password' && !existingUser) {
      throw new NotFoundException('该手机号未注册');
    }

    const code = this.generateVerificationCode();
    const ttl = this.getSmsCodeTtl();

    await this.storeVerificationCode(phone, purpose, code, ttl);
    this.logger.log(`[${phone}] ${purpose} 短信验证码：${code}`);

    return { success: true, expiresIn: ttl };
  }

  async sendEmailCode(
    email: string,
    purpose: EmailCodePurpose = 'register',
  ): Promise<{ success: boolean; expiresIn: number }> {
    const normalizedEmail = this.normalizeEmail(email);
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (purpose === 'register' && existingUser) {
      throw new ConflictException('该邮箱已注册');
    }

    const code = this.generateVerificationCode();
    const ttl = this.getSmsCodeTtl();

    await this.storeEmailVerificationCode(normalizedEmail, purpose, code, ttl);
    await this.deliverEmailVerificationCode(normalizedEmail, code);
    this.logger.log(`[${normalizedEmail}] ${purpose} 邮箱验证码：${code}`);

    return { success: true, expiresIn: ttl };
  }

  /**
   * 重置密码
   */
  async resetPassword(phone: string, smsCode: string, newPassword: string): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { phone },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('该手机号未注册');
    }

    await this.verifySmsCode(phone, 'reset-password', smsCode);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { phone },
      data: { password: hashedPassword },
    });

    return { success: true };
  }

  /**
   * 生成 JWT Token
   */
  private async generateToken(user: any): Promise<string> {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');

    return this.jwtService.sign({
      id: Number(user.id),
      phone: user.phone,
      email: user.email,
      role: user.role,
      canUploadArticles: Boolean(user.canUploadArticles),
      canAccessVideos: Boolean(user.canAccessVideos),
      vipExpiresAt: user.vipExpiresAt ? Number(user.vipExpiresAt) : null,
    }, {
      expiresIn,
    });
  }

  private buildVerificationCodeKey(phone: string, purpose: SmsCodePurpose): string {
    return `auth:sms:${purpose}:${phone}`;
  }

  private buildEmailVerificationCodeKey(email: string, purpose: EmailCodePurpose): string {
    return `auth:email:${purpose}:${email}`;
  }

  private normalizeEmail(email: string): string {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      throw new BadRequestException('邮箱不能为空');
    }

    return normalized;
  }

  private getSmsCodeTtl(): number {
    const configured = this.configService.get<string>('SMS_CODE_TTL_SECONDS', '600');
    const ttl = Number(configured);
    return Number.isFinite(ttl) && ttl > 0 ? ttl : 600;
  }

  private generateVerificationCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private async storeVerificationCode(
    phone: string,
    purpose: SmsCodePurpose,
    code: string,
    ttlSeconds: number,
  ): Promise<void> {
    const key = this.buildVerificationCodeKey(phone, purpose);
    const payload = JSON.stringify({
      code,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    const stored = await this.redisService.safeSet(key, payload, ttlSeconds);
    if (!stored) {
      this.fallbackCodeStore.set(key, {
        code,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    }
  }

  private async storeEmailVerificationCode(
    email: string,
    purpose: EmailCodePurpose,
    code: string,
    ttlSeconds: number,
  ): Promise<void> {
    const key = this.buildEmailVerificationCodeKey(email, purpose);
    const payload = JSON.stringify({
      code,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    const stored = await this.redisService.safeSet(key, payload, ttlSeconds);
    if (!stored) {
      this.fallbackCodeStore.set(key, {
        code,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    }
  }

  private async getVerificationCode(
    phone: string,
    purpose: SmsCodePurpose,
  ): Promise<VerificationCodeRecord | null> {
    const key = this.buildVerificationCodeKey(phone, purpose);
    const cached = await this.redisService.safeGet(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as VerificationCodeRecord;
        if (parsed.expiresAt <= Date.now()) {
          await this.deleteVerificationCode(phone, purpose);
          return null;
        }
        return parsed;
      } catch {
        await this.redisService.safeDel(key);
        return null;
      }
    }

    const fallback = this.fallbackCodeStore.get(key);
    if (!fallback) {
      return null;
    }

    if (fallback.expiresAt <= Date.now()) {
      this.fallbackCodeStore.delete(key);
      return null;
    }

    return fallback;
  }

  private async deleteVerificationCode(phone: string, purpose: SmsCodePurpose): Promise<void> {
    const key = this.buildVerificationCodeKey(phone, purpose);
    await this.redisService.safeDel(key);
    this.fallbackCodeStore.delete(key);
  }

  private async deleteEmailVerificationCode(email: string, purpose: EmailCodePurpose): Promise<void> {
    const key = this.buildEmailVerificationCodeKey(email, purpose);
    await this.redisService.safeDel(key);
    this.fallbackCodeStore.delete(key);
  }

  private async getEmailVerificationCode(
    email: string,
    purpose: EmailCodePurpose,
  ): Promise<VerificationCodeRecord | null> {
    const key = this.buildEmailVerificationCodeKey(email, purpose);
    const cached = await this.redisService.safeGet(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as VerificationCodeRecord;
        if (parsed.expiresAt <= Date.now()) {
          await this.deleteEmailVerificationCode(email, purpose);
          return null;
        }
        return parsed;
      } catch {
        await this.redisService.safeDel(key);
        return null;
      }
    }

    const fallback = this.fallbackCodeStore.get(key);
    if (!fallback) {
      return null;
    }

    if (fallback.expiresAt <= Date.now()) {
      this.fallbackCodeStore.delete(key);
      return null;
    }

    return fallback;
  }

  private async verifySmsCode(
    phone: string,
    purpose: SmsCodePurpose,
    smsCode: string,
  ): Promise<void> {
    const record = await this.getVerificationCode(phone, purpose);
    if (!record) {
      throw new BadRequestException('验证码不存在或已过期');
    }

    if (record.code !== smsCode) {
      throw new BadRequestException('验证码错误');
    }

    await this.deleteVerificationCode(phone, purpose);
  }

  private async verifyEmailCode(
    email: string,
    purpose: EmailCodePurpose,
    emailCode: string,
  ): Promise<void> {
    const record = await this.getEmailVerificationCode(email, purpose);
    if (!record) {
      throw new BadRequestException('邮箱验证码不存在或已过期');
    }

    if (record.code !== emailCode) {
      throw new BadRequestException('邮箱验证码错误');
    }

    await this.deleteEmailVerificationCode(email, purpose);
  }

  private async deliverEmailVerificationCode(email: string, code: string): Promise<void> {
    const host = this.configService.get<string>('SMTP_HOST', 'smtp.163.com');
    const port = Number(this.configService.get<string>('SMTP_PORT', '465'));
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const from = this.configService.get<string>('SMTP_FROM', user || '');
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    if (!user || !pass || !from) {
      if (isProduction) {
        throw new ServiceUnavailableException('生产环境未配置邮箱验证码 SMTP 服务');
      }
      this.logger.warn('未配置 SMTP_USER/SMTP_PASS/SMTP_FROM，邮箱验证码仅记录日志');
      return;
    }

    if (
      isProduction &&
      (!host.includes('163.com') || (!user.endsWith('@163.com') && !from.endsWith('@163.com')))
    ) {
      throw new ServiceUnavailableException('生产环境邮箱验证码必须使用 163.com SMTP 邮箱');
    }

    const subject = '掘金股邮箱验证码';
    const body = `您的邮箱验证码是：${code}\n\n验证码将在 ${this.getSmsCodeTtl()} 秒后过期。如非本人操作，请忽略。`;
    await this.sendSmtpMail({ host, port, user, pass, from, to: email, subject, body });
  }

  private sendSmtpMail(options: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    to: string;
    subject: string;
    body: string;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = tls.connect({
        host: options.host,
        port: options.port,
        servername: options.host,
      });
      socket.setEncoding('utf8');
      socket.setTimeout(10000);

      let buffer = '';
      const readResponse = () =>
        new Promise<string>((readResolve, readReject) => {
          const onData = (chunk: string) => {
            buffer += chunk;
            const lines = buffer.split(/\r?\n/).filter(Boolean);
            const lastLine = lines[lines.length - 1] ?? '';
            if (/^\d{3} /.test(lastLine)) {
              socket.off('data', onData);
              const response = buffer;
              buffer = '';
              readResolve(response);
            }
          };
          socket.on('data', onData);
          socket.once('error', readReject);
        });

      const writeCommand = async (command: string, expectedPrefix: string) => {
        socket.write(`${command}\r\n`);
        const response = await readResponse();
        if (!response.startsWith(expectedPrefix)) {
          throw new Error(`SMTP 响应异常：${response.trim()}`);
        }
      };

      socket.once('secureConnect', async () => {
        try {
          const greeting = await readResponse();
          if (!greeting.startsWith('220')) {
            throw new Error(`SMTP 连接异常：${greeting.trim()}`);
          }

          await writeCommand('EHLO king.local', '250');
          await writeCommand('AUTH LOGIN', '334');
          await writeCommand(Buffer.from(options.user).toString('base64'), '334');
          await writeCommand(Buffer.from(options.pass).toString('base64'), '235');
          await writeCommand(`MAIL FROM:<${options.from}>`, '250');
          await writeCommand(`RCPT TO:<${options.to}>`, '250');
          await writeCommand('DATA', '354');

          const safeBody = options.body.replace(/^\./gm, '..');
          const message = [
            `From: ${options.from}`,
            `To: ${options.to}`,
            `Subject: ${options.subject}`,
            'Content-Type: text/plain; charset=UTF-8',
            '',
            safeBody,
            '.',
          ].join('\r\n');
          socket.write(`${message}\r\n`);
          const dataResponse = await readResponse();
          if (!dataResponse.startsWith('250')) {
            throw new Error(`SMTP 发送失败：${dataResponse.trim()}`);
          }

          socket.write('QUIT\r\n');
          socket.end();
          resolve();
        } catch (error) {
          socket.destroy();
          reject(error);
        }
      });

      socket.once('timeout', () => {
        socket.destroy();
        reject(new Error('SMTP 连接超时'));
      });
      socket.once('error', reject);
    });
  }
}
