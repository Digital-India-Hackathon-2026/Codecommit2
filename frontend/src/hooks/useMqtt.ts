import { useEffect, useState } from 'react';
import mqtt from 'mqtt';

const MQTT_BROKER_URL = 'ws://10.209.222.6:9001';

export const useMqtt = (topic: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Note: We are using websockets, so no SSL certs are passed here for local testing
    const client = mqtt.connect(MQTT_BROKER_URL, {
      clientId: `nakshatra-dashboard-${Math.random().toString(16).substr(2, 8)}`,
    });

    client.on('connect', () => {
      console.log('Connected to MQTT via WebSockets');
      setIsConnected(true);
      client.subscribe(topic);
    });

    client.on('message', (receivedTopic, message) => {
      if (receivedTopic === topic) {
        try {
          const parsed = JSON.parse(message.toString());
          setMessages((prev) => [...prev, parsed]);
        } catch (e) {
          setMessages((prev) => [...prev, message.toString()]);
        }
      }
    });

    client.on('error', (err) => {
      console.error('MQTT Connection error: ', err);
      setIsConnected(false);
      client.end();
    });

    return () => {
      client.end();
    };
  }, [topic]);

  return { messages, isConnected };
};
