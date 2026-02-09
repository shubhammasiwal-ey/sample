
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateFormFieldDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
