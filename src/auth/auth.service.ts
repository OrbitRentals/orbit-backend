import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private users: any[] = [];

  constructor(private jwt: JwtService) {}

  async register(email: string, password: string, role = 'RENTER') {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = { id: crypto.randomUUID(), email, passwordHash, role };
    this.users.push(user);
    return { id: user.id, email: user.email, role: user.role };
  }

  async login(email: string, password: string) {
    const user = this.users.find(u => u.email === email);
    if (!user) throw new Error('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error('Invalid credentials');
    return {
      access_token: this.jwt.sign({ sub: user.id, email: user.email, role: user.role })
    };
  }
}
