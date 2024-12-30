// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// async function main() {
//   console.log('Seeding database...');

//   // 1. Seed Users
//   const users = await Promise.all(
//     [
//       {
//         email: 'admin@example.com',
//         username: 'admin',
//         firstName: 'Admin',
//         lastName: 'User',
//       },
//       {
//         email: 'user1@example.com',
//         username: 'user1',
//         firstName: 'User',
//         lastName: 'One',
//       },
//       {
//         email: 'user2@example.com',
//         username: 'user2',
//         firstName: 'User',
//         lastName: 'Two',
//       },
//     ].map(async (user) => {
//       return prisma.user.upsert({
//         where: { email: user.email },
//         update: {},
//         create: {
//           ...user,
//           password: 'hashedpassword', // Replace with actual hashed password
//           avatar: 'https://api.realworld.io/images/smiley-cyrus.jpeg',
//         },
//       });
//     }),
//   );

//   console.log(
//     'Users seeded:',
//     users.map((u) => u.username),
//   );

//   // 2. Seed Workspaces
//   const workspaces = await Promise.all(
//     [
//       {
//         name: 'Workspace 1',
//         joinCode: 'JOINCODE1',
//         createdBy: users[0].id,
//         memberId: users[0].id,
//       },
//       {
//         name: 'Workspace 2',
//         joinCode: 'JOINCODE2',
//         createdBy: users[1].id,
//         memberId: users[1].id,
//       },
//     ].map(async (workspace) => {
//       return prisma.workspace.upsert({
//         where: { joinCode: workspace.joinCode },
//         update: {},
//         create: workspace,
//       });
//     }),
//   );

//   console.log(
//     'Workspaces seeded:',
//     workspaces.map((w) => w.name),
//   );

//   // 3. Seed Members
//   const members = [];
//   for (const workspace of workspaces) {
//     for (const user of users) {
//       const member = await prisma.member.upsert({
//         where: {
//           userId_workspaceId: { userId: user.id, workspaceId: workspace.id },
//         },
//         update: {},
//         create: {
//           userId: user.id,
//           workspaceId: workspace.id,
//           role: user.id === workspace.createdBy ? 'OWNER' : 'MEMBER',
//         },
//       });
//       members.push(member);
//     }
//   }

//   console.log('Members seeded:', members.length);

//   // 4. Seed Channels
//   const channels = await Promise.all(
//     [
//       { name: 'General', workspaceId: workspaces[0].id },
//       { name: 'Random', workspaceId: workspaces[0].id },
//     ].map(async (channel) => {
//       return prisma.channel.upsert({
//         where: {
//           name_workspaceId: {
//             name: channel.name,
//             workspaceId: channel.workspaceId,
//           },
//         },
//         update: {},
//         create: channel,
//       });
//     }),
//   );

//   console.log(
//     'Channels seeded:',
//     channels.map((c) => c.name),
//   );

//   // 5. Seed Conversations
//   const conversations = [];
//   for (let i = 0; i < members.length; i++) {
//     for (let j = i + 1; j < members.length; j++) {
//       if (members[i].workspaceId === members[j].workspaceId) {
//         const conversation = await prisma.conversation.upsert({
//           where: {
//             memberOneId_memberTwoId: {
//               memberOneId: members[i].id,
//               memberTwoId: members[j].id,
//             },
//           },
//           update: {},
//           create: {
//             workspaceId: members[i].workspaceId,
//             memberOneId: members[i].id,
//             memberTwoId: members[j].id,
//           },
//         });
//         conversations.push(conversation);
//       }
//     }
//   }

//   console.log('Conversations seeded:', conversations.length);

//   // 6. Seed Messages
//   const messages = await Promise.all(
//     [
//       {
//         content: 'Hello World!',
//         memberId: members[0].id,
//         workspaceId: workspaces[0].id,
//         channelId: channels[0].id,
//       },
//       {
//         content: 'Welcome to the workspace!',
//         memberId: members[1].id,
//         workspaceId: workspaces[0].id,
//         channelId: channels[0].id,
//       },
//     ].map(async (message) => {
//       return prisma.message.create({ data: message });
//     }),
//   );

//   console.log(
//     'Messages seeded:',
//     messages.map((m) => m.content),
//   );

//   // 7. Seed Reactions
//   const reactions = await Promise.all(
//     messages.map(async (message) => {
//       return prisma.reaction.create({
//         data: {
//           value: '👍',
//           memberId: members[0].id,
//           workspaceId: message.workspaceId,
//           messageId: message.id,
//         },
//       });
//     }),
//   );

//   console.log('Reactions seeded:', reactions.length);
// }

// main()
//   .then(async () => {
//     console.log('Seeding completed.');
//     await prisma.$disconnect();
//   })
//   .catch(async (e) => {
//     console.error(e);
//     await prisma.$disconnect();
//     process.exit(1);
//   });
