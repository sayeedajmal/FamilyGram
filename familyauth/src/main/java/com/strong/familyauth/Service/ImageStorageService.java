package com.strong.familyauth.Service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

import javax.imageio.ImageIO;

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
import com.strong.familyauth.Util.UserException;

@Service
public class ImageStorageService {
    @Autowired
    private GridFSBucket gridFSBucket;

    public Map<String, String> uploadProfileImage(MultipartFile file, String id, MultipartFile thumbnail)
            throws UserException {
        try {
            // First, try to find and delete existing image for the username
            GridFSFile existingFile = gridFSBucket
                    .find(new org.bson.Document("filename", new org.bson.Document("$regex", "^" + id + "_")))
                    .first();

            if (existingFile != null) {
                gridFSBucket.delete(existingFile.getObjectId());
            }

            // Upload the main profile image
            String profileImageId = uploadImage(file, id);

            // Upload the thumbnail
            String thumbnailId = uploadImage(thumbnail, id);

            // Return both media and thumbnail IDs in a Map
            Map<String, String> result = new HashMap<>();
            result.put("mediaId", profileImageId);
            result.put("thumbnailId", thumbnailId);

            return result;
        } catch (Exception e) {
            throw new UserException(e.getLocalizedMessage());
        }
    }

    private String uploadImage(MultipartFile file, String id) throws IOException {
        // Convert image to JPEG
        BufferedImage originalImage = ImageIO.read(file.getInputStream());
        BufferedImage jpegImage = new BufferedImage(
                originalImage.getWidth(),
                originalImage.getHeight(),
                BufferedImage.TYPE_INT_RGB);
        jpegImage.createGraphics().drawImage(originalImage, 0, 0, null);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(jpegImage, "jpg", baos);
        InputStream inputStream = new ByteArrayInputStream(baos.toByteArray());

        // Generate a unique file name
        String fileName = id + "_" + System.currentTimeMillis() + ".jpg";

        // Upload the image
        GridFSUploadOptions options = new GridFSUploadOptions()
                .chunkSizeBytes(1024 * 1024)
                .metadata(new org.bson.Document("type", "image/jpeg"));
        ObjectId fileId = gridFSBucket.uploadFromStream(fileName, inputStream, options);

        // Return the fileId as a hex string
        return fileId.toHexString();
    }

    public InputStreamResource getImageStream(String fileId) throws UserException {
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
            throw new UserException(e.getLocalizedMessage());
        }
    }

    public void deleteImage(String fileId) throws UserException {
        try {
            gridFSBucket.delete(new ObjectId(fileId));
        } catch (IllegalArgumentException | MongoGridFSException e) {
            throw new UserException(e.getLocalizedMessage());
        }
    }

}