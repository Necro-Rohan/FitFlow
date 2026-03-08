import { PrismaClient, Payment, Prisma } from '@prisma/client';

export class PaymentRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.PaymentUncheckedCreateInput): Promise<Payment> {
    return this.prisma.payment.create({ data });
  }

  async findById(id: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({ where: { id } });
  }

  async findByMemberId(memberId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { memberId },
      orderBy: { transactionDate: 'desc' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: {
        transactionDate: { gte: startDate, lte: endDate },
        syncStatus: 'SYNCED',
      },
      include: {
        member: { select: { id: true, fullName: true } },
      },
      orderBy: { transactionDate: 'desc' },
    });
  }

  async getTodayRevenue(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.prisma.payment.aggregate({
      where: {
        transactionDate: { gte: today },
        syncStatus: 'SYNCED',
      },
      _sum: { amount: true },
    });

    return Number(result._sum.amount || 0);
  }

  async update(id: string, data: Prisma.PaymentUpdateInput): Promise<Payment> {
    return this.prisma.payment.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Payment> {
    return this.prisma.payment.delete({ where: { id } });
  }
}
