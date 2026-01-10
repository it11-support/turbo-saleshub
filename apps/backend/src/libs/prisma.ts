import "dotenv/config";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient, Prisma } from '../generated/prisma/client.js';
import { pagination } from "prisma-extension-pagination";

function convertValue(value: any): any {
  if (typeof value === "bigint") return Number(value);

  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as Prisma.Decimal).toNumber === "function"
  ) {
    return (value as Prisma.Decimal).toNumber();
  }

  if (value instanceof Date) {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = value.getFullYear();
    const month = pad(value.getMonth() + 1);
    const day = pad(value.getDate());
    const hours = pad(value.getHours());
    const minutes = pad(value.getMinutes());
    const seconds = pad(value.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  if (Array.isArray(value)) return value.map(convertValue);

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, convertValue(v)])
    );
  }

  return value;
}


const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: Number(process.env.DATABSE_PORT || 3306),
  connectionLimit: 20
});

const base  = new PrismaClient({ adapter })
const prismaWithPagination = base.$extends(pagination());

const prisma = prismaWithPagination.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        const result = await query(args);
        return convertValue(result);
      },
    },
  },
});

export default prisma;
