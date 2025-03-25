package com.strong.familyfeed.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.stereotype.Service;

import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSDownloadStream;
import com.mongodb.client.gridfs.model.GridFSFile;
import com.mongodb.client.model.Filters;
import com.strong.familyfeed.Util.PostException;

@Service
public class StorageService {

    @Autowired
    private GridFSBucket gridFSBucket;

    public GridFSFile getFileMetadata(String fileId) {
        return gridFSBucket.find(Filters.eq("_id", new ObjectId(fileId))).first();
    }

    public InputStreamResource getMediaStream(String fileId) throws PostException {
        try {
            GridFSDownloadStream downloadStream = gridFSBucket.openDownloadStream(new ObjectId(fileId));
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            byte[] buffer = new byte[1024];
            int read;
            while ((read = downloadStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, read);
            }
            ByteArrayInputStream inputStream = new ByteArrayInputStream(outputStream.toByteArray());
            return new InputStreamResource(inputStream);
        } catch (Exception e) {
            throw new PostException("Failed to retrieve media: " + e.getLocalizedMessage());
        }
    }

}
