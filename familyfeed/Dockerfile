# Build stage
FROM maven:3.8-openjdk-17 AS build

# Set working directory
WORKDIR /app

# Copy the parent pom.xml
COPY pom.xml /app/

# Copy the service module
COPY familyfeed /app/familyfeed/

# Build the application with Maven
RUN mvn clean install -DskipTests

# Runtime stage
FROM openjdk:17-jdk-slim

# Set working directory
WORKDIR /app

# Copy the built JAR from the build stage
COPY --from=build /app/familyfeed/target/*.jar /app/

# Expose port
EXPOSE 8084

# Run the application
CMD ["java", "-jar", "familyfeed.jar"]