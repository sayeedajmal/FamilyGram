package com.strong.familyauth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

@SpringBootApplication(exclude = { DataSourceAutoConfiguration.class })
public class FamilyauthApplication {

	public static void main(String[] args) {
		SpringApplication.run(FamilyauthApplication.class, args);
	}

}
