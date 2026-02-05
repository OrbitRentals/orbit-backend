import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Role } from './roles';
import * as crypto from 'crypto';

type User = {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
};

@Injectable()
export class AuthService {
  private users: User[] = [];

  constructor(private jwt: JwtService) {}

  async register(email: string, password: string, role: Role = 'RENTER') {
    const passwordHash = await bcrypt.hash(password, 10);

    const user: User = {
      id: crypto.randomUUID(),
      email,
      passwordHash,
      role
    };

    this.users.push(user);

    return {
      id: user.id,
      email: user.email,
      role: user.role
    };
  }

  async login(email: string, password: string) {
    const user = this.users.find(u => u.email === email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    return {
      access_token: token
    };
  }

  findById(id: string) {
    return this.users.find(u => u.id === id);
  }
}
