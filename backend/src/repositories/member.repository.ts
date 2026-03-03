import { PrismaClient, Member, Prisma } from '@prisma/client';

export class MemberRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.MemberCreateInput): Promise<Member> {
    return this.prisma.member.create({ data });
  }

  async findById(id: string): Promise<Member | null> {
    return this.prisma.member.findUnique({ where: { id } });
  }

  async findByQrCode(qrCode: string): Promise<Member | null> {
    return this.prisma.member.findUnique({ where: { qrCode } });
  }

  async findByPhone(phone: string): Promise<Member | null> {
    return this.prisma.member.findUnique({ where: { phone } });
  }

  async findAll(filters?: {
    status?: string;
    assignedTrainerId?: string;
  }): Promise<Member[]> {
    const where: Prisma.MemberWhereInput = {};

    if (filters?.status) {
      where.status = filters.status as any;
    }
    if (filters?.assignedTrainerId) {
      where.assignedTrainerId = filters.assignedTrainerId;
    }

    return this.prisma.member.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        memberships: true,
        assignedTrainer: {
          select: { id: true, username: true },
        },
      },
    });
  }

  async update(id: string, data: Prisma.MemberUpdateInput): Promise<Member> {
    return this.prisma.member.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Member> {
    return this.prisma.member.delete({ where: { id } });
  }
}
