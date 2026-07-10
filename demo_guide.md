# Nakshatra Security Demonstration Guide

This guide will help you demonstrate the core security features of Nakshatra using **Wireshark** and our **Rogue Client**.

## Demonstration 1: Encrypted Telemetry (Wireshark)

The goal here is to prove that an attacker monitoring the network cannot read the temperature/sensor data being transmitted by the legitimate ESP32 or Raspberry Pi.

### Steps:
1. **Start the Infrastructure**: Make sure your backend and Mosquitto broker are running (`docker-compose up -d`).
2. **Start the Client**: Boot up your ESP32 or run the Raspberry Pi Python script. Wait for it to provision and start sending data.
3. **Open Wireshark**: Start capturing packets on your local network interface (e.g., `eth0` or `wlan0`).
4. **Apply the Filter**: In the Wireshark filter bar, type:
   `tcp.port == 8883`
5. **Analyze the Packets**: 
   - You will see packets labeled **TLSv1.2**.
   - Click on a packet labeled **Application Data**.
   - If you look at the raw bytes at the bottom of Wireshark, you will **not** see the JSON `{"temp": 24.5}`. It will be completely scrambled ciphertext.
6. **Compare to Unencrypted (Optional)**: If you were using standard MQTT on port `1883`, Wireshark would automatically decode it as "MQTT" protocol, and the raw text `{"temp": 24.5}` would be visible to anyone on the network. Nakshatra prevents this.

## Demonstration 2: Rogue Device Rejection

The goal here is to prove that a device without a dynamically provisioned certificate cannot interact with the system.

### Steps:
1. **Flash the Rogue Device**: Upload the code inside `client/esp32_rogue/` to an ESP32.
2. **Observe the Serial Monitor**:
   - The Rogue device intentionally skips the secure Zero-Touch Provisioning step.
   - It attempts to connect to the broker using a fake/invalid certificate.
   - You will see the Mosquitto broker instantly drop the connection due to an SSL/TLS Handshake Failure (`alert unknown ca` or `bad certificate`).
3. **Verify on the Broker**:
   - Run `docker logs nakshatra-broker`.
   - You will see logs stating: `OpenSSL Error: error:14089086:SSL routines:ssl3_get_client_certificate:certificate verify failed`.
   - The broker actively protected the network and refused the connection!
