import { LeadRepository } from '../repositories/lead.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { CreateLeadDTO, UpdateLeadDTO } from '../types/dto';
import { ILead } from '../types/interfaces';

export class LeadService {
  constructor(
    private leadRepo: LeadRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async captureInquiry(dto: CreateLeadDTO, userId: string): Promise<ILead> {
    const lead = await this.leadRepo.create({
      id: dto.id,
      name: dto.name,
      phone: dto.phone,
      status: (dto.status as any) || 'NEW',
      notes: dto.notes || null,
    });

    await this.auditRepo.create({
      userId,
      action: 'LEAD_CAPTURED',
      metadata: { leadId: lead.id, name: lead.name },
    });

    return lead as ILead;
  }

  async updateLead(id: string, dto: UpdateLeadDTO, userId: string): Promise<ILead> {
    const existing = await this.leadRepo.findById(id);
    if (!existing) throw new Error('Lead not found.');

    const updated = await this.leadRepo.update(id, dto as any);

    await this.auditRepo.create({
      userId,
      action: 'LEAD_UPDATED',
      metadata: { leadId: id, changes: dto },
    });

    return updated as ILead;
  }

  async getAllLeads(): Promise<ILead[]> {
    return this.leadRepo.findAll() as Promise<ILead[]>;
  }

  async getLeadsByStatus(status: string): Promise<ILead[]> {
    return this.leadRepo.findByStatus(status) as Promise<ILead[]>;
  }

  async convertToMember(id: string, userId: string): Promise<ILead> {
    const lead = await this.leadRepo.findById(id);
    if (!lead) throw new Error('Lead not found.');

    if (lead.status === 'CONVERTED') {
      throw new Error('This lead has already been converted.');
    }

    const updated = await this.leadRepo.update(id, { status: 'CONVERTED' });

    await this.auditRepo.create({
      userId,
      action: 'LEAD_CONVERTED',
      metadata: { leadId: id, name: lead.name },
    });

    return updated as ILead;
  }

  async deleteLead(id: string, userId: string): Promise<void> {
    const lead = await this.leadRepo.findById(id);
    if (!lead) throw new Error('Lead not found.');

    await this.auditRepo.create({
      userId,
      action: 'LEAD_DELETED',
      metadata: { leadId: id, leadData: lead },
    });

    await this.leadRepo.delete(id);
  }
}
