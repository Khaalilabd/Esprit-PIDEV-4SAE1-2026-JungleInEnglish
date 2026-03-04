package com.englishflow.event.validation;

import com.englishflow.event.dto.EventDTO;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class EventDatesValidator implements ConstraintValidator<ValidEventDates, EventDTO> {

    @Override
    public void initialize(ValidEventDates constraintAnnotation) {
    }

    @Override
    public boolean isValid(EventDTO eventDTO, ConstraintValidatorContext context) {
        if (eventDTO == null) {
            return true;
        }

        if (eventDTO.getStartDate() == null || eventDTO.getEndDate() == null) {
            return true; // Let @NotNull handle null validation
        }

        // Check if end date is after start date
        return eventDTO.getEndDate().isAfter(eventDTO.getStartDate());
    }
}
