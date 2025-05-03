# Stage 1: Build the JAR using Maven
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build

# Copy the Maven project
COPY familypost/pom.xml familypost/pom.xml
COPY familypost/src familypost/src

# Build the project (output JAR goes to target/)
RUN mvn -f familypost/pom.xml clean package -DskipTests

# Stage 2: Use minimal JDK to run the app
FROM eclipse-temurin:17-jdk

WORKDIR /app

# Copy the built JAR from the builder stage
COPY --from=builder /build/familypost/target/*.jar app.jar

EXPOSE 8083

ENTRYPOINT ["java", "-jar", "app.jar"]
