package com.rehman.finance.auth.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * Serves uploaded profile pictures from the local upload directory, so
 * profile.pictureUrl ("/uploads/avatars/user-1.png") resolves to a real file.
 * WHY: the file lives on disk (not the classpath), so the default static
 * resource resolution would 404 — this maps the URL prefix to the directory.
 */
@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    private final String uploadDir;

    public StaticResourceConfig(@Value("${app.upload-dir:./uploads}") String uploadDir) {
        this.uploadDir = uploadDir;
    }

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        String location = Paths.get(uploadDir).toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler("/uploads/**").addResourceLocations(location);
    }
}