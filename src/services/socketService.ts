import { io, Socket } from 'socket.io-client';
import { GameState, ChatMessage, EmojiReaction, PlayerColor, Player } from '../types';

export interface RoomPlayer {
  socketId: string;
  uid: string;
  name: string;
  avatar: string;
  color: PlayerColor;
  isHost: boolean;
  isReady: boolean;
  country?: string;
  rating?: number;
  winRate?: string;
}

export interface RoomState {
  roomId: string;
  roomCode?: string;
  mode: 'online_random' | 'private_room';
  wager: number;
  prizePool: number;
  status: 'waiting' | 'countdown' | 'playing' | 'ended';
  players: RoomPlayer[];
  maxPlayers: number;
  hostUid: string;
  countdown?: number;
  gameState?: GameState;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private currentRoomId: string | null = null;

  public init(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (!this.socket) {
      // Connect to current origin
      this.socket = io({
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('[SocketService] Connected to Real-time Multiplayer Server:', this.socket?.id);
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        console.log('[SocketService] Disconnected from Multiplayer Server:', reason);
      });

      this.socket.on('connect_error', (err) => {
        console.warn('[SocketService] Connection error:', err.message);
      });
    }

    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket || this.init();
  }

  public joinMatchmaking(user: { uid: string; name: string; avatar: string; coins: number }, wager: number) {
    const s = this.getSocket();
    s?.emit('join_matchmaking', {
      uid: user.uid,
      name: user.name,
      avatar: user.avatar,
      coins: user.coins,
      wager,
    });
  }

  public leaveMatchmaking() {
    const s = this.getSocket();
    s?.emit('leave_matchmaking');
  }

  public createPrivateRoom(user: { uid: string; name: string; avatar: string }, wager: number, maxPlayers: 2 | 4 = 4) {
    const s = this.getSocket();
    s?.emit('create_room', {
      uid: user.uid,
      name: user.name,
      avatar: user.avatar,
      wager,
      maxPlayers,
    });
  }

  public joinPrivateRoom(user: { uid: string; name: string; avatar: string }, roomCode: string) {
    const s = this.getSocket();
    s?.emit('join_room', {
      uid: user.uid,
      name: user.name,
      avatar: user.avatar,
      roomCode: roomCode.trim().toUpperCase(),
    });
  }

  public startRoomGame(roomId: string) {
    const s = this.getSocket();
    s?.emit('start_room_game', { roomId });
  }

  public rollDice(roomId: string, uid: string) {
    const s = this.getSocket();
    s?.emit('roll_dice', { roomId, uid });
  }

  public moveToken(roomId: string, uid: string, tokenId: number) {
    const s = this.getSocket();
    s?.emit('move_token', { roomId, uid, tokenId });
  }

  public sendChatMessage(roomId: string, message: Partial<ChatMessage>) {
    const s = this.getSocket();
    s?.emit('send_chat', { roomId, message });
  }

  public sendEmojiReaction(roomId: string, emoji: string, senderColor: PlayerColor) {
    const s = this.getSocket();
    s?.emit('send_emoji', { roomId, emoji, senderColor });
  }

  public leaveGame(roomId: string, uid: string) {
    const s = this.getSocket();
    s?.emit('leave_game', { roomId, uid });
  }

  public setCurrentRoomId(id: string | null) {
    this.currentRoomId = id;
  }

  public getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }
}

export const socketService = new SocketService();
