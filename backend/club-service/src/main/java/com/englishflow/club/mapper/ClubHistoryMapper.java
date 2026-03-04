package com.englishflow.club.mapper;

import com.englishflow.club.dto.ClubHistoryDTO;
import com.englishflow.club.entity.ClubHistory;
import org.springframework.stereotype.Component;

@Component
public class ClubHistoryMapper {
    
    public ClubHistoryDTO toDTO(ClubHistory entity) {
        if (entity == null) {
            return null;
        }
        
        ClubHistoryDTO dto = new ClubHistoryDTO();
        dto.setId(entity.getId());
        dto.setClubId(entity.getClubId());
        dto.setUserId(entity.getUserId());
        dto.setType(entity.getType());
        dto.setAction(entity.getAction());
        dto.setDescription(entity.getDescription());
        dto.setOldValue(entity.getOldValue());
        dto.setNewValue(entity.getNewValue());
        dto.setPerformedBy(entity.getPerformedBy());
        dto.setCreatedAt(entity.getCreatedAt());
        
        return dto;
    }
    
    public ClubHistory toEntity(ClubHistoryDTO dto) {
        if (dto == null) {
            return null;
        }
        
        ClubHistory entity = new ClubHistory();
        entity.setId(dto.getId());
        entity.setClubId(dto.getClubId());
        entity.setUserId(dto.getUserId());
        entity.setType(dto.getType());
        entity.setAction(dto.getAction());
        entity.setDescription(dto.getDescription());
        entity.setOldValue(dto.getOldValue());
        entity.setNewValue(dto.getNewValue());
        entity.setPerformedBy(dto.getPerformedBy());
        entity.setCreatedAt(dto.getCreatedAt());
        
        return entity;
    }
}
