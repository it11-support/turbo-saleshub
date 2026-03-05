import "dotenv/config";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient, Prisma } from '../generated/prisma/client.js';
import { pagination } from "prisma-extension-pagination";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function convertScalar(value: any): { converted: boolean; value: any } {
  if (typeof value === "bigint") return { converted: true, value: Number(value) };

  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as Prisma.Decimal).toNumber === "function"
  ) {
    return { converted: true, value: (value as Prisma.Decimal).toNumber() };
  }

  if (value instanceof Date) {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = value.getFullYear();
    const month = pad(value.getMonth() + 1);
    const day = pad(value.getDate());
    const hours = pad(value.getHours());
    const minutes = pad(value.getMinutes());
    const seconds = pad(value.getSeconds());
    return {
      converted: true,
      value: `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
    };
  }

  return { converted: false, value };
}

function convertValue(input: any): any {
  const scalar = convertScalar(input);
  if (scalar.converted) return scalar.value;

  if (!Array.isArray(input) && !(input && typeof input === "object" && isPlainObject(input))) {
    return input;
  }

  const seen = new WeakMap<object, any>();
  const root = Array.isArray(input) ? [] : {};
  seen.set(input as object, root);

  const stack: Array<{ source: any; target: any }> = [{ source: input, target: root }];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    const { source, target } = current;

    if (Array.isArray(source)) {
      for (let i = 0; i < source.length; i++) {
        const item = source[i];
        const itemScalar = convertScalar(item);
        if (itemScalar.converted) {
          target[i] = itemScalar.value;
          continue;
        }

        if (Array.isArray(item) || (item && typeof item === "object" && isPlainObject(item))) {
          const cached = seen.get(item);
          if (cached) {
            target[i] = cached;
            continue;
          }

          const child = Array.isArray(item) ? [] : {};
          seen.set(item, child);
          target[i] = child;
          stack.push({ source: item, target: child });
          continue;
        }

        target[i] = item;
      }
      continue;
    }

    for (const [key, value] of Object.entries(source)) {
      const valueScalar = convertScalar(value);
      if (valueScalar.converted) {
        target[key] = valueScalar.value;
        continue;
      }

      if (Array.isArray(value) || (value && typeof value === "object" && isPlainObject(value))) {
        const cached = seen.get(value);
        if (cached) {
          target[key] = cached;
          continue;
        }

        const child = Array.isArray(value) ? [] : {};
        seen.set(value, child);
        target[key] = child;
        stack.push({ source: value, target: child });
        continue;
      }

      target[key] = value;
    }
  }

  return root;
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
