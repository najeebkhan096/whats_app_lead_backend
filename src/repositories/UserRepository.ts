import { getPrismaClient } from '@config/database';
import { User } from '@prisma/client';
import { hashPassword } from '@utils/password';

export class UserRepository {
  private prisma = getPrismaClient();

  /**
   * Create a new user
   */
  async create(data: {
    email: string;
    name: string;
    password: string;
    role?: 'ADMIN' | 'USER';
  }): Promise<User> {
    const hashedPassword = await hashPassword(data.password);
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role || 'USER',
      },
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Update user
   */
  async update(id: string, data: Partial<User>): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Find all users
   */
  async findAll(skip: number = 0, take: number = 10): Promise<{ users: User[]; total: number }> {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { users, total };
  }
}
