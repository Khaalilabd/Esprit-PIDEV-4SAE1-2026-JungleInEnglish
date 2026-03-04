package com.englishflow.exam.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.hypersistence.utils.hibernate.type.util.ObjectMapperSupplier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Jackson configuration for JSONB support with Hypersistence Utils
 */
@Configuration
public class JacksonConfig implements ObjectMapperSupplier {
    
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
                .findAndRegisterModules();
    }
    
    @Override
    public ObjectMapper get() {
        return objectMapper();
    }
}
