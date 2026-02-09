import { CreateKyaQuestionDto } from './create-question.dto';

// Make all properties optional for update DTO
export class UpdateKyaQuestionDto implements Partial<CreateKyaQuestionDto> {
    categoryId?: number;
    questionLabel?: string;
    fieldType?: string;
    isDependent?: boolean;
    parentQuestionId?: number | null;
    kyaOptionId?: number | null;
    isMandatory?: boolean;
    isTooltipAvailable?: boolean;
    tooltipText?: string;
    showReferenceDocument?: boolean;
    urlDocument?: string;
    userId?: number | null;
    optionDetails?: any;
}
