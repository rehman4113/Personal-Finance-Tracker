# ============================================================
# Multi-stage production Dockerfile for the Spring Boot backend
# Target: Render "Docker" runtime (Root Directory = backend/)
# Build tool: Maven (pom.xml + mvnw wrapper, Java 21)
# ============================================================

# ---------- Stage 1: build ----------
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Wrapper first (no Maven installed in image; mvnw 3.3.4 only-script
# downloads the pinned Maven 3.9.16 distribution on first run).
COPY mvnw /app/mvnw
COPY .mvn /app/.mvn
RUN chmod +x mvnw

# Dependencies before sources -> cached layer, rebuilds don't re-download
COPY pom.xml .
RUN ./mvnw -B dependency:go-offline

# Application sources -> build the fat JAR (tests skipped for deploy speed)
COPY src ./src
RUN ./mvnw -B package -DskipTests

# ---------- Stage 2: slim runtime ----------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Non-root user (best practice)
RUN addgroup -S spring && adduser -S spring -G spring

# Only the built JAR crosses the stage boundary — no JDK, build tools or sources
COPY --from=build /app/target/*.jar app.jar
RUN chown -R spring:spring /app

USER spring

# Documentation only — the app binds to server.port = ${PORT:8080}
# from application-prod.yml, so Render's PORT env var wins at runtime.
EXPOSE 8080

# Plain `java -jar` — respects SPRING_PROFILES_ACTIVE (and all other
# env vars) injected by Render; profile is NOT hardcoded here.
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
