# Use OpenJDK 17 as base image
FROM openjdk:17-jdk-slim

# Set working directory
WORKDIR /app

# Copy pom.xml first for better caching
COPY pom.xml .

# Install Maven
RUN apt-get update && apt-get install -y maven

# Download dependencies
RUN mvn dependency:go-offline -B

# Copy source code
COPY src src

# Build the application
RUN mvn clean package -DskipTests

# Expose port
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "target/spotify-media-player-0.0.1-SNAPSHOT.jar"]
