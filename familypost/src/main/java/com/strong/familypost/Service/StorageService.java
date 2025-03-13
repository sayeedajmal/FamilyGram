package com.strong.familypost.Service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;

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
import com.mongodb.client.model.Filters;
import com.strong.familypost.Util.PostException;

@Service
public class StorageService {

    @Autowired
    private GridFSBucket gridFSBucket;

    private static final List<String> SUPPORTED_IMAGE_TYPES = Arrays.asList("image/jpeg", "image/png");
    private static final List<String> SUPPORTED_VIDEO_TYPES = Arrays.asList("video/mp4", "video/mkv",
            "video/quicktime");

    public String uploadMedia(MultipartFile file, String postId) throws PostException {
        try {
            String originalFileName = file.getOriginalFilename();
            String contentType = file.getContentType();

            if (contentType == null || originalFileName == null) {
                throw new PostException("Invalid file type");
            }

            if (!SUPPORTED_IMAGE_TYPES.contains(contentType) && !SUPPORTED_VIDEO_TYPES.contains(contentType)) {
                throw new PostException("Unsupported file type: " + contentType);
            }

            InputStream inputStream;
            String fileExtension = originalFileName.substring(originalFileName.lastIndexOf('.') + 1);

            if (SUPPORTED_IMAGE_TYPES.contains(contentType)) {
                // Convert image to JPEG
                BufferedImage originalImage = ImageIO.read(file.getInputStream());
                BufferedImage jpegImage = new BufferedImage(
                        originalImage.getWidth(),
                        originalImage.getHeight(),
                        BufferedImage.TYPE_INT_RGB);
                jpegImage.createGraphics().drawImage(originalImage, 0, 0, null);

                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(jpegImage, "jpg", baos);
                inputStream = new ByteArrayInputStream(baos.toByteArray());
                fileExtension = "jpg"; // Convert all images to JPEG
            } else {
                // For video, use the original file input stream
                inputStream = file.getInputStream();
            }

            // Upload media file
            String fileName = postId + "_" + System.currentTimeMillis() + "." + fileExtension;
            GridFSUploadOptions options = new GridFSUploadOptions()
                    .chunkSizeBytes(256 * 1024)
                    .metadata(new org.bson.Document("type", contentType));

            ObjectId fileId = gridFSBucket.uploadFromStream(fileName, inputStream, options);
            return fileId.toHexString();
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
