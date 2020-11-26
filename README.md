# Suotar - Course Completion Checker
[Suotar](https://study.cs.helsinki.fi/suoritustarkistin/) is a tool designed to make registering course completions easy.

Additionally, Suotar automatically checks for Elements of AI completions every week.

## User's Guide
[Päivittämätön käyttöohje suomeksi](kayttoohje.md)

### Who can use Suotar?
To use Suotar, you must be a HY employee and be approved as a grader in Suotar. To get approved, **first [visit the service](https://study.cs.helsinki.fi/suoritustarkistin/)** so that your user account is automatically created, then contact grp-toska@helsinki.fi.

### Supported courses
Suotar can be used to register completions on any course CS department may register. Mostly this means all TKT, AYTKT, and some MOOC courses. However, before using Suotar, **the course details must first be added to it manually**. To get your course added, please contact grp-toska@helsinki.fi.

### How to report completions
1. [Visit the site](https://study.cs.helsinki.fi/suoritustarkistin/).
2. Request grader approval by mailing grp-toska@helsinki.fi. Also give the details of the course you want to grade.
3. After being approved, head to the service.
4. Select the right course from the dropdown, and paste the list of completions. You can also upload or drag a .csv, .txt, or .dat type file if you prefer. **See format instructions below for details.**
5. Once everything is in order, the green "Send report" button activates, and you can forward the report by clicking it!

In the "View reports" tab you can see all the reports you've sent, as well as their download status.

### Format Instructions
Completions are reported as rows, with values separated with a semicolon:

```student id;grade;amount of credits; language```

Only the student id is required, all the other information is filled in from the course details by default. If you need to overwrite a default value, you can do so by typing the value in the required row.

Grade can be a number (0, 1, 2, 3, 4, 5), "Hyv." or "Hyl." (Hyv. = hyväksytty = passed, Hyl. = hylätty = failed) and will always default to passed ("Hyv.").

#### Examples of report rows
```
010000003;2;5;fi
011000002;;2,0;en
011100009
011110002;Hyl.;;fi
```
On the first row, all details are filled in. The second row has no grade, meaning it will default to passed.

Third row only gives the student id and everything else is filled based on the course details. On the fourth row the completion is marked as failed, and being in Finnish.

### Combo Courses
For some courses, same course instance has students signed in from both AY and TKT. These courses are called Combo Courses. When marked as such in the SuotarDB, and approved by AY, Suotar can automatically detect which completion should the student receive. You can see the selection for each student after inserting the data.

### Student ID Finder
When the feature is approved for the course by AY, student ID may also be replaced with an email the student signed up for the course in AY. In such a case, Suotar will find the student ID and replace the student email with it.

## Developer Information
**Master:** [![CircleCI](https://circleci.com/gh/UniversityOfHelsinkiCS/suoritustarkistin/tree/master.svg?style=svg)](https://circleci.com/gh/UniversityOfHelsinkiCS/suoritustarkistin/tree/master)

**Trunk:** [![CircleCI](https://circleci.com/gh/UniversityOfHelsinkiCS/suoritustarkistin/tree/trunk.svg?style=svg)](https://circleci.com/gh/UniversityOfHelsinkiCS/suoritustarkistin/tree/trunk)

### Development Environment
1. Clone the repository
2. Create docker-compose.yml file to run the db (c&p from [documentation repo](https://github.com/UniversityOfHelsinkiCS/dokumentaatio/blob/master/suotar_docker-compose.yml))
3. ```docker-compose up -d```
4. ```npm ci```
5. ```npm run db:recreate```
6. ```npm run dev fakeshibbo```

### Program Logic
- [Sequence diagram for the EoAI weekly script](documentation/Suotar_Weekly_EoAI_Credit_Markup_Script.png)
- [Sequence diagram for Ooditool-Suotar Interaction](documentation/Ooditool-Suotar_Interaction.png)


See [documentation folder](documentation/) for diagram sources.
