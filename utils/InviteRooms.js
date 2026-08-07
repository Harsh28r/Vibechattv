import { randomBytes } from 'crypto';

/**
 * Private invite rooms: host creates code, guest joins via link.
 */
class InviteRooms {
  constructor() {
    this.rooms = new Map(); // code -> { code, hostId, guestId, createdAt }
    this.bySocket = new Map(); // socketId -> code
  }

  #code() {
    return randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  }

  create(hostId) {
    this.leave(hostId);
    let code = this.#code();
    while (this.rooms.has(code)) code = this.#code();

    const room = {
      code,
      hostId,
      guestId: null,
      createdAt: Date.now(),
    };
    this.rooms.set(code, room);
    this.bySocket.set(hostId, code);
    return room;
  }

  join(code, guestId) {
    const normalized = String(code || '').trim().toUpperCase();
    const room = this.rooms.get(normalized);
    if (!room) return { ok: false, message: 'Room not found' };
    if (room.hostId === guestId) return { ok: false, message: 'You are already the host' };
    if (room.guestId && room.guestId !== guestId) {
      return { ok: false, message: 'Room is full' };
    }
    if (Date.now() - room.createdAt > 30 * 60 * 1000) {
      this.rooms.delete(normalized);
      return { ok: false, message: 'Room expired' };
    }

    this.leave(guestId);
    room.guestId = guestId;
    this.bySocket.set(guestId, normalized);
    return { ok: true, room };
  }

  getBySocket(socketId) {
    const code = this.bySocket.get(socketId);
    return code ? this.rooms.get(code) : null;
  }

  leave(socketId) {
    const code = this.bySocket.get(socketId);
    if (!code) return null;
    this.bySocket.delete(socketId);
    const room = this.rooms.get(code);
    if (!room) return null;

    if (room.hostId === socketId) {
      this.rooms.delete(code);
      if (room.guestId) this.bySocket.delete(room.guestId);
      return { code, closed: true, otherId: room.guestId };
    }

    if (room.guestId === socketId) {
      room.guestId = null;
      return { code, closed: false, otherId: room.hostId };
    }

    return null;
  }

  cleanup(socketId) {
    return this.leave(socketId);
  }
}

export default InviteRooms;
