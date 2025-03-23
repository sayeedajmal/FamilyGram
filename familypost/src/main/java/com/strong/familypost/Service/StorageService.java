package com.strong.familypost.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.mongodb.MongoGridFSException;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSDownloadStream;
import com.mongodb.client.gridfs.model.GridFSFile;
import com.mongodb.client.gridfs.model.GridFSUploadOptions;
import com.mongodb.client.model.Filters;
import com.strong.familypost.Util.PostException;

@Service
public class StorageService {

    @Autowired
    private GridFSBucket gridFSBucket;

    private static final List<String> SUPPORTED_IMAGE_TYPES = Arrays.asList("image/jpeg", "image/png");
    private static final List<String> SUPPORTED_VIDEO_TYPES = Arrays.asList("video/mp4", "video/mkv",
            "video/quicktime");

    public List<Map<String, String>> uploadMedia(List<MultipartFile> files, List<MultipartFile> thumbnails,
            String postId) throws PostException {
        if (files == null || files.isEmpty()) {
            throw new PostException("No media files provided");
        }

        if (thumbnails == null || thumbnails.size() != files.size()) {
            throw new PostException("Thumbnails must be provided for each media file");
        }

        List<Map<String, String>> uploadedFiles = new ArrayList<>();

        try {
            for (int i = 0; i < files.size(); i++) {
                MultipartFile file = files.get(i);
                MultipartFile thumbnail = thumbnails.get(i);

                String originalFileName = file.getOriginalFilename();
                String contentType = file.getContentType();

                if (contentType == null || originalFileName == null) {
                    throw new PostException("Invalid file type");
                }

                if (!SUPPORTED_IMAGE_TYPES.contains(contentType) && !SUPPORTED_VIDEO_TYPES.contains(contentType)) {
                    throw new PostException("Unsupported file type: " + contentType);
                }

                // Upload media file
                String fileExtension = originalFileName.substring(originalFileName.lastIndexOf('.') + 1);
                String mediaFileName = postId + "_" + System.currentTimeMillis() + "." + fileExtension;
                GridFSUploadOptions mediaOptions = new GridFSUploadOptions()
                        .chunkSizeBytes(1024 * 1024)
                        .metadata(new org.bson.Document("type", contentType));

                ObjectId mediaId = gridFSBucket.uploadFromStream(mediaFileName, file.getInputStream(), mediaOptions);

                // Upload thumbnail file
                String thumbnailFileName = postId + "_thumbnail_" + System.currentTimeMillis() + ".jpg";
                GridFSUploadOptions thumbnailOptions = new GridFSUploadOptions()
                        .chunkSizeBytes(64 * 1024)
                        .metadata(new org.bson.Document("type", "image/jpeg"));

                ObjectId thumbnailId = gridFSBucket.uploadFromStream(thumbnailFileName, thumbnail.getInputStream(),
                        thumbnailOptions);

                // Store mediaId and thumbnailId in a map
                Map<String, String> mediaData = new HashMap<>();
                mediaData.put("mediaId", mediaId.toHexString());
                mediaData.put("thumbnailId", thumbnailId.toHexString());

                uploadedFiles.add(mediaData);
            }
            return uploadedFiles;

        } catch (Exception e) {
            throw new PostException("Failed to upload media: " + e.getLocalizedMessage());
        }
    }

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

    public void deleteMedia(String fileId) throws PostException {
        try {
            gridFSBucket.delete(new ObjectId(fileId));
        } catch (IllegalArgumentException | MongoGridFSException e) {
            throw new PostException("Failed to delete media: " + e.getLocalizedMessage());
        }
    }
}
