package com.englishflow.community.config;

import feign.Logger;
import feign.Request;
import feign.Retryer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class FeignConfig {
    
    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.BASIC;
    }
    
    @Bean
    public Request.Options requestOptions() {
        // Connect timeout: 5 seconds, Read timeout: 10 seconds
        return new Request.Options(5, TimeUnit.SECONDS, 10, TimeUnit.SECONDS, true);
    }
    
    @Bean
    public Retryer retryer() {
        // Retry up to 3 times with 1 second interval
        return new Retryer.Default(1000, 1000, 3);
    }
}
