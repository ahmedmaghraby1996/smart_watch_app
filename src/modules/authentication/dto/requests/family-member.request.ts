import { RelationType } from 'src/infrastructure/data/enums/relation_type.enum';
import { RegisterRequest } from './register.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { RelationType } from 'typeorm/metadata/types/RelationTypes';

export class FamilyMemberRequest extends RegisterRequest {
  @ApiProperty({
    default: RelationType.DRIVER,
    enum: [
      RelationType.BROTHER,
      RelationType.BROTHER_IN_LAW,
      RelationType.FATHER,
      RelationType.GRAND_FATHER,
      RelationType.GRAND_FATHER_IN_LAW,
      RelationType.GRAND_MOTHER,
      RelationType.MOTHER,
      RelationType.SISTER,
      RelationType.SISTER_IN_LAW,
    ],
  })
  @IsNotEmpty()
  @IsEnum(RelationType)
  relation_type: RelationType;
}
