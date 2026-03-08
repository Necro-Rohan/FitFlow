import { PrismaClient, Attendance, Prisma } from '@prisma/client';

export class AttendanceRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.AttendanceUncheckedCreateInput): Promise<Attendance> {
    return this.prisma.attendance.create({ data });
  }

  async findById(id: string): Promise<Attendance | null> {
    return this.prisma.attendance.findUnique({ where: { id } });
  }

  async findByMemberId(memberId: string): Promise<Attendance[]> {
    return this.prisma.attendance.findMany({
      where: { memberId },
      orderBy: { checkIn: 'desc' },
    });
  }

  async getTodayCheckIns(): Promise<(Attendance & { member: { id: string; fullName: string; qrCode: string } })[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.attendance.findMany({
      where: { checkIn: { gte: today } },
      include: {
        member: { select: { id: true, fullName: true, qrCode: true } },
      },
      orderBy: { checkIn: 'desc' },
    }) as any;
  }

  async getTodayCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.attendance.count({
      where: { checkIn: { gte: today } },
    });
  }

  async delete(id: string): Promise<Attendance> {
    return this.prisma.attendance.delete({ where: { id } });
  }
}
