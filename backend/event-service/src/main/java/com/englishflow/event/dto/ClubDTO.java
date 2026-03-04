package com.englishflow.event.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClubDTO {
    private Integer id;
    private String name;
    private String description;
    private String category;
    private String status;
}
