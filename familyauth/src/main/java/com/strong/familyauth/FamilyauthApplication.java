package com.strong.familyauth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.strong.familyauth.Model.User;

@SpringBootApplication(exclude = { DataSourceAutoConfiguration.class })
@EnableDiscoveryClient
public class FamilyauthApplication {

	@Value("${spring.redis.host}")
	String host;
	@Value("${spring.redis.port}")
	int port;
	@Value("${spring.redis.username}")
	String username;
	@Value("${spring.redis.password}")
	String password;

	public static void main(String[] args) {
		SpringApplication.run(FamilyauthApplication.class, args);
	}

	@Bean
	public RedisTemplate<String, User> redisTemplate(RedisConnectionFactory connectionFactory) {
		RedisTemplate<String, User> template = new RedisTemplate<>();
		template.setConnectionFactory(connectionFactory);
		template.setKeySerializer(new StringRedisSerializer());

		ObjectMapper objectMapper = new ObjectMapper();
		objectMapper.registerModule(new JavaTimeModule());
		objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

		Jackson2JsonRedisSerializer<User> valueSerializer = new Jackson2JsonRedisSerializer<>(objectMapper, User.class);

		template.setValueSerializer(valueSerializer);
		template.afterPropertiesSet();
		return template;
	}

	@Bean
	public LettuceConnectionFactory redisConnectionFactory() {
		RedisStandaloneConfiguration redisConfig = new RedisStandaloneConfiguration();
		redisConfig.setHostName(host);
		redisConfig.setPort(port);
		redisConfig.setUsername(username);
		redisConfig.setPassword(password);
		return new LettuceConnectionFactory(redisConfig);
	}
}
