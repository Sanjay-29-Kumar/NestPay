import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

let io: SocketIOServer | null = null;

export function initSocketServer(server: HTTPServer): SocketIOServer {
    io = new SocketIOServer(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket: Socket) => {
        // Join specific unit chat room
        socket.on("join_unit_room", (data: { unitId: string }) => {
            if (data?.unitId) {
                const room = `unit_${data.unitId}`;
                socket.join(room);
            }
        });

        // Leave specific unit chat room
        socket.on("leave_unit_room", (data: { unitId: string }) => {
            if (data?.unitId) {
                const room = `unit_${data.unitId}`;
                socket.leave(room);
            }
        });

        socket.on("disconnect", () => {
            // connection closed
        });
    });

    return io;
}

export function getIO(): SocketIOServer | null {
    return io;
}

export function emitNewChatMessage(unitId: string, message: any) {
    if (io) {
        const room = `unit_${unitId}`;
        io.to(room).emit("new_message", message);
    }
}

export function emitMessagesRead(unitId: string, userId: string) {
    if (io) {
        const room = `unit_${unitId}`;
        io.to(room).emit("messages_read", { unitId, userId });
    }
}
