import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const SIGNAL_API_URL = "https://familygateway.onrender.com";

class SignalSocket {
    constructor(userId, onSignalReceived) {
        this.userId = userId;
        this.onSignalReceived = onSignalReceived;
        this.client = null;
        this.connected = false;
        this.serverUrl = SIGNAL_API_URL;
    }

    connect() {
        if (!this.userId) return;

        const socket = new SockJS(`${this.serverUrl}/ws-signaling`);
        this.client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
        });

        this.client.onConnect = () => {
            this.connected = true;
            console.log("✅ SignalSocket connected");

            this.client.subscribe(`/user/${this.userId}/queue/signaling`, (message) => {
                const signal = JSON.parse(message.body);
                console.log("📡 Signal received:", signal);
                if (this.onSignalReceived) {
                    this.onSignalReceived(signal);
                }
            });
        };

        this.client.onStompError = (frame) => {
            console.error("STOMP error", frame);
        };

        this.client.activate();
    }

    sendSignalMessage(targetUserId, data) {
        if (!this.client || !this.connected) {
            console.error("SignalSocket not connected");
            return;
        }

        this.client.publish({
            destination: `/app/signal/${targetUserId}`,
            body: JSON.stringify({
                ...data,
                from: this.userId,
                timestamp: new Date().toISOString(),
            }),
        });
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.connected = false;
            console.log("❌ SignalSocket disconnected");
        }
    }
}

export default SignalSocket;
