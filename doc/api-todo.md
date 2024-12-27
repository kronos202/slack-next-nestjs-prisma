auth:

- đăng kí - confirm email
- đăng nhập
- forgot password - send mail
- reset password
- vv...

channel:

- create(userId, name, workspaceId) -> check auth of member to create channel in workspace -> only admin allow create - improve: cache member - validation: name and workspaceId

- update(userId,name,channelId) -> check auth -> change name of channel

- remove(userId,channelId) -> check auth -> delete all message in channel and delete channel

- getCurrentChannel(userId,workspaceId) ->

- getChannels(userId,workspaceId) -> check isMemberOfWorkspace -> get all channels

- getChannelById(userId, channelId) -> check userId -> check channelId exist -> check isMemberOfWorkspace

conversation:

- getById(userId,conversationId) -> get conversation

- createOrGet(userId, memberId, workspaceId) -> current member (userId) -> other member (memberId) -> check is conversation exist? yes -> get exst -> no -> create new

member:

- populateUser(userId) -> get user

- getMember(workspaceId, userId) -> get

- get(workspaceId, userId) -> get []

- getById(memberId, userId)

- current(workspaceId, userId)

- update(memberId, role: 'admin' | 'member', userId)

- remove(memberId: string, userId: string)

message:

- getMessageById(userId: string, messageId: string)

- getMessages(args: {
  userId: string;
  channelId?: string;
  parentMessageId?: string;
  conversationId?: string;
  pagination: { skip: number; take: number };
  })

- createMessage(args: {
  userId: string;
  workspaceId: string;
  body: string;
  channelId?: string;
  conversationId?: string;
  parentMessageId?: string;
  image?: string;
  })

- updateMessage(userId: string, messageId: string, body: string)

- deleteMessage(userId: string, messageId: string)

- aggregateReactions(reactions: any[])

- getConversationIdFromParent(parentMessageId?: string)

reaction:

- getMember(workspaceId: string, userId: string)

- toggleReaction(userId: string, messageId: string, value: string)

workspace:

- generateWorkspaceCode

- createWorkspace(userId: string, name: string)

- joinWorkspace(userId: string, workspaceId: string, joinCode: string)

- updateWorkspace(userId: string, workspaceId: string, name: string)

- deleteWorkspace(userId: string, workspaceId: string)

- checkAdminRole(userId: string, workspaceId: string)

- generateJoinCode()

users:
