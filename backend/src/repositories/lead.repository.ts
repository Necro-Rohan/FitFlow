import { PrismaClient, Lead, Prisma } from '@prisma/client';

export class LeadRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.LeadUncheckedCreateInput): Promise<Lead> {
    return this.prisma.lead.create({ data });
  }

  async findById(id: string): Promise<Lead | null> {
    return this.prisma.lead.findUnique({ where: { id } });
  }

  async findByStatus(status: string): Promise<Lead[]> {
    return this.prisma.lead.findMany({
      where: { status: status as any },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(): Promise<Lead[]> {
    return this.prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Prisma.LeadUpdateInput): Promise<Lead> {
    return this.prisma.lead.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Lead> {
    return this.prisma.lead.delete({ where: { id } });
  }
}
