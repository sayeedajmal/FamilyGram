# Stage 1: Build the JAR using Maven
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build

# Copy the Maven project
COPY familyauth/pom.xml familyauth/pom.xml
COPY familyauth/src familyauth/src

# Build the project (output JAR goes to target/)
RUN mvn -f familyauth/pom.xml clean package -DskipTests

# Stage 2: Run the JAR with minimal JDK
FROM eclipse-temurin:17-jdk

WORKDIR /app

# Copy the built JAR from the builder stage
COPY --from=builder /build/familyauth/target/*.jar app.jar

EXPOSE 8082

ENTRYPOINT ["java", "-jar", "app.jar"]
