package com.englishflow.community.dto;

import com.englishflow.community.entity.Reaction;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReactionCountDTO {
    private Reaction.ReactionType type;
    private Long count;
}
