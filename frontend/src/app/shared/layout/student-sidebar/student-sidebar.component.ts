import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { combineLatest, forkJoin, Subscription } from 'rxjs';
import { ClubService } from '../../../core/services/club.service';
import { MemberService } from '../../../core/services/member.service';
import { EventService } from '../../../core/services/event.service';
import { Club } from '../../../core/models/club.model';
import { AuthService } from '../../../core/services/auth.service';

type SubItem = {
  name: string;
  path: string;
  badge?: string;
  badgeColor?: string;
  isPresident?: boolean;
};

type NavItem = {
  name: string;
  icon: string;
  path?: string;
  badge?: string;
  badgeColor?: string;
  subItems?: SubItem[];
};

type NavSection = {
  id: string;
  title: string;
  icon: string;
  items: NavItem[];
};

@Component({
  standalone: true,
  selector: 'app-student-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './student-sidebar.component.html',
})
export class StudentSidebarComponent {
  // Navigation sections with logical grouping
  navSections: NavSection[] = [
    {
      id: 'home',
      title: 'HOME',
      icon: '🏠',
      items: [
        {
          icon: 'fas fa-th-large',
          name: "Dashboard",
          path: "/user-panel/dashboard",
        }
      ]
    },
    {
      id: 'learning',
      title: 'LEARNING',
      icon: '📚',
      items: [
        {
          icon: 'fas fa-box',
          name: "My Packs",
          path: "/user-panel/my-packs",
        },
        {
          icon: 'fas fa-book',
          name: "My Courses",
          path: "/user-panel/my-courses",
          badge: "3",
          badgeColor: "bg-[#F6BD60]"
        },
        {
          icon: 'fas fa-calendar-alt',
          name: "My Schedule",
          path: "/user-panel/schedule",
        },
        {
          icon: 'fas fa-clipboard-list',
          name: "Assignments",
          path: "/user-panel/assignments",
          badge: "2",
          badgeColor: "bg-orange-500"
        },
        {
          icon: 'fas fa-question-circle',
          name: "Quizzes",
          path: "/user-panel/quizzes",
        },
        {
          icon: 'fas fa-graduation-cap',
          name: "CEFR Exams",
          path: "/user-panel/exams",
        },
        {
          icon: 'fas fa-trophy',
          name: "My Exam Results",
          path: "/user-panel/my-exam-results",
        },
        {
          icon: 'fas fa-book-open',
          name: "Ebooks",
          path: "/user-panel/ebooks",
        }
      ]
    },
    {
      id: 'community',
      title: 'COMMUNITY',
      icon: '👥',
      items: [
        {
          icon: 'fas fa-users',
          name: "Clubs",
          path: "/user-panel/clubs",
          subItems: [
            // User's clubs will be added by loadUserClubs()
            { name: "Loading...", path: "/user-panel/clubs" } as SubItem
          ]
        },
        {
          icon: 'fas fa-calendar-check',
          name: "Events",
          path: "/user-panel/events",
          subItems: [
            // User's events will be added by loadUserEvents()
            { name: "Loading...", path: "/user-panel/events" } as SubItem
          ]
        },
        {
          icon: 'fas fa-comments',
          name: "Forum",
          path: "/user-panel/forum",
        },
        {
          icon: 'fas fa-envelope',
          name: "Messages",
          path: "/user-panel/messages",
          badge: "5",
          badgeColor: "bg-red-500"
        }
      ]
    },
    {
      id: 'tracking',
      title: 'TRACKING',
      icon: '📊',
      items: [
        {
          icon: 'fas fa-chart-line',
          name: "My Progress",
          path: "/user-panel/progress",
        },
        {
          icon: 'fas fa-desktop',
          name: "My Sessions",
          path: "/user-panel/sessions",
        }
      ]
    },
    {
      id: 'account',
      title: 'ACCOUNT',
      icon: '⚙️',
      items: [
        {
          icon: 'fas fa-credit-card',
          name: "My Subscription",
          path: "/user-panel/subscription",
        },
        {
          icon: 'fas fa-cog',
          name: "Settings",
          path: "/user-panel/settings",
        },
        {
          icon: 'fas fa-life-ring',
          name: "Help & Support",
          path: "/user-panel/support",
        },
        {
          icon: 'fas fa-exclamation-circle',
          name: "Report Issue",
          path: "/user-panel/complaints",
        }
      ]
    }
  ];

  openSubmenu: string | null | number = null;
  subMenuHeights: { [key: string]: number } = {};

  readonly isExpanded$;
  readonly isMobileOpen$;
  readonly isHovered$;

  private subscription: Subscription = new Subscription();
  userClubs: Club[] = [];
  clubRoles: { [clubId: number]: string } = {};

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private clubService: ClubService,
    private memberService: MemberService,
    private authService: AuthService,
    private eventService: EventService
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isHovered$ = this.sidebarService.isHovered$;
  }

  ngOnInit() {
    this.subscription.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.setActiveMenuFromRoute(this.router.url);
        }
      })
    );

    this.subscription.add(
      combineLatest([this.isExpanded$, this.isMobileOpen$, this.isHovered$]).subscribe(
        ([isExpanded, isMobileOpen, isHovered]) => {
          if (!isExpanded && !isMobileOpen && !isHovered) {
            this.cdr.detectChanges();
          }
        }
      )
    );

    // Listen for club membership changes
    this.subscription.add(
      this.clubService.clubMembershipChanged$.subscribe(() => {
        console.log('🔄 Club membership changed, reloading clubs in sidebar...');
        this.loadUserClubs();
      })
    );

    // Listen for event participation changes
    this.subscription.add(
      this.eventService.eventParticipationChanged$.subscribe(() => {
        console.log('🔄 Event participation changed, reloading events in sidebar...');
        this.loadUserEvents();
      })
    );

    this.setActiveMenuFromRoute(this.router.url);
    this.loadUserClubs();
    this.loadUserEvents();
  }

  loadUserClubs() {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id) {
      console.error('No user logged in');
      const communitySection = this.navSections.find(s => s.id === 'community');
      if (communitySection) {
        const clubsItem = communitySection.items.find(item => item.name === 'Clubs');
        if (clubsItem && clubsItem.subItems) {
          clubsItem.subItems = [
            { name: "Please login", path: "/user-panel/clubs" }
          ];
        }
      }
      this.cdr.detectChanges();
      return;
    }

    const userId = currentUser.id;
    console.log('Loading clubs for user ID:', userId);
    
    // Get all memberships for the user
    this.memberService.getMembersByUser(userId).subscribe({
      next: (members) => {
        console.log('📋 Members data loaded:', members);
        
        if (members.length === 0) {
          const communitySection = this.navSections.find(s => s.id === 'community');
          if (communitySection) {
            const clubsItem = communitySection.items.find(item => item.name === 'Clubs');
            if (clubsItem && clubsItem.subItems) {
              clubsItem.subItems = [
                { name: "No clubs joined yet", path: "/user-panel/clubs" }
              ];
            }
          }
          this.cdr.detectChanges();
          return;
        }
        
        // Store roles
        members.forEach(member => {
          this.clubRoles[member.clubId] = member.rank;
          console.log(`Club ${member.clubId}: Role = ${member.rank}`);
        });
        
        console.log('📊 Club roles map:', this.clubRoles);
        
        // Get club IDs
        const clubIds = members.map(m => m.clubId);
        
        // Load club details for each membership
        const clubRequests = clubIds.map(clubId => this.clubService.getClubById(clubId));
        
        // Use forkJoin to load all clubs in parallel
        if (clubRequests.length > 0) {
          forkJoin(clubRequests).subscribe({
            next: (clubs) => {
              console.log('📚 Clubs loaded:', clubs);
              this.userClubs = clubs;
              
              // Update clubs menu with role information in the community section
              const communitySection = this.navSections.find(s => s.id === 'community');
              if (communitySection) {
                const clubsItem = communitySection.items.find(item => item.name === 'Clubs');
                if (clubsItem) {
                  // Create a completely new array to trigger change detection
                  const newSubItems = clubs.map(club => {
                    const isPresident = this.clubRoles[club.id!] === 'PRESIDENT';
                    console.log(`Club "${club.name}" (ID: ${club.id}): isPresident = ${isPresident}, role = ${this.clubRoles[club.id!]}`);
                    return {
                      name: club.name,
                      path: `/user-panel/clubs/${club.id}`,
                      isPresident: isPresident
                    };
                  });
                  clubsItem.subItems = newSubItems;
                  console.log('✅ Updated subItems:', newSubItems);
                  console.log('✅ Total clubs in submenu:', newSubItems.length);
                }
              }
              // Force change detection
              this.cdr.markForCheck();
              this.cdr.detectChanges();
            },
            error: (error) => {
              console.error('Error loading club details:', error);
              const communitySection = this.navSections.find(s => s.id === 'community');
              if (communitySection) {
                const clubsItem = communitySection.items.find(item => item.name === 'Clubs');
                if (clubsItem && clubsItem.subItems) {
                  clubsItem.subItems = [
                    { name: "Error loading clubs", path: "/user-panel/clubs" }
                  ];
                }
              }
              this.cdr.detectChanges();
            }
          });
        }
      },
      error: (error) => {
        console.error('Error loading user memberships:', error);
        const communitySection = this.navSections.find(s => s.id === 'community');
        if (communitySection) {
          const clubsItem = communitySection.items.find(item => item.name === 'Clubs');
          if (clubsItem && clubsItem.subItems) {
            clubsItem.subItems = [
              { name: "Error loading clubs", path: "/user-panel/clubs" }
            ];
          }
        }
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  toggleSubmenu(sectionId: string, index: number) {
    const key = `${sectionId}-${index}`;

    if (this.openSubmenu === key) {
      this.openSubmenu = null;
      this.subMenuHeights[key] = 0;
    } else {
      this.openSubmenu = key;

      setTimeout(() => {
        const el = document.getElementById(key);
        if (el) {
          this.subMenuHeights[key] = el.scrollHeight;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onSidebarMouseEnter() {
    this.isExpanded$.subscribe(expanded => {
      if (!expanded) {
        this.sidebarService.setHovered(true);
      }
    }).unsubscribe();
  }

  private setActiveMenuFromRoute(currentUrl: string) {
    this.navSections.forEach(section => {
      section.items.forEach((nav, i) => {
        if (nav.subItems) {
          nav.subItems.forEach(subItem => {
            if (currentUrl === subItem.path) {
              const key = `${section.id}-${i}`;
              this.openSubmenu = key;

              setTimeout(() => {
                const el = document.getElementById(key);
                if (el) {
                  this.subMenuHeights[key] = el.scrollHeight;
                  this.cdr.detectChanges();
                }
              });
            }
          });
        }
      });
    });
  }

  onSubmenuClick() {
    this.isMobileOpen$.subscribe(isMobile => {
      if (isMobile) {
        this.sidebarService.setMobileOpen(false);
      }
    }).unsubscribe();
  }

  loadUserEvents() {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id) {
      console.error('No user logged in');
      const communitySection = this.navSections.find(s => s.id === 'community');
      if (communitySection) {
        const eventsItem = communitySection.items.find(item => item.name === 'Events');
        if (eventsItem && eventsItem.subItems) {
          eventsItem.subItems = [
            { name: "Please login", path: "/user-panel/events" }
          ];
        }
      }
      this.cdr.detectChanges();
      return;
    }

    const userId = currentUser.id;
    console.log('Loading events for user ID:', userId);
    
    // Load events created by the user AND events they joined
    this.eventService.getEventsByCreator(userId).subscribe({
      next: (createdEvents) => {
        console.log('📚 Events created by user loaded:', createdEvents);
        
        // Also load events the user joined
        this.eventService.getUserEvents(userId).subscribe({
          next: (participants) => {
            console.log('📚 User participations loaded:', participants);
            const joinedEventIds = participants.map(p => p.eventId);
            
            // Get all events to find the joined ones
            this.eventService.getAllEvents().subscribe({
              next: (allEvents) => {
                const joinedEvents = allEvents.filter(e => e.id && joinedEventIds.includes(e.id));
                console.log('📚 Joined events:', joinedEvents);
                
                // Combine created and joined events (remove duplicates)
                const myEventsMap = new Map<number, any>();
                
                // Add created events
                createdEvents.forEach(event => {
                  if (event.id) {
                    myEventsMap.set(event.id, {
                      event: event,
                      isCreator: true
                    });
                  }
                });
                
                // Add joined events
                joinedEvents.forEach(event => {
                  if (event.id && !myEventsMap.has(event.id)) {
                    myEventsMap.set(event.id, {
                      event: event,
                      isCreator: false
                    });
                  }
                });
                
                const myEvents = Array.from(myEventsMap.values());
                
                if (myEvents.length === 0) {
                  const communitySection = this.navSections.find(s => s.id === 'community');
                  if (communitySection) {
                    const eventsItem = communitySection.items.find(item => item.name === 'Events');
                    if (eventsItem && eventsItem.subItems) {
                      eventsItem.subItems = [
                        { name: "No events yet", path: "/user-panel/events" }
                      ];
                    }
                  }
                  this.cdr.detectChanges();
                  return;
                }
                
                // Update events menu
                const communitySection = this.navSections.find(s => s.id === 'community');
                if (communitySection) {
                  const eventsItem = communitySection.items.find(item => item.name === 'Events');
                  if (eventsItem) {
                    const newSubItems = myEvents.map(({ event, isCreator }) => {
                      // Check if event is coming soon (more than 3 days away)
                      const now = new Date();
                      const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
                      const eventDate = new Date(event.eventDate);
                      const isComingSoon = eventDate > threeDaysFromNow;
                      
                      let displayName = event.title;
                      if (isCreator) {
                        displayName = `👑 ${displayName}`;
                      }
                      
                      return {
                        name: displayName,
                        path: `/user-panel/events/${event.id}`,
                        badge: isComingSoon ? 'Soon' : undefined,
                        badgeColor: 'bg-[#F6BD60]'
                      };
                    });
                    eventsItem.subItems = newSubItems;
                    console.log('✅ Updated events subItems:', newSubItems);
                  }
                }
                this.cdr.markForCheck();
                this.cdr.detectChanges();
              },
              error: (error) => {
                console.error('Error loading all events:', error);
              }
            });
          },
          error: (error) => {
            console.error('Error loading user participations:', error);
          }
        });
      },
      error: (error) => {
        console.error('Error loading user events:', error);
        const communitySection = this.navSections.find(s => s.id === 'community');
        if (communitySection) {
          const eventsItem = communitySection.items.find(item => item.name === 'Events');
          if (eventsItem && eventsItem.subItems) {
            eventsItem.subItems = [
              { name: "Error loading events", path: "/user-panel/events" }
            ];
          }
        }
        this.cdr.detectChanges();
      }
    });
  }
}
