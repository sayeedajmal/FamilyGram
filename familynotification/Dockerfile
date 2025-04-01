# Use a minimal JDK image
FROM eclipse-temurin:17-jdk AS build

# Set the working directory inside the container
WORKDIR /app

# Copy the entire project into the container (assuming the parent pom.xml exists)
COPY . /app


# Run Maven clean install to build all modules and package the JAR
RUN mvn clean install -DskipTests


COPY target/*.jar /app/app.jar

# Expose the application port
EXPOSE 8085

# Run the application
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
