# Step 1: Build the app using Maven
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Step 2: Run the app
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/core-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]