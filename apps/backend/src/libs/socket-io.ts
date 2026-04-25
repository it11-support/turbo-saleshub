import { verifyToken } from '@/utils/jwt.js';
import { IUserPayload } from '@saleshub-tsm/types';
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

// 1. Definisikan Interface untuk Data Socket
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
    }
  });

  // 2. Middleware Autentikasi Reusable
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) return next(new Error("Authentication error: No token provided"));

    const decoded = verifyToken(token);
    if (!decoded) return next(new Error("Authentication error: Invalid token"));

    socket.data = decoded;
    next();
  });

  io.on("connection", (socket: Socket) => {
    const userId = Number(socket.data.id);
    onlineUsers.set(userId, socket.id);
    // Join room privat berdasarkan ID (untuk push personal)
    socket.join(`user-${userId}`);

    // Join room berdasarkan role (untuk broadcast per grup)
    if (socket.data.role) {
      socket.join(`role-${socket.data.role}`);
    }

    // Emit status online ke semua
    io.emit("userStatusUpdate", { userId, status: 'online' });
    io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));


    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("userStatusUpdate", { userId, status: 'offline' });
      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    });

    socket.on("requestOnlineUsers", () => {
      socket.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    });

  });

  return io;
};

// 4. Getter Instance IO (Untuk dipakai di Controller/Scheduler)
export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io must be initialized with initSocket(httpServer) first!");
  }
  return io;
};
