package com.smartcab.core.controller;

import com.smartcab.core.model.Evidence;
import com.smartcab.core.model.ShareLink;
import com.smartcab.core.model.Trip;
import com.smartcab.core.repository.EvidenceRepository;
import com.smartcab.core.repository.ShareLinkRepository;
import com.smartcab.core.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Video / image evidence upload + listing.
 *  - POST /api/evidence/upload   (multipart "video" file + form fields)
 *  - GET  /api/evidence          (recent evidence)
 *  - GET  /api/evidence/{id}     (download)
 */
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/evidence")
public class EvidenceController {

    @Autowired private EvidenceRepository evidenceRepository;
    @Autowired private TripRepository tripRepository;
    @Autowired private ShareLinkRepository shareLinkRepository;

    @Value("${evidence.storage-dir:${java.io.tmpdir}/smartcab-evidence}")
    private String storageDir;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(
            @RequestParam("video") MultipartFile file,
            @RequestParam(value = "bookingId", required = false) String bookingId,
            @RequestParam(value = "linkId",    required = false) String linkId,
            @RequestParam(value = "timestamp", required = false) String timestamp,
            @RequestParam(value = "location",  required = false) String locationJson,
            @RequestParam(value = "apiKey",    required = false) String apiKey
    ) throws IOException {

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No file uploaded under field 'video'"));
        }

        String evidenceId = "ev_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        Path dir = Paths.get(storageDir);
        Files.createDirectories(dir);
        String safeName = evidenceId + "_" + sanitize(file.getOriginalFilename());
        Path dest = dir.resolve(safeName);
        file.transferTo(dest.toFile());

        Evidence ev = new Evidence();
        ev.setEvidenceId(evidenceId);
        ev.setFileName(safeName);
        ev.setStorageUrl(dest.toAbsolutePath().toString());
        ev.setSizeBytes(file.getSize());
        ev.setKind(safeName.endsWith(".webm") || safeName.endsWith(".mp4") ? "video" : "image");
        ev.setUploaderRole("rider");

        if (bookingId != null) {
            try { tripRepository.findById(Long.parseLong(bookingId)).ifPresent(ev::setTrip); }
            catch (NumberFormatException ignored) {}
        }
        if (linkId != null) {
            shareLinkRepository.findByLinkId(linkId).ifPresent(ev::setShareLink);
        }
        // location is a JSON string like "{\"lat\":23.0,\"lng\":72.0}"
        if (locationJson != null) {
            try {
                String t = locationJson.replaceAll("[^0-9.,\\-]", "");
                int comma = t.indexOf(',');
                if (comma > 0) {
                    ev.setLat(Double.parseDouble(t.substring(0, comma)));
                    ev.setLng(Double.parseDouble(t.substring(comma + 1)));
                }
            } catch (Exception ignored) {}
        }

        evidenceRepository.save(ev);
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "evidenceId", evidenceId,
                "fileName", safeName,
                "sizeBytes", file.getSize(),
                "message", "Video evidence saved to secure vault"
        ));
    }

    @GetMapping
    public List<Evidence> list() {
        return evidenceRepository.findTop20ByOrderByCreatedAtDesc();
    }

    @GetMapping("/{evidenceId}")
    public ResponseEntity<?> download(@PathVariable String evidenceId) {
        return evidenceRepository.findByEvidenceId(evidenceId)
                .<ResponseEntity<?>>map(ev -> {
                    File f = new File(ev.getStorageUrl());
                    if (!f.exists()) return ResponseEntity.notFound().build();
                    return ResponseEntity.ok()
                            .header(HttpHeaders.CONTENT_DISPOSITION,
                                    "inline; filename=\"" + ev.getFileName() + "\"")
                            .contentType(MediaType.APPLICATION_OCTET_STREAM)
                            .body(new FileSystemResource(f));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private String sanitize(String name) {
        if (name == null) return "upload.webm";
        return name.replaceAll("[^A-Za-z0-9._-]", "_");
    }
}
