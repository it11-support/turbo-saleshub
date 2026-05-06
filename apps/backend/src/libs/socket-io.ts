import { verifyToken } from '@/utils/jwt.js';
import { IUserPayload } from '@saleshub-tsm/types';
import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

// 1. Perbaikan Interface: Gunakan 'data' property sesuai standar Socket.io
declare module "socket.io" {
  interface Socket extends IUserPayload { }
}

let io: Server;
const onlineUsers = new Map<number, string>();

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.SOCKET_IO_CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling'] // Support fallback untuk stabilitas
  });

  // 2. Middleware Autentikasi
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) return next(new Error("Authentication error: No token provided"));

    const decoded = verifyToken(token) as IUserPayload;
    if (!decoded) return next(new Error("Authentication error: Invalid token"));

    socket.data = decoded; // Data user disimpan di socket.data
    next();
  });

  io.on("connection", (socket) => {
    const userId = Number(socket.data.id);

    // Simpan ke daftar user online
    onlineUsers.set(userId, socket.id);

    // Join room privat berdasarkan ID
    socket.join(`room-${userId}`);
    console.log(`[Socket] User ${userId} connected and joined room: room-${userId}`);

    // Join room berdasarkan role
    if (socket.data.role) {
      socket.join(`role-${socket.data.role}`);
    }

    // Broadcast status online
    io.emit("userStatusUpdate", { userId, status: 'online' });
    io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("userStatusUpdate", { userId, status: 'offline' });
      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
      console.log(`[Socket] User ${userId} disconnected`);
    });

    socket.on("requestOnlineUsers", () => {
      socket.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};
export const socketIoEmitter = async <T>(
  event: string,
  data: T,
  targetUserId: number
): Promise<void> => {
  try {
    const io = getIO();

    // PENTING: Konversi BigInt ke String agar tidak error saat dikirim via JSON
    const safeData = JSON.parse(
      JSON.stringify(data, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    console.log(`[Socket] Emitting ${event} to room-${targetUserId}`);
    io.to(`room-${targetUserId}`).emit(event, safeData);
  } catch (error) {
    console.error("[Socket Error] socketIoEmitter failed:", error);
  }
};
