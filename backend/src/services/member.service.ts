import { MemberRepository } from '../repositories/member.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { CreateMemberDTO, UpdateMemberDTO } from '../types/dto';
import { IMember } from '../types/interfaces';

export class MemberService {
  constructor(
    private memberRepo: MemberRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async createMember(dto: CreateMemberDTO, userId: string): Promise<IMember> {
    const existingPhone = await this.memberRepo.findByPhone(dto.phone);
    if (existingPhone) {
      throw new Error('A member with this phone number already exists.');
    }

    const existingQr = await this.memberRepo.findByQrCode(dto.qrCode);
    if (existingQr) {
      throw new Error('This QR code is already assigned to another member.');
    }

    const member = await this.memberRepo.create({
      id: dto.id,
      fullName: dto.fullName,
      phone: dto.phone,
      qrCode: dto.qrCode,
      status: (dto.status as any) || 'ACTIVE',
      managedBy: userId ? { connect: { id: userId } } : undefined,
      assignedTrainer: dto.assignedTrainerId
        ? { connect: { id: dto.assignedTrainerId } }
        : undefined,
    });

    await this.auditRepo.create({
      userId,
      action: 'MEMBER_CREATED',
      metadata: { memberId: member.id, name: member.fullName },
    });

    return member as IMember;
  }

  async updateMember(id: string, dto: UpdateMemberDTO, userId: string): Promise<IMember> {
    const existing = await this.memberRepo.findById(id);
    if (!existing) {
      throw new Error('Member not found.');
    }

    if (dto.phone && dto.phone !== existing.phone) {
      const phoneExists = await this.memberRepo.findByPhone(dto.phone);
      if (phoneExists) {
        throw new Error('This phone number is already registered to another member.');
      }
    }

    const updateData: Record<string, any> = {};
    if (dto.fullName) updateData.fullName = dto.fullName;
    if (dto.phone) updateData.phone = dto.phone;
    if (dto.status) updateData.status = dto.status;

    // Null = unassign trainer, string = reassign
    if (dto.assignedTrainerId !== undefined) {
      if (dto.assignedTrainerId === null) {
        updateData.assignedTrainer = { disconnect: true };
      } else {
        updateData.assignedTrainer = { connect: { id: dto.assignedTrainerId } };
      }
    }

    const updated = await this.memberRepo.update(id, updateData);

    await this.auditRepo.create({
      userId,
      action: 'MEMBER_UPDATED',
      metadata: { memberId: id, changes: dto },
    });

    return updated as IMember;
  }

  async getMemberById(id: string): Promise<IMember> {
    const member = await this.memberRepo.findById(id);
    if (!member) throw new Error('Member not found.');
    return member as IMember;
  }

  async getMemberByQrCode(qrCode: string): Promise<IMember> {
    const member = await this.memberRepo.findByQrCode(qrCode);
    if (!member) throw new Error('No member found for this QR code.');
    return member as IMember;
  }

  async getAllMembers(filters?: {
    status?: string;
    assignedTrainerId?: string;
  }): Promise<IMember[]> {
    return this.memberRepo.findAll(filters) as Promise<IMember[]>;
  }

  async deleteMember(id: string, userId: string): Promise<void> {
    const member = await this.memberRepo.findById(id);
    if (!member) throw new Error('Member not found.');

    // log full member data before deletion for recovery
    await this.auditRepo.create({
      userId,
      action: 'MEMBER_DELETED',
      metadata: { memberId: id, memberData: member },
    });

    await this.memberRepo.delete(id);
  }
}
