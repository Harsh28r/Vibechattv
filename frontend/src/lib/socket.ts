import { io, type Socket } from "socket.io-client";
import { siteConfig } from "./site";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(siteConfig.socketUrl, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
