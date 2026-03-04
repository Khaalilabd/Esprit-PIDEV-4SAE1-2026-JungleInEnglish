package com.englishflow.community.config;

import com.englishflow.community.entity.Category;
import com.englishflow.community.entity.SubCategory;
import com.englishflow.community.repository.CategoryRepository;
import com.englishflow.community.repository.SubCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;

    @Override
    public void run(String... args) {
        // Check if data already exists
        if (categoryRepository.count() > 0) {
            log.info("Categories already initialized. Skipping data initialization.");
            return;
        }

        log.info("Initializing forum categories and subcategories...");

        // Create Categories
        Category general = createCategory("General", "General discussions and announcements", "fa-home", "primary");
        Category language = createCategory("Language Discussions", "Grammar, vocabulary, pronunciation and expression", "fa-book-open", "accent-navy");
        Category clubs = createCategory("Clubs", "Join our thematic clubs", "fa-users", "accent-orange");
        Category events = createCategory("Events", "Workshops, competitions and meetups", "fa-calendar-alt", "accent-red");
        Category resources = createCategory("Resources and Help", "Share and find resources", "fa-lightbulb", "secondary");

        // Save categories
        general = categoryRepository.save(general);
        language = categoryRepository.save(language);
        clubs = categoryRepository.save(clubs);
        events = categoryRepository.save(events);
        resources = categoryRepository.save(resources);

        // Create SubCategories for General
        createSubCategory("Student Introductions", "Introduce yourself, talk about your level and goals", general);
        createSubCategory("School Announcements", "Important news, schedule changes, reminders", general);
        createSubCategory("General Questions", "For everything that doesn't fit in another category", general);

        // Create SubCategories for Language Discussions
        createSubCategory("Grammar & Vocabulary", "Ask questions about grammar, learn new words", language);
        createSubCategory("Pronunciation & Accent", "Tips, tricks, recordings to improve pronunciation", language);
        createSubCategory("Written Expression", "Share texts, essays to receive feedback", language);
        createSubCategory("Oral Expression", "Organize discussion sessions with other students", language);

        // Create SubCategories for Clubs
        createSubCategory("Official Announcements", "Official club announcements (restricted to club members)", clubs, true);
        createSubCategory("Reading Club", "Discussion about books in English, recommendations", clubs);
        createSubCategory("Movie / Series Club", "Talk about movies and series in original version, analyze dialogues and vocabulary", clubs);
        createSubCategory("Conversation Club", "Informal conversation groups to practice English", clubs);
        createSubCategory("Culture & Travel Club", "Discover the culture of English-speaking countries, share your experiences", clubs);

        // Create SubCategories for Events
        createSubCategory("Workshops and Conferences", "Discussions about school workshops, note sharing", events);
        createSubCategory("Competitions & Challenges", "Vocabulary contests, quizzes, language games", events);
        createSubCategory("Outings & Meetups", "Event planning, cultural visits, language cafes", events);
        createSubCategory("Event Feedback & Reviews", "Share your feedback and rate events you attended", events);

        // Create SubCategories for Resources and Help
        createSubCategory("Resource Sharing", "Links, videos, books, podcasts in English", resources);
        createSubCategory("Student Help", "Tutoring, group reviews, Q&A", resources);

        log.info("✅ Forum categories and subcategories initialized successfully!");
        log.info("   - {} categories created", categoryRepository.count());
        log.info("   - {} subcategories created", subCategoryRepository.count());
    }

    private Category createCategory(String name, String description, String icon, String color) {
        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        category.setIcon(icon);
        category.setColor(color);
        return category;
    }

    private void createSubCategory(String name, String description, Category category) {
        createSubCategory(name, description, category, false);
    }
    
    private void createSubCategory(String name, String description, Category category, boolean requiresClubMembership) {
        SubCategory subCategory = new SubCategory();
        subCategory.setName(name);
        subCategory.setDescription(description);
        subCategory.setCategory(category);
        subCategory.setRequiresClubMembership(requiresClubMembership);
        subCategoryRepository.save(subCategory);
    }
}
