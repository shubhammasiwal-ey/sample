import { IsEnum, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { YnFlag } from '@prisma/client';

export class UpdateBuilderFieldDto {
  @IsOptional()
  @IsString()
  inputType?: string;

  @IsOptional()
  @IsString()
  customLabel?: string;

  @IsOptional()
  @IsString()
  helpText?: string;

  @IsOptional()
  @IsEnum(YnFlag)
  isRequired?: YnFlag;

  @IsOptional()
  @IsEnum(YnFlag)
  isEditable?: YnFlag;

  @IsOptional()
  @IsEnum(YnFlag)
  isReadonly?: YnFlag;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minLength?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxLength?: number;

  @IsOptional()
  @IsString()
  pattern?: string;

  @IsOptional()
  @IsString()
  step?: string;

  @IsOptional()
  @IsObject()
  validationRule?: any;

  @IsOptional()
  @IsString()
  rowType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  preference?: number;

  @IsOptional()
  @IsEnum(YnFlag)
  isActive?: YnFlag;
}