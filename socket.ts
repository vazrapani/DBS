import { Server } from "bun";

// Store clients by channel
const channels = new Map<string, Set<any>>();

const server = Bun.serve({
  port: 3055,
  fetch(req, server) {
    const success = server.upgrade(req);
    if (success) {
      return;
    }
    return new Response("WebSocket server running", { 
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  },
  websocket: {
    open(ws) {
      console.log("Client connected");
      // 연결 시 웰컴 메시지 전송
      ws.send(JSON.stringify({
        type: "system",
        message: "Connected to server"
      }));
    },
    message(ws, message) {
      try {
        const data = JSON.parse(message);
        console.log("Message received:", data);
        
        if (data.type === "join" && data.channel) {
          const channelName = data.channel;
          
          // 채널이 없으면 생성
          if (!channels.has(channelName)) {
            channels.set(channelName, new Set());
          }
          
          // 클라이언트를 채널에 추가 (채널이 반드시 존재함)
          const channelClients = channels.get(channelName)!;
          channelClients.add(ws);
          
          console.log("Joined channel:", channelName);
          
          // 채널 참가 응답
          ws.send(JSON.stringify({
            type: "system",
            message: {
              id: data.id,
              result: "Connected to channel: " + channelName
            },
            channel: channelName
          }));
        } else if (data.type === "message" && data.channel) {
          // 채널이 있고 클라이언트가 채널에 속해있는지 확인
          const channelClients = channels.get(data.channel);
          if (!channelClients || !channelClients.has(ws)) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Not joined to channel"
            }));
            return;
          }
          
          // 같은 채널의 다른 클라이언트들에게 메시지 전달
          channelClients.forEach(client => {
            if (client !== ws) {
              client.send(JSON.stringify(data));
            }
          });
        }
      } catch (error) {
        console.error("Error processing message:", error);
        ws.send(JSON.stringify({
          type: "error",
          message: "Failed to process message"
        }));
      }
    },
    close(ws) {
      console.log("Client disconnected");
      // 모든 채널에서 클라이언트 제거
      channels.forEach((clients, channelName) => {
        if (clients.has(ws)) {
          clients.delete(ws);
          console.log(`Removed client from channel: ${channelName}`);
        }
      });
    },
  },
});

console.log(`WebSocket server running on port ${server.port}`); 