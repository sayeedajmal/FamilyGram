# Build stage
FROM maven:3.8-openjdk-17 AS build

# Set working directory
WORKDIR /build

# Copy the parent pom.xml
COPY pom.xml .

# Copy the service module
COPY familyfeed/ ./familyfeed/

# Build the specific service
RUN mvn clean package -pl familyfeed -am -DskipTests

# Runtime stage
FROM openjdk:17-jdk-slim

# Set working directory
WORKDIR /app

# Copy the built JAR from the build stage
COPY --from=build /build/familyfeed/target/*.jar /app/familyfeed.jar

# Expose port
EXPOSE 8084

# Run the application
CMD ["java", "-jar", "familyfeed.jar"]