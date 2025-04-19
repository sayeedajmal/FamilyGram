package com.strong.familygateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class FamilyGatwayApplication {

	public static void main(String[] args) {
		SpringApplication.run(FamilyGatwayApplication.class, args);
	}
}