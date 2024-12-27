export class CreateMessageDto {
  content: string;
  workspaceId: string;
  image?: string;
  channelId?: string;
  conversationId?: string;
  parentMessageId?: string;
}
