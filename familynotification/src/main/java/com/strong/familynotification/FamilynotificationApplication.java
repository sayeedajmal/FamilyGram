package com.strong.familynotification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.context.annotation.Bean;
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
}
