# Build stage
FROM maven:3.8-openjdk-17 AS build

# Set working directory
WORKDIR /app

# Copy the parent pom.xml
COPY pom.xml /app/

# Copy the service module
COPY familyauth /app/familyauth/

# Build the application with Maven
RUN mvn clean install -DskipTests

# Runtime stage
FROM openjdk:17-jdk-slim

# Set working directory
WORKDIR /app

# Copy the built JAR from the build stage
COPY --from=build /app/familyauth/target/*.jar /app/

# Expose port
EXPOSE 8082

# Run the application
CMD ["java", "-jar", "familyauth.jar"]