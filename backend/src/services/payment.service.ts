import { PaymentRepository } from '../repositories/payment.repository';
import { MemberRepository } from '../repositories/member.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { CreatePaymentDTO } from '../types/dto';
import { IPayment } from '../types/interfaces';

export class PaymentService {
  constructor(
    private paymentRepo: PaymentRepository,
    private memberRepo: MemberRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async createPayment(dto: CreatePaymentDTO, userId: string): Promise<IPayment> {
    const member = await this.memberRepo.findById(dto.memberId);
    if (!member) {
      throw new Error('Member not found. Cannot record payment.');
    }

    const payment = await this.paymentRepo.create({
      id: dto.id,
      memberId: dto.memberId,
      amount: dto.amount,
      method: dto.method as any,
      syncStatus: 'SYNCED',
      invoiceNumber: dto.invoiceNumber || null,
      transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
    });

    await this.auditRepo.create({
      userId,
      action: 'PAYMENT_RECORDED',
      metadata: {
        paymentId: payment.id,
        memberId: dto.memberId,
        amount: dto.amount,
        method: dto.method,
      },
    });

    return this.toPaymentResponse(payment);
  }

  async getPaymentsByMemberId(memberId: string): Promise<IPayment[]> {
    const payments = await this.paymentRepo.findByMemberId(memberId);
    return payments.map(this.toPaymentResponse);
  }

  async getPaymentsByDateRange(startDate: string, endDate: string): Promise<IPayment[]> {
    const payments = await this.paymentRepo.findByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
    return payments.map(this.toPaymentResponse);
  }

  async getTodayRevenue(): Promise<{ total: number }> {
    const total = await this.paymentRepo.getTodayRevenue();
    return { total };
  }

  async getPaymentById(id: string): Promise<IPayment> {
    const payment = await this.paymentRepo.findById(id);
    if (!payment) throw new Error('Payment not found.');
    return this.toPaymentResponse(payment);
  }

  // Prisma stores amount as Decimal, need to convert to number for JSON response
  private toPaymentResponse(payment: any): IPayment {
    return {
      ...payment,
      amount: Number(payment.amount),
    };
  }
}
