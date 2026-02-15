# Sequence Diagram — FitFlow

## **Overview**

This diagram maps out the "invisible" work that happens when a gym's internet goes down during the busiest hour of the day. It illustrates the seamless transition from a high-speed, local check-in at the front desk to the automatic background reconciliation that happens the moment the Wi-Fi returns. This flow ensures that the staff never has to tell a member to "wait for the system," while the gym owner stays perfectly informed through real-time dashboard updates once the data is safely in the cloud.

---

```mermaid
sequenceDiagram
    actor M as Member
    actor S as Staff
    actor O as Owner
    participant FE as Frontend (IndexedDB)
    participant SW as Service Worker (Sync)
    participant API as Backend API
    participant DB as Cloud Database (MySQL)
    participant WSocket as Socket.io Server

    Note over M, FE: Phase 1 — Offline Check-in (Zero Latency)

    M ->> S: Presents QR Code
    S ->> FE: Scan QR Code via App
    FE ->> FE: Validate against Local Snapshot (Dexie.js)
    FE -->> S: "Check-in Successful (Offline Mode)"
    FE ->> FE: Save check-in record (sync_status=PENDING)

    Note over FE, DB: Phase 2 — Connection Restored & Background Sync

    SW ->> SW: Detect Internet Connection
    SW ->> FE: Retrieve PENDING records
    FE -->> SW: List of offline check-ins
    SW ->> API: POST /api/sync/attendance (Bulk)
    API ->> DB: Transactional bulk insert
    DB -->> API: Success
    API -->> SW: 201 Created (Synced)
    SW ->> FE: Update local records (sync_status=SYNCED)
    FE -->> S: "All local data synced with cloud"

    Note over API, O: Phase 3 — Real-Time Owner Notification

    API ->> WSocket: Emit "check_in_update" (member_id)
    WSocket -->> FE: Broadcast live occupancy update
    FE -->> O: Dashboard updates: "1 Member Checked In"

```

---

## **Flow Summary**

| Phase | Description | Key Patterns Used |
| --- | --- | --- |
| **1. The Offline Check-in** | During an outage, the system bypasses the network entirely, validating the member's QR code against a local "snapshot" and recording the entry with a "pending" flag to ensure zero operational downtime. | **Local-First**, Optimistic UI |
| **2. The Silent Recovery** | The Service Worker monitors connectivity in the background; once the internet returns, it automatically gathers all pending offline records without requiring any manual action from the staff. | **Background Sync**, Observer |
| **3. The Cloud Handshake** | Local data is pushed to the API in a single transactional batch to ensure that every check-in is recorded in the cloud database correctly and mapped to the right member profile. | **Transactional Update**, Bulk API |
| **4. Real-Time Awareness** | Once the database is updated, the server triggers a WebSocket event that pushes a live notification to the owner's mobile device, instantly reflecting the true occupancy of the gym. | **WebSocket**, Pub-Sub |