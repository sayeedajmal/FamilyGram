# Use Maven to build the application
FROM maven:3.8.8-eclipse-temurin-17 AS build

# Set working directory
WORKDIR /app

# Copy the project files
COPY . .

# Build the JAR file
RUN mvn clean package -DskipTests

# Use a minimal JDK runtime for the final image
FROM eclipse-temurin:17-jdk

# Set working directory
WORKDIR /app

# Copy the built JAR file from the previous stage
COPY --from=build /app/target/*.jar app.jar

# Expose the application port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
