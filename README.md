# Private-and-Permissioned-Blockchain-for-the-Fruit-Supply-Chain
As part of my M.Tech coursework at IIT Kharagpur, I developed a blockchain-based supply chain system using Hyperledger Fabric. The project aimed to create a secure, traceable network inspired by the insights from “Blockchain and IIoT-Aided Big Data Process Engineering in Supply Chains.”

Technologies and Stacks Used
Key technology stacks employed to build this solution include:

1. Blockchain Layer

Hyperledger Fabric: For creating a permissioned, modular blockchain network tailored for supply chains.

Smart Contracts (Chaincode): Developed in Go to enforce secure and immutable business rules.


2. Data Management

Big Data Frameworks: Apache Kafka for event-driven data streaming.

MongoDB for metadata storage, such as stakeholder details and non-critical batch information.

IPFS (InterPlanetary File System) for decentralized storage of critical documents like quality certificates.


3. Frontend and Backend

ReactJS: Frontend interface for stakeholders to interact with blockchain features.

Node.js & Express: Backend APIs to connect the frontend to Hyperledger Fabric.

Docker: For containerized deployment of Fabric peers, orderers, and databases.


4. Data Integrity and Privacy

SHA256 hashing: To secure and verify the authenticity of stored data and documents.

Private Data Collections: To restrict access to sensitive data, such as quality metrics and pricing, to authorized stakeholders only.

---

📚 Architectural Implementations
Inspired by the referenced paper, I implemented the following architectures:

1. Permissioned Blockchain Framework

Designed a network with secure channels for private communication among farmers, distributors, retailers, and consumers.



2. Data Privacy and Sharing

Leveraged Hyperledger Fabric private data collections to allow selective sharing of sensitive information.

Ensured data authenticity and integrity using cryptographic hashing.



3. Event-Driven Supply Chain

Integrated Apache Kafka to enable seamless data streaming and automated triggers for supply chain events (e.g., batch delivery updates).
---

🏆 Key Contributions

Developed a permissioned blockchain to foster trust among supply chain stakeholders.

Enabled secure document storage and data sharing using IPFS and hashing mechanisms.

Designed smart contract functionalities to ensure traceability, such as:

Adding balances and documents securely.

Fetching and updating batch information with integrity verification.


Implemented a modular architecture to support future scalability and enhancements.
---

🌍 Impact and Future Plans
This solution demonstrates the transformative potential of blockchain and big data in supply chain management:

Ensuring farmers can log verified crop data and quality metrics.
