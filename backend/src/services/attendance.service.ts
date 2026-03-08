import { AttendanceRepository } from '../repositories/attendance.repository';
import { MemberRepository } from '../repositories/member.repository';
import { CreateAttendanceDTO } from '../types/dto';
import { IAttendance } from '../types/interfaces';

export class AttendanceService {
  constructor(
    private attendanceRepo: AttendanceRepository,
    private memberRepo: MemberRepository,
  ) {}

  async recordCheckIn(dto: CreateAttendanceDTO): Promise<IAttendance> {
    const member = await this.memberRepo.findById(dto.memberId);
    if (!member) {
      throw new Error('Member not found. Invalid QR code or ID.');
    }

    if (member.status === 'EXPIRED') {
      throw new Error('Membership has expired. Please renew before checking in.');
    }
    if (member.status === 'PAUSED') {
      throw new Error('Membership is paused. Resume it before checking in.');
    }

    const attendance = await this.attendanceRepo.create({
      id: dto.id,
      memberId: dto.memberId,
      checkIn: new Date(dto.checkIn),
      syncStatus: 'SYNCED',
    });

    return attendance as IAttendance;
  }

  async getTodayCheckIns(): Promise<IAttendance[]> {
    return this.attendanceRepo.getTodayCheckIns() as Promise<IAttendance[]>;
  }

  async getTodayCount(): Promise<{ count: number }> {
    const count = await this.attendanceRepo.getTodayCount();
    return { count };
  }

  async getCheckInsByMemberId(memberId: string): Promise<IAttendance[]> {
    return this.attendanceRepo.findByMemberId(memberId) as Promise<IAttendance[]>;
  }
}
