import { MembershipRepository } from '../repositories/membership.repository';
import { MemberRepository } from '../repositories/member.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { CreateMembershipDTO, UpdateMembershipDTO } from '../types/dto';
import { IMembership } from '../types/interfaces';

export class MembershipService {
  constructor(
    private membershipRepo: MembershipRepository,
    private memberRepo: MemberRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async createMembership(dto: CreateMembershipDTO, userId: string): Promise<IMembership> {
    const member = await this.memberRepo.findById(dto.memberId);
    if (!member) {
      throw new Error('Member not found. Create the member first.');
    }

    const membership = await this.membershipRepo.create({
      id: dto.id,
      planName: dto.planName,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      type: dto.type as any,
      remainingClasses: dto.remainingClasses ?? null,
      member: { connect: { id: dto.memberId } },
    });

    // auto-activate member if they were expired/paused
    // TODO: maybe send a notification or something here later
    if (member.status !== 'ACTIVE') {
      await this.memberRepo.update(member.id, { status: 'ACTIVE' });
    }

    await this.auditRepo.create({
      userId,
      action: 'MEMBERSHIP_CREATED',
      metadata: { membershipId: membership.id, memberId: dto.memberId, plan: dto.planName },
    });

    return membership as IMembership;
  }

  async updateMembership(id: string, dto: UpdateMembershipDTO, userId: string): Promise<IMembership> {
    const existing = await this.membershipRepo.findById(id);
    if (!existing) throw new Error('Membership not found.');

    const updateData: Record<string, any> = {};
    if (dto.planName) updateData.planName = dto.planName;
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);
    if (dto.remainingClasses !== undefined) updateData.remainingClasses = dto.remainingClasses;

    const updated = await this.membershipRepo.update(id, updateData);

    await this.auditRepo.create({
      userId,
      action: 'MEMBERSHIP_UPDATED',
      metadata: { membershipId: id, changes: dto },
    });

    return updated as IMembership;
  }

  async getMembershipsByMemberId(memberId: string): Promise<IMembership[]> {
    return this.membershipRepo.findByMemberId(memberId) as Promise<IMembership[]>;
  }

  async getExpiringSoon(daysFromNow: number = 7): Promise<IMembership[]> {
    return this.membershipRepo.findExpiringSoon(daysFromNow) as Promise<IMembership[]>;
  }

  async pauseMembership(id: string, userId: string): Promise<IMembership> {
    const membership = await this.membershipRepo.findById(id);
    if (!membership) throw new Error('Membership not found.');

    await this.memberRepo.update(membership.memberId, { status: 'PAUSED' });

    await this.auditRepo.create({
      userId,
      action: 'MEMBERSHIP_PAUSED',
      metadata: { membershipId: id, memberId: membership.memberId },
    });

    // pause is tracked via member status for now, not on the membership itself
    return membership as IMembership;
  }

  async extendMembership(id: string, extraDays: number, userId: string): Promise<IMembership> {
    const membership = await this.membershipRepo.findById(id);
    if (!membership) throw new Error('Membership not found.');

    const newEndDate = new Date(membership.endDate);
    newEndDate.setDate(newEndDate.getDate() + extraDays);

    const updated = await this.membershipRepo.update(id, { endDate: newEndDate });

    await this.auditRepo.create({
      userId,
      action: 'MEMBERSHIP_EXTENDED',
      metadata: { membershipId: id, extraDays, newEndDate },
    });

    return updated as IMembership;
  }

  async deleteMembership(id: string, userId: string): Promise<void> {
    const membership = await this.membershipRepo.findById(id);
    if (!membership) throw new Error('Membership not found.');

    await this.auditRepo.create({
      userId,
      action: 'MEMBERSHIP_DELETED',
      metadata: { membershipId: id, membershipData: membership },
    });

    await this.membershipRepo.delete(id);
  }
}
