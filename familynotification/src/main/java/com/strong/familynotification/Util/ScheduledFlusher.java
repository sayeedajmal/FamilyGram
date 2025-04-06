package com.strong.familynotification.Util;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.strong.familynotification.Service.StorageService;

@Component
public class ScheduledFlusher {

    @Autowired
    private StorageService storageService;

    // ⏱ Run every minute
    @Scheduled(fixedRate = 25000)
    public void flush() throws JsonMappingException, JsonProcessingException {
        System.out.println("Flushing data to MongoDB...");
        // Call the flushToMongo method from StorageService
        storageService.flushToMongo();
    }
}
