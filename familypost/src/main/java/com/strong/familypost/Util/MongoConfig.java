package com.strong.familypost.Util;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.MongoTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

import com.mongodb.client.MongoClient;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSBuckets;

/**
 * MongoConfig is a Spring configuration class that sets up MongoDB-related
 * beans.
 * It configures the `GridFSBucket` for GridFS operations and the
 * `PlatformTransactionManager`
 * for managing MongoDB transactions.
 */
@Configuration
public class MongoConfig {

    /**
     * Provides a `GridFSBucket` bean for interacting with GridFS in MongoDB.
     * 
     * <p>
     * GridFS is a specification for storing and retrieving large files such as
     * images, audio files,
     * video files, etc., in MongoDB. The `GridFSBucket` bean allows for operations
     * on GridFS, including
     * file uploads and downloads.
     * 
     * @param mongoClient          the MongoDB client used for database operations.
     * @param mongoDatabaseFactory the factory used to obtain the MongoDB database.
     * @return a `GridFSBucket` instance configured for the MongoDB database.
     */
    @Bean
    public GridFSBucket gridFSBucket(MongoClient mongoClient, MongoDatabaseFactory mongoDatabaseFactory) {
        return GridFSBuckets.create(mongoDatabaseFactory.getMongoDatabase());
    }

    /**
     * Provides a `PlatformTransactionManager` bean for managing transactions with
     * MongoDB.
     * 
     * <p>
     * The `MongoTransactionManager` is used to manage transactions and ensure data
     * consistency
     * when performing operations in MongoDB. It is configured with the
     * `MongoDatabaseFactory` to
     * handle transactional operations within the MongoDB database.
     * 
     * @param dbFactory the factory used to obtain the MongoDB database.
     * @return a `PlatformTransactionManager` instance configured for MongoDB
     *         transactions.
     */
    @Bean
    PlatformTransactionManager transactionManager(MongoDatabaseFactory dbFactory) {
        return new MongoTransactionManager(dbFactory);
    }
}