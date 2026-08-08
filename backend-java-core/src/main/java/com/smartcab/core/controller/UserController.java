package com.smartcab.core.controller;

import com.smartcab.core.model.User;
import com.smartcab.core.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired private UserRepository userRepository;

    @GetMapping
    public List<User> list() { return userRepository.findAll(); }

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody User u) {
        // If email already exists, return that user (idempotent)
        if (u.getEmail() != null) {
            var existing = userRepository.findByEmail(u.getEmail());
            if (existing.isPresent()) return ResponseEntity.ok(existing.get());
        }
        return ResponseEntity.ok(userRepository.save(u));
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> get(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
