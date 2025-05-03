# Stage 1: Build the JAR using Maven
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build

# Copy the Maven project
COPY familydiscovery/pom.xml familydiscovery/pom.xml
COPY familydiscovery/src familydiscovery/src

# Build the project (output JAR goes to target/)
RUN mvn -f familydiscovery/pom.xml clean package -DskipTests

# Stage 2: Use minimal JDK image to run the app
FROM eclipse-temurin:17-jdk

WORKDIR /app

# Copy the built JAR from the builder stage
COPY --from=builder /build/familydiscovery/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
