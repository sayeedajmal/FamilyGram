package com.strong.familypost;

import java.util.List;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.strong.familypost.Model.Post;

@SpringBootApplication(exclude = { DataSourceAutoConfiguration.class })
public class FamilypostApplication {

	public static void main(String[] args) {
		SpringApplication.run(FamilypostApplication.class, args);
	}

	@Bean
	public RedisTemplate<String, List<Post>> redisTemplate(RedisConnectionFactory connectionFactory) {
		RedisTemplate<String, List<Post>> template = new RedisTemplate<>();
		template.setConnectionFactory(connectionFactory);
		template.setKeySerializer(new StringRedisSerializer());

		// Configure Jackson for List<Post>
		ObjectMapper objectMapper = new ObjectMapper();
		objectMapper.registerModule(new JavaTimeModule());

		template.setValueSerializer(new GenericJackson2JsonRedisSerializer(objectMapper));
		return template;
	}

	@Bean
	public LettuceConnectionFactory redisConnectionFactory() {
		return new LettuceConnectionFactory("redis", 6379);
	}
}
