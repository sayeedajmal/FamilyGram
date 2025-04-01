# Build stage
FROM maven:3.8-openjdk-17 AS build

# Set working directory
WORKDIR /build

# Copy the parent pom.xml
COPY pom.xml .

# Copy the service module
COPY familynotification/ ./familynotification/

# Build the specific service
RUN mvn clean package -pl familynotification -am -DskipTests

# Runtime stage
FROM openjdk:17-jdk-slim

# Set working directory
WORKDIR /app

# Copy the built JAR from the build stage
COPY --from=build /build/familynotification/target/*.jar /app/familynotification.jar

# Expose port
EXPOSE 8085

# Run the application
CMD ["java", "-jar", "familynotification.jar"]