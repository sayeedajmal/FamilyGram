package com.strong.familynotification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.util.backoff.FixedBackOff;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@SpringBootApplication(exclude = { DataSourceAutoConfiguration.class })
@EnableWebSocketMessageBroker
public class FamilynotificationApplication implements WebSocketMessageBrokerConfigurer {
	public static void main(String[] args) {
		SpringApplication.run(FamilynotificationApplication.class, args);
	}

	@Override
	public void configureMessageBroker(@SuppressWarnings("null") MessageBrokerRegistry registry) {
		registry.enableSimpleBroker("/topic", "/queue", "/user");
		registry.setApplicationDestinationPrefixes("/app");
		registry.setUserDestinationPrefix("/user");
	}

	@Bean
	public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory(
			ConsumerFactory<String, String> consumerFactory) {
		ConcurrentKafkaListenerContainerFactory<String, String> factory = new ConcurrentKafkaListenerContainerFactory<>();
		factory.setConsumerFactory(consumerFactory);
		factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);
		factory.setCommonErrorHandler(errorHandler());
		return factory;
	}

	@Bean
	public DefaultErrorHandler errorHandler() {
		return new DefaultErrorHandler(new FixedBackOff(1000L, 3));
	}

	@Override
	public void registerStompEndpoints(@SuppressWarnings("null") StompEndpointRegistry registry) {
		registry.addEndpoint("/ws-notifications")
				.setAllowedOrigins("http://localhost:3000", "http://192.168.31.218:3000")
				.withSockJS();
	}

	@Bean
	public ObjectMapper objectMapper() {
		ObjectMapper mapper = new ObjectMapper();
		mapper.registerModule(new JavaTimeModule());
		mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
		return mapper;
	}

	@Bean
	public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
		RedisTemplate<String, Object> template = new RedisTemplate<>();
		template.setConnectionFactory(connectionFactory);
		template.setKeySerializer(new StringRedisSerializer());

		// Configure Jackson to support Java 8 time (LocalDateTime)
		ObjectMapper objectMapper = new ObjectMapper();
		objectMapper.registerModule(new JavaTimeModule()); // ✅ Register the module

		template.setValueSerializer(new GenericJackson2JsonRedisSerializer(objectMapper));
		return template;
	}

	@Bean
	public LettuceConnectionFactory redisConnectionFactory() {
		return new LettuceConnectionFactory("redis", 6379);
	}
}
