
package com.substring.chat.chat_app_backend.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;

@Configuration
public class MongoConfig {

    @Bean
    public MongoClient mongoClient(
            @Value("${spring.data.mongodb.uri}") String uri) {
        return MongoClients.create(uri);
    }

    @Bean
    public MongoDatabaseFactory mongoDatabaseFactory(
            MongoClient mongoClient) {
        return new SimpleMongoClientDatabaseFactory(
                mongoClient, "chatapp");
    }
}
