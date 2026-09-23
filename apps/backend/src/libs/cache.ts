import redis from '@/libs/redis.js';

const serialize = (value: unknown): string => {
  return JSON.stringify(value, (_, val) => {
    if (typeof val === 'bigint') {
      return {
        __type: 'bigint',
        value: val.toString(),
      };
    }

    return val;
  });
};

const deserialize = <T>(value: string): T => {
  return JSON.parse(value, (_, val) => {
    if (
      val &&
      typeof val === 'object' &&
      val.__type === 'bigint'
    ) {
      return BigInt(val.value);
    }

    return val;
  }) as T;
};

export const cacheGet = async <T>(
  key: string,
): Promise<T | null> => {
  try {
    const value = await redis.get(key);

    if (value === null) {
      return null;
    }

    return deserialize<T>(value);
  } catch (error) {
    console.error(`[Redis] GET failed: ${key}`, error);

    // Redis adalah cache.
    // Kalau Redis mati, aplikasi tetap menggunakan database.
    return null;
  }
};

export const cacheSet = async (
  key: string,
  value: unknown,
  ttlSeconds = 300,
): Promise<void> => {
  try {
    await redis.set(
      key,
      serialize(value),
      'EX',
      ttlSeconds,
    );
  } catch (error) {
    console.error(`[Redis] SET failed: ${key}`, error);
  }
};

export const cacheDelete = async (
  ...keys: string[]
): Promise<void> => {
  if (keys.length === 0) {
    return;
  }

  try {
    await redis.del(...keys);
  } catch (error) {
    console.error(
      `[Redis] DELETE failed: ${keys.join(', ')}`,
      error,
    );
  }
};
