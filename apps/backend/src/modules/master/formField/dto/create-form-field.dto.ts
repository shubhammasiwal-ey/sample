
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFormFieldDto {
  @IsString()
  name!: string;

  @IsNumber()
  categoryId!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
