// src/conversation/dto/add-participant.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class AddParticipantDto {
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @IsNotEmpty()
  @IsString()
  memberId: string;
}
