import { PrismaClient } from '@prisma/client'

class PrismaClientWithLogging extends PrismaClient {
  async $connect() {
    console.log('Attempting to connect to the database...');
    try {
      await super.$connect();
      console.log('Successfully connected to the database');
    } catch (error) {
      console.error('Failed to connect to the database:', error);
      throw error;
    }
  }
}

const prismaClientSingleton = () => {
  return new PrismaClientWithLogging()
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

// Attempt to connect and log the result
prisma.$connect()
  .then(() => console.log('Prisma client is ready'))
  .catch((error) => console.error('Failed to initialize Prisma client:', error));

export default prisma