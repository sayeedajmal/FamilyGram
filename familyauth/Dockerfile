# Build stage
FROM maven:3.8-openjdk-17 AS build

# Set working directory
WORKDIR /app

# Copy the parent pom.xml
COPY pom.xml /app/

# Copy the service module
COPY familyauth /app/familyauth/

# Build the application with Maven
WORKDIR /app
RUN mvn clean package -pl familyauth -am -DskipTests

# Runtime stage
FROM openjdk:17-jdk-slim

# Set working directory
WORKDIR /app

# Find and copy the JAR file (handles varying JAR names)
COPY --from=build /app/familyauth/target/*.jar /app/app.jar

# Expose port
EXPOSE 8082

# Run the application
CMD ["java", "-jar", "app.jar"]