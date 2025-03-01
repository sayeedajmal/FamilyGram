# Use an official OpenJDK runtime as a parent image
FROM maven:3.8.8-openjdk-17 AS build

# Set the working directory
WORKDIR /app

# Copy the project files
COPY . .

# Build the project (this generates the JAR file inside target/)
RUN mvn clean package -DskipTests

# Use a minimal JDK runtime for the final image
FROM openjdk:17-jdk-slim

# Set working directory
WORKDIR /app

# Copy the built JAR file from the previous step
COPY --from=build /app/target/*.jar app.jar

# Expose the application port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
