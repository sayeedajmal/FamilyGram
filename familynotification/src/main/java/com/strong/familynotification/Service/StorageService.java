package com.strong.familynotification.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class StorageService {

    @Autowired
    private MongoTemplate mongoTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final List<String> buffer = new CopyOnWriteArrayList<>();

    public void addToBuffer(String json) {
        buffer.add(json);
    }

    public void flushToMongo() throws JsonProcessingException {
        if (buffer.isEmpty()) {
            System.out.println("Buffer is empty, nothing to flush.");
            return;
        }

        for (String json : buffer) {
            Map<String, Object> updates = objectMapper.readValue(json, new TypeReference<>() {});
            String id = (String) updates.remove("id");

            if (id == null) {
                System.out.println("❌ Skipping: No ID in payload");
                continue;
            }

            Update update = new Update();
            for (Map.Entry<String, Object> entry : updates.entrySet()) {
                update.set(entry.getKey(), entry.getValue());
            }

            mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(id)),
                update,
                "users" // 👈 or use User.class instead
            );

            System.out.println("✅ Patched user: " + id + " with fields: " + updates.keySet());
        }

        buffer.clear();
        System.out.println("Buffer cleared.");
    }
}
