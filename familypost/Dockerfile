# Use a minimal JDK image
FROM eclipse-temurin:17-jdk

WORKDIR /app

# Copy only the pre-built JAR file (ensure JAR exists before building the image)
COPY familypost/target/familypost-1.0.0.jar app.jar

# Expose the application port
EXPOSE 8083

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
