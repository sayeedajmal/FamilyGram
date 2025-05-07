# Documentation

This architecture diagram illustrates the FamilyGram microservices system:

FamilyDiscovery (center top): Eureka Server running on port 8761 that handles service registration and discovery

All services register themselves with this central registry

FamilyGateway (left): API Gateway running on port 8080 that:

Routes external requests to the appropriate microservices
Registers itself with the Discovery Server
Acts as the single entry point for client applications

Microservices (right):

FamilyAuth (port 8082): Authentication service
FamilyPost (port 8083): Post management service
FamilyFeed (port 8084): Feed aggregation service
FamilyNotification (port 8085): Notification service

Kafka Broker (center): Message broker running on port 9092 that:

Enables asynchronous communication between services
Handles event-driven interactions

The diagram shows three types of connections:

Dashed lines: Service registration with the Discovery Server
Solid blue lines: API request routing through the Gateway
Solid orange lines: Inter-service communication via Kafka

This design follows microservices best practices by separating concerns and keeping the Discovery Server and API Gateway as independent components.

<img src="System Design.png" alt="FamilyGram microservices architecture diagram">
