package com.strong.familypost;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@SpringBootApplication(exclude = { DataSourceAutoConfiguration.class })
@EnableScheduling
public class FamilypostApplication {

	public static void main(String[] args) {
		SpringApplication.run(FamilypostApplication.class, args);
	}

	@SuppressWarnings("removal")
	@Bean
	public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
		RedisTemplate<String, Object> template = new RedisTemplate<>();
		template.setConnectionFactory(connectionFactory);

		// 🔑 Key & Hash Key as plain strings
		template.setKeySerializer(new StringRedisSerializer());
		template.setHashKeySerializer(new StringRedisSerializer());

		// 🧠 Jackson ObjectMapper config
		ObjectMapper objectMapper = new ObjectMapper();
		objectMapper.registerModule(new JavaTimeModule());
		objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
		objectMapper.activateDefaultTyping(
				objectMapper.getPolymorphicTypeValidator(),
				ObjectMapper.DefaultTyping.NON_FINAL);

		// ✅ JSON serializer for values
		Jackson2JsonRedisSerializer<Object> valueSerializer = new Jackson2JsonRedisSerializer<>(Object.class);
		valueSerializer.setObjectMapper(objectMapper);

		template.setValueSerializer(valueSerializer);
		template.setHashValueSerializer(valueSerializer);

		template.afterPropertiesSet();
		return template;
	}

	@Bean
	public LettuceConnectionFactory redisConnectionFactory() {
		return new LettuceConnectionFactory("redis", 6379);
	}
}
