import { PrismaClient, PublicKeyType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const internalBpiSubjectRole = await prisma.bpiSubjectRole.upsert({
    where: { name: 'INTERNAL_BPI_SUBJECT' },
    update: {},
    create: {
      name: 'INTERNAL_BPI_SUBJECT',
      description: 'Internal Bpi Subject',
    },
  });

  await prisma.bpiSubjectRole.upsert({
    where: { name: 'EXTERNAL_BPI_SUBJECT' },
    update: {},
    create: {
      name: 'EXTERNAL_BPI_SUBJECT',
      description: 'External Bpi Subject',
    },
  });

  const internalBpiSubject = await prisma.bpiSubject.create({
    data: {
      name: 'BpiAdmin',
      description: 'Internal Bpi Subject of this Bpi',
      // private key 0x0fbdb56ab0fecb2f406fa807d9e6558baedacc1c15c0e2703b77d4c08441e4fe, used for testing purposes only
      loginNonce: '',
      roles: {
        connect: {
          id: internalBpiSubjectRole.id,
        },
      },
    },
  });

  await prisma.publicKey.createMany({
    data: [
      {
        type: PublicKeyType.ECDSA,
        value:
          '0x044e851fa6118d0d33f11ebf8d4cae2a25dca959f06c1ab87b8fec9ccbf0ca0021b7efc27c786f9480f9f11cfe8df1ae991329654308611148a35a2277ba5909fe',
        bpiSubjectId: internalBpiSubject.id,
      },
      {
        type: PublicKeyType.EDDSA,
        value:
          '0x044e851fa6118d0d33f11ebf8d4cae2a25dca959f06c1ab87b8fec9ccbf0ca0021b7efc27c786f9480f9f11cfe8df1ae991329654308611148a35a2277ba5909fe',
        bpiSubjectId: internalBpiSubject.id,
      },
    ],
  });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
