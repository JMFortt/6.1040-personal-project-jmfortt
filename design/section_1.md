# Section 1: Problem Framing and Stakeholders

## Problem Framing

### Domain

The domain I'm interested in focusing on for this project is shift scheduling, attendance tracking, and schedule maintenance for course staff in large college courses. Office hours are essential components of many courses, as they're the best way for students to get help with assignments or class material when they need it. At MIT, depending on the class, office hours are usually staffed by faculty, teaching assistants, lab assistants, or some subset of the three. In large classes like MIT's 6.100A, 6.1010 and 6.1020, this can scale to mean dozens of lab assistants and teaching assistants. Classes tend to have their own methods for organizing shifts, schedule swaps, covers, and schedule changes, with Google Docs/Sheets and Slack communication being common methods. Generally, someone (usually a teaching assistant or faculty member) is in charge of initial scheduling and monitoring shift attendance, with shift attendees being responsible for making sure they're marked as present or "checked-in" during their shift. There are penalties for repeated missed shifts or chronic lateness.


### Bad situations

The bad situation here is that class schedule organization can get fragmented and difficult to understand/set up/make changes to, especially at scale. It's easy for things to get lost in translation between dozens of people and different communication channels. As mentioned previously, Google Docs/Sheets and Slack communication are common ways for managing these things, but neither was really designed for that.

- On the setup side, there's commonly a fair amount of setup work to be done, as the more people there are to schedule, the more complicated it is to accommodate everyone's shift requests and constraints, even with a template. For example: office hour schedules/shifts are usually first made at the beginning of the semester. This usually begins by collecting schedule constraints from LAs and TAs using a Google Form and then carefully assigning slots, or sometimes with a Google Sheets free-for-all. In either case, the resulting schedule is manually built, usually in Google Sheets. Also, both cases have downsides - either someone has to spend considerable time assigning slots or some people will be left with undesirable slots (in the case of the free-for-all).

- Once set up, shift changes, temporary swaps, and covers are almost inevitable. While expected, it can be difficult to keep track of what's changed, whether the change has been updated in all relevant places in various documents, and whether or not anyone has made a given change yet, as record keeping is uncommon. For example: let's say an LA requests a schedule change via an email to the TA mailing list, and TA 1 makes the change to the LA-facing schedule, but not to the separate attendance tracking spreadsheet. If TA 1 forgets to respond to the email, no one knows that the change has been made, and the posted schedule will be out of sync with what the TAs taking attendance will see.

- Even outside of those situations, it's not uncommon for people to be marked absent mistakenly during a shift, or to not realize they aren't "checked-in" on their shift's attendance sheet - which can become a problem if it happens repeatedly. After a certain number of such infractions, one's position can be put at risk. For example: let's say that an LA checks in for their shift during a busy time in office hours. The TA who they checked in with then forgets to mark them present on the attendance spreadsheet. Since the LA cannot see the attendance spreadsheet, they think they're marked present, but will eventually be marked absent.

### Corroboration

- In the 6.100A/6.100B/6.1000 (formerly 6.100L) staff pool, attendance, schedules, etc. are all managed via Google Sheets and Google Forms. There are so many forms and so many people listening to requests and making changes to sheets that it's not uncommon for a request to slip through the cracks, be acknowledged twice, or be only partially made across all relevant docs. There are 40+ LAs as well, and it's easy for one to miss check-in at the start of a shift and be unaware they aren't marked present. Shift covers are managed via Slack, and can be hard to keep track of, even though there is a record.
    - Source: From my time as a 6.100x TA/LA

- In the 6.1020 staff pool, schedules are kept on Google Sheets and nearly all other schedule-related documentation is in Slack. In particular, check-in and check-out are self-managed in Slack. It's both easy and common for people to forget to check in/check out until long after the normal time.
    - Source: From my time as a 6.1020 LA

- In the 6.390 staff pool, the schedule is kept on Google Sheets, with many things handled automatically via a Claude-bot on the staff Slack (which is connected to the class Google Drive). Shift switching and attendance updates are handled manually on Google Sheets. A longtime TA admitted that "I suppose our tracking system for attendance and switching isn't great ... we could have something better than a Google sheets."
    - Source: A friend and longtime 6.390 TA

### Workarounds and comparables

- Google Sheets seems to be the most popular workaround, but they aren't ideal because LAs can't see whether they've been marked present and they require high setup/maintenance overhead.
- There are some apps that have shift planning capabilities, usually for hourly jobs like retail or customer service. I haven't seen any tailored towards class schedule management, which has slightly different needs.

### Solution sketch

Make a website/app on which users can create an account and set up a class for schedule management. They can create custom roles with configurable permissions (e.g., can mark attendance, can create new schedules, etc.) and invite others to join their class under those custom roles. In this way, an active staff roster is preserved. Users with the correct permissions can then create shifts and assign staff to them, giving everyone one shared schedule.

Once a schedule for a class is made, staff can post cover requests or propose swaps for their shifts on the app. Another staff member claims the request, and once someone with the correct permissions approves it, the schedule updates automatically. Every request keeps a visible status (open, claimed, approved, etc.), so it's always clear whether a request has been handled.

Attendance can also be marked on the app by those with the correct permissions. People without permission to view everyone's attendance can still see their own records, so they can confirm they were marked present and follow up if they weren't.

(Decidedly outside of the initial scope for the purposes of this project, but autogenerating schedules based on entered schedule preferences would be a stretch goal.)

## Stakeholders

- Faculty members who manage classes
    - Usually in charge of hiring TAs and LAs, as well as making sure class components like office hours run smoothly. Usually the people who decide what software/method to use to manage class schedules.

- Teaching assistants
    - Tasks vary depending on class, but often the people in charge of managing LAs, marking attendance for office hours, etc.

- Lab assistants
    - In classes where they exist, usually in charge of doing the bulk of work in office hours. The most likely to be impacted negatively by a poorly managed attendance method.
