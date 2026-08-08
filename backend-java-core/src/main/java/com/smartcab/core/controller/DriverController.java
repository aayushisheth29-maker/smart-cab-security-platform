package com.smartcab.core.controller;

import com.smartcab.core.model.Cab;
import com.smartcab.core.model.Driver;
import com.smartcab.core.repository.CabRepository;
import com.smartcab.core.repository.DriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/drivers")
public class DriverController {

    @Autowired private DriverRepository driverRepository;
    @Autowired private CabRepository cabRepository;

    @GetMapping
    public List<Driver> list() { return driverRepository.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Driver> get(@PathVariable Long id) {
        return driverRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Driver create(@RequestBody Driver d) { return driverRepository.save(d); }

    @GetMapping("/{id}/cabs")
    public List<Cab> cabs(@PathVariable Long id) {
        return cabRepository.findByDriverId(id);
    }

    @GetMapping("/random")
    public ResponseEntity<Map<String, Object>> random() {
        List<Driver> all = driverRepository.findAll();
        if (all.isEmpty()) return ResponseEntity.notFound().build();
        Driver d = all.get((int) (Math.random() * all.size()));
        List<Cab> cabs = cabRepository.findByDriverId(d.getId());
        Cab c = cabs.isEmpty() ? null : cabs.get(0);
        return ResponseEntity.ok(Map.of(
                "driver", d,
                "cab", c
        ));
    }
}
