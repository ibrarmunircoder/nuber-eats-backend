import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { UserVerification } from '../entities/verification.entity';

@ObjectType()
export class VerifyEamilOutput extends CoreOutput {}

@InputType()
export class VerifyEmailInput extends PickType(UserVerification, ['code']) {}
