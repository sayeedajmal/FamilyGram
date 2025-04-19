# Use a minimal JDK image
FROM eclipse-temurin:17-jdk

WORKDIR /app

# Copy only the pre-built JAR file (ensure JAR exists before building the image)
COPY familyfeed/target/*.jar app.jar

# Expose the application port
EXPOSE 8084

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
