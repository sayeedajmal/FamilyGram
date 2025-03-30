# Use Maven to build the project
FROM maven:3.8.8-eclipse-temurin-17 AS build

# Set the working directory
WORKDIR /app

# Copy the entire project (including FamilyGram and familyauth)
COPY . .

# Build the project (this will generate the JAR inside familyauth/target)
RUN mvn clean package -DskipTests

# Use a minimal JDK runtime for the final image
FROM eclipse-temurin:17-jdk

# Set working directory
WORKDIR /app

# Copy the built JAR of familyauth module
COPY --from=build /app/familynotification/target/*.jar app.jar

# Expose the application port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
