# Stage 1: Build the JAR using Maven
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build

# Copy the Maven project
COPY familynotification/pom.xml familynotification/pom.xml
COPY familynotification/src familynotification/src

# Build the project (output JAR goes to target/)
RUN mvn -f familynotification/pom.xml clean package -DskipTests

# Stage 2: Use minimal JDK to run the app
FROM eclipse-temurin:17-jdk

WORKDIR /app

# Copy the built JAR from the builder stage
COPY --from=builder /build/familynotification/target/*.jar app.jar

EXPOSE 8085

ENTRYPOINT ["java", "-jar", "app.jar"]
