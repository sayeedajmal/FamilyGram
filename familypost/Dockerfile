# Build stage
FROM maven:3.8-openjdk-17 AS build

# Set working directory
WORKDIR /build

# Copy the parent pom.xml
COPY pom.xml .

# Copy the service module
COPY familypost/ ./familypost/

# Build the specific service
RUN mvn clean package -pl familypost -am -DskipTests

# Runtime stage
FROM openjdk:17-jdk-slim

# Set working directory
WORKDIR /app

# Copy the built JAR from the build stage
COPY --from=build /build/familypost/target/*.jar /app/familypost.jar

# Expose port
EXPOSE 8083

# Run the application
CMD ["java", "-jar", "familypost.jar"]