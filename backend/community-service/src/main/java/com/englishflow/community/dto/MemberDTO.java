package com.englishflow.community.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MemberDTO {
    private Integer id;
    private Integer clubId;
    private Long userId;
    private String rank; // PRESIDENT, VICE_PRESIDENT, SECRETARY, TREASURER, etc.
}
