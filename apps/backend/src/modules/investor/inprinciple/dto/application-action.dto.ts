import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class ApplicationActionDto {
  @IsInt()
  submissionId: number;

  @IsString()
  serviceId: string;

  @IsOptional()
  @IsString()
  processingLevel?: string;

  @IsIn(['forward', 'approve', 'reject', 'revert', 'hold'])
  action: 'forward' | 'approve' | 'reject' | 'revert' | 'hold';

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsInt()
  nextRoleId?: number;

  @IsOptional()
  @IsInt()
  nextUserId?: number;

  @IsOptional()
  @IsString()
  reasonForDelay?: string;

  @IsOptional()
  @IsString()
  supportiveDocument?: string;
}
