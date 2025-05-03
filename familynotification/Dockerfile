# Stage 1: Build the JAR using Maven
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build

# Copy the Maven project
COPY pom.xml pom.xml
COPY src src

# Build the project (output JAR goes to target/)
RUN mvn -f pom.xml clean package -DskipTests

# Stage 2: Use minimal JDK image to run the app
FROM eclipse-temurin:17-jdk

WORKDIR /app

# Copy the built JAR from the builder stage
COPY --from=builder /build/target/*.jar app.jar

EXPOSE 8085

ENTRYPOINT ["java", "-jar", "app.jar"]
