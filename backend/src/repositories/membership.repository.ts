import { PrismaClient, Membership, Prisma } from '@prisma/client';

export class MembershipRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.MembershipCreateInput): Promise<Membership> {
    return this.prisma.membership.create({ data });
  }

  async findById(id: string): Promise<Membership | null> {
    return this.prisma.membership.findUnique({ where: { id } });
  }

  async findByMemberId(memberId: string): Promise<Membership[]> {
    return this.prisma.membership.findMany({
      where: { memberId },
      orderBy: { endDate: 'desc' },
    });
  }

  async findExpiringSoon(daysFromNow: number): Promise<Membership[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysFromNow);

    return this.prisma.membership.findMany({
      where: {
        endDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        member: { select: { id: true, fullName: true, phone: true } },
      },
    });
  }

  async update(id: string, data: Prisma.MembershipUpdateInput): Promise<Membership> {
    return this.prisma.membership.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Membership> {
    return this.prisma.membership.delete({ where: { id } });
  }
}
