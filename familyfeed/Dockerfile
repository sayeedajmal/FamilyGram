# Build stage
FROM maven:3.8-openjdk-17 AS build

# Set working directory
WORKDIR /app

# Copy the parent pom.xml
COPY pom.xml /app/

# Copy the service module
COPY familyfeed /app/familyfeed/

# Build the application with Maven
WORKDIR /app
RUN mvn clean package -pl familyfeed -am -DskipTests

# Runtime stage
FROM openjdk:17-jdk-slim

# Set working directory
WORKDIR /app

# Find and copy the JAR file (handles varying JAR names)
COPY --from=build /app/familyfeed/target/*.jar /app/app.jar

# Expose port
EXPOSE 8084

# Run the application
CMD ["java", "-jar", "app.jar"]