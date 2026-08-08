package com.smartcab.core.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.beans.factory.annotation.Autowired;

import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Translates the standard DATABASE_URL env var (used by Render / Heroku /
 * Supabase / Railway) into the three separate Spring properties
 *   spring.datasource.url
 *   spring.datasource.username
 *   spring.datasource.password
 *
 * Accepted forms:
 *   postgresql://user:pass@host:5432/db
 *   postgres://user:pass@host:5432/db
 *   jdbc:postgresql://user:pass@host:5432/db
 */
@Configuration
@Profile("prod")
public class ProductionDataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(ProductionDataSourceConfig.class);

    @Autowired
    private ConfigurableEnvironment env;

    @PostConstruct
    public void injectDatabaseUrl() {
        String url = env.getProperty("DATABASE_URL");
        if (url == null || url.isBlank()) {
            log.warn("DATABASE_URL not set in prod profile — Spring will fail to start. " +
                     "Set DATABASE_URL in Render Environment to your Supabase connection string.");
            return;
        }

        try {
            String jdbc = url.startsWith("jdbc:") ? url : url.replaceFirst("^postgresql://", "jdbc:postgresql://")
                                                              .replaceFirst("^postgres://",   "jdbc:postgresql://");
            URI uri = URI.create(jdbc.substring("jdbc:".length()));

            String userInfo = uri.getUserInfo();
            String username = "postgres";
            String password = "";
            if (userInfo != null) {
                int colon = userInfo.indexOf(':');
                if (colon >= 0) {
                    username = URLDecoder.decode(userInfo.substring(0, colon), StandardCharsets.UTF_8);
                    password = URLDecoder.decode(userInfo.substring(colon + 1), StandardCharsets.UTF_8);
                } else {
                    username = URLDecoder.decode(userInfo, StandardCharsets.UTF_8);
                }
            }

            String host = uri.getHost();
            int port = uri.getPort() == -1 ? 5432 : uri.getPort();
            String db = uri.getPath() == null || uri.getPath().isBlank() || "/".equals(uri.getPath())
                    ? "postgres"
                    : uri.getPath().substring(1);

            String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + db;

            log.info("Loaded DATABASE_URL -> host={} port={} db={} user={}",
                     host, port, db, username);

            Map<String, Object> props = new HashMap<>();
            props.put("spring.datasource.url",      jdbcUrl);
            props.put("spring.datasource.username", username);
            props.put("spring.datasource.password", password);
            env.getPropertySources().addFirst(new MapPropertySource("dbUrlFromEnv", props));
        } catch (Exception e) {
            log.error("Failed to parse DATABASE_URL='{}': {}", url, e.toString());
        }
    }
}
