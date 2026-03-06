package com.englishflow.auth.service;

import com.maxmind.geoip2.DatabaseReader;
import com.maxmind.geoip2.exception.GeoIp2Exception;
import com.maxmind.geoip2.model.CityResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.net.InetAddress;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class GeoIpService {

    @Value("${geoip.database.path:#{null}}")
    private String databasePath;
    
    @Value("${geoip.api.enabled:true}")
    private boolean apiEnabled;
    
    private DatabaseReader databaseReader;
    private final WebClient webClient;

    public GeoIpService() {
        this.webClient = WebClient.builder()
                .baseUrl("http://ip-api.com")
                .build();
    }

    @PostConstruct
    public void init() {
        // Try to initialize MaxMind database if path is provided
        if (databasePath != null && !databasePath.isEmpty()) {
            try {
                File database = new File(databasePath);
                if (database.exists()) {
                    databaseReader = new DatabaseReader.Builder(database).build();
                    log.info("GeoIP database loaded successfully from: {}", databasePath);
                } else {
                    log.warn("GeoIP database file not found at: {}. Will use API fallback.", databasePath);
                }
            } catch (IOException e) {
                log.error("Failed to load GeoIP database: {}. Will use API fallback.", e.getMessage());
            }
        } else {
            log.info("GeoIP database path not configured. Using API-based geolocation.");
        }
    }

    /**
     * Get location information for an IP address
     */
    public LocationInfo getLocationInfo(String ipAddress) {
        // Skip private/local IPs
        if (isPrivateOrLocalIp(ipAddress)) {
            log.debug("Skipping geolocation for private/local IP: {}", ipAddress);
            return new LocationInfo("Local Network", "Local", "Local ISP");
        }

        // Try database first if available
        if (databaseReader != null) {
            try {
                return getLocationFromDatabase(ipAddress);
            } catch (Exception e) {
                log.warn("Failed to get location from database for IP {}: {}. Trying API fallback.", 
                        ipAddress, e.getMessage());
            }
        }

        // Fallback to API if enabled
        if (apiEnabled) {
            try {
                return getLocationFromApi(ipAddress);
            } catch (Exception e) {
                log.error("Failed to get location from API for IP {}: {}", ipAddress, e.getMessage());
            }
        }

        // Return unknown if all methods fail
        return new LocationInfo("Unknown", "Unknown", "Unknown");
    }

    /**
     * Get location from MaxMind database
     */
    private LocationInfo getLocationFromDatabase(String ipAddress) throws IOException, GeoIp2Exception {
        InetAddress inetAddress = InetAddress.getByName(ipAddress);
        CityResponse response = databaseReader.city(inetAddress);

        String country = response.getCountry().getName();
        String city = response.getCity().getName();
        String isp = response.getTraits().getIsp();

        return new LocationInfo(
                country != null ? country : "Unknown",
                city != null ? city : "Unknown",
                isp != null ? isp : "Unknown"
        );
    }

    /**
     * Get location from IP-API (free, no key required, 45 req/min limit)
     */
    private LocationInfo getLocationFromApi(String ipAddress) {
        try {
            Map<String, Object> response = webClient.get()
                    .uri("/json/" + ipAddress + "?fields=status,country,city,isp")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && "success".equals(response.get("status"))) {
                return new LocationInfo(
                        (String) response.getOrDefault("country", "Unknown"),
                        (String) response.getOrDefault("city", "Unknown"),
                        (String) response.getOrDefault("isp", "Unknown")
                );
            }
        } catch (Exception e) {
            log.error("API request failed for IP {}: {}", ipAddress, e.getMessage());
        }

        return new LocationInfo("Unknown", "Unknown", "Unknown");
    }

    /**
     * Check if IP is private or local
     */
    private boolean isPrivateOrLocalIp(String ipAddress) {
        if (ipAddress == null || ipAddress.isEmpty()) {
            return true;
        }

        // Common local/private patterns
        return ipAddress.equals("127.0.0.1") ||
               ipAddress.equals("0:0:0:0:0:0:0:1") ||
               ipAddress.equals("::1") ||
               ipAddress.startsWith("192.168.") ||
               ipAddress.startsWith("10.") ||
               ipAddress.startsWith("172.16.") ||
               ipAddress.startsWith("172.17.") ||
               ipAddress.startsWith("172.18.") ||
               ipAddress.startsWith("172.19.") ||
               ipAddress.startsWith("172.20.") ||
               ipAddress.startsWith("172.21.") ||
               ipAddress.startsWith("172.22.") ||
               ipAddress.startsWith("172.23.") ||
               ipAddress.startsWith("172.24.") ||
               ipAddress.startsWith("172.25.") ||
               ipAddress.startsWith("172.26.") ||
               ipAddress.startsWith("172.27.") ||
               ipAddress.startsWith("172.28.") ||
               ipAddress.startsWith("172.29.") ||
               ipAddress.startsWith("172.30.") ||
               ipAddress.startsWith("172.31.") ||
               ipAddress.equals("localhost");
    }

    /**
     * Location information DTO
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class LocationInfo {
        private String country;
        private String city;
        private String isp;
    }
}
