import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { pagination } from 'prisma-extension-pagination';
import { Prisma, PrismaClient } from '../generated/prisma/client.js';

function convertValue(value: any): any {
  if (typeof value === 'bigint') return Number(value);

  if (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as Prisma.Decimal).toNumber === 'function'
  ) {
    return (value as Prisma.Decimal).toNumber();
  }

  if (value instanceof Date) {
    if (!value) return '';

    const pad = (n: number) => n.toString().padStart(2, '0');

    // Jika value adalah Date object, ambil komponennya langsung tanpa ubah zona waktu
    const dateObj = value instanceof Date ? value : new Date(value);

    const year = dateObj.getFullYear();
    const month = pad(dateObj.getMonth() + 1);
    const date = pad(dateObj.getDate());
    const hours = pad(dateObj.getHours());
    const minutes = pad(dateObj.getMinutes());
    const seconds = pad(dateObj.getSeconds());

    const newDate = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
    return newDate;
  }
  if (Array.isArray(value)) return value.map(convertValue);
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, convertValue(v)]));
  return value;
}

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT as unknown as number,
});

const base = new PrismaClient({ adapter });

const prismaProxyfied = new Proxy(base, {
  get(target, prop) {
    return Reflect.get(target, prop);
  },
});

const prismaPaginated = prismaProxyfied.$extends(pagination());

const prisma = prismaPaginated.$extends({
  query: {
    $allModels: {
      async findMany({ args, query }) {
        const result = await query(args);
        return convertValue(result);
      },
      async findFirst({ args, query }) {
        const result = await query(args);
        return convertValue(result);
      },
      async findUnique({ args, query }) {
        const result = await query(args);
        return convertValue(result);
      },
      async create({ args, query }) {
        const result = await query(args);
        return convertValue(result);
      },
      async update({ args, query }) {
        const result = await query(args);
        return convertValue(result);
      },
    },
  },
});

export default prisma;
