package com.englishflow.community.controller;

import com.englishflow.community.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/community/permissions")
@RequiredArgsConstructor
public class PermissionController {
    
    private final PermissionService permissionService;
    
    @GetMapping("/subcategory/{subCategoryId}")
    public ResponseEntity<PermissionService.PermissionInfo> getPermissions(
            @PathVariable Long subCategoryId,
            @RequestParam String userRole) {
        PermissionService.PermissionInfo permissions = permissionService.getPermissionInfo(subCategoryId, userRole);
        return ResponseEntity.ok(permissions);
    }
}
